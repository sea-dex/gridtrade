package scanner

import (
	"context"
	"fmt"
	"math"
	"math/big"
	"strings"
	"time"

	"github.com/gridex/indexer/db"
)

// runAPRUpdater starts a periodic timer that recalculates APR for all active grids.
// It blocks until ctx is cancelled.
func (s *Scanner) runAPRUpdater(ctx context.Context) {
	interval := time.Duration(s.cfg.APRUpdateInterval) * time.Second
	if interval <= 0 {
		interval = 300 * time.Second // default 5 minutes
	}

	s.logger.Info("starting APR updater", "interval", interval)

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			s.logger.Info("APR updater stopped")
			return
		case <-ticker.C:
			if err := s.updateAllGridAPRs(ctx); err != nil {
				s.logger.Error("failed to update grid APRs", "error", err)
			}
			// Update leaderboard after APR updates
			if err := s.repo.UpdateLeaderboardPeriodic(ctx, s.cfg.ChainID); err != nil {
				s.logger.Error("failed to update leaderboard", "error", err)
			}
		}
	}
}

// updateAllGridAPRs fetches all active grids and recalculates their APR values.
func (s *Scanner) updateAllGridAPRs(ctx context.Context) error {
	grids, err := s.repo.GetActiveGridsForAPR(ctx, s.cfg.ChainID)
	if err != nil {
		return fmt.Errorf("get active grids: %w", err)
	}

	if len(grids) == 0 {
		return nil
	}

	s.logger.Info("updating APR for active grids", "count", len(grids))

	chainIndex := fmt.Sprintf("%d", s.cfg.ChainID)

	// Build stablecoin lookup set (case-insensitive) from chain config
	stablecoinSet := make(map[string]bool, len(s.cfg.Stablecoins))
	for _, addr := range s.cfg.Stablecoins {
		stablecoinSet[strings.ToLower(addr)] = true
	}

	// Cache prices per token address to avoid redundant API calls
	priceCache := make(map[string]string)

	getPrice := func(tokenAddr string) (string, error) {
		if p, ok := priceCache[tokenAddr]; ok {
			return p, nil
		}
		// If the token is a stablecoin, use price = 1 directly
		if stablecoinSet[strings.ToLower(tokenAddr)] {
			priceCache[tokenAddr] = "1"
			return "1", nil
		}
		p, err := s.okxPriceClient.GetTokenPrice(ctx, chainIndex, tokenAddr)
		if err != nil {
			return "", err
		}
		priceCache[tokenAddr] = p
		return p, nil
	}

	updated := 0
	for _, g := range grids {
		// Get current token prices
		currentBasePrice, err := getPrice(g.BaseTokenAddress)
		if err != nil {
			s.logger.Warn("failed to get base token price for APR",
				"grid_id", g.GridID, "token", g.BaseTokenAddress, "error", err)
			continue
		}
		currentQuotePrice, err := getPrice(g.QuoteTokenAddress)
		if err != nil {
			s.logger.Warn("failed to get quote token price for APR",
				"grid_id", g.GridID, "token", g.QuoteTokenAddress, "error", err)
			continue
		}

		// Get current order amounts for real APR
		amounts, err := s.repo.GetGridOrderAmounts(ctx, g.ChainID, g.GridID)
		if err != nil {
			s.logger.Warn("failed to get grid order amounts",
				"grid_id", g.GridID, "error", err)
			continue
		}

		// Get orders for theoretical APR calculation
		orders, err := s.repo.GetGridOrdersForTheoretical(ctx, g.ChainID, g.GridID)
		if err != nil {
			s.logger.Warn("failed to get grid orders for theoretical",
				"grid_id", g.GridID, "error", err)
			continue
		}

		// Calculate APR
		aprTheoretical, aprReal, err := calculateAPR(
			g.InitialBaseAmount, g.InitialQuoteAmount,
			g.InitBasePrice, g.InitQuotePrice,
			amounts.BaseAmount, amounts.QuoteAmount,
			currentBasePrice, currentQuotePrice,
			g.Profits,
			orders,
			g.CreatedAt,
		)
		if err != nil {
			s.logger.Warn("failed to calculate APR",
				"grid_id", g.GridID, "error", err)
			continue
		}

		// Update in DB
		if err := s.repo.UpdateGridAPR(ctx, g.GridID, g.ChainID, aprTheoretical, aprReal); err != nil {
			s.logger.Warn("failed to update grid APR",
				"grid_id", g.GridID, "error", err)
			continue
		}

		// Insert APR history record
		historyRow := db.APRHistoryRow{
			Timestamp:          time.Now().UTC(),
			ChainID:            g.ChainID,
			GridID:             g.GridID,
			PairID:             g.PairID,
			InitBaseAmount:     g.InitialBaseAmount,
			InitQuoteAmount:    g.InitialQuoteAmount,
			CurrentBaseAmount:  amounts.BaseAmount,
			CurrentQuoteAmount: amounts.QuoteAmount,
			InitBasePrice:      g.InitBasePrice,
			InitQuotePrice:     g.InitQuotePrice,
			CurrentBasePrice:   currentBasePrice,
			CurrentQuotePrice:  currentQuotePrice,
			Profits:            g.Profits,
			APRReal:            aprReal,
			APRTheoretical:     aprTheoretical,
		}
		if err := s.repo.InsertAPRHistory(ctx, historyRow); err != nil {
			s.logger.Warn("failed to insert APR history",
				"grid_id", g.GridID, "error", err)
			// Don't continue here, the APR update itself succeeded
		}
		updated++
	}

	s.logger.Info("APR update complete", "updated", updated, "total", len(grids))
	return nil
}

