package scanner

import (
	"context"
	"fmt"
	"log/slog"
	"math/big"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/jackc/pgx/v5"

	"github.com/gridex/indexer/config"
	"github.com/gridex/indexer/contracts"
	"github.com/gridex/indexer/db"
	"github.com/gridex/indexer/kafka"
)

// EthClient defines the subset of ethclient.Client methods used by Scanner.
// This interface enables mocking in tests.
type EthClient interface {
	BlockNumber(ctx context.Context) (uint64, error)
	FilterLogs(ctx context.Context, q ethereum.FilterQuery) ([]types.Log, error)
	BlockByNumber(ctx context.Context, number *big.Int) (*types.Block, error)
	TransactionReceipt(ctx context.Context, txHash common.Hash) (*types.Receipt, error)
}

// linearStrategyInfo holds price0 and gap from LinearStrategyCreated events,
// keyed by gridId. This is populated before GridOrderCreated in the same tx.
// There can be two events per grid: one for ask side, one for bid side.
type linearStrategyInfo struct {
	AskPrice0 *big.Int // ask starting price (uint256)
	AskGap    *big.Int // ask price gap between consecutive orders (int256)
	BidPrice0 *big.Int // bid starting price (uint256)
	BidGap    *big.Int // bid price gap between consecutive orders (int256)
}

// Scanner scans a single chain for GridEx events.
type Scanner struct {
	cfg      config.ChainConfig
	client   EthClient
	decoder  *contracts.Decoder
	caller   *contracts.Caller
	repo     *db.Repository
	producer *kafka.Producer
	logger   *slog.Logger

	gridExAddr   common.Address
	strategyAddr common.Address

	// Kafka brokers and topic for offset tracking
	kafkaBrokers []string
	kafkaTopic   string

	// tokenCache avoids repeated on-chain calls for the same token
	tokenCache map[common.Address]*contracts.TokenInfo

	// strategyCache holds LinearStrategyCreated data keyed by gridId (string).
	// Populated when processing LinearStrategyCreated, consumed by GridOrderCreated.
	// Entries are removed after consumption.
	strategyCache map[string]*linearStrategyInfo
}

// New creates a new Scanner for a chain.
// The client parameter must implement EthClient (e.g. *ethclient.Client or
// *rpc.RateLimitedClient). If using a rate-limited client that also implements
// contracts.ContractCaller, it will be used for contract calls as well.
func New(
	cfg config.ChainConfig,
	client EthClient,
	repo *db.Repository,
	producer *kafka.Producer,
	kafkaBrokers []string,
	kafkaTopic string,
	logger *slog.Logger,
) (*Scanner, error) {
	decoder, err := contracts.NewDecoder()
	if err != nil {
		return nil, fmt.Errorf("create decoder: %w", err)
	}

	gridExAddr := common.HexToAddress(cfg.GridExAddress)

	if cfg.LinearStrategyAddress == "" {
		panic("LinearStrategyAddress is not configured")
	}
	strategyAddr := common.HexToAddress(cfg.LinearStrategyAddress)
	if strategyAddr == (common.Address{}) {
		panic("LinearStrategyAddress is the zero address")
	}

	// The client must also implement ContractCaller for on-chain reads.
	contractCaller, ok := client.(contracts.ContractCaller)
	if !ok {
		return nil, fmt.Errorf("client does not implement contracts.ContractCaller")
	}

	caller, err := contracts.NewCaller(contractCaller, gridExAddr)
	if err != nil {
		return nil, fmt.Errorf("create caller: %w", err)
	}

	return &Scanner{
		cfg:           cfg,
		client:        client,
		decoder:       decoder,
		caller:        caller,
		repo:          repo,
		producer:      producer,
		logger:        logger.With("chain", cfg.Name, "chain_id", cfg.ChainID),
		gridExAddr:    gridExAddr,
		strategyAddr:  strategyAddr,
		kafkaBrokers:  kafkaBrokers,
		kafkaTopic:    kafkaTopic,
		tokenCache:    make(map[common.Address]*contracts.TokenInfo),
		strategyCache: make(map[string]*linearStrategyInfo),
	}, nil
}

