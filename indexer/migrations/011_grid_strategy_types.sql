-- Migration: Add strategy type and geometry ratio fields to grids table
-- Supports both Linear and Geometry strategies per v2 modification plan

-- Strategy type identifiers
ALTER TABLE grids ADD COLUMN IF NOT EXISTS ask_strategy VARCHAR(32) NOT NULL DEFAULT 'linear';
ALTER TABLE grids ADD COLUMN IF NOT EXISTS bid_strategy VARCHAR(32) NOT NULL DEFAULT 'linear';

-- Geometry strategy parameters (ratio for geometric progression)
ALTER TABLE grids ADD COLUMN IF NOT EXISTS ask_ratio VARCHAR(78) NOT NULL DEFAULT '';
ALTER TABLE grids ADD COLUMN IF NOT EXISTS bid_ratio VARCHAR(78) NOT NULL DEFAULT '';
