package contracts

import (
	"fmt"
	"math/big"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
)

// Decoder decodes GridEx contract event logs.
type Decoder struct {
	abi         abi.ABI
	strategyABI abi.ABI
	geometryABI abi.ABI
}

// linearStrategyABI is the ABI for the Linear strategy contract events.
// Updated for v2: gridId is now uint48 (was uint128)
const linearStrategyABI = `[
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "name": "isAsk", "type": "bool"},
      {"indexed": false, "name": "gridId", "type": "uint48"},
      {"indexed": false, "name": "price0", "type": "uint256"},
      {"indexed": false, "name": "gap", "type": "int256"}
    ],
    "name": "LinearStrategyCreated",
    "type": "event"
  }
]`

// geometryStrategyABI is the ABI for the Geometry strategy contract events.
// Updated for v2: gridId is now uint48 (was uint128)
const geometryStrategyABI = `[
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "name": "isAsk", "type": "bool"},
      {"indexed": false, "name": "gridId", "type": "uint48"},
      {"indexed": false, "name": "price0", "type": "uint256"},
      {"indexed": false, "name": "ratio", "type": "uint256"}
    ],
    "name": "GeometryStrategyCreated",
    "type": "event"
  }
]`

// gridExABI is a minimal ABI containing only the events we care about.
// Updated for v2 contract with new types (uint48 gridId, uint64 orderId, uint16 order counts)
const gridExABI = `[
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "base", "type": "address"},
      {"indexed": true, "name": "quote", "type": "address"},
      {"indexed": false, "name": "pairId", "type": "uint64"}
    ],
    "name": "PairCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "owner", "type": "address"},
      {"indexed": false, "name": "pairId", "type": "uint64"},
      {"indexed": false, "name": "amount", "type": "uint256"},
      {"indexed": false, "name": "gridId", "type": "uint48"},
      {"indexed": false, "name": "asks", "type": "uint32"},
      {"indexed": false, "name": "bids", "type": "uint32"},
      {"indexed": false, "name": "fee", "type": "uint32"},
      {"indexed": false, "name": "compound", "type": "bool"},
      {"indexed": false, "name": "oneshot", "type": "bool"}
    ],
    "name": "GridOrderCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "name": "taker", "type": "address"},
      {"indexed": false, "name": "orderId", "type": "uint64"},
      {"indexed": false, "name": "baseAmt", "type": "uint256"},
      {"indexed": false, "name": "quoteVol", "type": "uint256"},
      {"indexed": false, "name": "orderAmt", "type": "uint256"},
      {"indexed": false, "name": "orderRevAmt", "type": "uint256"},
      {"indexed": false, "name": "isAsk", "type": "bool"}
    ],
    "name": "FilledOrder",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "owner", "type": "address"},
      {"indexed": true, "name": "orderId", "type": "uint64"},
      {"indexed": true, "name": "gridId", "type": "uint48"}
    ],
    "name": "CancelGridOrder",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "owner", "type": "address"},
      {"indexed": true, "name": "gridId", "type": "uint48"}
    ],
    "name": "CancelWholeGrid",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "sender", "type": "address"},
      {"indexed": false, "name": "gridId", "type": "uint48"},
      {"indexed": false, "name": "fee", "type": "uint32"}
    ],
    "name": "GridFeeChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "name": "gridId", "type": "uint48"},
      {"indexed": false, "name": "quote", "type": "address"},
      {"indexed": false, "name": "to", "type": "address"},
      {"indexed": false, "name": "amt", "type": "uint256"}
    ],
    "name": "WithdrawProfit",
    "type": "event"
  }
]`

// NewDecoder creates a new event decoder.
func NewDecoder() (*Decoder, error) {
	parsed, err := abi.JSON(strings.NewReader(gridExABI))
	if err != nil {
		return nil, fmt.Errorf("parse gridex abi: %w", err)
	}
	stratParsed, err := abi.JSON(strings.NewReader(linearStrategyABI))
	if err != nil {
		return nil, fmt.Errorf("parse linear strategy abi: %w", err)
	}
	geometryParsed, err := abi.JSON(strings.NewReader(geometryStrategyABI))
	if err != nil {
		return nil, fmt.Errorf("parse geometry strategy abi: %w", err)
	}
	return &Decoder{abi: parsed, strategyABI: stratParsed, geometryABI: geometryParsed}, nil
}

