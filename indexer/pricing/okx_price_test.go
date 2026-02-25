package pricing

import (
	"context"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"testing"
	"time"

	"github.com/gridex/indexer/config"
)

func TestGetPairPrice(t *testing.T) {
	// Load config from config.prod.yaml
	cfg, err := config.Load("../config.prod.yaml")
	if err != nil {
		t.Fatalf("failed to load config: %v", err)
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}))

	client := NewOKXPriceClient(OKXConfig{
		APIKey:     cfg.OKX.APIKey,
		SecretKey:  cfg.OKX.SecretKey,
		Passphrase: cfg.OKX.Passphrase,
	}, logger)

	// Support HTTPS_PROXY / HTTP_PROXY for environments behind a proxy/firewall
	if proxyURL := os.Getenv("HTTPS_PROXY"); proxyURL != "" {
		u, err := url.Parse(proxyURL)
		if err == nil {
			client.client.Transport = &http.Transport{
				Proxy: http.ProxyURL(u),
			}
			t.Logf("using proxy: %s", proxyURL)
		}
	} else if proxyURL := os.Getenv("HTTP_PROXY"); proxyURL != "" {
		u, err := url.Parse(proxyURL)
		if err == nil {
			client.client.Transport = &http.Transport{
				Proxy: http.ProxyURL(u),
			}
			t.Logf("using proxy: %s", proxyURL)
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// BSC chain ID = 56
	// WETH (Binance-Peg Ethereum Token): 0x2170Ed0880ac9A755fd29B2688956BD959F933F8, 18 decimals
	// USDT (Binance-Peg BSC-USD):        0x55d398326f99059fF775485246999027B3197955, 18 decimals
	const (
		chainID      int64  = 56
		wethAddr     string = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" // wbnb
		usdtAddr     string = "0x55d398326f99059fF775485246999027B3197955"
		wethDecimals uint8  = 18
		usdtDecimals uint8  = 18
	)

	price, err := client.GetPairPrice(ctx, chainID, wethAddr, usdtAddr, wethDecimals, usdtDecimals)
	if err != nil {
		t.Fatalf("GetPairPrice failed: %v", err)
	}

	t.Logf("WETH/USDT price on BSC (chainID=%d): %s", chainID, price)

	if price == "" || price == "0" {
		t.Errorf("expected a non-zero price, got: %q", price)
	}
}

func TestGetTokenPrice(t *testing.T) {
	// Load config from config.prod.yaml
	cfg, err := config.Load("../config.prod.yaml")
	if err != nil {
		t.Fatalf("failed to load config: %v", err)
	}

	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}))

	client := NewOKXPriceClient(OKXConfig{
		APIKey:     cfg.OKX.APIKey,
		SecretKey:  cfg.OKX.SecretKey,
		Passphrase: cfg.OKX.Passphrase,
	}, logger)

	// Support HTTPS_PROXY / HTTP_PROXY for environments behind a proxy/firewall
	if proxyURL := os.Getenv("HTTPS_PROXY"); proxyURL != "" {
		u, err := url.Parse(proxyURL)
		if err == nil {
			client.client.Transport = &http.Transport{
				Proxy: http.ProxyURL(u),
			}
			t.Logf("using proxy: %s", proxyURL)
		}
	} else if proxyURL := os.Getenv("HTTP_PROXY"); proxyURL != "" {
		u, err := url.Parse(proxyURL)
		if err == nil {
			client.client.Transport = &http.Transport{
				Proxy: http.ProxyURL(u),
			}
			t.Logf("using proxy: %s", proxyURL)
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	tests := []struct {
		name         string
		chainIndex   string
		tokenAddress string
	}{
		{
			name:         "WBNB on BSC",
			chainIndex:   "56",
			tokenAddress: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
		},
		{
			name:         "USDT on BSC",
			chainIndex:   "56",
			tokenAddress: "0x55d398326f99059fF775485246999027B3197955",
		},
		{
			name:         "WETH on Ethereum",
			chainIndex:   "1",
			tokenAddress: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
		},
		{
			name:         "USDC on Ethereum",
			chainIndex:   "1",
			tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			price, err := client.GetTokenPrice(ctx, tt.chainIndex, tt.tokenAddress)
			if err != nil {
				t.Fatalf("GetTokenPrice failed: %v", err)
			}

			t.Logf("%s price (USD): %s", tt.name, price)

			if price == "" || price == "0" {
				t.Errorf("expected a non-zero price, got: %q", price)
			}
		})
	}
}
