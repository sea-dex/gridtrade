package db

import (
	"context"
	"fmt"
	"math/big"
	"time"

	"github.com/gridex/indexer/pricing"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ActiveGridRow holds the data needed for APR calculation.
type ActiveGridRow struct {
	GridID             int64
	ChainID            int64
	PairID             int
	InitialBaseAmount  string
	InitialQuoteAmount string
	InitBasePrice      string
	InitQuotePrice     string
	Profits            string
	Compound           bool
	CreatedAt          time.Time
	BaseTokenAddress   string
	QuoteTokenAddress  string
}

// GridOrderAmounts holds aggregated order amounts for a grid.
// BaseAmount = SUM(amount) for ask orders + SUM(rev_amount) for bid orders
// QuoteAmount = SUM(rev_amount) for ask orders + SUM(amount) for bid orders
type GridOrderAmounts struct {
	BaseAmount  string
	QuoteAmount string
}

// Repository provides database operations within transactions.
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository creates a new Repository.
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// GetLastBlock returns the last scanned block for a chain.
// Returns 0 if no record exists.
func (r *Repository) GetLastBlock(ctx context.Context, chainID int64) (uint64, error) {
	var lastBlock int64
	err := r.pool.QueryRow(ctx,
		`SELECT last_block FROM indexer_state WHERE chain_id = $1`, chainID,
	).Scan(&lastBlock)
	if err == pgx.ErrNoRows {
		return 0, nil
	}
	if err != nil {
		return 0, fmt.Errorf("get last block: %w", err)
	}
	return uint64(lastBlock), nil
}

// TxFunc is a function that runs within a transaction.
type TxFunc func(ctx context.Context, tx pgx.Tx) error

// WithTx executes fn within a database transaction.
func (r *Repository) WithTx(ctx context.Context, fn TxFunc) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	if err := fn(ctx, tx); err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit tx: %w", err)
	}
	return nil
}

// UpdateLastBlock updates the last scanned block for a chain within a transaction.
func UpdateLastBlock(ctx context.Context, tx pgx.Tx, chainID int64, blockNumber uint64) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO indexer_state (chain_id, last_block, updated_at)
		VALUES ($1, $2, $3)
		ON CONFLICT (chain_id) DO UPDATE SET last_block = $2, updated_at = $3
	`, chainID, int64(blockNumber), time.Now().UTC())
	if err != nil {
		return fmt.Errorf("update last block: %w", err)
	}
	return nil
}

// UpdateKafkaOffset updates the Kafka offset for a chain within a transaction.
// This is used to track the latest Kafka message offset for tradebot synchronization.
func UpdateKafkaOffset(ctx context.Context, tx pgx.Tx, chainID int64, kafkaOffset int64) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO indexer_state (chain_id, last_block, kafka_offset, updated_at)
		VALUES ($1, 0, $2, $3)
		ON CONFLICT (chain_id) DO UPDATE SET kafka_offset = $2, updated_at = $3
	`, chainID, kafkaOffset, time.Now().UTC())
	if err != nil {
		return fmt.Errorf("update kafka offset: %w", err)
	}
	return nil
}

// GetKafkaOffset returns the last Kafka offset for a chain.
// Returns 0 if no record exists.
func (r *Repository) GetKafkaOffset(ctx context.Context, chainID int64) (int64, error) {
	var kafkaOffset int64
	err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(kafka_offset, 0) FROM indexer_state WHERE chain_id = $1`, chainID,
	).Scan(&kafkaOffset)
	if err == pgx.ErrNoRows {
		return 0, nil
	}
	if err != nil {
		return 0, fmt.Errorf("get kafka offset: %w", err)
	}
	return kafkaOffset, nil
}

// InsertPair inserts a new pair record within a transaction.
func InsertPair(ctx context.Context, tx pgx.Tx, chainID int64, pairID int,
	baseToken, baseTokenAddr, quoteToken, quoteTokenAddr string, blockNumber uint64) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO pairs (pair_id, chain_id, base_token, base_token_address, quote_token, quote_token_address, create_block, update_block)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
		ON CONFLICT DO NOTHING
	`, pairID, chainID, baseToken, baseTokenAddr, quoteToken, quoteTokenAddr, int64(blockNumber))
	if err != nil {
		return fmt.Errorf("insert pair: %w", err)
	}
	return nil
}

