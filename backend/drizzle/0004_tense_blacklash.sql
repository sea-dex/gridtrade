ALTER TABLE "grids" ADD COLUMN "total_profit" varchar(78) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_fills" ADD COLUMN "grid_id" bigint;--> statement-breakpoint
ALTER TABLE "order_fills" ADD COLUMN "quote_address" varchar(42);--> statement-breakpoint
ALTER TABLE "order_fills" ADD COLUMN "price_gap" varchar(78);--> statement-breakpoint
ALTER TABLE "order_fills" ADD COLUMN "grid_profit" varchar(78);--> statement-breakpoint
ALTER TABLE "order_fills" ADD COLUMN "order_fee" varchar(78);--> statement-breakpoint
ALTER TABLE "order_fills" ADD COLUMN "is_reverse" boolean;--> statement-breakpoint
CREATE INDEX "order_fills_chain_id_grid_id_idx" ON "order_fills" USING btree ("chain_id","grid_id");