// Run starts the scanning loop. It blocks until ctx is cancelled.
func (s *Scanner) Run(ctx context.Context) error {
	// Pre-populate token cache from DB to avoid redundant RPC calls on restart.
	// This is critical for rate-limited RPC endpoints (e.g. Tatum free tier: 5 req/min)
	// since GetTokenInfo makes 3 RPC calls per token (name, symbol, decimals).
	if err := s.loadTokenCache(ctx); err != nil {
		s.logger.Warn("failed to pre-populate token cache from DB (will fetch from chain)", "error", err)
	}

	// Determine start block
	lastBlock, err := s.repo.GetLastBlock(ctx, s.cfg.ChainID)
	if err != nil {
		return fmt.Errorf("get last block: %w", err)
	}

	startBlock := s.cfg.StartBlock
	if lastBlock > 0 {
		startBlock = lastBlock + 1
	}

	s.logger.Info("starting scanner", "start_block", startBlock)

	currentBlock := startBlock
	pollInterval := time.Duration(s.cfg.PollInterval) * time.Millisecond
	var latestBlock uint64

	for {
		select {
		case <-ctx.Done():
			s.logger.Info("scanner stopped")
			return ctx.Err()
		default:
		}

		// Only fetch the latest block number when we're close to the chain tip
		// (within 100 blocks) or on the first iteration (latestBlock == 0).
		if latestBlock == 0 || latestBlock < currentBlock+100 {
			newBlock, err := s.client.BlockNumber(ctx)
			if err != nil {
				s.logger.Error("failed to get latest block", "error", err)
				time.Sleep(pollInterval)
				continue
			}
			latestBlock = newBlock
		}

		// Apply confirmations
		safeBlock := latestBlock
		if safeBlock > s.cfg.Confirmations {
			safeBlock -= s.cfg.Confirmations
		}

		if currentBlock > safeBlock {
			// We're caught up, wait for new blocks
			time.Sleep(pollInterval)
			continue
		}

		// Calculate the end block for this batch
		endBlock := min(currentBlock+s.cfg.BlockBatchSize-1, safeBlock)

		s.logger.Info("scanning blocks", "from", currentBlock, "to", endBlock, "latest", latestBlock)

		// Fetch logs with adaptive range splitting on "limit exceeded" errors
		logs, err := s.fetchLogsAdaptive(ctx, currentBlock, endBlock)
		if err != nil {
			s.logger.Error("failed to fetch logs", "from", currentBlock, "to", endBlock, "error", err)
			time.Sleep(pollInterval)
			continue
		}

		// Process all logs in a single transaction
		if err := s.processLogs(ctx, logs, endBlock); err != nil {
			s.logger.Error("failed to process logs", "from", currentBlock, "to", endBlock, "error", err)
			time.Sleep(pollInterval)
			continue
		}

		s.logger.Info("processed blocks", "from", currentBlock, "to", endBlock, "events", len(logs))

		currentBlock = endBlock + 1
	}
}

// isLimitExceededErr checks whether an error from the RPC node indicates that
// the getLogs request exceeded the node's limits (response size, block range,
// or rate). Different RPC providers return different error messages.
func isLimitExceededErr(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "limit exceeded") ||
		strings.Contains(msg, "query returned more than") ||
		strings.Contains(msg, "too many results") ||
		strings.Contains(msg, "block range too large") ||
		strings.Contains(msg, "exceed maximum block range") ||
		strings.Contains(msg, "response size is too large") ||
		strings.Contains(msg, "log response size exceeded")
}