// UpsertToken inserts or updates a token record within a transaction.
func UpsertToken(ctx context.Context, tx pgx.Tx, chainID int64,
	address, symbol, name string, decimals int, blockNumber uint64) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO tokens (chain_id, address, symbol, name, decimals, logo, create_block, update_block)
		VALUES ($1, $2, $3, $4, $5, '', $6, $6)
		ON CONFLICT (chain_id, address) DO UPDATE
		SET symbol = EXCLUDED.symbol, name = EXCLUDED.name, decimals = EXCLUDED.decimals,
		    update_block = EXCLUDED.update_block, updated_at = NOW()
	`, chainID, address, symbol, name, decimals, int64(blockNumber))
	if err != nil {
		return fmt.Errorf("upsert token: %w", err)
	}
	return nil
}

// InsertGrid inserts a new grid record within a transaction.
// askStrategy/bidStrategy are strategy type identifiers: "linear" or "geometry".
// askPrice0/askGap/bidPrice0/bidGap come from LinearStrategyCreated events (may be empty strings).
// askRatio/bidRatio come from GeometryStrategyCreated events (may be empty strings).
// initPrice is the initial price when the grid was created (typically bidPrice0).
// initBasePrice/initQuotePrice are USD prices at creation time from OKX DEX API.
// aprExcludeIl/aprReal are APR calculation fields (empty on creation, updated by periodic timer).
func InsertGrid(ctx context.Context, tx pgx.Tx, chainID int64, gridID int64,
	owner string, pairID int, baseToken, quoteToken, initialBaseAmount, initialQuoteAmount string,
	askOrderCount, bidOrderCount, fee int, compound, oneshot bool,
	askStrategy, bidStrategy string,
	askPrice0, askGap, bidPrice0, bidGap string,
	askRatio, bidRatio string,
	initPrice string,
	initBasePrice, initQuotePrice string,
	blockNumber uint64) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO grids (grid_id, chain_id, owner, pair_id, base_token, quote_token,
			ask_order_count, bid_order_count, initial_base_amount, initial_quote_amount,
			fee, compound, oneshot, status,
			ask_strategy, bid_strategy,
			ask_price0, ask_gap, bid_price0, bid_gap,
			ask_ratio, bid_ratio,
			init_price,
			init_base_price, init_quote_price, apr_theoretical, apr_real,
			create_block, update_block)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 1,
			$14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, '', '', $25, $25)
		ON CONFLICT DO NOTHING
	`, gridID, chainID, owner, pairID, baseToken, quoteToken,
		askOrderCount, bidOrderCount, initialBaseAmount, initialQuoteAmount,
		fee, compound, oneshot,
		askStrategy, bidStrategy,
		askPrice0, askGap, bidPrice0, bidGap,
		askRatio, bidRatio,
		initPrice,
		initBasePrice, initQuotePrice,
		int64(blockNumber))
	if err != nil {
		return fmt.Errorf("insert grid: %w", err)
	}
	return nil
}

// orderIDToHex converts a numeric orderID string to hexadecimal format.
// Returns "0x" prefixed hex string.
func orderIDToHex(orderID string) string {
	bigInt := new(big.Int)
	bigInt.SetString(orderID, 10)
	return "0x" + bigInt.Text(16)
}

// InsertOrder inserts a new order record within a transaction.
func InsertOrder(ctx context.Context, tx pgx.Tx, chainID int64, orderID string,
	gridID int64, pairID int, isAsk, compound, oneshot bool, fee int,
	amount, revAmount, initialBaseAmount, initialQuoteAmount, price, revPrice string,
	blockNumber uint64) error {
	hexOrderID := orderIDToHex(orderID)
	_, err := tx.Exec(ctx, `
		INSERT INTO orders (order_id, chain_id, grid_id, pair_id, is_ask, compound, oneshot,
			fee, status, amount, rev_amount, initial_base_amount, initial_quote_amount,
			price, rev_price, hex_order_id, create_block, update_block)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10, $11, $12, $13, $14, $15, $16, $16)
		ON CONFLICT DO NOTHING
	`, orderID, chainID, gridID, pairID, isAsk, compound, oneshot, fee,
		amount, revAmount, initialBaseAmount, initialQuoteAmount, price, revPrice,
		hexOrderID, int64(blockNumber))
	if err != nil {
		return fmt.Errorf("insert order: %w", err)
	}
	return nil
}

