-- Migration: Add APR calculation fields to grids table
-- init_base_price / init_quote_price: USD prices at grid creation time (from OKX DEX API)
-- apr_exclude_il / apr_real: calculated APR values updated by periodic timer

ALTER TABLE grids ADD COLUMN IF NOT EXISTS init_base_price VARCHAR(78) NOT NULL DEFAULT '';
ALTER TABLE grids ADD COLUMN IF NOT EXISTS init_quote_price VARCHAR(78) NOT NULL DEFAULT '';
ALTER TABLE grids ADD COLUMN IF NOT EXISTS apr_exclude_il VARCHAR(78) NOT NULL DEFAULT '';
ALTER TABLE grids ADD COLUMN IF NOT EXISTS apr_real VARCHAR(78) NOT NULL DEFAULT '';