// fetchLogsAdaptive fetches logs for [fromBlock, toBlock] with automatic range
// splitting when the RPC returns a "limit exceeded" error. It recursively
// bisects the range until each sub-range succeeds or a single block still
// fails (in which case it fetches that block's events per-topic as a fallback).
func (s *Scanner) fetchLogsAdaptive(ctx context.Context, fromBlock, toBlock uint64) ([]types.Log, error) {
	logs, err := s.fetchLogs(ctx, fromBlock, toBlock)
	if err == nil {
		return logs, nil
	}

	if !isLimitExceededErr(err) {
		return nil, err
	}

	s.logger.Warn("fetchLogs failed", "fromBlock", fromBlock, "toBlock", toBlock, "error", err)

	// Single block still exceeds limit — fall back to per-address fetching
	if fromBlock == toBlock {
		s.logger.Warn("single block exceeds log limit, fetching per-address",
			"block", fromBlock)
		return s.fetchLogsSingleBlockPerAddress(ctx, fromBlock)
	}

	// Bisect the range and fetch each half
	mid := fromBlock + (toBlock-fromBlock)/2
	s.logger.Warn("splitting block range due to limit exceeded",
		"from", fromBlock, "to", toBlock, "mid", mid)

	logsFirst, err := s.fetchLogsAdaptive(ctx, fromBlock, mid)
	if err != nil {
		return nil, err
	}

	logsSecond, err := s.fetchLogsAdaptive(ctx, mid+1, toBlock)
	if err != nil {
		return nil, err
	}

	return append(logsFirst, logsSecond...), nil
}

// fetchLogsSingleBlockPerAddress fetches logs for a single block by querying
// each contract address individually. This is a fallback when even a single-block
// query with all addresses exceeds the RPC limit. If a per-address query still
// exceeds the limit, it falls back to receipt-based log extraction.
func (s *Scanner) fetchLogsSingleBlockPerAddress(ctx context.Context, blockNum uint64) ([]types.Log, error) {
	addresses := []common.Address{s.gridExAddr, s.strategyAddr}

	var allLogs []types.Log
	blockBig := new(big.Int).SetUint64(blockNum)

	for _, addr := range addresses {
		query := ethereum.FilterQuery{
			FromBlock: blockBig,
			ToBlock:   blockBig,
			Addresses: []common.Address{addr},
		}

		logs, err := s.client.FilterLogs(ctx, query)
		if err != nil {
			if isLimitExceededErr(err) {
				// Even a single address exceeds the limit — fall back to receipt scanning
				s.logger.Warn("single block per-address still exceeds limit, falling back to receipt scanning",
					"block", blockNum, "address", addr.Hex())
				return s.fetchLogsFromReceipts(ctx, blockNum)
			}
			return nil, fmt.Errorf("fetch logs block %d address %s: %w", blockNum, addr.Hex(), err)
		}
		allLogs = append(allLogs, logs...)
	}

	// Sort by log index to maintain correct event ordering within the block
	sortLogsByIndex(allLogs)

	return allLogs, nil
}

// fetchLogsFromReceipts is the last-resort fallback. It fetches the full block,
// iterates over every transaction receipt, and filters logs that match our
// contract addresses. This avoids eth_getLogs entirely.
func (s *Scanner) fetchLogsFromReceipts(ctx context.Context, blockNum uint64) ([]types.Log, error) {
	s.logger.Info("fetching logs from receipts", "block", blockNum)

	block, err := s.client.BlockByNumber(ctx, new(big.Int).SetUint64(blockNum))
	if err != nil {
		return nil, fmt.Errorf("fetch block %d: %w", blockNum, err)
	}

	// Build lookup set for fast address matching
	addressSet := map[common.Address]struct{}{
		s.gridExAddr:   {},
		s.strategyAddr: {},
	}

	var allLogs []types.Log

	for _, tx := range block.Transactions() {
		receipt, err := s.client.TransactionReceipt(ctx, tx.Hash())
		if err != nil {
			return nil, fmt.Errorf("fetch receipt for tx %s in block %d: %w",
				tx.Hash().Hex(), blockNum, err)
		}

		for _, log := range receipt.Logs {
			// Check address matches only — no topic filtering
			if _, ok := addressSet[log.Address]; !ok {
				continue
			}
			allLogs = append(allLogs, *log)
		}
	}

	s.logger.Info("extracted logs from receipts",
		"block", blockNum,
		"transactions", len(block.Transactions()),
		"matched_logs", len(allLogs))

	// Already ordered by log index within the block from receipt ordering,
	// but sort to be safe
	sortLogsByIndex(allLogs)

	return allLogs, nil
}

