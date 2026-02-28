ALTER TABLE "grids" ADD COLUMN "ask_strategy" varchar(32) DEFAULT 'linear' NOT NULL;--> statement-breakpoint
ALTER TABLE "grids" ADD COLUMN "bid_strategy" varchar(32) DEFAULT 'linear' NOT NULL;--> statement-breakpoint
ALTER TABLE "grids" ADD COLUMN "ask_ratio" varchar(78) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "grids" ADD COLUMN "bid_ratio" varchar(78) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "grids" ADD COLUMN "init_price" varchar(78) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "grids" ADD COLUMN "init_base_price" varchar(78) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "grids" ADD COLUMN "init_quote_price" varchar(78) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "grids" ADD COLUMN "apr_exclude_il" varchar(78) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "grids" ADD COLUMN "apr_real" varchar(78) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "leaderboard" ADD COLUMN "tvl" varchar(78) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "leaderboard" ADD COLUMN "apr" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_fills" ADD COLUMN "hex_order_id" varchar(66);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "hex_order_id" varchar(66);--> statement-breakpoint
CREATE UNIQUE INDEX "leaderboard_chain_period_grid_uq" ON "leaderboard" USING btree ("chain_id","period","grid_id");--> statement-breakpoint
CREATE INDEX "idx_orders_hex_order_id" ON "orders" USING btree ("hex_order_id");