-- Add hex_order_id column to orders table for hexadecimal representation of order_id.
-- This provides a more compact and readable format for order identifiers.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS hex_order_id VARCHAR(66);

COMMENT ON COLUMN orders.hex_order_id IS 'Hexadecimal representation of the order_id (64-bit unsigned integer as 0x-prefixed hex string)';

-- Create index for faster lookups by hex_order_id
CREATE INDEX IF NOT EXISTS idx_orders_hex_order_id ON orders(hex_order_id);
