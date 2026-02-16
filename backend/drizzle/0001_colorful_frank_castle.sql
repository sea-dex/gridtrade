CREATE TABLE "indexer_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"chain_id" integer NOT NULL,
	"last_block" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pair_daily_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"chain_id" integer NOT NULL,
	"pair_id" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"volume" varchar(78) DEFAULT '0' NOT NULL,
	"trades" integer DEFAULT 0 NOT NULL,
	"create_block" bigint DEFAULT 0 NOT NULL,
	"update_block" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_fills" ADD COLUMN "pair_id" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "indexer_state_chain_id_uq" ON "indexer_state" USING btree ("chain_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pair_daily_stats_chain_pair_date_uq" ON "pair_daily_stats" USING btree ("chain_id","pair_id","date");--> statement-breakpoint
CREATE INDEX "pair_daily_stats_chain_id_date_idx" ON "pair_daily_stats" USING btree ("chain_id","date");--> statement-breakpoint
CREATE INDEX "order_fills_chain_id_pair_id_idx" ON "order_fills" USING btree ("chain_id","pair_id");