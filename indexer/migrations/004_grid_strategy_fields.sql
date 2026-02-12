-- Migration: Add LinearStrategy price0/gap fields to grids table
-- These fields store the starting price and price gap from LinearStrategyCreated events.
-- There can be separate values for ask and bid sides.

ALTER TABLE grids ADD COLUMN IF NOT EXISTS ask_price0 VARCHAR(78) NOT NULL DEFAULT '';
ALTER TABLE grids ADD COLUMN IF NOT EXISTS ask_gap VARCHAR(78) NOT NULL DEFAULT '';
ALTER TABLE grids ADD COLUMN IF NOT EXISTS bid_price0 VARCHAR(78) NOT NULL DEFAULT '';
ALTER TABLE grids ADD COLUMN IF NOT EXISTS bid_gap VARCHAR(78) NOT NULL DEFAULT '';
