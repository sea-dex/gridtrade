package scanner

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"math/big"
	"testing"

	"github.com/davecgh/go-spew/spew"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/ethclient"
)

type mockEthClient struct {
	blockNumberFn        func(ctx context.Context) (uint64, error)
	filterLogsFn         func(ctx context.Context, q ethereum.FilterQuery) ([]types.Log, error)
	blockByNumberFn      func(ctx context.Context, number *big.Int) (*types.Block, error)
	transactionReceiptFn func(ctx context.Context, txHash common.Hash) (*types.Receipt, error)
}

func (m *mockEthClient) BlockNumber(ctx context.Context) (uint64, error) {
	if m.blockNumberFn == nil {
		panic("BlockNumber not mocked")
	}
	return m.blockNumberFn(ctx)
}

func (m *mockEthClient) FilterLogs(ctx context.Context, q ethereum.FilterQuery) ([]types.Log, error) {
	if m.filterLogsFn == nil {
		panic("FilterLogs not mocked")
	}
	return m.filterLogsFn(ctx, q)
}

func (m *mockEthClient) BlockByNumber(ctx context.Context, number *big.Int) (*types.Block, error) {
	if m.blockByNumberFn == nil {
		panic("BlockByNumber not mocked")
	}
	return m.blockByNumberFn(ctx, number)
}

func (m *mockEthClient) TransactionReceipt(ctx context.Context, txHash common.Hash) (*types.Receipt, error) {
	if m.transactionReceiptFn == nil {
		panic("TransactionReceipt not mocked")
	}
	return m.transactionReceiptFn(ctx, txHash)
}

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(io.Discard, &slog.HandlerOptions{Level: slog.LevelDebug}))
}

func TestIsLimitExceededErr(t *testing.T) {
	cases := []struct {
		name string
		err  error
		want bool
	}{
		{"nil", nil, false},
		{"limit exceeded", errors.New("Limit Exceeded"), true},
		{"too many results", errors.New("too many results"), true},
		{"block range too large", errors.New("Block range too large"), true},
		{"response size too large", errors.New("response size is too large"), true},
		{"unrelated", errors.New("some other error"), false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := isLimitExceededErr(tc.err); got != tc.want {
				t.Fatalf("isLimitExceededErr(%v)=%v want %v", tc.err, got, tc.want)
			}
		})
	}
}

func TestFetchLogsAdaptive_NoSplit(t *testing.T) {
	ctx := context.Background()
	grid := common.HexToAddress("0x5F7943e9424eF9370392570D06fFA630a5124e9A")
	strategy := common.HexToAddress("0x1cf9a206c9e416d39332530277D26090AC2692A0")

	// var gotQuery ethereum.FilterQuery
	// gotQuery.FromBlock = 89563281
	// m := &mockEthClient{
	// 	filterLogsFn: func(_ context.Context, q ethereum.FilterQuery) ([]types.Log, error) {
	// 		gotQuery = q
	// 		return []types.Log{{BlockNumber: 10, TxIndex: 1, Index: 2}, {BlockNumber: 10, TxIndex: 1, Index: 3}}, nil
	// 	},
	// }

	fromBlock := uint64(89563281)
	rpcURL := "https://data-seed-prebsc-1-s1.bnbchain.org:8545"
	rpcURL = "https://lb.drpc.live/bsc/AvoXWOKivk30tAY8_T6HeeUpUTXXBysR8bWwehXRfUMv"
	// rpcURL = "https://bsc-testnet.gateway.tatum.io/"
	client, err := ethclient.DialContext(ctx, rpcURL)
	if err != nil {
		panic(err.Error())
	}

	s := &Scanner{client: client, logger: testLogger(), gridExAddr: grid, strategyAddr: strategy}
	logs, err := s.fetchLogs(ctx, fromBlock, fromBlock+100)
	if err != nil {
		t.Fatalf("fetchLogs err=%v", err)
	}
	if len(logs) != 2 {
		t.Fatalf("len(logs)=%d want 2", len(logs))
	}
	spew.Dump(logs)
	// if gotQuery.FromBlock == nil || gotQuery.ToBlock == nil {
	// 	t.Fatalf("expected FromBlock/ToBlock to be set")
	// }

	// if gotQuery.FromBlock.Uint64() != 10 || gotQuery.ToBlock.Uint64() != 12 {
	// 	t.Fatalf("query range got [%d,%d] want [10,12]", gotQuery.FromBlock.Uint64(), gotQuery.ToBlock.Uint64())
	// }
	// if len(gotQuery.Addresses) != 2 || gotQuery.Addresses[0] != grid || gotQuery.Addresses[1] != strategy {
	// 	t.Fatalf("unexpected query addresses: %+v", gotQuery.Addresses)
	// }
}

