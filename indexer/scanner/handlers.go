package scanner

import (
	"context"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/ethereum/go-ethereum/core/types"
	"github.com/jackc/pgx/v5"

	"github.com/gridex/indexer/db"
	"github.com/gridex/indexer/kafka"
)

// handleLinearStrategyCreated processes a LinearStrategyCreated event from the strategy contract.
// It caches price0 and gap per gridId for later use by handleGridOrderCreated.
func (s *Scanner) handleLinearStrategyCreated(ctx context.Context, tx pgx.Tx, log types.Log) ([]*kafka.Message, error) {
	event, err := s.decoder.DecodeLinearStrategyCreated(log)
	if err != nil {
		return nil, fmt.Errorf("decode LinearStrategyCreated: %w", err)
	}

	gridIDStr := event.GridID.String()

	s.logger.Info("LinearStrategyCreated",
		"grid_id", gridIDStr,
		"is_ask", event.IsAsk,
		"price0", event.Price0.String(),
		"gap", event.Gap.String(),
	)

	// Cache the strategy info keyed by gridIdStr + isAsk.
	// Ask and bid orders can have different strategies.
	key := gridIDStr + "_ask"
	if !event.IsAsk {
		key = gridIDStr + "_bid"
	}
	info := &strategyInfo{
		AskStrategy: StrategyTypeLinear,
		AskPrice0:   event.Price0,
		AskGap:      event.Gap,
	}
	if !event.IsAsk {
		info = &strategyInfo{
			BidStrategy: StrategyTypeLinear,
			BidPrice0:   event.Price0,
			BidGap:      event.Gap,
		}
	}
	s.strategyCache[key] = info

	return nil, nil
}

// handleGeometryStrategyCreated processes a GeometryStrategyCreated event from the geometry strategy contract.
// It caches price0 and ratio per gridId for later use by handleGridOrderCreated.
func (s *Scanner) handleGeometryStrategyCreated(ctx context.Context, tx pgx.Tx, log types.Log) ([]*kafka.Message, error) {
	event, err := s.decoder.DecodeGeometryStrategyCreated(log)
	if err != nil {
		return nil, fmt.Errorf("decode GeometryStrategyCreated: %w", err)
	}

	gridIDStr := event.GridID.String()

	s.logger.Info("GeometryStrategyCreated",
		"grid_id", gridIDStr,
		"is_ask", event.IsAsk,
		"price0", event.Price0.String(),
		"ratio", event.Ratio.String(),
	)

	// Cache the strategy info keyed by gridIdStr + isAsk.
	// Ask and bid orders can have different strategies.
	key := gridIDStr + "_ask"
	if !event.IsAsk {
		key = gridIDStr + "_bid"
	}
	info := &strategyInfo{
		AskStrategy: StrategyTypeGeometry,
		AskPrice0:   event.Price0,
		AskRatio:    event.Ratio,
	}
	if !event.IsAsk {
		info = &strategyInfo{
			BidStrategy: StrategyTypeGeometry,
			BidPrice0:   event.Price0,
			BidRatio:    event.Ratio,
		}
	}
	s.strategyCache[key] = info

	return nil, nil
}

