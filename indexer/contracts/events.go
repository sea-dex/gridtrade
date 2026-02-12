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

	// GridOrderCreated(address indexed owner, uint64 pairId, uint256 amount, uint128 gridId,
	//   uint256 askOrderId, uint256 bidOrderId, uint32 asks, uint32 bids, uint32 fee, bool compound, bool oneshot)
	TopicGridOrderCreated = crypto.Keccak256Hash([]byte("GridOrderCreated(address,uint64,uint256,uint128,uint256,uint256,uint32,uint32,uint32,bool,bool)"))

	// FilledOrder(address taker, uint256 gridOrderId, uint256 baseAmt, uint256 quoteVol,
	//   uint256 orderAmt, uint256 orderRevAmt, bool isAsk)
	TopicFilledOrder = crypto.Keccak256Hash([]byte("FilledOrder(address,uint256,uint256,uint256,uint256,uint256,bool)"))

	// CancelGridOrder(address indexed owner, uint128 indexed orderId, uint128 indexed gridId)
	TopicCancelGridOrder = crypto.Keccak256Hash([]byte("CancelGridOrder(address,uint128,uint128)"))

	// CancelWholeGrid(address indexed owner, uint128 indexed gridId)
	TopicCancelWholeGrid = crypto.Keccak256Hash([]byte("CancelWholeGrid(address,uint128)"))

	// GridFeeChanged(address indexed sender, uint256 gridId, uint32 fee)
	TopicGridFeeChanged = crypto.Keccak256Hash([]byte("GridFeeChanged(address,uint256,uint32)"))

	// WithdrawProfit(uint128 gridId, address quote, address to, uint256 amt)
	TopicWithdrawProfit = crypto.Keccak256Hash([]byte("WithdrawProfit(uint128,address,address,uint256)"))

	// LinearStrategyCreated(bool isAsk, uint128 gridId, uint256 price0, int256 gap)
	// Emitted by the Linear strategy contract before GridOrderCreated.
	TopicLinearStrategyCreated = crypto.Keccak256Hash([]byte("LinearStrategyCreated(bool,uint128,uint256,int256)"))
)

// ASK_ORDER_FLAG is the high bit flag for ask orders in gridOrderId.
// In Solidity: uint128 constant ASK_ORDER_FLAG = 1 << 127
var ASKOrderFlag = new(big.Int).Lsh(big.NewInt(1), 127)

// OrderIDMask is used to extract the raw orderId from a gridOrderId.
// In Solidity: uint128 constant ODER_ID_MASK = (1 << 128) - 1
var OrderIDMask = new(big.Int).Sub(new(big.Int).Lsh(big.NewInt(1), 128), big.NewInt(1))

// PairCreatedEvent represents a decoded PairCreated event.
type PairCreatedEvent struct {
	Base   common.Address
	Quote  common.Address
	PairID uint64
}

// GridOrderCreatedEvent represents a decoded GridOrderCreated event.
type GridOrderCreatedEvent struct {
	Owner      common.Address
	PairID     uint64
	Amount     *big.Int
	GridID     *big.Int // uint128
	AskOrderID *big.Int // uint256 (first ask order id)
	BidOrderID *big.Int // uint256 (first bid order id)
	Asks       uint32
	Bids       uint32
	Fee        uint32
	Compound   bool
	Oneshot    bool
}

// FilledOrderEvent represents a decoded FilledOrder event.
type FilledOrderEvent struct {
	Taker       common.Address
	GridOrderID *big.Int // uint256 = (gridId << 128) | orderId
	BaseAmt     *big.Int
	QuoteVol    *big.Int
	OrderAmt    *big.Int
	OrderRevAmt *big.Int
	IsAsk       bool
}

// CancelGridOrderEvent represents a decoded CancelGridOrder event.
type CancelGridOrderEvent struct {
	Owner   common.Address
	OrderID *big.Int // uint128
	GridID  *big.Int // uint128
}

// CancelWholeGridEvent represents a decoded CancelWholeGrid event.
type CancelWholeGridEvent struct {
	Owner  common.Address
	GridID *big.Int // uint128
}

// GridFeeChangedEvent represents a decoded GridFeeChanged event.
type GridFeeChangedEvent struct {
	Sender common.Address
	GridID *big.Int
	Fee    uint32
}

// WithdrawProfitEvent represents a decoded WithdrawProfit event.
type WithdrawProfitEvent struct {
	GridID *big.Int
	Quote  common.Address
	To     common.Address
	Amt    *big.Int
}

// LinearStrategyCreatedEvent represents a decoded LinearStrategyCreated event.
// Emitted by the Linear strategy contract before GridOrderCreated in the same tx.
type LinearStrategyCreatedEvent struct {
	IsAsk  bool
	GridID *big.Int // uint128
	Price0 *big.Int // uint256 - starting price
	Gap    *big.Int // int256 - price gap between consecutive orders
}

// ExtractGridIDOrderID extracts gridId and orderId from a gridOrderId (uint256).
// gridOrderId = (gridId << 128) | orderId
func ExtractGridIDOrderID(gridOrderID *big.Int) (gridID *big.Int, orderID *big.Int) {
	orderID = new(big.Int).And(gridOrderID, OrderIDMask)
	gridID = new(big.Int).Rsh(gridOrderID, 128)
	return gridID, orderID
}

// IsAskOrder checks if an orderId has the ASK_ORDER_FLAG set.
func IsAskOrder(orderID *big.Int) bool {
	return new(big.Int).And(orderID, ASKOrderFlag).Sign() > 0
}
