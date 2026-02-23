// Package pricing provides price fetching clients for various exchanges.

package pricing

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"
)

// BinancePriceClient fetches spot prices from Binance public API.
// No authentication is required for the public ticker endpoint.
type BinancePriceClient struct {
	client *http.Client
	logger *slog.Logger
}

// NewBinancePriceClient creates a new Binance price client.
func NewBinancePriceClient(logger *slog.Logger) *BinancePriceClient {
	return &BinancePriceClient{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
		logger: logger,
	}
}

// binanceTickerResponse is the response from GET /api/v3/ticker/price.
type binanceTickerResponse struct {
	Symbol string `json:"symbol"`
	Price  string `json:"price"`
}

// binanceEndpoints are the Binance API endpoints to try in order.
var binanceEndpoints = []string{
	"https://api1.binance.com",
	"https://api2.binance.com",
	"https://api3.binance.com",
	"https://api.binance.com",
}

// GetSpotPrice fetches the latest spot price for a trading pair from Binance.
// symbol should be in Binance format, e.g. "BNBUSDT", "ETHUSDT".
// Returns the price as a decimal string (e.g., "625.12000000").
func (c *BinancePriceClient) GetSpotPrice(ctx context.Context, symbol string) (string, error) {
	var lastErr error

	for _, baseURL := range binanceEndpoints {
		price, err := c.tryGetPrice(ctx, baseURL, symbol)
		if err != nil {
			lastErr = err
			c.logger.Debug("binance endpoint failed, trying next",
				"endpoint", baseURL, "symbol", symbol, "error", err)
			continue
		}
		return price, nil
	}

	return "", fmt.Errorf("all binance endpoints failed for symbol %s: %w", symbol, lastErr)
}

// tryGetPrice attempts to fetch the price from a single Binance endpoint.
func (c *BinancePriceClient) tryGetPrice(ctx context.Context, baseURL, symbol string) (string, error) {
	url := baseURL + "/api/v3/ticker/price?symbol=" + symbol

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("http request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("unexpected status %d: %s", resp.StatusCode, string(body))
	}

	var ticker binanceTickerResponse
	if err := json.Unmarshal(body, &ticker); err != nil {
		return "", fmt.Errorf("unmarshal response: %w", err)
	}

	if ticker.Price == "" {
		return "", fmt.Errorf("empty price in response for symbol %s", symbol)
	}

	return ticker.Price, nil
}
