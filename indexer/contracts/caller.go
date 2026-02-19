package contracts

import (
	"context"
	"fmt"
	"log/slog"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
)

// ContractCaller is the subset of ethclient.Client methods used by Caller.
// This interface allows injecting a rate-limited client.
type ContractCaller interface {
	CallContract(ctx context.Context, msg ethereum.CallMsg, blockNumber *big.Int) ([]byte, error)
}

// GridOrder represents the on-chain GridOrder struct returned by getGridOrder.
type GridOrder struct {
	Amount    *big.Int
	RevAmount *big.Int
	Price     *big.Int
	RevPrice  *big.Int
}

// TokenInfo holds ERC20 token metadata fetched from chain.
type TokenInfo struct {
	Address  common.Address
	Name     string
	Symbol   string
	Decimals uint8
}

// Caller makes read-only calls to the GridEx contract and ERC20 tokens.
type Caller struct {
	client     ContractCaller
	gridExAddr common.Address
	gridExABI  abi.ABI
	erc20ABI   abi.ABI
}

// getGridOrder ABI (only the function we need)
const getGridOrderABIJSON = `[
  {
    "inputs": [{"name": "gridOrderId", "type": "uint256"}],
    "name": "getGridOrder",
    "outputs": [
      {
        "components": [
          {"name": "amount", "type": "uint128"},
          {"name": "revAmount", "type": "uint128"},
          {"name": "price", "type": "uint128"},
          {"name": "revPrice", "type": "uint128"}
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "gridId", "type": "uint96"}],
    "name": "getGridConfig",
    "outputs": [
      {
        "components": [
          {"name": "owner", "type": "address"},
          {"name": "pairId", "type": "uint64"},
          {"name": "compound", "type": "bool"},
          {"name": "oneshot", "type": "bool"},
          {"name": "fee", "type": "uint32"},
          {"name": "status", "type": "uint8"},
          {"name": "asks", "type": "uint32"},
          {"name": "bids", "type": "uint32"}
        ],
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "pairId", "type": "uint64"}],
    "name": "getPairTokens",
    "outputs": [
      {"name": "base", "type": "address"},
      {"name": "quote", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
]`

// pancakeV2PairABI is the ABI for PancakeSwap V2 pair contract to get reserves
const pancakeV2PairABIJSON = `[
  {
    "inputs": [],
    "name": "getReserves",
    "outputs": [
      {"name": "reserve0", "type": "uint112"},
      {"name": "reserve1", "type": "uint112"},
      {"name": "blockTimestampLast", "type": "uint32"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "token0",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "token1",
    "outputs": [{"name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
]`

// pancakeV2FactoryABI is the ABI for PancakeSwap V2 Factory to get pair address
const pancakeV2FactoryABIJSON = `[
  {
    "inputs": [{"name": "tokenA", "type": "address"}, {"name": "tokenB", "type": "address"}],
    "name": "getPair",
    "outputs": [{"name": "pair", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
]`

const erc20ABIJSON = `[
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
]`

// NewCaller creates a new contract caller.
// The client parameter must implement ContractCaller (e.g. *ethclient.Client
// or *rpc.RateLimitedClient).
func NewCaller(client ContractCaller, gridExAddr common.Address) (*Caller, error) {
	gridABI, err := abi.JSON(strings.NewReader(getGridOrderABIJSON))
	if err != nil {
		return nil, fmt.Errorf("parse gridex caller abi: %w", err)
	}
	erc20ABI, err := abi.JSON(strings.NewReader(erc20ABIJSON))
	if err != nil {
		return nil, fmt.Errorf("parse erc20 abi: %w", err)
	}
	return &Caller{
		client:     client,
		gridExAddr: gridExAddr,
		gridExABI:  gridABI,
		erc20ABI:   erc20ABI,
	}, nil
}

