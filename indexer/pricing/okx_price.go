// Package pricing provides OKX DEX API client for fetching token prices.
// APIs:
//   - Market Price: GET https://web3.okx.com/api/v6/dex/market/price
//   - Aggregator Quote: GET https://web3.okx.com/api/v6/dex/aggregator/quote
package pricing

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"math"
	"math/big"
	"net/http"
	"strings"
	"time"
)

// OKXConfig holds the authentication config for OKX DEX API v6.
type OKXConfig struct {
	APIKey     string // OK-ACCESS-KEY & OK-ACCESS-PROJECT
	SecretKey  string // HMAC secret key for signing
	Passphrase string // OK-ACCESS-PASSPHRASE
}

// OKXPriceClient fetches token prices from OKX DEX Market Price API.
type OKXPriceClient struct {
	cfg    OKXConfig
	client *http.Client
	logger *slog.Logger
}

// NewOKXPriceClient creates a new OKX price client.
func NewOKXPriceClient(cfg OKXConfig, logger *slog.Logger) *OKXPriceClient {
	return &OKXPriceClient{
		cfg: cfg,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
		logger: logger,
	}
}

// dexMarketPriceResponse is the API response envelope.
type dexMarketPriceResponse struct {
	Code string          `json:"code"`
	Msg  string          `json:"msg"`
	Data json.RawMessage `json:"data"`
}

// dexMarketPriceData is the response data element.
type dexMarketPriceData struct {
	ChainIndex           string `json:"chainIndex"`
	TokenContractAddress string `json:"tokenContractAddress"`
	Time                 string `json:"time"`
	Price                string `json:"price"`
}

const okxBaseURL = "https://web3.okx.com"