// InsertOrderFill inserts an order fill record within a transaction.
func InsertOrderFill(ctx context.Context, tx pgx.Tx, chainID int64,
	txHash, taker, orderID, filledAmount, filledVolume string, isAsk bool, pairID int, ts time.Time,
	gridID int64, quoteAddress, priceGap, gridProfit, orderFee string, isReverse bool,
	blockNumber uint64) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO order_fills (chain_id, tx_hash, taker, order_id, filled_amount, filled_volume, is_ask, pair_id, timestamp, grid_id, quote_address, price_gap, grid_profit, order_fee, is_reverse, create_block, update_block)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $16)
	`, chainID, txHash, taker, orderID, filledAmount, filledVolume, isAsk, pairID, ts, gridID, quoteAddress, priceGap, gridProfit, orderFee, isReverse, int64(blockNumber))
	if err != nil {
		return fmt.Errorf("insert order fill: %w", err)
	}
	return nil
}

// UpdateOrderOnFill updates an order's amount and rev_amount after a fill.
func UpdateOrderOnFill(ctx context.Context, tx pgx.Tx, chainID int64,
	orderID, newAmount, newRevAmount string, blockNumber uint64) error {
	_, err := tx.Exec(ctx, `
		UPDATE orders SET amount = $1, rev_amount = $2, update_block = $5, updated_at = NOW()
		WHERE chain_id = $3 AND order_id = $4
	`, newAmount, newRevAmount, chainID, orderID, int64(blockNumber))
	if err != nil {
		return fmt.Errorf("update order on fill: %w", err)
	}
	return nil
}

// CancelOrder sets an order's status to cancelled (status=2).
func CancelOrder(ctx context.Context, tx pgx.Tx, chainID int64, orderID string, blockNumber uint64) error {
	_, err := tx.Exec(ctx, `
		UPDATE orders SET status = 2, update_block = $3, updated_at = NOW()
		WHERE chain_id = $1 AND order_id = $2
	`, chainID, orderID, int64(blockNumber))
	if err != nil {
		return fmt.Errorf("cancel order: %w", err)
	}
	return nil
}

// CancelGrid sets a grid's status to cancelled (status=2) and all its orders.
func CancelGrid(ctx context.Context, tx pgx.Tx, chainID int64, gridID int64, blockNumber uint64) error {
	_, err := tx.Exec(ctx, `
		UPDATE grids SET status = 2, update_block = $3, updated_at = NOW()
		WHERE chain_id = $1 AND grid_id = $2
	`, chainID, gridID, int64(blockNumber))
	if err != nil {
		return fmt.Errorf("cancel grid: %w", err)
	}

	// Also cancel all orders belonging to this grid
	_, err = tx.Exec(ctx, `
		UPDATE orders SET status = 2, update_block = $3, updated_at = NOW()
		WHERE chain_id = $1 AND grid_id = $2
	`, chainID, gridID, int64(blockNumber))
	if err != nil {
		return fmt.Errorf("cancel grid orders: %w", err)
	}

	return nil
}

// UpdateGridFee updates a grid's fee.
func UpdateGridFee(ctx context.Context, tx pgx.Tx, chainID int64, gridID int64, fee int, blockNumber uint64) error {
	_, err := tx.Exec(ctx, `
		UPDATE grids SET fee = $1, update_block = $4, updated_at = NOW()
		WHERE chain_id = $2 AND grid_id = $3
	`, fee, chainID, gridID, int64(blockNumber))
	if err != nil {
		return fmt.Errorf("update grid fee: %w", err)
	}
	return nil
}

// UpdateGridProfits adds to a grid's profits.
func UpdateGridProfits(ctx context.Context, tx pgx.Tx, chainID int64, gridID int64, amt string, blockNumber uint64) error {
	// We store profits as a string representation of big.Int
	// For simplicity, we use PostgreSQL's numeric casting to add
	_, err := tx.Exec(ctx, `
		UPDATE grids SET profits = (CAST(profits AS NUMERIC) + CAST($1 AS NUMERIC))::TEXT,
		    update_block = $4, updated_at = NOW()
		WHERE chain_id = $2 AND grid_id = $3
	`, amt, chainID, gridID, int64(blockNumber))
	if err != nil {
		return fmt.Errorf("update grid profits: %w", err)
	}
	return nil
}

// UpdateGridTotalProfit adds to a grid's total_profit field.
// total_profit accumulates gridProfit + orderFee from each fill.
func UpdateGridTotalProfit(ctx context.Context, tx pgx.Tx, chainID int64, gridID int64, profitToAdd string, blockNumber uint64) error {
	_, err := tx.Exec(ctx, `
		UPDATE grids SET total_profit = (CAST(COALESCE(total_profit, '0') AS NUMERIC) + CAST($1 AS NUMERIC))::TEXT,
		    update_block = $4, updated_at = NOW()
		WHERE chain_id = $2 AND grid_id = $3
	`, profitToAdd, chainID, gridID, int64(blockNumber))
	if err != nil {
		return fmt.Errorf("update grid total_profit: %w", err)
	}
	return nil
}

// IncrementPairActiveGrids increments the active_grids count for a pair.
func IncrementPairActiveGrids(ctx context.Context, tx pgx.Tx, chainID int64, pairID int, blockNumber uint64) error {
	_, err := tx.Exec(ctx, `
		UPDATE pairs SET active_grids = active_grids + 1, update_block = $3, updated_at = NOW()
		WHERE chain_id = $1 AND pair_id = $2
	`, chainID, pairID, int64(blockNumber))
	if err != nil {
		return fmt.Errorf("increment pair active grids: %w", err)
	}
	return nil
}

// DecrementPairActiveGrids decrements the active_grids count for a pair.
func DecrementPairActiveGrids(ctx context.Context, tx pgx.Tx, chainID int64, pairID int, blockNumber uint64) error {
	_, err := tx.Exec(ctx, `
		UPDATE pairs SET active_grids = GREATEST(active_grids - 1, 0), update_block = $3, updated_at = NOW()
		WHERE chain_id = $1 AND pair_id = $2
	`, chainID, pairID, int64(blockNumber))
	if err != nil {
		return fmt.Errorf("decrement pair active grids: %w", err)
	}
	return nil
}

// TokenRow represents a token record from the database.
type TokenRow struct {
	Address  string
	Symbol   string
	Name     string
	Decimals int
}

// GetTokensByChain returns all known tokens for a chain.
// Used to pre-populate the in-memory token cache on startup, avoiding
// redundant RPC calls for tokens we've already fetched.
func (r *Repository) GetTokensByChain(ctx context.Context, chainID int64) ([]TokenRow, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT address, symbol, name, decimals FROM tokens WHERE chain_id = $1`, chainID)
	if err != nil {
		return nil, fmt.Errorf("get tokens by chain: %w", err)
	}
	defer rows.Close()

	var tokens []TokenRow
	for rows.Next() {
		var t TokenRow
		if err := rows.Scan(&t.Address, &t.Symbol, &t.Name, &t.Decimals); err != nil {
			return nil, fmt.Errorf("scan token row: %w", err)
		}
		tokens = append(tokens, t)
	}
	return tokens, rows.Err()
}