// GetGridOrder calls getGridOrder(uint256) on the GridEx contract.
func (c *Caller) GetGridOrder(ctx context.Context, gridOrderID *big.Int) (*GridOrder, error) {
	data, err := c.gridExABI.Pack("getGridOrder", gridOrderID)
	if err != nil {
		return nil, fmt.Errorf("pack getGridOrder: %w", err)
	}

	result, err := c.client.CallContract(ctx, ethereum.CallMsg{
		To:   &c.gridExAddr,
		Data: data,
	}, nil)
	if err != nil {
		return nil, fmt.Errorf("call getGridOrder: %w", err)
	}

	values, err := c.gridExABI.Methods["getGridOrder"].Outputs.Unpack(result)
	if err != nil {
		return nil, fmt.Errorf("unpack getGridOrder: %w", err)
	}

	// ABI unpacking returns the struct as an anonymous struct with json tags
	s := values[0].(struct {
		Amount    *big.Int `json:"amount"`
		RevAmount *big.Int `json:"revAmount"`
		Price     *big.Int `json:"price"`
		RevPrice  *big.Int `json:"revPrice"`
	})

	return &GridOrder{
		Amount:    s.Amount,
		RevAmount: s.RevAmount,
		Price:     s.Price,
		RevPrice:  s.RevPrice,
	}, nil
}

// GetPairTokens calls getPairTokens(uint64) on the GridEx contract.
func (c *Caller) GetPairTokens(ctx context.Context, pairID uint64) (base, quote common.Address, err error) {
	data, err := c.gridExABI.Pack("getPairTokens", pairID)
	if err != nil {
		return common.Address{}, common.Address{}, fmt.Errorf("pack getPairTokens: %w", err)
	}

	result, err := c.client.CallContract(ctx, ethereum.CallMsg{
		To:   &c.gridExAddr,
		Data: data,
	}, nil)
	if err != nil {
		return common.Address{}, common.Address{}, fmt.Errorf("call getPairTokens: %w", err)
	}

	values, err := c.gridExABI.Methods["getPairTokens"].Outputs.Unpack(result)
	if err != nil {
		return common.Address{}, common.Address{}, fmt.Errorf("unpack getPairTokens: %w", err)
	}

	base = values[0].(common.Address)
	quote = values[1].(common.Address)
	return base, quote, nil
}

// GetTokenInfo fetches ERC20 token metadata from chain.
func (c *Caller) GetTokenInfo(ctx context.Context, tokenAddr common.Address) (*TokenInfo, error) {
	info := &TokenInfo{Address: tokenAddr}

	// Get name
	nameData, err := c.erc20ABI.Pack("name")
	if err != nil {
		return nil, fmt.Errorf("pack name: %w", err)
	}
	nameResult, err := c.client.CallContract(ctx, ethereum.CallMsg{
		To:   &tokenAddr,
		Data: nameData,
	}, nil)
	if err != nil {
		// Some tokens don't implement name(), use empty string
		slog.Error("failed to call ERC20 name()", "token", tokenAddr.Hex(), "error", err)
		info.Name = ""
	} else {
		values, err := c.erc20ABI.Methods["name"].Outputs.Unpack(nameResult)
		if err == nil && len(values) > 0 {
			info.Name = values[0].(string)
		}
	}

	// Get symbol
	symbolData, err := c.erc20ABI.Pack("symbol")
	if err != nil {
		slog.Error("failed to pack ERC20 symbol()", "token", tokenAddr.Hex(), "error", err)
		return nil, fmt.Errorf("pack symbol: %w", err)
	}
	symbolResult, err := c.client.CallContract(ctx, ethereum.CallMsg{
		To:   &tokenAddr,
		Data: symbolData,
	}, nil)
	if err != nil {
		info.Symbol = ""
	} else {
		values, err := c.erc20ABI.Methods["symbol"].Outputs.Unpack(symbolResult)
		if err == nil && len(values) > 0 {
			info.Symbol = values[0].(string)
		}
	}

	// Get decimals
	decimalsData, err := c.erc20ABI.Pack("decimals")
	if err != nil {
		return nil, fmt.Errorf("pack decimals: %w", err)
	}
	decimalsResult, err := c.client.CallContract(ctx, ethereum.CallMsg{
		To:   &tokenAddr,
		Data: decimalsData,
	}, nil)
	if err != nil {
		info.Decimals = 18 // default
	} else {
		values, err := c.erc20ABI.Methods["decimals"].Outputs.Unpack(decimalsResult)
		if err == nil && len(values) > 0 {
			info.Decimals = values[0].(uint8)
		}
	}

	return info, nil
}