// fetchLogs fetches all GridEx and strategy contract logs in the given block range.
// It filters only by contract addresses — no topic filtering — so that all events
// emitted by these contracts are captured.
func (s *Scanner) fetchLogs(ctx context.Context, fromBlock, toBlock uint64) ([]types.Log, error) {
	// Build the list of contract addresses to watch
	addresses := []common.Address{s.gridExAddr, s.strategyAddr}

	query := ethereum.FilterQuery{
		FromBlock: new(big.Int).SetUint64(fromBlock),
		ToBlock:   new(big.Int).SetUint64(toBlock),
		Addresses: addresses,
	}

	return s.client.FilterLogs(ctx, query)
}

// sortLogsByIndex sorts logs by (BlockNumber, TxIndex, Index) to ensure
// correct event processing order, especially after merging per-topic results.
func sortLogsByIndex(logs []types.Log) {
	if len(logs) <= 1 {
		return
	}
	// Simple insertion sort — log slices from a single block are typically small
	for i := 1; i < len(logs); i++ {
		for j := i; j > 0 && logLess(logs[j], logs[j-1]); j-- {
			logs[j], logs[j-1] = logs[j-1], logs[j]
		}
	}
}

func logLess(a, b types.Log) bool {
	if a.BlockNumber != b.BlockNumber {
		return a.BlockNumber < b.BlockNumber
	}
	if a.TxIndex != b.TxIndex {
		return a.TxIndex < b.TxIndex
	}
	return a.Index < b.Index
}

// processLogs processes all logs within a single database transaction.
func (s *Scanner) processLogs(ctx context.Context, logs []types.Log, endBlock uint64) error {
	// Collect all kafka messages to send after DB commit
	var kafkaMsgs []*kafka.Message

	return s.repo.WithTx(ctx, func(ctx context.Context, tx pgx.Tx) error {
		for _, log := range logs {
			if len(log.Topics) == 0 {
				continue
			}

			msgs, err := s.processLog(ctx, tx, log)
			if err != nil {
				return fmt.Errorf("process log block=%d txIdx=%d logIdx=%d: %w",
					log.BlockNumber, log.TxIndex, log.Index, err)
			}
			kafkaMsgs = append(kafkaMsgs, msgs...)
		}

		// Update the last scanned block
		if err := db.UpdateLastBlock(ctx, tx, s.cfg.ChainID, endBlock); err != nil {
			return err
		}

		// Compute and upsert protocol stats
		if err := s.updateProtocolStats(ctx, tx, endBlock); err != nil {
			s.logger.Warn("failed to update protocol stats", "error", err)
			// Non-fatal: don't block indexing if stats update fails
		}

		// Update per-pair volume_24h, trades_24h, and pair_daily_stats
		if err := s.updatePairStats(ctx, tx, endBlock); err != nil {
			s.logger.Warn("failed to update pair stats", "error", err)
		}

		// Update leaderboard data (all periods)
		if err := s.updateLeaderboard(ctx, tx, endBlock); err != nil {
			s.logger.Warn("failed to update leaderboard", "error", err)
		}

		// Send Kafka messages after successful DB operations but before commit
		// Note: If Kafka send fails, the transaction will be rolled back
		if len(kafkaMsgs) > 0 {
			if err := s.producer.SendBatch(ctx, kafkaMsgs); err != nil {
				return fmt.Errorf("send kafka messages: %w", err)
			}

			// Get the latest Kafka offset and store it for tradebot synchronization
			lastOffset, err := s.producer.LastOffset(s.kafkaBrokers, s.kafkaTopic)
			if err != nil {
				s.logger.Warn("failed to get kafka offset", "error", err)
				// Non-fatal: offset tracking is for tradebot optimization
			} else if lastOffset > 0 {
				if err := db.UpdateKafkaOffset(ctx, tx, s.cfg.ChainID, lastOffset); err != nil {
					s.logger.Warn("failed to update kafka offset", "error", err)
					// Non-fatal: offset tracking is for tradebot optimization
				}
			}
		}

		return nil
	})
}

