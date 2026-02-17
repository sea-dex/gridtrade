package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"sync"
	"syscall"

	"github.com/ethereum/go-ethereum/ethclient"

	"github.com/gridex/indexer/config"
	"github.com/gridex/indexer/db"
	"github.com/gridex/indexer/kafka"
	"github.com/gridex/indexer/rpc"
	"github.com/gridex/indexer/scanner"
)

func main() {
	configPath := flag.String("config", "config.yaml", "path to config file")
	flag.Parse()

	// Load configuration
	cfg, err := config.Load(*configPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to load config: %v\n", err)
		os.Exit(1)
	}

	// Setup logger
	var logLevel slog.Level
	switch cfg.Log.Level {
	case "debug":
		logLevel = slog.LevelDebug
	case "warn":
		logLevel = slog.LevelWarn
	case "error":
		logLevel = slog.LevelError
	default:
		logLevel = slog.LevelInfo
	}

	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: logLevel,
	}))
	slog.SetDefault(logger)

	logger.Info("starting gridex indexer",
		"chains", len(cfg.Chains),
		"log_level", cfg.Log.Level,
	)

	logger.Debug("database config",
		"host", cfg.Database.Host,
		"port", cfg.Database.Port,
		"user", cfg.Database.User,
		"dbname", cfg.Database.DBName,
		"sslmode", cfg.Database.SSLMode,
	)

	// Create context with cancellation
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle shutdown signals
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		sig := <-sigCh
		logger.Info("received shutdown signal", "signal", sig)
		cancel()
	}()

	// Connect to database
	pool, err := db.NewPool(ctx, cfg.Database.DSN())
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	// Ensure indexer_state table exists
	if err := db.EnsureIndexerStateTable(ctx, pool); err != nil {
		logger.Error("failed to ensure indexer_state table", "error", err)
		os.Exit(1)
	}

	repo := db.NewRepository(pool)

	// Ensure Kafka topic exists — create it if missing and verify it is visible.
	// This must succeed before we start producing messages.
	logger.Info("ensuring kafka topic exists", "topic", cfg.Kafka.Topic, "brokers", cfg.Kafka.Brokers)
	if err := kafka.EnsureTopic(cfg.Kafka.Brokers, cfg.Kafka.Topic, 3, 1); err != nil {
		logger.Error("failed to ensure kafka topic", "topic", cfg.Kafka.Topic, "error", err)
		os.Exit(1)
	}
	logger.Info("kafka topic verified", "topic", cfg.Kafka.Topic)

	// Create Kafka producer
	producer := kafka.NewProducer(cfg.Kafka.Brokers, cfg.Kafka.Topic, logger)
	defer func() {
		if err := producer.Close(); err != nil {
			logger.Error("failed to close kafka producer", "error", err)
		}
	}()

	// Start a scanner for each chain
	var wg sync.WaitGroup

	for _, chainCfg := range cfg.Chains {
		cCfg := chainCfg // capture loop variable

		// Connect to RPC
		rawClient, err := ethclient.DialContext(ctx, cCfg.RPCURL)
		if err != nil {
			logger.Error("failed to connect to RPC",
				"chain", cCfg.Name,
				"rpc_url", cCfg.RPCURL,
				"error", err,
			)
			os.Exit(1)
		}

		// Wrap with rate limiter (0 or unset = unlimited)
		client := rpc.NewRateLimitedClient(rawClient, cCfg.RPCTPM)
		if cCfg.RPCTPM > 0 {
			logger.Info("RPC rate limiting enabled",
				"chain", cCfg.Name,
				"rpc_tpm", cCfg.RPCTPM,
			)
		}

		s, err := scanner.New(cCfg, client, repo, producer, cfg.Kafka.Brokers, cfg.Kafka.Topic, logger)
		if err != nil {
			logger.Error("failed to create scanner",
				"chain", cCfg.Name,
				"error", err,
			)
			os.Exit(1)
		}

		wg.Add(1)
		go func() {
			defer wg.Done()
			defer client.Close()

			if err := s.Run(ctx); err != nil && ctx.Err() == nil {
				logger.Error("scanner exited with error",
					"chain", cCfg.Name,
					"error", err,
				)
			}
		}()

		logger.Info("scanner started", "chain", cCfg.Name, "chain_id", cCfg.ChainID)
	}

	// Wait for all scanners to finish
	wg.Wait()
	logger.Info("gridex indexer stopped")
}
