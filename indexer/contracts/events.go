package contracts

import (
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

// Event topic signatures (keccak256 of event signatures).
var (
	// PairCreated(address indexed base, address indexed quote, uint64 pairId)
	TopicPairCreated = crypto.Keccak256Hash([]byte("PairCreated(address,address,uint64)"))

	// GridOrderCreated(address indexed owner, uint64 pairId, uint256 amount, uint48 gridId,
	//   uint64 askOrderId, uint64 bidOrderId, uint16 asks, uint16 bids, uint32 fee, bool compound, bool oneshot)
	// Note: gridId is now uint48, orderId is now uint64 (not uint256)
	TopicGridOrderCreated = crypto.Keccak256Hash([]byte("GridOrderCreated(address,uint64,uint256,uint48,uint64,uint64,uint16,uint16,uint32,bool,bool)"))

	// FilledOrder(address taker, uint64 orderId, uint256 baseAmt, uint256 quoteVol,
	//   uint256 orderAmt, uint256 orderRevAmt, bool isAsk)
	// Note: orderId is now uint64 (not uint256 gridOrderId)
	TopicFilledOrder = crypto.Keccak256Hash([]byte("FilledOrder(address,uint64,uint256,uint256,uint256,uint256,bool)"))

	// CancelGridOrder(address indexed owner, uint64 indexed orderId, uint48 indexed gridId)
	// Note: orderId is uint64, gridId is uint48
	TopicCancelGridOrder = crypto.Keccak256Hash([]byte("CancelGridOrder(address,uint64,uint48)"))

	// CancelWholeGrid(address indexed owner, uint48 indexed gridId)
	// Note: gridId is uint48
	TopicCancelWholeGrid = crypto.Keccak256Hash([]byte("CancelWholeGrid(address,uint48)"))

	// GridFeeChanged(address indexed sender, uint48 gridId, uint32 fee)
	TopicGridFeeChanged = crypto.Keccak256Hash([]byte("GridFeeChanged(address,uint48,uint32)"))

	// WithdrawProfit(uint48 gridId, address quote, address to, uint256 amt)
	TopicWithdrawProfit = crypto.Keccak256Hash([]byte("WithdrawProfit(uint48,address,address,uint256)"))

	// LinearStrategyCreated(bool isAsk, uint48 gridId, uint256 price0, int256 gap)
	// Emitted by the Linear strategy contract before GridOrderCreated.
	TopicLinearStrategyCreated = crypto.Keccak256Hash([]byte("LinearStrategyCreated(bool,uint48,uint256,int256)"))

	// GeometryStrategyCreated(bool isAsk, uint48 gridId, uint256 price0, uint256 ratio)
	// Emitted by the Geometry strategy contract before GridOrderCreated.
	TopicGeometryStrategyCreated = crypto.Keccak256Hash([]byte("GeometryStrategyCreated(bool,uint48,uint256,uint256)"))
)

// ASK_ORDER_FLAG is the high bit flag for ask orders.
// In Solidity: uint128 constant ASK_ORDER_FLAG = 1 << 127
var ASKOrderFlag = new(big.Int).Lsh(big.NewInt(1), 127)

// OrderIDMask is used to extract the raw orderId from a gridOrderId.
// In Solidity: uint128 constant ODER_ID_MASK = (1 << 128) - 1
// Note: This may no longer be needed with the new uint64 orderId
var OrderIDMask = new(big.Int).Sub(new(big.Int).Lsh(big.NewInt(1), 128), big.NewInt(1))

// PairCreatedEvent represents a decoded PairCreated event.
type PairCreatedEvent struct {
	Base   common.Address
	Quote  common.Address
	PairID uint64
}

// GridOrderCreatedEvent represents a decoded GridOrderCreated event.
// Note: Types updated for v2 contract
type GridOrderCreatedEvent struct {
	Owner      common.Address
	PairID     uint64
	Amount     *big.Int
	GridID     uint64 // uint48 in contract, stored as uint64 for convenience
	AskOrderID uint64 // uint64 (was uint256)
	BidOrderID uint64 // uint64 (was uint256)
	Asks       uint16 // uint16 (was uint32)
	Bids       uint16 // uint16 (was uint32)
	Fee        uint32
	Compound   bool
	Oneshot    bool
}

// FilledOrderEvent represents a decoded FilledOrder event.
// Note: orderId is now uint64
type FilledOrderEvent struct {
	Taker       common.Address
	OrderID     uint64 // uint64 (was uint256 gridOrderId)
	BaseAmt     *big.Int
	QuoteVol    *big.Int
	OrderAmt    *big.Int
	OrderRevAmt *big.Int
	IsAsk       bool
}

// CancelGridOrderEvent represents a decoded CancelGridOrder event.
type CancelGridOrderEvent struct {
	Owner   common.Address
	OrderID uint64 // uint64 (was uint128)
	GridID  uint64 // uint48 (was uint128)
}

// CancelWholeGridEvent represents a decoded CancelWholeGrid event.
type CancelWholeGridEvent struct {
	Owner  common.Address
	GridID uint64 // uint48 (was uint128)
}

// GridFeeChangedEvent represents a decoded GridFeeChanged event.
type GridFeeChangedEvent struct {
	Sender common.Address
	GridID uint64 // uint48
	Fee    uint32
}

// WithdrawProfitEvent represents a decoded WithdrawProfit event.
type WithdrawProfitEvent struct {
	GridID uint64 // uint48
	Quote  common.Address
	To     common.Address
	Amt    *big.Int
}

// LinearStrategyCreatedEvent represents a decoded LinearStrategyCreated event.
type LinearStrategyCreatedEvent struct {
	IsAsk  bool
	GridID *big.Int // uint128
	Price0 *big.Int
	Gap    *big.Int
}

// GeometryStrategyCreatedEvent represents a decoded GeometryStrategyCreated event.
type GeometryStrategyCreatedEvent struct {
	IsAsk  bool
	GridID *big.Int // uint128
	Price0 *big.Int
	Ratio  *big.Int
}

// ExtractGridIDOrderID extracts gridId and orderId from a gridOrderId (uint256).
// gridOrderId = (gridId << 128) | orderId
// Note: This function is kept for backward compatibility but may not be needed with v2.
func ExtractGridIDOrderID(gridOrderID *big.Int) (gridID *big.Int, orderID *big.Int) {
	orderID = new(big.Int).And(gridOrderID, OrderIDMask)
	gridID = new(big.Int).Rsh(gridOrderID, 128)
	return gridID, orderID
}

// IsAskOrder checks if an orderId has the ASK_ORDER_FLAG set.
func IsAskOrder(orderID *big.Int) bool {
	return new(big.Int).And(orderID, ASKOrderFlag).Sign() > 0
}