// handlePairCreated processes a PairCreated event.
func (s *Scanner) handlePairCreated(ctx context.Context, tx pgx.Tx, log types.Log) ([]*kafka.Message, error) {
	event, err := s.decoder.DecodePairCreated(log)
	if err != nil {
		return nil, fmt.Errorf("decode PairCreated: %w", err)
	}

	s.logger.Info("PairCreated",
		"pair_id", event.PairID,
		"base", event.Base.Hex(),
		"quote", event.Quote.Hex(),
	)

	// Fetch token info for both base and quote
	baseInfo, err := s.getOrFetchToken(ctx, tx, event.Base, log.BlockNumber)
	if err != nil {
		return nil, fmt.Errorf("fetch base token: %w", err)
	}
	quoteInfo, err := s.getOrFetchToken(ctx, tx, event.Quote, log.BlockNumber)
	if err != nil {
		return nil, fmt.Errorf("fetch quote token: %w", err)
	}

	// Upsert base and quote tokens into the tokens table
	if err := db.UpsertToken(ctx, tx, s.cfg.ChainID,
		strings.ToLower(event.Base.Hex()), baseInfo.Symbol, baseInfo.Name, int(baseInfo.Decimals), log.BlockNumber); err != nil {
		return nil, fmt.Errorf("upsert base token: %w", err)
	}
	if err := db.UpsertToken(ctx, tx, s.cfg.ChainID,
		strings.ToLower(event.Quote.Hex()), quoteInfo.Symbol, quoteInfo.Name, int(quoteInfo.Decimals), log.BlockNumber); err != nil {
		return nil, fmt.Errorf("upsert quote token: %w", err)
	}

	// Insert pair
	if err := db.InsertPair(ctx, tx, s.cfg.ChainID, int(event.PairID),
		baseInfo.Symbol, strings.ToLower(event.Base.Hex()),
		quoteInfo.Symbol, strings.ToLower(event.Quote.Hex()),
		log.BlockNumber); err != nil {
		return nil, err
	}

	// Build Kafka message
	msg := s.makeBaseMsg(log, kafka.EventPairCreated)
	msg.Data = &kafka.PairCreatedData{
		PairID:       int(event.PairID),
		BaseAddress:  strings.ToLower(event.Base.Hex()),
		QuoteAddress: strings.ToLower(event.Quote.Hex()),
		BaseSymbol:   baseInfo.Symbol,
		QuoteSymbol:  quoteInfo.Symbol,
	}

	return []*kafka.Message{msg}, nil
}

