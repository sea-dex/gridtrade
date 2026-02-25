package scanner

import (
	"context"
	"fmt"
	"math"
	"math/big"
	"strings"
	"time"
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

		// Get current order amounts
		amounts, err := s.repo.GetGridOrderAmounts(ctx, g.ChainID, g.GridID)
		if err != nil {
			s.logger.Warn("failed to get grid order amounts",
				"grid_id", g.GridID, "error", err)
			continue
		}

		// Calculate APR
		aprExcludeIL, aprReal, err := calculateAPR(
			g.InitialBaseAmount, g.InitialQuoteAmount,
			g.InitBasePrice, g.InitQuotePrice,
			amounts.BaseAmount, amounts.QuoteAmount,
			currentBasePrice, currentQuotePrice,
			g.Profits,
			g.Compound,
			g.CreatedAt,
		)
		if err != nil {
			s.logger.Warn("failed to calculate APR",
				"grid_id", g.GridID, "error", err)
			continue
		}

		// Update in DB
		if err := s.repo.UpdateGridAPR(ctx, g.GridID, g.ChainID, aprExcludeIL, aprReal); err != nil {
			s.logger.Warn("failed to update grid APR",
				"grid_id", g.GridID, "error", err)
			continue
		}
		updated++
	}

	s.logger.Info("APR update complete", "updated", updated, "total", len(grids))
	return nil
}

// calculateAPR computes both apr_exclude_il and apr_real based on the formulas in apr.md.
// All numeric string inputs are raw big number strings (no decimals).
// Returns the APR/APY values as string representations of the rate (e.g. "0.1523" for 15.23%).
func calculateAPR(
	initBaseAmount, initQuoteAmount string,
	initBasePrice, initQuotePrice string,
	currentBaseAmount, currentQuoteAmount string,
	currentBasePrice, currentQuotePrice string,
	gridProfit string,
	compound bool,
	createdAt time.Time,
) (aprExcludeIL string, aprReal string, err error) {
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

	// elapsed_days = (current_time - init_time) / 86400
	elapsedSeconds := time.Since(createdAt).Seconds()
	if elapsedSeconds < 60 {
		// Grid just created, skip APR calculation
		return "0", "0", nil
	}
	elapsedDays := elapsedSeconds / 86400.0

	// grid_value_exclude_il = current_base_amount * init_base_price + current_quote_amount * init_quote_price + grid_profit * init_quote_price
	gridValueExcludeIL := new(big.Float).Add(
		new(big.Float).Add(
			new(big.Float).Mul(curBaseAmt, initBPrice),
			new(big.Float).Mul(curQuoteAmt, initQPrice),
		),
		new(big.Float).Mul(profit, initQPrice),
	)

	// grid_profit_rate_exclude_il = grid_value_exclude_il / init_usd - 1
	profitRateExcludeIL := new(big.Float).Sub(
		new(big.Float).Quo(gridValueExcludeIL, initUSD),
		new(big.Float).SetFloat64(1.0),
	)

	// grid_value_real = current_base_amount * current_base_price + current_quote_amount * current_quote_price + grid_profit * current_quote_price
	gridValueReal := new(big.Float).Add(
		new(big.Float).Add(
			new(big.Float).Mul(curBaseAmt, curBPrice),
			new(big.Float).Mul(curQuoteAmt, curQPrice),
		),
		new(big.Float).Mul(profit, curQPrice),
	)

	// grid_profit_rate_real = grid_value_real / init_usd - 1
	profitRateReal := new(big.Float).Sub(
		new(big.Float).Quo(gridValueReal, initUSD),
		new(big.Float).SetFloat64(1.0),
	)

	if compound {
		// APY: (1 + profit_rate) ^ (365 / elapsed_days) - 1
		aprExcludeIL = computeAPY(profitRateExcludeIL, elapsedDays)
		aprReal = computeAPY(profitRateReal, elapsedDays)
	} else {
		// APR: profit_rate / elapsed_days * 365
		aprExcludeIL = computeAPR(profitRateExcludeIL, elapsedDays)
		aprReal = computeAPR(profitRateReal, elapsedDays)
	}

	return aprExcludeIL, aprReal, nil
}

// computeAPR calculates simple annualized return: profit_rate / elapsed_days * 365
func computeAPR(profitRate *big.Float, elapsedDays float64) string {
	if elapsedDays == 0 {
		return "0"
	}
	// apr = profit_rate / elapsed_days * 365
	rate, _ := profitRate.Float64()
	apr := rate / elapsedDays * 365.0
	return fmt.Sprintf("%.8f", apr)
}

// computeAPY calculates compound annualized return: (1 + profit_rate) ^ (365 / elapsed_days) - 1
func computeAPY(profitRate *big.Float, elapsedDays float64) string {
	if elapsedDays == 0 {
		return "0"
	}
	rate, _ := profitRate.Float64()
	base := 1.0 + rate
	if base <= 0 {
		// Avoid NaN from negative base with fractional exponent
		return fmt.Sprintf("%.8f", -1.0)
	}
	exponent := 365.0 / elapsedDays
	apy := math.Pow(base, exponent) - 1.0
	return fmt.Sprintf("%.8f", apy)
}
