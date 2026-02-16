-- Add tvl and apr columns to leaderboard table
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS tvl VARCHAR(78) NOT NULL DEFAULT '0';
ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS apr REAL NOT NULL DEFAULT 0;

-- Add unique constraint for upsert support (chain_id, period, grid_id)
CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_chain_period_grid_uq
  ON leaderboard (chain_id, period, grid_id);