// GetGridPairID returns the pair_id for a given grid.
func GetGridPairID(ctx context.Context, tx pgx.Tx, chainID int64, gridID int64) (int, error) {
	var pairID int
	err := tx.QueryRow(ctx,
		`SELECT pair_id FROM grids WHERE chain_id = $1 AND grid_id = $2`, chainID, gridID,
	).Scan(&pairID)
	if err != nil {
		return 0, fmt.Errorf("get grid pair_id: %w", err)
	}
	return pairID, nil
}

// GetOrderGridID returns the grid_id for a given order.
func GetOrderGridID(ctx context.Context, tx pgx.Tx, chainID int64, orderID string) (int64, error) {
	var gridID int64
	err := tx.QueryRow(ctx,
		`SELECT grid_id FROM orders WHERE chain_id = $1 AND order_id = $2`, chainID, orderID,
	).Scan(&gridID)
	if err != nil {
		return 0, fmt.Errorf("get order grid_id: %w", err)
	}
	return gridID, nil
}

// OrderInfo holds order details needed for fill processing.
type OrderInfo struct {
	GridID   int64
	PairID   int
	IsAsk    bool
	Compound bool
	Price    string
	RevPrice string
	Fee      int
}

// GetOrderInfo returns order details for a given order.
func GetOrderInfo(ctx context.Context, tx pgx.Tx, chainID int64, orderID string) (*OrderInfo, error) {
	var info OrderInfo
	err := tx.QueryRow(ctx,
		`SELECT grid_id, pair_id, is_ask, compound, price, rev_price, fee FROM orders WHERE chain_id = $1 AND order_id = $2`,
		chainID, orderID,
	).Scan(&info.GridID, &info.PairID, &info.IsAsk, &info.Compound, &info.Price, &info.RevPrice, &info.Fee)
	if err != nil {
		return nil, fmt.Errorf("get order info: %w", err)
	}
	return &info, nil
}

// GridStrategyInfo holds grid strategy details needed for priceGap calculation.
type GridStrategyInfo struct {
	AskStrategy string
	BidStrategy string
	AskPrice0   string
	AskGap      string
	BidPrice0   string
	BidGap      string
	AskRatio    string
	BidRatio    string
	Fee         int
}

// GetGridStrategyInfo returns grid strategy info for priceGap calculation.
func GetGridStrategyInfo(ctx context.Context, tx pgx.Tx, chainID int64, gridID int64) (*GridStrategyInfo, error) {
	var info GridStrategyInfo
	err := tx.QueryRow(ctx,
		`SELECT ask_strategy, bid_strategy, ask_price0, ask_gap, bid_price0, bid_gap, ask_ratio, bid_ratio, fee FROM grids WHERE chain_id = $1 AND grid_id = $2`,
		chainID, gridID,
	).Scan(&info.AskStrategy, &info.BidStrategy, &info.AskPrice0, &info.AskGap, &info.BidPrice0, &info.BidGap, &info.AskRatio, &info.BidRatio, &info.Fee)
	if err != nil {
		return nil, fmt.Errorf("get grid strategy info: %w", err)
	}
	return &info, nil
}

// GetPairQuoteAddress returns the quote token address for a pair.
func GetPairQuoteAddress(ctx context.Context, tx pgx.Tx, chainID int64, pairID int) (string, error) {
	var quoteAddr string
	err := tx.QueryRow(ctx,
		`SELECT quote_token_address FROM pairs WHERE chain_id = $1 AND pair_id = $2`, chainID, pairID,
	).Scan(&quoteAddr)
	if err != nil {
		return "", fmt.Errorf("get pair quote address: %w", err)
	}
	return quoteAddr, nil
}

// ProtocolStats holds aggregated protocol statistics.
type ProtocolStats struct {
	TotalVolume string // SUM of filled_volume from order_fills (quote token amounts)
	TotalTVL    string // SUM of quote token amounts in active orders
	TotalGrids  int    // total number of grids
	ActiveGrids int    // number of active grids (status=1)
	TotalTrades int    // total number of order fills
	TotalProfit string // SUM of profits from all grids
	ActiveUsers int    // distinct grid owners
}

