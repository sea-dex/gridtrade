-- Migration: Schema changes for grids, orders, and all tables
-- 1. grids: rename base_amount -> initial_base_amount, add initial_quote_amount, create_block, update_block, indexes
-- 2. orders: rename base_amount -> initial_base_amount, add initial_quote_amount, create_block, update_block, indexes
-- 3. All tables: add create_block, update_block
-- 4. Additional indexes based on query patterns

-- ============================================================
-- grids table changes
-- ============================================================
ALTER TABLE grids RENAME COLUMN base_amount TO initial_base_amount;
ALTER TABLE grids ADD COLUMN initial_quote_amount VARCHAR(78) NOT NULL DEFAULT '0';
ALTER TABLE grids ADD COLUMN create_block BIGINT NOT NULL DEFAULT 0;
ALTER TABLE grids ADD COLUMN update_block BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS grids_chain_id_grid_id_idx ON grids (chain_id, grid_id);
CREATE INDEX IF NOT EXISTS grids_chain_id_pair_id_idx ON grids (chain_id, pair_id);
CREATE INDEX IF NOT EXISTS grids_chain_id_owner_idx ON grids (chain_id, owner);
CREATE INDEX IF NOT EXISTS grids_chain_id_status_idx ON grids (chain_id, status);

-- ============================================================
-- orders table changes
-- ============================================================
ALTER TABLE orders RENAME COLUMN base_amount TO initial_base_amount;
ALTER TABLE orders ADD COLUMN initial_quote_amount VARCHAR(78) NOT NULL DEFAULT '0';
ALTER TABLE orders ADD COLUMN create_block BIGINT NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN update_block BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS orders_chain_id_order_id_idx ON orders (chain_id, order_id);
CREATE INDEX IF NOT EXISTS orders_chain_id_grid_id_idx ON orders (chain_id, grid_id);
CREATE INDEX IF NOT EXISTS orders_chain_id_pair_id_idx ON orders (chain_id, pair_id);
CREATE INDEX IF NOT EXISTS orders_chain_id_status_idx ON orders (chain_id, status);

-- ============================================================
-- order_fills table changes
-- ============================================================
ALTER TABLE order_fills ADD COLUMN create_block BIGINT NOT NULL DEFAULT 0;
ALTER TABLE order_fills ADD COLUMN update_block BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS order_fills_chain_id_order_id_idx ON order_fills (chain_id, order_id);
CREATE INDEX IF NOT EXISTS order_fills_chain_id_tx_hash_idx ON order_fills (chain_id, tx_hash);
CREATE INDEX IF NOT EXISTS order_fills_chain_id_taker_idx ON order_fills (chain_id, taker);

-- ============================================================
-- tokens table changes
-- ============================================================
ALTER TABLE tokens ADD COLUMN create_block BIGINT NOT NULL DEFAULT 0;
ALTER TABLE tokens ADD COLUMN update_block BIGINT NOT NULL DEFAULT 0;

-- ============================================================
-- pairs table changes
-- ============================================================
ALTER TABLE pairs ADD COLUMN create_block BIGINT NOT NULL DEFAULT 0;
ALTER TABLE pairs ADD COLUMN update_block BIGINT NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS pairs_chain_id_pair_id_uq ON pairs (chain_id, pair_id);

-- ============================================================
-- protocol_stats table changes
-- ============================================================
ALTER TABLE protocol_stats ADD COLUMN create_block BIGINT NOT NULL DEFAULT 0;
ALTER TABLE protocol_stats ADD COLUMN update_block BIGINT NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS protocol_stats_chain_id_date_uq ON protocol_stats (chain_id, date);

-- ============================================================
-- leaderboard table changes
-- ============================================================
ALTER TABLE leaderboard ADD COLUMN create_block BIGINT NOT NULL DEFAULT 0;
ALTER TABLE leaderboard ADD COLUMN update_block BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS leaderboard_chain_id_period_rank_idx ON leaderboard (chain_id, period, rank);
CREATE INDEX IF NOT EXISTS leaderboard_chain_id_trader_idx ON leaderboard (chain_id, trader);
CREATE INDEX IF NOT EXISTS leaderboard_chain_id_period_pair_idx ON leaderboard (chain_id, period, pair);
