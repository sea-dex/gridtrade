package db

import (
	"context"
	"fmt"
	"log/slog"
	"math/big"
	"os"
	"testing"

	"github.com/davecgh/go-spew/spew"
	"github.com/gridex/indexer/config"
	"github.com/gridex/indexer/pricing"
)

// loadProdConfig loads config.prod.yaml from the indexer root directory.
func loadProdConfig(t *testing.T) *config.Config {
	t.Helper()
	cfg, err := config.Load("../config.prod.yaml")
	if err != nil {
		t.Fatalf("load config.prod.yaml: %v", err)
	}
	return cfg
}

func TestComputeProtocolStats(t *testing.T) {
	// Skip in CI or when explicitly skipped
	if os.Getenv("SKIP_DB_TESTS") != "" {
		t.Skip("SKIP_DB_TESTS is set, skipping database test")
	}

	ctx := context.Background()
	cfg := loadProdConfig(t)

	// Override host for local (non-Docker) execution.
	// host.docker.internal only resolves inside Docker containers.
	if h := os.Getenv("DB_HOST"); h != "" {
		cfg.Database.Host = h
	} else if cfg.Database.Host == "host.docker.internal" {
		cfg.Database.Host = "localhost"
	}

	// Connect to the production database
	dsn := cfg.Database.DSN()
	t.Logf("Connecting to database: %s@%s:%d/%s",
		cfg.Database.User, cfg.Database.Host, cfg.Database.Port, cfg.Database.DBName)

	pool, err := NewPool(ctx, dsn)
	if err != nil {
		t.Fatalf("connect to database: %v", err)
	}
	defer pool.Close()

	// Get the chain ID from config (BSC mainnet = 56)
	if len(cfg.Chains) == 0 {
		t.Fatal("no chains configured in config.prod.yaml")
	}
	chainID := cfg.Chains[0].ChainID
	t.Logf("Using chain_id: %d (%s)", chainID, cfg.Chains[0].Name)

	// Fetch native token price from Binance for TVL calculation
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}))
	binanceClient := pricing.NewBinancePriceClient(logger)

	nativeSymbol, ok := pricing.ChainNativeSymbol[chainID]
	if !ok {
		t.Fatalf("no native symbol mapping for chain_id %d", chainID)
	}

	priceStr, err := binanceClient.GetSpotPrice(ctx, nativeSymbol)
	if err != nil {
		t.Logf("WARNING: failed to fetch native token price from Binance: %v (TVL will exclude wrapped native tokens)", err)
	} else {
		t.Logf("Native token price (%s): %s USD", nativeSymbol, priceStr)
	}

	var nativeTokenPrice *big.Float
	if priceStr != "" {
		nativeTokenPrice = new(big.Float)
		if _, ok := nativeTokenPrice.SetString(priceStr); !ok {
			t.Fatalf("parse native token price %q: invalid float", priceStr)
		}
	}

	// Begin a read-only transaction from the pool
	var stats *ProtocolStats
	tx, err := pool.Begin(ctx)
	if err != nil {
		t.Fatalf("begin transaction: %v", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	stats, err = ComputeProtocolStats(ctx, tx, chainID, nativeTokenPrice)
	if err != nil {
		t.Fatalf("ComputeProtocolStats: %v", err)
	}

	// Print results
	fmt.Println("=== Protocol Stats ===")
	fmt.Printf("Chain ID:      %d\n", chainID)
	fmt.Printf("Total Volume:  %s\n", stats.TotalVolume)
	fmt.Printf("Total TVL:     %s\n", stats.TotalTVL)
	fmt.Printf("Total Grids:   %d\n", stats.TotalGrids)
	fmt.Printf("Active Grids:  %d\n", stats.ActiveGrids)
	fmt.Printf("Total Trades:  %d\n", stats.TotalTrades)
	fmt.Printf("Total Profit:  %s\n", stats.TotalProfit)
	fmt.Printf("Active Users:  %d\n", stats.ActiveUsers)
	fmt.Println("======================")

	spew.Dump(stats)

	// Basic sanity checks
	if stats.TotalGrids < 0 {
		t.Errorf("TotalGrids should be >= 0, got %d", stats.TotalGrids)
	}
	if stats.ActiveGrids < 0 {
		t.Errorf("ActiveGrids should be >= 0, got %d", stats.ActiveGrids)
	}
	if stats.ActiveGrids > stats.TotalGrids {
		t.Errorf("ActiveGrids (%d) should be <= TotalGrids (%d)", stats.ActiveGrids, stats.TotalGrids)
	}
	if stats.TotalTrades < 0 {
		t.Errorf("TotalTrades should be >= 0, got %d", stats.TotalTrades)
	}
	if stats.ActiveUsers < 0 {
		t.Errorf("ActiveUsers should be >= 0, got %d", stats.ActiveUsers)
	}

	// Rollback since this is a read-only test
	if err := tx.Rollback(ctx); err != nil {
		t.Logf("rollback: %v (may already be rolled back by defer)", err)
	}
}