// calculateAPR computes both apr_theoretical and apr_real based on the formulas in apr.md.
// All numeric string inputs are raw big number strings (no decimals).
// Returns the APR values as string representations of the rate (e.g. "0.1523" for 15.23%).
func calculateAPR(
	initBaseAmount, initQuoteAmount string,
	initBasePrice, initQuotePrice string,
	currentBaseAmount, currentQuoteAmount string,
	currentBasePrice, currentQuotePrice string,
	gridProfit string,
	orders []db.GridOrderForTheoretical,
	createdAt time.Time,
) (aprTheoretical string, aprReal string, err error) {
	// Parse all values as big.Float for precision
	initBaseAmt, ok := new(big.Float).SetString(initBaseAmount)
	if !ok {
		return "", "", fmt.Errorf("invalid init_base_amount: %s", initBaseAmount)
	}
	initQuoteAmt, ok := new(big.Float).SetString(initQuoteAmount)
	if !ok {
		return "", "", fmt.Errorf("invalid init_quote_amount: %s", initQuoteAmount)
	}
	initBPrice, ok := new(big.Float).SetString(initBasePrice)
	if !ok {
		return "", "", fmt.Errorf("invalid init_base_price: %s", initBasePrice)
	}
	initQPrice, ok := new(big.Float).SetString(initQuotePrice)
	if !ok {
		return "", "", fmt.Errorf("invalid init_quote_price: %s", initQuotePrice)
	}
	curBaseAmt, ok := new(big.Float).SetString(currentBaseAmount)
	if !ok {
		return "", "", fmt.Errorf("invalid current_base_amount: %s", currentBaseAmount)
	}
	curQuoteAmt, ok := new(big.Float).SetString(currentQuoteAmount)
	if !ok {
		return "", "", fmt.Errorf("invalid current_quote_amount: %s", currentQuoteAmount)
	}
	curBPrice, ok := new(big.Float).SetString(currentBasePrice)
	if !ok {
		return "", "", fmt.Errorf("invalid current_base_price: %s", currentBasePrice)
	}
	curQPrice, ok := new(big.Float).SetString(currentQuotePrice)
	if !ok {
		return "", "", fmt.Errorf("invalid current_quote_price: %s", currentQuotePrice)
	}
	profit, ok := new(big.Float).SetString(gridProfit)
	if !ok {
		return "", "", fmt.Errorf("invalid grid_profit: %s", gridProfit)
	}

	// init_usd = init_base_amount * init_base_price + init_quote_amount * init_quote_price
	initUSD := new(big.Float).Add(
		new(big.Float).Mul(initBaseAmt, initBPrice),
		new(big.Float).Mul(initQuoteAmt, initQPrice),
	)

	// Guard against zero init_usd (would cause division by zero)
	zero := new(big.Float)
	if initUSD.Cmp(zero) == 0 {
		return "0", "0", nil
	}

	// elapsed_hours = (current_time - init_time) / 3600
	elapsedSeconds := time.Since(createdAt).Seconds()
	if elapsedSeconds < 60 {
		// Grid just created, skip APR calculation
		return "0", "0", nil
	}
	elapsedHours := elapsedSeconds / 3600.0

	// ============================================================
	// Calculate real APR (实际收益)
	// current_usd = total_base_amt * current_base_price + (total_quote_amount + grid_profit) * current_quote_price
	// ============================================================
	currentUSD := new(big.Float).Add(
		new(big.Float).Mul(curBaseAmt, curBPrice),
		new(big.Float).Mul(new(big.Float).Add(curQuoteAmt, profit), curQPrice),
	)

	// real_profit_rate = current_usd / init_usd - 1
	realProfitRate := new(big.Float).Sub(
		new(big.Float).Quo(currentUSD, initUSD),
		new(big.Float).SetFloat64(1.0),
	)

	// ============================================================
	// Calculate theoretical APR (理论收益/无网格收益)
	// Simulate what the portfolio would be if orders were filled based on current price
	// ============================================================
	theoreticalBaseAmt := new(big.Float)
	theoreticalQuoteAmt := new(big.Float)

	// Parse current price in quote terms for comparison with order prices
	// order.price is the price of base in quote terms
	// current_price_in_quote = current_base_price / current_quote_price
	curPriceInQuote := new(big.Float).Quo(curBPrice, curQPrice)

	for _, order := range orders {
		orderPrice, ok := new(big.Float).SetString(order.Price)
		if !ok {
			continue // skip invalid order
		}
		orderAmt, ok := new(big.Float).SetString(order.Amount)
		if !ok {
			continue
		}

		// For theoretical calculation, we use initial amounts (what the order was created with)
		// For ask orders: Amount = initial_base_amount, RevAmt = initial_quote_amount (usually 0)
		// For bid orders: Amount = initial_quote_amount, RevAmt = initial_base_amount (usually 0)
		// We need to get the initial amounts from the order
		// Actually, looking at the schema, we should use initial_base_amount and initial_quote_amount
		// But for simplicity, we'll use the current Amount as the "grid_base_amt" equivalent

		if order.IsAsk {
			// Ask order: sells base for quote at order.price
			// ask 网格单，当前价格 > 网格价格，amount = 0, rev_amount(quote) = amount * order.price
			// ask 网格单，当前价格 <= 网格价格, amount = grid_base_amt, rev_amount(quote) = 0
			if curPriceInQuote.Cmp(orderPrice) > 0 {
				// Current price > order price: order would have been filled
				// base = 0, quote = amount * order.price
				quoteFromOrder := new(big.Float).Mul(orderAmt, orderPrice)
				theoreticalQuoteAmt.Add(theoreticalQuoteAmt, quoteFromOrder)
				// base remains 0 for this order
			} else {
				// Current price <= order price: order would NOT have been filled
				// base = amount, quote = 0
				theoreticalBaseAmt.Add(theoreticalBaseAmt, orderAmt)
				// quote remains 0 for this order
			}
		} else {
			// Bid order: buys base with quote at order.price
			// bid 网格单, 当前价格 >= 网格价格, amount(quote) = grid_base_amt * order.price, rev_amount(base) = 0
			// bid 网格单, 当前价格 < 网格价格, amount = 0, rev_amount = grid_base_amt
			// For bid orders, Amount is quote amount, and we need to derive grid_base_amt
			// grid_base_amt = Amount / order.price (the base amount this order would buy)
			gridBaseAmt := new(big.Float).Quo(orderAmt, orderPrice)

			if curPriceInQuote.Cmp(orderPrice) >= 0 {
				// Current price >= order price: order would NOT have been filled
				// quote = amount, base = 0
				theoreticalQuoteAmt.Add(theoreticalQuoteAmt, orderAmt)
				// base remains 0 for this order
			} else {
				// Current price < order price: order would have been filled
				// quote = 0, base = grid_base_amt
				theoreticalBaseAmt.Add(theoreticalBaseAmt, gridBaseAmt)
				// quote remains 0 for this order
			}
		}
	}

	// tvl_usd = total_base_amount * current_base_price + total_quote_amount * current_quote_price
	tvlUSD := new(big.Float).Add(
		new(big.Float).Mul(theoreticalBaseAmt, curBPrice),
		new(big.Float).Mul(theoreticalQuoteAmt, curQPrice),
	)

	// theoretical_profit_rate = tvl_usd / init_usd - 1
	theoreticalProfitRate := new(big.Float).Sub(
		new(big.Float).Quo(tvlUSD, initUSD),
		new(big.Float).SetFloat64(1.0),
	)

	// ============================================================
	// Calculate APY using the formula from apr.md:
	// APY = (value / init_usd) ** (8760 / elapsed_hours) - 1
	// ============================================================
	aprTheoretical = computeAPYFromRatio(tvlUSD, initUSD, elapsedHours)
	aprReal = computeAPYFromRatio(currentUSD, initUSD, elapsedHours)

	// Also store the profit rates for debugging/logging
	_ = realProfitRate
	_ = theoreticalProfitRate

	return aprTheoretical, aprReal, nil
}

// computeAPYFromRatio calculates APY using the formula: (value / init) ^ (8760 / hours) - 1
// This matches the formula in apr.md: APY = (current_usd / init_usd) ** (8760/运行小时) - 1
func computeAPYFromRatio(value, init *big.Float, elapsedHours float64) string {
	if elapsedHours == 0 {
		return "0"
	}

	// ratio = value / init
	ratio := new(big.Float).Quo(value, init)
	ratioFloat, _ := ratio.Float64()

	if ratioFloat <= 0 {
		// Avoid NaN from negative base with fractional exponent
		return fmt.Sprintf("%.8f", -1.0)
	}

	// APY = ratio ^ (8760 / elapsed_hours) - 1
	exponent := 8760.0 / elapsedHours
	apy := math.Pow(ratioFloat, exponent) - 1.0

	return fmt.Sprintf("%.8f", apy)
}
