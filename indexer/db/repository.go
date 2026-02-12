package db

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

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
// askPrice0/askGap/bidPrice0/bidGap come from LinearStrategyCreated events (may be empty strings).
func InsertGrid(ctx context.Context, tx pgx.Tx, chainID int64, gridID int64,
	owner string, pairID int, baseToken, quoteToken, initialBaseAmount, initialQuoteAmount string,
	askOrderCount, bidOrderCount, fee int, compound, oneshot bool,
	askPrice0, askGap, bidPrice0, bidGap string,
	blockNumber uint64) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO grids (grid_id, chain_id, owner, pair_id, base_token, quote_token,
			ask_order_count, bid_order_count, initial_base_amount, initial_quote_amount,
			fee, compound, oneshot, status,
			ask_price0, ask_gap, bid_price0, bid_gap,
			create_block, update_block)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 1,
			$14, $15, $16, $17, $18, $18)
		ON CONFLICT DO NOTHING
	`, gridID, chainID, owner, pairID, baseToken, quoteToken,
		askOrderCount, bidOrderCount, initialBaseAmount, initialQuoteAmount,
		fee, compound, oneshot,
		askPrice0, askGap, bidPrice0, bidGap,
		int64(blockNumber))
	if err != nil {
		return fmt.Errorf("insert grid: %w", err)
	}
	return nil
}

// InsertOrder inserts a new order record within a transaction.
func InsertOrder(ctx context.Context, tx pgx.Tx, chainID int64, orderID string,
	gridID int64, pairID int, isAsk, compound, oneshot bool, fee int,
	amount, revAmount, initialBaseAmount, initialQuoteAmount, price, revPrice string,
	blockNumber uint64) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO orders (order_id, chain_id, grid_id, pair_id, is_ask, compound, oneshot,
			fee, status, amount, rev_amount, initial_base_amount, initial_quote_amount,
			price, rev_price, create_block, update_block)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10, $11, $12, $13, $14, $15, $15)
		ON CONFLICT DO NOTHING
	`, orderID, chainID, gridID, pairID, isAsk, compound, oneshot, fee,
		amount, revAmount, initialBaseAmount, initialQuoteAmount, price, revPrice,
		int64(blockNumber))
	if err != nil {
		return fmt.Errorf("insert order: %w", err)
	}
	return nil
}

// InsertOrderFill inserts an order fill record within a transaction.
func InsertOrderFill(ctx context.Context, tx pgx.Tx, chainID int64,
	txHash, taker, orderID, filledAmount, filledVolume string, isAsk bool, ts time.Time,
	blockNumber uint64) error {
	_, err := tx.Exec(ctx, `
		INSERT INTO order_fills (chain_id, tx_hash, taker, order_id, filled_amount, filled_volume, is_ask, timestamp, create_block, update_block)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
	`, chainID, txHash, taker, orderID, filledAmount, filledVolume, isAsk, ts, int64(blockNumber))
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
