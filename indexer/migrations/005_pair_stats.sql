-- Add pair_id column to order_fills for direct per-pair volume queries
ALTER TABLE order_fills ADD COLUMN IF NOT EXISTS pair_id INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS order_fills_chain_id_pair_id_idx ON order_fills (chain_id, pair_id);

-- Backfill pair_id from orders table for existing records
UPDATE order_fills f SET pair_id = o.pair_id
FROM orders o
WHERE f.chain_id = o.chain_id AND f.order_id = o.order_id AND f.pair_id = 0;

-- Create pair_daily_stats table for historical daily volume/trades per pair
CREATE TABLE IF NOT EXISTS pair_daily_stats (
    id SERIAL PRIMARY KEY,
    chain_id INTEGER NOT NULL,
    pair_id INTEGER NOT NULL,
    date VARCHAR(10) NOT NULL,
    volume VARCHAR(78) NOT NULL DEFAULT '0',
    trades INTEGER NOT NULL DEFAULT 0,
    create_block BIGINT NOT NULL DEFAULT 0,
    update_block BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS pair_daily_stats_chain_pair_date_uq ON pair_daily_stats (chain_id, pair_id, date);
CREATE INDEX IF NOT EXISTS pair_daily_stats_chain_id_date_idx ON pair_daily_stats (chain_id, date);