func TestFetchLogsAdaptive_SplitsOnLimitExceeded(t *testing.T) {
	ctx := context.Background()
	grid := common.HexToAddress("0x0000000000000000000000000000000000000001")
	strategy := common.HexToAddress("0x0000000000000000000000000000000000000002")

	limitErr := errors.New("query returned more than 10000 results")
	calls := map[[2]uint64]int{}

	m := &mockEthClient{
		filterLogsFn: func(_ context.Context, q ethereum.FilterQuery) ([]types.Log, error) {
			from := q.FromBlock.Uint64()
			to := q.ToBlock.Uint64()
			calls[[2]uint64{from, to}]++

			switch {
			case from == 1 && to == 10:
				return nil, limitErr
			case from == 1 && to == 5:
				return []types.Log{{BlockNumber: 2, TxIndex: 0, Index: 0}}, nil
			case from == 6 && to == 10:
				return []types.Log{{BlockNumber: 9, TxIndex: 1, Index: 1}}, nil
			default:
				t.Fatalf("unexpected query range [%d,%d]", from, to)
				return nil, nil
			}
		},
	}

	s := &Scanner{client: m, logger: testLogger(), gridExAddr: grid, strategyAddr: strategy}
	logs, err := s.fetchLogsAdaptive(ctx, 1, 10)
	if err != nil {
		t.Fatalf("fetchLogsAdaptive err=%v", err)
	}
	if len(logs) != 2 {
		t.Fatalf("len(logs)=%d want 2", len(logs))
	}
	if calls[[2]uint64{1, 10}] != 1 || calls[[2]uint64{1, 5}] != 1 || calls[[2]uint64{6, 10}] != 1 {
		t.Fatalf("unexpected call counts: %#v", calls)
	}
}

func TestFetchLogsAdaptive_SingleBlockFallsBackToPerAddressAndSorts(t *testing.T) {
	ctx := context.Background()
	grid := common.HexToAddress("0x0000000000000000000000000000000000000001")
	strategy := common.HexToAddress("0x0000000000000000000000000000000000000002")
	limitErr := errors.New("limit exceeded")

	m := &mockEthClient{}
	m.filterLogsFn = func(_ context.Context, q ethereum.FilterQuery) ([]types.Log, error) {
		from := q.FromBlock.Uint64()
		to := q.ToBlock.Uint64()
		// First call: combined addresses for the single block, trigger fallback.
		if from == 7 && to == 7 && len(q.Addresses) == 2 {
			return nil, limitErr
		}
		// Per-address calls.
		if from == 7 && to == 7 && len(q.Addresses) == 1 {
			addr := q.Addresses[0]
			if addr == grid {
				// Intentionally out of order.
				return []types.Log{{BlockNumber: 7, TxIndex: 0, Index: 3}, {BlockNumber: 7, TxIndex: 0, Index: 1}}, nil
			}
			if addr == strategy {
				return []types.Log{{BlockNumber: 7, TxIndex: 0, Index: 2}}, nil
			}
		}
		t.Fatalf("unexpected FilterLogs query: from=%d to=%d addrs=%v", from, to, q.Addresses)
		return nil, nil
	}

	s := &Scanner{client: m, logger: testLogger(), gridExAddr: grid, strategyAddr: strategy}
	logs, err := s.fetchLogsAdaptive(ctx, 7, 7)
	if err != nil {
		t.Fatalf("fetchLogsAdaptive err=%v", err)
	}
	if len(logs) != 3 {
		t.Fatalf("len(logs)=%d want 3", len(logs))
	}
	if logs[0].Index != 1 || logs[1].Index != 2 || logs[2].Index != 3 {
		t.Fatalf("logs not sorted by Index: got [%d,%d,%d]", logs[0].Index, logs[1].Index, logs[2].Index)
	}
}