// handleGridOrderCreated processes a GridOrderCreated event.
func (s *Scanner) handleGridOrderCreated(ctx context.Context, tx pgx.Tx, log types.Log) ([]*kafka.Message, error) {
	event, err := s.decoder.DecodeGridOrderCreated(log)
	if err != nil {
		return nil, fmt.Errorf("decode GridOrderCreated: %w", err)
	}

	gridID := int64(event.GridID)
	gridIDStr := fmt.Sprintf("%d", event.GridID)

	// Consume cached strategy data (if any).
	// The strategy events fire before GridOrderCreated in the same tx.
	// Ask and bid strategies are cached separately with keys: gridIdStr + "_ask" / gridIdStr + "_bid"
	askStratInfo, askOk := s.strategyCache[gridIDStr+"_ask"]
	bidStratInfo, bidOk := s.strategyCache[gridIDStr+"_bid"]
	if !askOk && !bidOk {
		s.logger.Error("not found strategy for grid", "grid_id", gridID)
		return nil, fmt.Errorf("not found strategy for grid")
	}

	var askStrategy, bidStrategy string
	var askPrice0, askGap, bidPrice0, bidGap string
	var askRatio, bidRatio string
	var bidPrice0Int, bidGapInt *big.Int // kept as *big.Int for initialQuoteAmount calculation
	if askStratInfo != nil {
		askStrategy = string(askStratInfo.AskStrategy)
		if askStratInfo.AskPrice0 != nil {
			askPrice0 = askStratInfo.AskPrice0.String()
		}
		if askStratInfo.AskGap != nil {
			askGap = askStratInfo.AskGap.String()
		}
		if askStratInfo.AskRatio != nil {
			askRatio = askStratInfo.AskRatio.String()
		}
	}
	if bidStratInfo != nil {
		bidStrategy = string(bidStratInfo.BidStrategy)
		if bidStratInfo.BidPrice0 != nil {
			bidPrice0 = bidStratInfo.BidPrice0.String()
			bidPrice0Int = new(big.Int).Set(bidStratInfo.BidPrice0)
		}
		if bidStratInfo.BidGap != nil {
			bidGap = bidStratInfo.BidGap.String()
			bidGapInt = new(big.Int).Set(bidStratInfo.BidGap)
		}
		if bidStratInfo.BidRatio != nil {
			bidRatio = bidStratInfo.BidRatio.String()
		}
	}
	// Remove from cache after consumption
	delete(s.strategyCache, gridIDStr+"_ask")
	delete(s.strategyCache, gridIDStr+"_bid")

	s.logger.Info("consumed strategy cache",
		"grid_id", gridID,
		"ask_strategy", askStrategy,
		"bid_strategy", bidStrategy,
		"ask_price0", askPrice0,
		"ask_gap", askGap,
		"ask_ratio", askRatio,
		"bid_price0", bidPrice0,
		"bid_gap", bidGap,
		"bid_ratio", bidRatio,
	)

	// Get pair tokens from chain to populate base_token and quote_token
	baseAddr, quoteAddr, err := s.caller.GetPairTokens(ctx, event.PairID)
	if err != nil {
		return nil, fmt.Errorf("get pair tokens: %w", err)
	}

	baseInfo, err := s.getOrFetchToken(ctx, tx, baseAddr, log.BlockNumber)
	if err != nil {
		return nil, fmt.Errorf("fetch base token: %w", err)
	}
	quoteInfo, err := s.getOrFetchToken(ctx, tx, quoteAddr, log.BlockNumber)
	if err != nil {
		return nil, fmt.Errorf("fetch quote token: %w", err)
	}

	// Fetch init_price from OKX DEX Aggregator Quote API
	initPrice := ""
	if s.okxPriceClient != nil {
		initPrice, err = s.okxPriceClient.GetPairPrice(ctx, s.cfg.ChainID,
			strings.ToLower(baseAddr.Hex()), strings.ToLower(quoteAddr.Hex()),
			baseInfo.Decimals, quoteInfo.Decimals)
		if err != nil {
			s.logger.Warn("failed to fetch init_price from OKX, using empty string",
				"error", err,
				"base", baseAddr.Hex(),
				"quote", quoteAddr.Hex(),
			)
			initPrice = ""
		} else {
			s.logger.Info("fetched init_price from OKX",
				"init_price", initPrice,
				"base", baseInfo.Symbol,
				"quote", quoteInfo.Symbol,
			)
		}
	}

	// Fetch USD prices for base and quote tokens (for APR calculation)
	chainIndex := fmt.Sprintf("%d", s.cfg.ChainID)
	initBasePrice := ""
	initQuotePrice := ""
	if s.okxPriceClient != nil {
		initBasePrice, err = s.okxPriceClient.GetTokenPrice(ctx, chainIndex, strings.ToLower(baseAddr.Hex()))
		if err != nil {
			s.logger.Warn("failed to fetch init_base_price from OKX",
				"error", err, "base", baseAddr.Hex())
			initBasePrice = ""
		}
		initQuotePrice, err = s.okxPriceClient.GetTokenPrice(ctx, chainIndex, strings.ToLower(quoteAddr.Hex()))
		if err != nil {
			s.logger.Warn("failed to fetch init_quote_price from OKX",
				"error", err, "quote", quoteAddr.Hex())
			initQuotePrice = ""
		}
		if initBasePrice != "" && initQuotePrice != "" {
			s.logger.Info("fetched init USD prices from OKX",
				"init_base_price", initBasePrice,
				"init_quote_price", initQuotePrice,
				"base", baseInfo.Symbol,
				"quote", quoteInfo.Symbol,
			)
		}
	}

	// Calculate initialBaseAmount and initialQuoteAmount per Lens.sol calcGridAmount logic.
	// bidPrice0Int and bidGapInt come from the cached LinearStrategyCreated event.
	// For bid orders: price_i = bidPrice0 + bidGap * i (bidGap is int256, negative for bids)
	// quoteAmt_i = floor(baseAmt * price_i / PRICE_MULTIPLIER)
	// initialBaseAmount = baseAmt * askCount
	if bidPrice0Int == nil {
		bidPrice0Int = new(big.Int)
	}
	if bidGapInt == nil {
		bidGapInt = new(big.Int)
	}
	initBase, initQuote := calcInitialAmounts(event.Amount, bidPrice0Int, bidGapInt, uint32(event.Asks), uint32(event.Bids))
	initialBaseAmountStr := initBase.String()
	initialQuoteAmountStr := initQuote.String()

	s.logger.Info("GridOrderCreated",
		"grid_id", gridID,
		"owner", event.Owner.Hex(),
		"pair_id", event.PairID,
		"asks", event.Asks,
		"bids", event.Bids,
		"initial_base_amount", initialBaseAmountStr,
		"initial_quote_amount", initialQuoteAmountStr,
	)

	// Insert grid with strategy data
	if err := db.InsertGrid(ctx, tx, s.cfg.ChainID, gridID,
		strings.ToLower(event.Owner.Hex()), int(event.PairID),
		baseInfo.Symbol, quoteInfo.Symbol,
		initialBaseAmountStr, initialQuoteAmountStr,
		int(event.Asks), int(event.Bids), int(event.Fee),
		event.Compound, event.Oneshot,
		askStrategy, bidStrategy,
		askPrice0, askGap, bidPrice0, bidGap,
		askRatio, bidRatio,
		initPrice,
		initBasePrice, initQuotePrice,
		log.BlockNumber); err != nil {
		return nil, err
	}

	// Increment active grids for the pair
	if err := db.IncrementPairActiveGrids(ctx, tx, s.cfg.ChainID, int(event.PairID), log.BlockNumber); err != nil {
		return nil, err
	}

	var msgs []*kafka.Message

	// Grid created message
	gridMsg := s.makeBaseMsg(log, kafka.EventGridCreated)
	gridMsg.Data = &kafka.GridCreatedData{
		GridID:             gridID,
		Owner:              strings.ToLower(event.Owner.Hex()),
		PairID:             int(event.PairID),
		BaseToken:          baseInfo.Symbol,
		QuoteToken:         quoteInfo.Symbol,
		AskOrderCount:      int(event.Asks),
		BidOrderCount:      int(event.Bids),
		InitialBaseAmount:  initialBaseAmountStr,
		InitialQuoteAmount: initialQuoteAmountStr,
		Fee:                int(event.Fee),
		Compound:           event.Compound,
		Oneshot:            event.Oneshot,
		AskPrice0:          askPrice0,
		AskGap:             askGap,
		BidPrice0:          bidPrice0,
		BidGap:             bidGap,
	}
	msgs = append(msgs, gridMsg)

	// Compute and insert individual orders from strategy parameters (no contract calls).
	// Ask orders: askOrderId, askOrderId+1, ..., askOrderId+(asks-1)
	for i := uint16(0); i < event.Asks; i++ {
		orderID := new(big.Int).SetUint64(event.AskOrderID + uint64(i))
		gridOrderID := toGridOrderID(big.NewInt(int64(event.GridID)), orderID)

		orderMsgs, err := s.computeAndInsertOrder(ctx, tx, log, gridOrderID, gridID,
			int(event.PairID), true, event.Compound, event.Oneshot, int(event.Fee),
			event.Amount, askStratInfo, uint32(i),
		)
		if err != nil {
			return nil, fmt.Errorf("insert ask order %d: %w", i, err)
		}
		msgs = append(msgs, orderMsgs...)
	}

	// Bid orders: bidOrderId, bidOrderId+1, ..., bidOrderId+(bids-1)
	for i := uint16(0); i < event.Bids; i++ {
		orderID := new(big.Int).SetUint64(event.BidOrderID + uint64(i))
		gridOrderID := toGridOrderID(big.NewInt(int64(event.GridID)), orderID)

		orderMsgs, err := s.computeAndInsertOrder(ctx, tx, log, gridOrderID, gridID,
			int(event.PairID), false, event.Compound, event.Oneshot, int(event.Fee),
			event.Amount, bidStratInfo, uint32(i),
		)
		if err != nil {
			return nil, fmt.Errorf("insert bid order %d: %w", i, err)
		}
		msgs = append(msgs, orderMsgs...)
	}

	return msgs, nil
}

