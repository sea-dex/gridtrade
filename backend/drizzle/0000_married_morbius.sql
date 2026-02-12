CREATE TABLE "grids" (
	"id" serial PRIMARY KEY NOT NULL,
	"grid_id" bigint NOT NULL,
	"chain_id" integer NOT NULL,
	"owner" varchar(42) NOT NULL,
	"pair_id" integer NOT NULL,
	"base_token" varchar(20) NOT NULL,
	"quote_token" varchar(20) NOT NULL,
	"ask_order_count" integer NOT NULL,
	"bid_order_count" integer NOT NULL,
	"initial_base_amount" varchar(78) NOT NULL,
	"initial_quote_amount" varchar(78) DEFAULT '0' NOT NULL,
	"profits" varchar(78) DEFAULT '0' NOT NULL,
	"fee" integer NOT NULL,
	"compound" boolean NOT NULL,
	"oneshot" boolean NOT NULL,
	"ask_price0" varchar(78) DEFAULT '' NOT NULL,
	"ask_gap" varchar(78) DEFAULT '' NOT NULL,
	"bid_price0" varchar(78) DEFAULT '' NOT NULL,
	"bid_gap" varchar(78) DEFAULT '' NOT NULL,
	"status" integer DEFAULT 1 NOT NULL,
	"create_block" bigint DEFAULT 0 NOT NULL,
	"update_block" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leaderboard" (
	"id" serial PRIMARY KEY NOT NULL,
	"chain_id" integer NOT NULL,
	"trader" varchar(42) NOT NULL,
	"pair" varchar(20) NOT NULL,
	"grid_id" bigint NOT NULL,
	"profit" varchar(78) DEFAULT '0' NOT NULL,
	"profit_rate" real DEFAULT 0 NOT NULL,
	"volume" varchar(78) DEFAULT '0' NOT NULL,
	"trades" integer DEFAULT 0 NOT NULL,
	"period" varchar(10) NOT NULL,
	"rank" integer NOT NULL,
	"create_block" bigint DEFAULT 0 NOT NULL,
	"update_block" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_fills" (
	"id" serial PRIMARY KEY NOT NULL,
	"chain_id" integer NOT NULL,
	"tx_hash" varchar(66) NOT NULL,
	"taker" varchar(42) NOT NULL,
	"order_id" varchar(78) NOT NULL,
	"filled_amount" varchar(78) NOT NULL,
	"filled_volume" varchar(78) NOT NULL,
	"is_ask" boolean NOT NULL,
	"timestamp" timestamp NOT NULL,
	"create_block" bigint DEFAULT 0 NOT NULL,
	"update_block" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" varchar(78) NOT NULL,
	"chain_id" integer NOT NULL,
	"grid_id" bigint NOT NULL,
	"pair_id" integer NOT NULL,
	"is_ask" boolean NOT NULL,
	"compound" boolean NOT NULL,
	"oneshot" boolean NOT NULL,
	"fee" integer NOT NULL,
	"status" integer DEFAULT 0 NOT NULL,
	"amount" varchar(78) NOT NULL,
	"rev_amount" varchar(78) NOT NULL,
	"initial_base_amount" varchar(78) NOT NULL,
	"initial_quote_amount" varchar(78) DEFAULT '0' NOT NULL,
	"price" varchar(78) NOT NULL,
	"rev_price" varchar(78) NOT NULL,
	"create_block" bigint DEFAULT 0 NOT NULL,
	"update_block" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pairs" (
	"id" serial PRIMARY KEY NOT NULL,
	"pair_id" integer NOT NULL,
	"chain_id" integer NOT NULL,
	"base_token" varchar(20) NOT NULL,
	"base_token_address" varchar(42) NOT NULL,
	"quote_token" varchar(20) NOT NULL,
	"quote_token_address" varchar(42) NOT NULL,
	"volume_24h" varchar(78) DEFAULT '0' NOT NULL,
	"trades_24h" integer DEFAULT 0 NOT NULL,
	"active_grids" integer DEFAULT 0 NOT NULL,
	"create_block" bigint DEFAULT 0 NOT NULL,
	"update_block" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "protocol_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"chain_id" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"total_volume" varchar(78) DEFAULT '0' NOT NULL,
	"total_tvl" varchar(78) DEFAULT '0' NOT NULL,
	"total_grids" integer DEFAULT 0 NOT NULL,
	"total_trades" integer DEFAULT 0 NOT NULL,
	"total_profit" varchar(78) DEFAULT '0' NOT NULL,
	"active_users" integer DEFAULT 0 NOT NULL,
	"create_block" bigint DEFAULT 0 NOT NULL,
	"update_block" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"chain_id" integer NOT NULL,
	"address" varchar(42) NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"name" varchar(128) NOT NULL,
	"decimals" integer NOT NULL,
	"logo" text NOT NULL,
	"total_supply" varchar(78),
	"priority" integer DEFAULT 0 NOT NULL,
	"is_quote" boolean DEFAULT false NOT NULL,
	"tags" text[],
	"create_block" bigint DEFAULT 0 NOT NULL,
	"update_block" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "grids_chain_id_grid_id_idx" ON "grids" USING btree ("chain_id","grid_id");--> statement-breakpoint
CREATE INDEX "grids_chain_id_pair_id_idx" ON "grids" USING btree ("chain_id","pair_id");--> statement-breakpoint
CREATE INDEX "grids_chain_id_owner_idx" ON "grids" USING btree ("chain_id","owner");--> statement-breakpoint
CREATE INDEX "grids_chain_id_status_idx" ON "grids" USING btree ("chain_id","status");--> statement-breakpoint
CREATE INDEX "leaderboard_chain_id_period_rank_idx" ON "leaderboard" USING btree ("chain_id","period","rank");--> statement-breakpoint
CREATE INDEX "leaderboard_chain_id_trader_idx" ON "leaderboard" USING btree ("chain_id","trader");--> statement-breakpoint
CREATE INDEX "leaderboard_chain_id_period_pair_idx" ON "leaderboard" USING btree ("chain_id","period","pair");--> statement-breakpoint
CREATE INDEX "order_fills_chain_id_order_id_idx" ON "order_fills" USING btree ("chain_id","order_id");--> statement-breakpoint
CREATE INDEX "order_fills_chain_id_tx_hash_idx" ON "order_fills" USING btree ("chain_id","tx_hash");--> statement-breakpoint
CREATE INDEX "order_fills_chain_id_taker_idx" ON "order_fills" USING btree ("chain_id","taker");--> statement-breakpoint
CREATE INDEX "orders_chain_id_order_id_idx" ON "orders" USING btree ("chain_id","order_id");--> statement-breakpoint
CREATE INDEX "orders_chain_id_grid_id_idx" ON "orders" USING btree ("chain_id","grid_id");--> statement-breakpoint
CREATE INDEX "orders_chain_id_pair_id_idx" ON "orders" USING btree ("chain_id","pair_id");--> statement-breakpoint
CREATE INDEX "orders_chain_id_status_idx" ON "orders" USING btree ("chain_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "pairs_chain_id_pair_id_uq" ON "pairs" USING btree ("chain_id","pair_id");--> statement-breakpoint
CREATE UNIQUE INDEX "protocol_stats_chain_id_date_uq" ON "protocol_stats" USING btree ("chain_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "tokens_chain_id_address_uq" ON "tokens" USING btree ("chain_id","address");