// ComputeProtocolStats aggregates protocol-level statistics from existing tables.
// nativeTokenPrice is the USD price of the chain's native token (e.g., BNB, ETH)
// fetched from Binance. It is used to value wrapped native tokens in TVL.
// If nativeTokenPrice is nil, wrapped native tokens are valued at $0.
func ComputeProtocolStats(ctx context.Context, tx pgx.Tx, chainID int64, nativeTokenPrice *big.Float) (*ProtocolStats, error) {
	stats := &ProtocolStats{}

	// Total volume: SUM of filled_volume (quote token amounts) from order_fills
	err := tx.QueryRow(ctx, `
		SELECT COALESCE(SUM(filled_volume::NUMERIC), 0)::TEXT
		FROM order_fills WHERE chain_id = $1
	`, chainID).Scan(&stats.TotalVolume)
	if err != nil {
		return nil, fmt.Errorf("compute total volume: %w", err)
	}

	// Total TVL: Only count stablecoins and wrapped native tokens.
	// For each active order, we include BOTH amount (base token) and rev_amount (quote token),
	// but only if the respective token is a stablecoin or wrapped native token.
	// Stablecoins are valued at $1; wrapped native tokens at the Binance spot price.
	tvl, err := computeTVL(ctx, tx, chainID, nativeTokenPrice)
	if err != nil {
		return nil, fmt.Errorf("compute total tvl: %w", err)
	}
	stats.TotalTVL = tvl

	// Total grids and active grids
	err = tx.QueryRow(ctx, `
		SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 1)
		FROM grids WHERE chain_id = $1
	`, chainID).Scan(&stats.TotalGrids, &stats.ActiveGrids)
	if err != nil {
		return nil, fmt.Errorf("compute grid counts: %w", err)
	}

	// Total trades
	err = tx.QueryRow(ctx, `
		SELECT COUNT(*) FROM order_fills WHERE chain_id = $1
	`, chainID).Scan(&stats.TotalTrades)
	if err != nil {
		return nil, fmt.Errorf("compute total trades: %w", err)
	}

	// Total profit: SUM of profits from all grids
	err = tx.QueryRow(ctx, `
		SELECT COALESCE(SUM(profits::NUMERIC), 0)::TEXT
		FROM grids WHERE chain_id = $1
	`, chainID).Scan(&stats.TotalProfit)
	if err != nil {
		return nil, fmt.Errorf("compute total profit: %w", err)
	}

	// Active users: distinct grid owners
	err = tx.QueryRow(ctx, `
		SELECT COUNT(DISTINCT owner) FROM grids WHERE chain_id = $1
	`, chainID).Scan(&stats.ActiveUsers)
	if err != nil {
		return nil, fmt.Errorf("compute active users: %w", err)
	}

	return stats, nil
}

// computeTVL calculates the total TVL by summing USD values of stablecoins and
// wrapped native tokens held in active orders.
// For each active order:
//   - amount is denominated in the base token (pair's base_token_address)
//   - rev_amount is denominated in the quote token (pair's quote_token_address)
//
// Only tokens classified as stablecoins or wrapped native are counted.
// Stablecoins are valued at $1; wrapped native tokens at nativeTokenPrice.
func computeTVL(ctx context.Context, tx pgx.Tx, chainID int64, nativeTokenPrice *big.Float) (string, error) {
	// Query all active orders joined with their pair to get token addresses.
	rows, err := tx.Query(ctx, `
		SELECT o.amount, o.rev_amount,
		       p.base_token_address, p.quote_token_address
		FROM orders o
		JOIN pairs p ON o.pair_id = p.pair_id AND o.chain_id = p.chain_id
		WHERE o.chain_id = $1 AND o.status = 0
	`, chainID)
	if err != nil {
		return "0", fmt.Errorf("query active orders for tvl: %w", err)
	}
	defer rows.Close()

	// Use big.Float for precise accumulation of USD values.
	totalUSD := new(big.Float).SetFloat64(0)
	one := new(big.Float).SetFloat64(1)

	for rows.Next() {
		var amountStr, revAmountStr, baseAddr, quoteAddr string
		if err := rows.Scan(&amountStr, &revAmountStr, &baseAddr, &quoteAddr); err != nil {
			return "0", fmt.Errorf("scan order row for tvl: %w", err)
		}

		// Check base token (amount is in base token units)
		if baseInfo, ok := pricing.LookupTVLToken(chainID, baseAddr); ok {
			addTokenValue(totalUSD, amountStr, baseInfo, nativeTokenPrice, one)
		}

		// Check quote token (rev_amount is in quote token units)
		if quoteInfo, ok := pricing.LookupTVLToken(chainID, quoteAddr); ok {
			addTokenValue(totalUSD, revAmountStr, quoteInfo, nativeTokenPrice, one)
		}
	}
	if err := rows.Err(); err != nil {
		return "0", fmt.Errorf("iterate orders for tvl: %w", err)
	}

	// Scale to 18-decimal precision for consistency with on-chain token amounts.
	precision := new(big.Int).Exp(big.NewInt(10), big.NewInt(18), nil)
	scaled := new(big.Float).Mul(totalUSD, new(big.Float).SetInt(precision))
	totalInt, _ := scaled.Int(nil)
	return totalInt.String(), nil
}

// addTokenValue converts a raw token amount to USD and adds it to the accumulator.
// rawAmount is the raw integer amount (no decimals applied).
// info contains the token type and decimal count.
// nativePrice is the USD price for wrapped native tokens.
// one is a pre-allocated big.Float(1) for stablecoin pricing.
func addTokenValue(acc *big.Float, rawAmount string, info pricing.TVLTokenInfo, nativePrice, one *big.Float) {
	amount, ok := new(big.Int).SetString(rawAmount, 10)
	if !ok || amount.Sign() <= 0 {
		return
	}

	// Convert raw amount to human-readable by dividing by 10^decimals.
	decimals := new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(info.Decimals)), nil)
	humanAmount := new(big.Float).Quo(
		new(big.Float).SetInt(amount),
		new(big.Float).SetInt(decimals),
	)

	// Multiply by the appropriate USD price.
	var price *big.Float
	switch info.Type {
	case pricing.TokenTypeStablecoin:
		price = one // $1
	case pricing.TokenTypeWrappedNative:
		if nativePrice != nil {
			price = nativePrice
		} else {
			return // skip if no price available
		}
	default:
		return // unknown token type, skip
	}

	usdValue := new(big.Float).Mul(humanAmount, price)
	acc.Add(acc, usdValue)
}