// computeAndInsertOrder calculates order properties from strategy parameters
// (price0, gap, orderIndex) and inserts the order into the DB.
// This avoids calling the contract's GetGridOrder method.
//
// For a linear grid strategy:
//   - Ask order i: price = askPrice0 + askGap * i, amount = baseAmt
//   - Bid order i: price = bidPrice0 + bidGap * i, amount = calcQuoteAmount(baseAmt, price)
//   - revPrice is the corresponding price on the opposite side at the same index
//   - revAmount is 0 for newly created orders
func (s *Scanner) computeAndInsertOrder(ctx context.Context, tx pgx.Tx, log types.Log,
	gridOrderID *big.Int, gridID int64, pairID int, isAsk, compound, oneshot bool,
	fee int, baseAmt *big.Int, strat *linearStrategyInfo, orderIndex uint32) ([]*kafka.Message, error) {

	idx := big.NewInt(int64(orderIndex))

	var (
		price, revPrice, amount               *big.Int
		initialBaseAmount, initialQuoteAmount string
	)
	revAmount := big.NewInt(0)

	if isAsk {
		// Ask order: price = askPrice0 + askGap * i
		askPrice0 := strat.AskPrice0
		if askPrice0 == nil {
			askPrice0 = new(big.Int)
		}
		askGap := strat.AskGap
		if askGap == nil {
			askGap = new(big.Int)
		}
		price = new(big.Int).Add(askPrice0, new(big.Int).Mul(askGap, idx))

		// revPrice for ask = price - askGap (the price when order flips to bid)
		revPrice = new(big.Int).Sub(price, askGap)

		// Ask order amount = baseAmt (base token)
		amount = new(big.Int).Set(baseAmt)
		initialBaseAmount = amount.String()
		initialQuoteAmount = "0"
	} else {
		// Bid order: price = bidPrice0 + bidGap * i
		bidPrice0 := strat.BidPrice0
		if bidPrice0 == nil {
			bidPrice0 = new(big.Int)
		}
		bidGap := strat.BidGap
		if bidGap == nil {
			bidGap = new(big.Int)
		}
		price = new(big.Int).Add(bidPrice0, new(big.Int).Mul(bidGap, idx))

		// revPrice for bid = price + bidGap (the price when order flips to ask), bidGap is negtive
		revPrice = new(big.Int).Sub(price, bidGap)

		// Bid order amount = calcQuoteAmount(baseAmt, price) (quote token)
		amount = calcQuoteAmount(baseAmt, price)
		initialBaseAmount = "0"
		initialQuoteAmount = amount.String()
	}

	orderIDStr := gridOrderID.String()

	if err := db.InsertOrder(ctx, tx, s.cfg.ChainID, orderIDStr, gridID, pairID,
		isAsk, compound, oneshot, fee,
		amount.String(), revAmount.String(),
		initialBaseAmount, initialQuoteAmount,
		price.String(), revPrice.String(),
		log.BlockNumber); err != nil {
		return nil, err
	}

	msg := s.makeBaseMsg(log, kafka.EventOrderCreated)
	msg.Data = &kafka.OrderCreatedData{
		OrderID:            orderIDStr,
		GridID:             gridID,
		PairID:             pairID,
		IsAsk:              isAsk,
		Amount:             amount.String(),
		RevAmount:          revAmount.String(),
		Price:              price.String(),
		RevPrice:           revPrice.String(),
		InitialBaseAmount:  initialBaseAmount,
		InitialQuoteAmount: initialQuoteAmount,
	}

	return []*kafka.Message{msg}, nil
}