func TestFetchLogsSingleBlockPerAddress_LimitExceededFallsBackToReceipts(t *testing.T) {
	ctx := context.Background()
	grid := common.HexToAddress("0x0000000000000000000000000000000000000001")
	strategy := common.HexToAddress("0x0000000000000000000000000000000000000002")
	other := common.HexToAddress("0x00000000000000000000000000000000000000ff")
	limitErr := errors.New("log response size exceeded")

	tx1 := types.NewTx(&types.LegacyTx{Nonce: 1})
	tx2 := types.NewTx(&types.LegacyTx{Nonce: 2})

	blockNum := uint64(42)
	header := &types.Header{Number: new(big.Int).SetUint64(blockNum)}
	block := types.NewBlockWithHeader(header).WithBody(types.Body{Transactions: []*types.Transaction{tx1, tx2}})

	receipts := map[common.Hash]*types.Receipt{}
	receipts[tx1.Hash()] = &types.Receipt{Logs: []*types.Log{
		{Address: other, BlockNumber: blockNum, TxIndex: 0, Index: 0},
		{Address: grid, BlockNumber: blockNum, TxIndex: 0, Index: 2},
	}}
	receipts[tx2.Hash()] = &types.Receipt{Logs: []*types.Log{
		{Address: strategy, BlockNumber: blockNum, TxIndex: 1, Index: 1},
	}}

	m := &mockEthClient{}
	m.filterLogsFn = func(_ context.Context, q ethereum.FilterQuery) ([]types.Log, error) {
		// The function should fall back on the first per-address attempt.
		if q.FromBlock.Uint64() == blockNum && q.ToBlock.Uint64() == blockNum && len(q.Addresses) == 1 {
			return nil, limitErr
		}
		t.Fatalf("unexpected FilterLogs call: from=%d to=%d addrs=%v", q.FromBlock.Uint64(), q.ToBlock.Uint64(), q.Addresses)
		return nil, nil
	}
	m.blockByNumberFn = func(_ context.Context, n *big.Int) (*types.Block, error) {
		if n.Uint64() != blockNum {
			t.Fatalf("BlockByNumber got %d want %d", n.Uint64(), blockNum)
		}
		return block, nil
	}
	m.transactionReceiptFn = func(_ context.Context, h common.Hash) (*types.Receipt, error) {
		r, ok := receipts[h]
		if !ok {
			return nil, errors.New("missing receipt")
		}
		return r, nil
	}

	s := &Scanner{client: m, logger: testLogger(), gridExAddr: grid, strategyAddr: strategy}
	logs, err := s.fetchLogsSingleBlockPerAddress(ctx, blockNum)
	if err != nil {
		t.Fatalf("fetchLogsSingleBlockPerAddress err=%v", err)
	}
	if len(logs) != 2 {
		t.Fatalf("len(logs)=%d want 2", len(logs))
	}
	// Should include only grid+strategy logs, sorted by (TxIndex, Index).
	if logs[0].Address != grid || logs[0].Index != 2 {
		t.Fatalf("unexpected logs[0]=%+v", logs[0])
	}
	if logs[1].Address != strategy || logs[1].Index != 1 {
		t.Fatalf("unexpected logs[1]=%+v", logs[1])
	}
}
