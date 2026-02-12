-- Indexer state table for tracking the last scanned block per chain.
-- This table is auto-created by the indexer on startup, but this migration
-- is provided for reference and manual setup.

CREATE TABLE IF NOT EXISTS indexer_state (
    id SERIAL PRIMARY KEY,
    chain_id INTEGER NOT NULL UNIQUE,
    last_block BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