// handleFilledOrder processes a FilledOrder event.
func (s *Scanner) handleFilledOrder(ctx context.Context, tx pgx.Tx, log types.Log) ([]*kafka.Message, error) {
	event, err := s.decoder.DecodeFilledOrder(log)
	if err != nil {
		return nil, fmt.Errorf("decode FilledOrder: %w", err)
	}

	// In v2, orderId is uint64 and we need to look up grid_id from the orders table
	orderIDStr := fmt.Sprintf("%d", event.OrderID)

	// Get grid_id for this order from the database
	gridID, err := db.GetOrderGridID(ctx, tx, s.cfg.ChainID, orderIDStr)
	if err != nil {
		return nil, fmt.Errorf("get grid_id for filled order: %w", err)
	}

	s.logger.Info("FilledOrder",
		"order_id", orderIDStr,
		"grid_id", gridID,
		"taker", event.Taker.Hex(),
		"is_ask", event.IsAsk,
	)

	// Get pair_id for this grid
	pairID, err := db.GetGridPairID(ctx, tx, s.cfg.ChainID, gridID)
	if err != nil {
		return nil, fmt.Errorf("get pair_id for filled order: %w", err)
	}

	// Get block timestamp
	block, err := s.client.BlockByNumber(ctx, new(big.Int).SetUint64(log.BlockNumber))
	if err != nil {
		// Fallback to current time if block fetch fails
		s.logger.Warn("failed to get block timestamp, using current time", "error", err)
	}
	var ts = time.Now().UTC()
	if block != nil {
		ts = time.Unix(int64(block.Time()), 0).UTC()
	}

	// Insert order fill
	if err := db.InsertOrderFill(ctx, tx, s.cfg.ChainID,
		log.TxHash.Hex(), strings.ToLower(event.Taker.Hex()),
		orderIDStr, event.BaseAmt.String(), event.QuoteVol.String(),
		event.IsAsk, pairID, ts, log.BlockNumber); err != nil {
		return nil, err
	}

	// Update order amounts
	if err := db.UpdateOrderOnFill(ctx, tx, s.cfg.ChainID,
		orderIDStr, event.OrderAmt.String(), event.OrderRevAmt.String(),
		log.BlockNumber); err != nil {
		return nil, err
	}

	msg := s.makeBaseMsg(log, kafka.EventOrderFilled)
	msg.Data = &kafka.OrderFilledData{
		OrderID:     orderIDStr,
		GridID:      gridID,
		Taker:       strings.ToLower(event.Taker.Hex()),
		BaseAmt:     event.BaseAmt.String(),
		QuoteVol:    event.QuoteVol.String(),
		OrderAmt:    event.OrderAmt.String(),
		OrderRevAmt: event.OrderRevAmt.String(),
		IsAsk:       event.IsAsk,
	}

	return []*kafka.Message{msg}, nil
}