// UpsertProtocolStats writes aggregated stats to the protocol_stats table.
func UpsertProtocolStats(ctx context.Context, tx pgx.Tx, chainID int64, date string, stats *ProtocolStats, blockNumber uint64) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO protocol_stats (chain_id, date, total_volume, total_tvl, total_grids, total_trades, total_profit, active_users, create_block, update_block)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
		ON CONFLICT (chain_id, date) DO UPDATE SET
			total_volume = EXCLUDED.total_volume,
			total_tvl = EXCLUDED.total_tvl,
			total_grids = EXCLUDED.total_grids,
			total_trades = EXCLUDED.total_trades,
			total_profit = EXCLUDED.total_profit,
			active_users = EXCLUDED.active_users,
			update_block = EXCLUDED.update_block
	`, chainID, date, stats.TotalVolume, stats.TotalTVL, stats.TotalGrids,
		stats.TotalTrades, stats.TotalProfit, stats.ActiveUsers, int64(blockNumber))
	if err != nil {
		return fmt.Errorf("upsert protocol stats: %w", err)
	}
	return nil
}

// LeaderboardPeriod defines a leaderboard time period and its SQL interval.
type LeaderboardPeriod struct {
	Name     string // '24h', '7d', '30d', 'all'
	Interval string // '24 hours', '7 days', '30 days', '' (unused for 'all')
}

// AllLeaderboardPeriods lists the four supported leaderboard periods.
var AllLeaderboardPeriods = []LeaderboardPeriod{
	{Name: "24h", Interval: "24 hours"},
	{Name: "7d", Interval: "7 days"},
	{Name: "30d", Interval: "30 days"},
	{Name: "all", Interval: ""},
}

// UpdateLeaderboard refreshes the leaderboard table for all periods.
// For each period it aggregates data from grids, orders, and order_fills,
// then upserts one row per active grid into the leaderboard table.
func UpdateLeaderboard(ctx context.Context, tx pgx.Tx, chainID int64, blockNumber uint64) error {
	for _, p := range AllLeaderboardPeriods {
		if err := updateLeaderboardPeriod(ctx, tx, chainID, p, blockNumber); err != nil {
			return fmt.Errorf("update leaderboard period %s: %w", p.Name, err)
		}
	}
	return nil
}

// UpdateLeaderboardPeriodic refreshes the leaderboard in its own transaction.
// This is used by the periodic updater (outside the scanning loop).
func (r *Repository) UpdateLeaderboardPeriodic(ctx context.Context, chainID int64) error {
	lastBlock, err := r.GetLastBlock(ctx, chainID)
	if err != nil {
		return fmt.Errorf("get last block for leaderboard: %w", err)
	}
	return r.WithTx(ctx, func(ctx context.Context, tx pgx.Tx) error {
		return UpdateLeaderboard(ctx, tx, chainID, lastBlock)
	})
}

// updateLeaderboardPeriod upserts leaderboard rows for a single period.
func updateLeaderboardPeriod(ctx context.Context, tx pgx.Tx, chainID int64, p LeaderboardPeriod, blockNumber uint64) error {
	// Build the time filter for order_fills. For 'all' we use no filter.
	var timeFilter string
	if p.Name == "all" {
		timeFilter = "TRUE" // no time restriction
	} else {
		timeFilter = fmt.Sprintf("of.timestamp >= NOW() - INTERVAL '%s'", p.Interval)
	}

	query := fmt.Sprintf(`
INSERT INTO leaderboard (chain_id, grid_id, trader, pair, profit, profit_rate, volume, trades, tvl, apr, period, rank, update_block)
SELECT
  g.chain_id,
  g.grid_id,
  g.owner AS trader,
  g.base_token || '/' || g.quote_token AS pair,
  g.profits AS profit,
  -- profit_rate = profits / initial_investment * 100
  CASE WHEN inv.total_invested > 0
    THEN (g.profits::NUMERIC / inv.total_invested * 100)::REAL
    ELSE 0
  END AS profit_rate,
  COALESCE(fills.volume, '0') AS volume,
  COALESCE(fills.trades, 0) AS trades,
  COALESCE(tvl_sub.tvl, '0') AS tvl,
  -- apr = profit_rate * 365 / days_active
  CASE WHEN inv.total_invested > 0 AND EXTRACT(EPOCH FROM NOW() - g.created_at) > 86400
    THEN (g.profits::NUMERIC / inv.total_invested * 365.0 / (EXTRACT(EPOCH FROM NOW() - g.created_at) / 86400) * 100)::REAL
    ELSE 0
  END AS apr,
  $2 AS period,
  ROW_NUMBER() OVER (ORDER BY g.profits::NUMERIC DESC) AS rank,
  $3 AS update_block
