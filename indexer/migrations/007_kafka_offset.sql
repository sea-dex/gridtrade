-- Add kafka_offset column to indexer_state table for tradebot synchronization.
-- This allows tradebot to know the latest Kafka message offset that indexer has sent.

ALTER TABLE indexer_state ADD COLUMN IF NOT EXISTS kafka_offset BIGINT NOT NULL DEFAULT 0;

COMMENT ON COLUMN indexer_state.kafka_offset IS 'The latest Kafka message offset sent by indexer. Tradebot uses this to resume consumption.';