// handleCancelGridOrder processes a CancelGridOrder event.
func (s *Scanner) handleCancelGridOrder(ctx context.Context, tx pgx.Tx, log types.Log) ([]*kafka.Message, error) {
	event, err := s.decoder.DecodeCancelGridOrder(log)
	if err != nil {
		return nil, fmt.Errorf("decode CancelGridOrder: %w", err)
	}

	gridID := int64(event.GridID)
	orderIDStr := fmt.Sprintf("%d", event.OrderID)

	s.logger.Info("CancelGridOrder",
		"owner", event.Owner.Hex(),
		"order_id", orderIDStr,
		"grid_id", gridID,
	)

	if err := db.CancelOrder(ctx, tx, s.cfg.ChainID, orderIDStr, log.BlockNumber); err != nil {
		return nil, err
	}

	msg := s.makeBaseMsg(log, kafka.EventOrderCancelled)
	msg.Data = &kafka.OrderCancelledData{
		OrderID: orderIDStr,
		GridID:  gridID,
		Owner:   strings.ToLower(event.Owner.Hex()),
	}

	return []*kafka.Message{msg}, nil
}

// handleCancelWholeGrid processes a CancelWholeGrid event.
func (s *Scanner) handleCancelWholeGrid(ctx context.Context, tx pgx.Tx, log types.Log) ([]*kafka.Message, error) {
	event, err := s.decoder.DecodeCancelWholeGrid(log)
	if err != nil {
		return nil, fmt.Errorf("decode CancelWholeGrid: %w", err)
	}

	gridID := int64(event.GridID)

	s.logger.Info("CancelWholeGrid",
		"owner", event.Owner.Hex(),
		"grid_id", gridID,
	)

	// Get pair_id before cancelling to decrement active grids
	pairID, err := db.GetGridPairID(ctx, tx, s.cfg.ChainID, gridID)
	if err != nil {
		s.logger.Warn("failed to get grid pair_id for active grids decrement", "error", err)
	} else {
		if err := db.DecrementPairActiveGrids(ctx, tx, s.cfg.ChainID, pairID, log.BlockNumber); err != nil {
			return nil, err
		}
	}

	if err := db.CancelGrid(ctx, tx, s.cfg.ChainID, gridID, log.BlockNumber); err != nil {
		return nil, err
	}

	msg := s.makeBaseMsg(log, kafka.EventGridCancelled)
	msg.Data = &kafka.GridCancelledData{
		GridID: gridID,
		Owner:  strings.ToLower(event.Owner.Hex()),
	}

	return []*kafka.Message{msg}, nil
}