// updateProtocolStats computes aggregate stats and upserts them into protocol_stats.
func (s *Scanner) updateProtocolStats(ctx context.Context, tx pgx.Tx, blockNumber uint64) error {
	stats, err := db.ComputeProtocolStats(ctx, tx, s.cfg.ChainID)
	if err != nil {
		return err
	}

	today := time.Now().UTC().Format("2006-01-02")
	return db.UpsertProtocolStats(ctx, tx, s.cfg.ChainID, today, stats, blockNumber)
}

// updatePairStats updates pairs.volume_24h/trades_24h and upserts pair_daily_stats.
func (s *Scanner) updatePairStats(ctx context.Context, tx pgx.Tx, blockNumber uint64) error {
	today := time.Now().UTC().Format("2006-01-02")
	return db.UpdatePairVolumes(ctx, tx, s.cfg.ChainID, today, blockNumber)
}

// updateLeaderboard refreshes the leaderboard table for all periods.
func (s *Scanner) updateLeaderboard(ctx context.Context, tx pgx.Tx, blockNumber uint64) error {
	return db.UpdateLeaderboard(ctx, tx, s.cfg.ChainID, blockNumber)
}

// processLog processes a single event log and returns Kafka messages to send.
func (s *Scanner) processLog(ctx context.Context, tx pgx.Tx, log types.Log) ([]*kafka.Message, error) {
	topic := log.Topics[0]

	switch topic {
	case contracts.TopicLinearStrategyCreated:
		return s.handleLinearStrategyCreated(ctx, tx, log)
	case contracts.TopicPairCreated:
		return s.handlePairCreated(ctx, tx, log)
	case contracts.TopicGridOrderCreated:
		return s.handleGridOrderCreated(ctx, tx, log)
	case contracts.TopicFilledOrder:
		return s.handleFilledOrder(ctx, tx, log)
	case contracts.TopicCancelGridOrder:
		return s.handleCancelGridOrder(ctx, tx, log)
	case contracts.TopicCancelWholeGrid:
		return s.handleCancelWholeGrid(ctx, tx, log)
	case contracts.TopicGridFeeChanged:
		return s.handleGridFeeChanged(ctx, tx, log)
	case contracts.TopicWithdrawProfit:
		return s.handleWithdrawProfit(ctx, tx, log)
	default:
		return nil, nil
	}
}

// getOrFetchToken returns token info, using cache when available.
func (s *Scanner) getOrFetchToken(ctx context.Context, tx pgx.Tx, addr common.Address, blockNumber uint64) (*contracts.TokenInfo, error) {
	if info, ok := s.tokenCache[addr]; ok {
		return info, nil
	}

	info, err := s.caller.GetTokenInfo(ctx, addr)
	if err != nil {
		return nil, fmt.Errorf("fetch token info %s: %w", addr.Hex(), err)
	}

	s.tokenCache[addr] = info

	// Upsert token in DB
	if err := db.UpsertToken(ctx, tx, s.cfg.ChainID,
		strings.ToLower(addr.Hex()), info.Symbol, info.Name, int(info.Decimals), blockNumber); err != nil {
		return nil, err
	}

	return info, nil
}

// loadTokenCache pre-populates the in-memory token cache from the database.
// This avoids expensive on-chain RPC calls (3 per token) for tokens that have
// already been indexed, which is critical for rate-limited endpoints.
func (s *Scanner) loadTokenCache(ctx context.Context) error {
	rows, err := s.repo.GetTokensByChain(ctx, s.cfg.ChainID)
	if err != nil {
		return err
	}

	for _, row := range rows {
		addr := common.HexToAddress(row.Address)
		s.tokenCache[addr] = &contracts.TokenInfo{
			Address:  addr,
			Name:     row.Name,
			Symbol:   row.Symbol,
			Decimals: uint8(row.Decimals),
		}
	}

	s.logger.Info("pre-populated token cache from DB", "count", len(rows))
	return nil
}

func (s *Scanner) makeBaseMsg(log types.Log, eventType kafka.EventType) *kafka.Message {
	return &kafka.Message{
		EventType:   eventType,
		ChainID:     s.cfg.ChainID,
		BlockNumber: log.BlockNumber,
		TxHash:      log.TxHash.Hex(),
		LogIndex:    log.Index,
		Timestamp:   time.Now().Unix(),
	}
}