// DecodePairCreated decodes a PairCreated event log.
func (d *Decoder) DecodePairCreated(log types.Log) (*PairCreatedEvent, error) {
	event := &PairCreatedEvent{}

	// Indexed parameters are in Topics
	if len(log.Topics) < 3 {
		return nil, fmt.Errorf("PairCreated: expected 3 topics, got %d", len(log.Topics))
	}
	event.Base = common.HexToAddress(log.Topics[1].Hex())
	event.Quote = common.HexToAddress(log.Topics[2].Hex())

	// Non-indexed parameters are in Data
	values, err := d.abi.Events["PairCreated"].Inputs.NonIndexed().Unpack(log.Data)
	if err != nil {
		return nil, fmt.Errorf("unpack PairCreated data: %w", err)
	}
	event.PairID = values[0].(uint64)

	return event, nil
}

// DecodeGridOrderCreated decodes a GridOrderCreated event log.
// Updated to match contract: GridOrderCreated(address indexed owner, uint64 pairId, uint256 amount, uint48 gridId, uint32 asks, uint32 bids, uint32 fee, bool compound, bool oneshot)
func (d *Decoder) DecodeGridOrderCreated(log types.Log) (*GridOrderCreatedEvent, error) {
	event := &GridOrderCreatedEvent{}

	// Indexed: owner
	if len(log.Topics) < 2 {
		return nil, fmt.Errorf("GridOrderCreated: expected 2 topics, got %d", len(log.Topics))
	}
	event.Owner = common.HexToAddress(log.Topics[1].Hex())

	// Non-indexed parameters
	values, err := d.abi.Events["GridOrderCreated"].Inputs.NonIndexed().Unpack(log.Data)
	if err != nil {
		return nil, fmt.Errorf("unpack GridOrderCreated data: %w", err)
	}

	event.PairID = values[0].(uint64)
	event.Amount = values[1].(*big.Int)
	// gridId is uint48, abi library returns it as *big.Int
	gridIDBig := values[2].(*big.Int)
	event.GridID = gridIDBig.Uint64()
	event.Asks = values[3].(uint32)
	event.Bids = values[4].(uint32)
	event.Fee = values[5].(uint32)
	event.Compound = values[6].(bool)
	event.Oneshot = values[7].(bool)

	return event, nil
}

// DecodeFilledOrder decodes a FilledOrder event log.
// Updated for v2 contract with uint64 orderId.
func (d *Decoder) DecodeFilledOrder(log types.Log) (*FilledOrderEvent, error) {
	event := &FilledOrderEvent{}

	// All parameters are non-indexed
	values, err := d.abi.Events["FilledOrder"].Inputs.NonIndexed().Unpack(log.Data)
	if err != nil {
		return nil, fmt.Errorf("unpack FilledOrder data: %w", err)
	}

	event.Taker = values[0].(common.Address)
	event.OrderID = values[1].(uint64)
	event.BaseAmt = values[2].(*big.Int)
	event.QuoteVol = values[3].(*big.Int)
	event.OrderAmt = values[4].(*big.Int)
	event.OrderRevAmt = values[5].(*big.Int)
	event.IsAsk = values[6].(bool)

	return event, nil
}

// DecodeCancelGridOrder decodes a CancelGridOrder event log.
// Updated for v2 contract with new types.
func (d *Decoder) DecodeCancelGridOrder(log types.Log) (*CancelGridOrderEvent, error) {
	event := &CancelGridOrderEvent{}

	// All parameters are indexed (in Topics)
	if len(log.Topics) < 4 {
		return nil, fmt.Errorf("CancelGridOrder: expected 4 topics, got %d", len(log.Topics))
	}
	event.Owner = common.HexToAddress(log.Topics[1].Hex())
	// orderId is uint64
	event.OrderID = new(big.Int).SetBytes(log.Topics[2].Bytes()).Uint64()
	// gridId is uint48
	event.GridID = new(big.Int).SetBytes(log.Topics[3].Bytes()).Uint64()

	return event, nil
}