// GetTokenPrice fetches the USD price for a token from OKX DEX Market Price API.
// Returns the price as a decimal string (e.g., "625.1234").
func (c *OKXPriceClient) GetTokenPrice(ctx context.Context, chainIndex, tokenAddress string) (string, error) {
	// Build query parameters for GET request
	params := "chainIndex=" + chainIndex + "&tokenContractAddress=" + strings.ToLower(tokenAddress)
	requestPath := "/api/v6/dex/market/price?" + params
	fullURL := okxBaseURL + requestPath

	httpReq, err := http.NewRequestWithContext(ctx, "GET", fullURL, nil)
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}

	// Set OKX DEX API authentication headers
	// For GET requests, the body in the signature must be empty string
	timestamp := time.Now().UTC().Format("2006-01-02T15:04:05.000Z")
	sign := c.okxSign(timestamp, "GET", requestPath, "")

	httpReq.Header.Set("OK-ACCESS-KEY", c.cfg.APIKey)
	httpReq.Header.Set("OK-ACCESS-SIGN", sign)
	httpReq.Header.Set("OK-ACCESS-TIMESTAMP", timestamp)
	httpReq.Header.Set("OK-ACCESS-PASSPHRASE", c.cfg.Passphrase)
	httpReq.Header.Set("OK-ACCESS-PROJECT", c.cfg.APIKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("http request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	var apiResp dexMarketPriceResponse
	if err := json.Unmarshal(respBody, &apiResp); err != nil {
		return "", fmt.Errorf("parse response: %w", err)
	}

	if apiResp.Code != "0" {
		return "", fmt.Errorf("OKX DEX API error code=%s msg=%s", apiResp.Code, apiResp.Msg)
	}

	if len(apiResp.Data) == 0 {
		return "", fmt.Errorf("no price data returned for %s on chain %s", tokenAddress, chainIndex)
	}

	// The OKX API may return data as either an array or a single object.
	// Try array first, then fall back to single object.
	var dataItems []dexMarketPriceData
	if err := json.Unmarshal(apiResp.Data, &dataItems); err != nil {
		// Try as a single object
		var single dexMarketPriceData
		if err2 := json.Unmarshal(apiResp.Data, &single); err2 != nil {
			return "", fmt.Errorf("parse response data (tried array and object): array=%w, object=%w", err, err2)
		}
		dataItems = []dexMarketPriceData{single}
	}

	if len(dataItems) == 0 {
		return "", fmt.Errorf("no price data returned for %s on chain %s", tokenAddress, chainIndex)
	}

	price := dataItems[0].Price
	if price == "" || price == "0" {
		return "", fmt.Errorf("zero price returned for %s on chain %s", tokenAddress, chainIndex)
	}

	return price, nil
}

// dexAggregatorQuoteResponse is the response envelope for the aggregator quote API.
type dexAggregatorQuoteResponse struct {
	Code string                   `json:"code"`
	Msg  string                   `json:"msg"`
	Data []dexAggregatorQuoteData `json:"data"`
}

// dexAggregatorQuoteData is the response data element for the aggregator quote API.
type dexAggregatorQuoteData struct {
	FromToken       dexQuoteToken `json:"fromToken"`
	ToToken         dexQuoteToken `json:"toToken"`
	FromTokenAmount string        `json:"fromTokenAmount"`
	ToTokenAmount   string        `json:"toTokenAmount"`
}

// dexQuoteToken represents a token in the aggregator quote response.
type dexQuoteToken struct {
	TokenContractAddress string `json:"tokenContractAddress"`
	Decimals             string `json:"decimals"`
	TokenSymbol          string `json:"tokenSymbol"`
}

// GetPairPrice fetches the price for a trading pair (base/quote) from OKX DEX
// Aggregator Quote API in a single call.
// It quotes 1 unit of base token and returns the equivalent amount in quote tokens
// as a human-readable decimal string (e.g., "2534.567890").
func (c *OKXPriceClient) GetPairPrice(ctx context.Context, chainID int64, baseAddr, quoteAddr string, baseDecimals, quoteDecimals uint8) (string, error) {
	chainIndex := fmt.Sprintf("%d", chainID)

	// Use 1 unit of base token (in smallest unit) as the quote amount.
	// e.g., for 18-decimal token: amount = 10^18
	amount := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(baseDecimals)), nil)

	// Build query parameters for the aggregator quote API
	params := "chainIndex=" + chainIndex +
		"&fromTokenAddress=" + strings.ToLower(baseAddr) +
		"&toTokenAddress=" + strings.ToLower(quoteAddr) +
		"&amount=" + amount.String()
	requestPath := "/api/v6/dex/aggregator/quote?" + params
	fullURL := okxBaseURL + requestPath

	httpReq, err := http.NewRequestWithContext(ctx, "GET", fullURL, nil)
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}

	// Set OKX DEX API authentication headers
	timestamp := time.Now().UTC().Format("2006-01-02T15:04:05.000Z")
	sign := c.okxSign(timestamp, "GET", requestPath, "")

	httpReq.Header.Set("OK-ACCESS-KEY", c.cfg.APIKey)
	httpReq.Header.Set("OK-ACCESS-SIGN", sign)
	httpReq.Header.Set("OK-ACCESS-TIMESTAMP", timestamp)
	httpReq.Header.Set("OK-ACCESS-PASSPHRASE", c.cfg.Passphrase)
	httpReq.Header.Set("OK-ACCESS-PROJECT", c.cfg.APIKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("http request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("HTTP %d: %s", resp.StatusCode, string(respBody))
	}

	var apiResp dexAggregatorQuoteResponse
	if err := json.Unmarshal(respBody, &apiResp); err != nil {
		return "", fmt.Errorf("parse response: %w", err)
	}

	if apiResp.Code != "0" {
		return "", fmt.Errorf("OKX aggregator quote API error code=%s msg=%s", apiResp.Code, apiResp.Msg)
	}

	if len(apiResp.Data) == 0 {
		return "", fmt.Errorf("no quote data returned for %s -> %s on chain %s", baseAddr, quoteAddr, chainIndex)
	}

	quoteData := apiResp.Data[0]
	toTokenAmount := quoteData.ToTokenAmount
	if toTokenAmount == "" || toTokenAmount == "0" {
		return "", fmt.Errorf("zero quote amount returned for %s -> %s on chain %s", baseAddr, quoteAddr, chainIndex)
	}

	// Convert toTokenAmount (smallest unit) to human-readable price.
	// price = toTokenAmount / 10^quoteDecimals
	// Since we quoted exactly 1 base token, this is the pair price.
	toAmountBig, ok := new(big.Int).SetString(toTokenAmount, 10)
	if !ok {
		return "", fmt.Errorf("invalid toTokenAmount: %s", toTokenAmount)
	}

	// Convert to float for human-readable representation
	toAmountFloat := new(big.Float).SetInt(toAmountBig)
	divisor := new(big.Float).SetFloat64(math.Pow10(int(quoteDecimals)))
	price := new(big.Float).Quo(toAmountFloat, divisor)

	// Format with sufficient precision
	pairPrice := price.Text('f', int(quoteDecimals))
	// Trim trailing zeros but keep at least one decimal place
	pairPrice = trimTrailingZeros(pairPrice)

	c.logger.Debug("fetched pair price from OKX aggregator quote",
		"chain_id", chainID,
		"base", baseAddr,
		"quote", quoteAddr,
		"from_amount", amount.String(),
		"to_amount", toTokenAmount,
		"price", pairPrice,
	)

	return pairPrice, nil
}

// trimTrailingZeros removes trailing zeros from a decimal string,
// keeping at least one digit after the decimal point.
func trimTrailingZeros(s string) string {
	if !strings.Contains(s, ".") {
		return s
	}
	s = strings.TrimRight(s, "0")
	if strings.HasSuffix(s, ".") {
		s += "0"
	}
	return s
}

// okxSign computes the OKX API signature:
// Base64(HMAC-SHA256(timestamp + method + requestPath + body, secretKey))
func (c *OKXPriceClient) okxSign(timestamp, method, requestPath, body string) string {
	preHash := timestamp + method + requestPath + body
	h := hmac.New(sha256.New, []byte(c.cfg.SecretKey))
	h.Write([]byte(preHash))
	return base64.StdEncoding.EncodeToString(h.Sum(nil))
}
