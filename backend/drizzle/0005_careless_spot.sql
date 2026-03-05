CREATE TABLE "grid_apr_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"chain_id" integer NOT NULL,
	"grid_id" bigint NOT NULL,
	"pair_id" integer NOT NULL,
	"init_base_amount" varchar(78) NOT NULL,
	"init_quote_amount" varchar(78) NOT NULL,
	"current_base_amount" varchar(78) NOT NULL,
	"current_quote_amount" varchar(78) NOT NULL,
	"init_base_price" varchar(78) NOT NULL,
	"init_quote_price" varchar(78) NOT NULL,
	"current_base_price" varchar(78) NOT NULL,
	"current_quote_price" varchar(78) NOT NULL,
	"profits" varchar(78) NOT NULL,
	"apr_real" varchar(78) NOT NULL,
	"apr_theoretical" varchar(78) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "grids" RENAME COLUMN "apr_exclude_il" TO "apr_theoretical";--> statement-breakpoint
CREATE INDEX "idx_grid_apr_history_grid" ON "grid_apr_history" USING btree ("chain_id","grid_id");--> statement-breakpoint
CREATE INDEX "idx_grid_apr_history_timestamp" ON "grid_apr_history" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_grid_apr_history_pair" ON "grid_apr_history" USING btree ("chain_id","pair_id");