// DecodeCancelWholeGrid decodes a CancelWholeGrid event log.
// Updated for v2 contract with uint48 gridId.
func (d *Decoder) DecodeCancelWholeGrid(log types.Log) (*CancelWholeGridEvent, error) {
	event := &CancelWholeGridEvent{}

	if len(log.Topics) < 3 {
		return nil, fmt.Errorf("CancelWholeGrid: expected 3 topics, got %d", len(log.Topics))
	}
	event.Owner = common.HexToAddress(log.Topics[1].Hex())
	event.GridID = new(big.Int).SetBytes(log.Topics[2].Bytes()).Uint64()

	return event, nil
}

// DecodeGridFeeChanged decodes a GridFeeChanged event log.
// Updated for v2 contract with uint48 gridId.
func (d *Decoder) DecodeGridFeeChanged(log types.Log) (*GridFeeChangedEvent, error) {
	event := &GridFeeChangedEvent{}

	if len(log.Topics) < 2 {
		return nil, fmt.Errorf("GridFeeChanged: expected 2 topics, got %d", len(log.Topics))
	}
	event.Sender = common.HexToAddress(log.Topics[1].Hex())

	values, err := d.abi.Events["GridFeeChanged"].Inputs.NonIndexed().Unpack(log.Data)
	if err != nil {
		return nil, fmt.Errorf("unpack GridFeeChanged data: %w", err)
	}
	event.GridID = values[0].(uint64)
	event.Fee = values[1].(uint32)

	return event, nil
}

// DecodeWithdrawProfit decodes a WithdrawProfit event log.
// Updated for v2 contract with uint48 gridId.
func (d *Decoder) DecodeWithdrawProfit(log types.Log) (*WithdrawProfitEvent, error) {
	event := &WithdrawProfitEvent{}

	values, err := d.abi.Events["WithdrawProfit"].Inputs.NonIndexed().Unpack(log.Data)
	if err != nil {
		return nil, fmt.Errorf("unpack WithdrawProfit data: %w", err)
	}
	event.GridID = values[0].(uint64)
	event.Quote = values[1].(common.Address)
	event.To = values[2].(common.Address)
	event.Amt = values[3].(*big.Int)

	return event, nil
}

// DecodeLinearStrategyCreated decodes a LinearStrategyCreated event log.
func (d *Decoder) DecodeLinearStrategyCreated(log types.Log) (*LinearStrategyCreatedEvent, error) {
	event := &LinearStrategyCreatedEvent{}

	// All parameters are non-indexed
	values, err := d.strategyABI.Events["LinearStrategyCreated"].Inputs.NonIndexed().Unpack(log.Data)
	if err != nil {
		return nil, fmt.Errorf("unpack LinearStrategyCreated data: %w", err)
	}

	event.IsAsk = values[0].(bool)
	event.GridID = values[1].(*big.Int)
	event.Price0 = values[2].(*big.Int)
	event.Gap = values[3].(*big.Int)

	return event, nil
}

// DecodeGeometryStrategyCreated decodes a GeometryStrategyCreated event log.
func (d *Decoder) DecodeGeometryStrategyCreated(log types.Log) (*GeometryStrategyCreatedEvent, error) {
	event := &GeometryStrategyCreatedEvent{}

	// All parameters are non-indexed
	values, err := d.geometryABI.Events["GeometryStrategyCreated"].Inputs.NonIndexed().Unpack(log.Data)
	if err != nil {
		return nil, fmt.Errorf("unpack GeometryStrategyCreated data: %w", err)
	}

	event.IsAsk = values[0].(bool)
	event.GridID = values[1].(*big.Int)
	event.Price0 = values[2].(*big.Int)
	event.Ratio = values[3].(*big.Int)

	return event, nil
}