// handleGridFeeChanged processes a GridFeeChanged event.
func (s *Scanner) handleGridFeeChanged(ctx context.Context, tx pgx.Tx, log types.Log) ([]*kafka.Message, error) {
	event, err := s.decoder.DecodeGridFeeChanged(log)
	if err != nil {
		return nil, fmt.Errorf("decode GridFeeChanged: %w", err)
	}

	gridID := int64(event.GridID)

	s.logger.Info("GridFeeChanged", "grid_id", gridID, "fee", event.Fee)

	if err := db.UpdateGridFee(ctx, tx, s.cfg.ChainID, gridID, int(event.Fee), log.BlockNumber); err != nil {
		return nil, err
	}

	msg := s.makeBaseMsg(log, kafka.EventGridFeeChanged)
	msg.Data = &kafka.GridFeeChangedData{
		GridID: gridID,
		Fee:    int(event.Fee),
	}

	return []*kafka.Message{msg}, nil
}

// handleWithdrawProfit processes a WithdrawProfit event.
func (s *Scanner) handleWithdrawProfit(ctx context.Context, tx pgx.Tx, log types.Log) ([]*kafka.Message, error) {
	event, err := s.decoder.DecodeWithdrawProfit(log)
	if err != nil {
		return nil, fmt.Errorf("decode WithdrawProfit: %w", err)
	}

	gridID := int64(event.GridID)

	s.logger.Info("WithdrawProfit",
		"grid_id", gridID,
		"quote", event.Quote.Hex(),
		"to", event.To.Hex(),
		"amt", event.Amt.String(),
	)

	if err := db.UpdateGridProfits(ctx, tx, s.cfg.ChainID, gridID, event.Amt.String(), log.BlockNumber); err != nil {
		return nil, err
	}

	msg := s.makeBaseMsg(log, kafka.EventProfitWithdrawn)
	msg.Data = &kafka.ProfitWithdrawnData{
		GridID: gridID,
		Quote:  strings.ToLower(event.Quote.Hex()),
		To:     strings.ToLower(event.To.Hex()),
		Amount: event.Amt.String(),
	}

	return []*kafka.Message{msg}, nil
}

// toGridOrderID constructs a gridOrderId from gridId and orderId.
// gridOrderId = (gridId << 128) | orderId
func toGridOrderID(gridID, orderID *big.Int) *big.Int {
	result := new(big.Int).Lsh(gridID, 128)
	result.Or(result, orderID)
	return result
}

// priceMultiplier is 10^36, matching Lens.sol PRICE_MULTIPLIER.
var priceMultiplier = new(big.Int).Exp(big.NewInt(10), big.NewInt(36), nil)

// calcQuoteAmount mirrors Lens.calcQuoteAmount(baseAmt, price, false).
// It computes floor(baseAmt * price / PRICE_MULTIPLIER).
func calcQuoteAmount(baseAmt, price *big.Int) *big.Int {
	// numerator = baseAmt * price
	numerator := new(big.Int).Mul(baseAmt, price)
	// result = floor(numerator / PRICE_MULTIPLIER)
	return new(big.Int).Div(numerator, priceMultiplier)
}

// calcInitialAmounts mirrors Lens.calcGridAmount.
// It computes the initial base and quote amounts for a grid order.
//
// For the bid side, it iterates through each bid order index and computes:
//
//	price_i = bidPrice0 + bidGap * i   (bidGap is int256, typically negative for bids)
//	quoteAmt_i = floor(baseAmt * price_i / PRICE_MULTIPLIER)
//	totalQuoteAmt = sum of all quoteAmt_i
//
// For the ask side: initialBaseAmount = baseAmt * askCount
func calcInitialAmounts(baseAmt *big.Int, bidPrice0, bidGap *big.Int, askCount, bidCount uint32) (initialBaseAmount, initialQuoteAmount *big.Int) {
	// initialBaseAmount = baseAmt * askCount
	initialBaseAmount = new(big.Int).Mul(baseAmt, big.NewInt(int64(askCount)))

	// initialQuoteAmount = sum of calcQuoteAmount for each bid order
	initialQuoteAmount = new(big.Int)
	for i := uint32(0); i < bidCount; i++ {
		// price_i = bidPrice0 + bidGap * i
		offset := new(big.Int).Mul(bidGap, big.NewInt(int64(i)))
		price := new(big.Int).Add(bidPrice0, offset)

		amt := calcQuoteAmount(baseAmt, price)
		initialQuoteAmount.Add(initialQuoteAmount, amt)
	}

	return initialBaseAmount, initialQuoteAmount
}