FROM grids g
-- initial_investment: initial_quote_amount + initial_base_amount * bid_price0 / 1e36
LEFT JOIN LATERAL (
  SELECT CASE
    WHEN g.bid_price0 != '' AND g.bid_price0 != '0'
      THEN g.initial_quote_amount::NUMERIC + (g.initial_base_amount::NUMERIC * g.bid_price0::NUMERIC / 1e36)
    ELSE g.initial_quote_amount::NUMERIC
  END AS total_invested
) inv ON TRUE
-- volume and trades for this grid in the given period
LEFT JOIN LATERAL (
  SELECT
    SUM(of.filled_volume::NUMERIC)::TEXT AS volume,
    COUNT(*)::INTEGER AS trades
  FROM order_fills of
  JOIN orders o ON of.chain_id = o.chain_id AND of.order_id = o.order_id
  WHERE o.chain_id = g.chain_id AND o.grid_id = g.grid_id
    AND %s
) fills ON TRUE
-- TVL: sum of quote amounts in active orders belonging to this grid
LEFT JOIN LATERAL (
  SELECT COALESCE(SUM(
    CASE WHEN o.is_ask THEN o.rev_amount::NUMERIC ELSE o.amount::NUMERIC END
  ), 0)::TEXT AS tvl
  FROM orders o
  WHERE o.chain_id = g.chain_id AND o.grid_id = g.grid_id AND o.status = 0
) tvl_sub ON TRUE
WHERE g.chain_id = $1 AND g.status = 1
ON CONFLICT (chain_id, period, grid_id) DO UPDATE SET
  trader = EXCLUDED.trader,
  pair = EXCLUDED.pair,
  profit = EXCLUDED.profit,
  profit_rate = EXCLUDED.profit_rate,
  volume = EXCLUDED.volume,
  trades = EXCLUDED.trades,
  tvl = EXCLUDED.tvl,
  apr = EXCLUDED.apr,
  rank = EXCLUDED.rank,
  update_block = EXCLUDED.update_block,
  updated_at = NOW()
`, timeFilter)

	_, err := tx.Exec(ctx, query, chainID, p.Name, int64(blockNumber))
	if err != nil {
		return fmt.Errorf("exec leaderboard upsert: %w", err)
	}
	return nil
}

// UpdatePairVolumes updates pairs.volume_24h and trades_24h by aggregating
// order_fills from the last 24 hours, and upserts pair_daily_stats for today.
func UpdatePairVolumes(ctx context.Context, tx pgx.Tx, chainID int64, date string, blockNumber uint64) error {
	// Update pairs.volume_24h and trades_24h from order_fills in last 24 hours
	_, err := tx.Exec(ctx, `
		UPDATE pairs p SET
			volume_24h = COALESCE(s.vol, '0'),
			trades_24h = COALESCE(s.cnt, 0),
			update_block = $2,
			updated_at = NOW()
		FROM (
			SELECT pair_id,
				SUM(filled_volume::NUMERIC)::TEXT AS vol,
				COUNT(*)::INTEGER AS cnt
			FROM order_fills
			WHERE chain_id = $1 AND timestamp >= NOW() - INTERVAL '24 hours'
			GROUP BY pair_id
		) s
		WHERE p.chain_id = $1 AND p.pair_id = s.pair_id
	`, chainID, int64(blockNumber))
	if err != nil {
		return fmt.Errorf("update pair volumes 24h: %w", err)
	}

	// Zero out pairs that had no fills in the last 24 hours
	_, err = tx.Exec(ctx, `
		UPDATE pairs SET volume_24h = '0', trades_24h = 0, update_block = $2, updated_at = NOW()
		WHERE chain_id = $1 AND pair_id NOT IN (
			SELECT DISTINCT pair_id FROM order_fills
			WHERE chain_id = $1 AND timestamp >= NOW() - INTERVAL '24 hours'
		) AND (volume_24h != '0' OR trades_24h != 0)
	`, chainID, int64(blockNumber))
	if err != nil {
		return fmt.Errorf("zero stale pair volumes: %w", err)
	}

	// Upsert pair_daily_stats for today
	_, err = tx.Exec(ctx, `
		INSERT INTO pair_daily_stats (chain_id, pair_id, date, volume, trades, create_block, update_block)
		SELECT $1, pair_id,
			$2::TEXT,
			SUM(filled_volume::NUMERIC)::TEXT,
			COUNT(*)::INTEGER,
			$3, $3
		FROM order_fills
		WHERE chain_id = $1 AND timestamp::DATE = ($2)::DATE
		GROUP BY pair_id
		ON CONFLICT (chain_id, pair_id, date) DO UPDATE SET
			volume = EXCLUDED.volume,
			trades = EXCLUDED.trades,
			update_block = EXCLUDED.update_block
	`, chainID, date, int64(blockNumber))
	if err != nil {
		return fmt.Errorf("upsert pair daily stats: %w", err)
	}

	return nil
}

// GetActiveGridsForAPR returns all active grids (status=1) with their pair token addresses
// for APR calculation.
func (r *Repository) GetActiveGridsForAPR(ctx context.Context, chainID int64) ([]ActiveGridRow, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT g.grid_id, g.chain_id, g.pair_id,
			g.initial_base_amount, g.initial_quote_amount,
			g.init_base_price, g.init_quote_price,
			g.profits, g.compound, g.created_at,
			p.base_token_address, p.quote_token_address
		FROM grids g
		JOIN pairs p ON g.chain_id = p.chain_id AND g.pair_id = p.pair_id
		WHERE g.chain_id = $1 AND g.status = 1
			AND g.init_base_price != '' AND g.init_quote_price != ''
	`, chainID)
	if err != nil {
		return nil, fmt.Errorf("query active grids for APR: %w", err)
	}
	defer rows.Close()

	var result []ActiveGridRow
	for rows.Next() {
		var g ActiveGridRow
		if err := rows.Scan(
			&g.GridID, &g.ChainID, &g.PairID,
			&g.InitialBaseAmount, &g.InitialQuoteAmount,
			&g.InitBasePrice, &g.InitQuotePrice,
			&g.Profits, &g.Compound, &g.CreatedAt,
			&g.BaseTokenAddress, &g.QuoteTokenAddress,
		); err != nil {
			return nil, fmt.Errorf("scan active grid row: %w", err)
		}
		result = append(result, g)
	}
	return result, rows.Err()
}

