-- Migration: Add init_price field to grids table
-- This field stores the initial price when the grid was created.
-- The value comes from bidPrice0 of the LinearStrategyCreated event.

ALTER TABLE grids ADD COLUMN IF NOT EXISTS init_price VARCHAR(78) NOT NULL DEFAULT '';