// GetGridOrderAmounts returns the aggregated base and quote amounts for a grid
// by summing order amounts from both ask and bid sides:
//   - Ask orders (is_ask=true): base_amount = amount, quote_amount = rev_amount
//   - Bid orders (is_ask=false): base_amount = rev_amount, quote_amount = amount
//
// The grid's total base/quote amounts are the sum of both sides.
func (r *Repository) GetGridOrderAmounts(ctx context.Context, chainID int64, gridID int64) (GridOrderAmounts, error) {
	var amounts GridOrderAmounts
	err := r.pool.QueryRow(ctx, `
		SELECT
			COALESCE(SUM(CASE WHEN is_ask THEN amount::NUMERIC ELSE rev_amount::NUMERIC END), 0)::TEXT,
			COALESCE(SUM(CASE WHEN is_ask THEN rev_amount::NUMERIC ELSE amount::NUMERIC END), 0)::TEXT
		FROM orders
		WHERE chain_id = $1 AND grid_id = $2
	`, chainID, gridID).Scan(&amounts.BaseAmount, &amounts.QuoteAmount)
	if err != nil {
		return amounts, fmt.Errorf("get grid order amounts: %w", err)
	}
	return amounts, nil
}

// GridOrderForTheoretical holds order data needed for theoretical TVL calculation.
type GridOrderForTheoretical struct {
	IsAsk  bool
	Price  string // order price (in quote token)
	Amount string // for ask: base amount, for bid: quote amount
	RevAmt string // for ask: quote amount (rev_amount), for bid: base amount (rev_amount)
}

// GetGridOrdersForTheoretical returns all orders for a grid with their price and amounts.
// This is used to calculate theoretical TVL (what the portfolio would be without grid trading).
func (r *Repository) GetGridOrdersForTheoretical(ctx context.Context, chainID int64, gridID int64) ([]GridOrderForTheoretical, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT is_ask, price, amount, rev_amount
		FROM orders
		WHERE chain_id = $1 AND grid_id = $2
	`, chainID, gridID)
	if err != nil {
		return nil, fmt.Errorf("get grid orders for theoretical: %w", err)
	}
	defer rows.Close()

	var orders []GridOrderForTheoretical
	for rows.Next() {
		var o GridOrderForTheoretical
		if err := rows.Scan(&o.IsAsk, &o.Price, &o.Amount, &o.RevAmt); err != nil {
			return nil, fmt.Errorf("scan order: %w", err)
		}
		orders = append(orders, o)
	}
	return orders, nil
}

// UpdateGridAPR updates the apr_theoretical and apr_real fields for a grid.
func (r *Repository) UpdateGridAPR(ctx context.Context, gridID int64, chainID int64, aprTheoretical, aprReal string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE grids SET apr_theoretical = $1, apr_real = $2
		WHERE grid_id = $3 AND chain_id = $4
	`, aprTheoretical, aprReal, gridID, chainID)
	if err != nil {
		return fmt.Errorf("update grid APR: %w", err)
	}
	return nil
}

// APRHistoryRow holds the data for inserting an APR history record.
type APRHistoryRow struct {
	Timestamp          time.Time
	ChainID            int64
	GridID             int64
	PairID             int
	InitBaseAmount     string
	InitQuoteAmount    string
	CurrentBaseAmount  string
	CurrentQuoteAmount string
	InitBasePrice      string
	InitQuotePrice     string
	CurrentBasePrice   string
	CurrentQuotePrice  string
	Profits            string
	APRReal            string
	APRTheoretical     string
}

// InsertAPRHistory inserts a new APR history record for a grid.
func (r *Repository) InsertAPRHistory(ctx context.Context, row APRHistoryRow) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO grid_apr_history (
			timestamp, chain_id, grid_id, pair_id,
			init_base_amount, init_quote_amount,
			current_base_amount, current_quote_amount,
			init_base_price, init_quote_price,
			current_base_price, current_quote_price,
			profits, apr_real, apr_theoretical
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	`, row.Timestamp, row.ChainID, row.GridID, row.PairID,
		row.InitBaseAmount, row.InitQuoteAmount,
		row.CurrentBaseAmount, row.CurrentQuoteAmount,
		row.InitBasePrice, row.InitQuotePrice,
		row.CurrentBasePrice, row.CurrentQuotePrice,
		row.Profits, row.APRReal, row.APRTheoretical)
	if err != nil {
		return fmt.Errorf("insert APR history: %w", err)
	}
	return nil
}
