import { pgTable, serial, integer, boolean, real, timestamp, varchar, bigint, text, uniqueIndex, index } from 'drizzle-orm/pg-core';

// Grids table
export const grids = pgTable('grids', {
  id: serial('id').primaryKey(),
  gridId: bigint('grid_id', { mode: 'number' }).notNull(),
  chainId: integer('chain_id').notNull(),
  owner: varchar('owner', { length: 42 }).notNull(),
  pairId: integer('pair_id').notNull(),
  baseToken: varchar('base_token', { length: 20 }).notNull(),
  quoteToken: varchar('quote_token', { length: 20 }).notNull(),
  askOrderCount: integer('ask_order_count').notNull(),
  bidOrderCount: integer('bid_order_count').notNull(),
  initialBaseAmount: varchar('initial_base_amount', { length: 78 }).notNull(),
  initialQuoteAmount: varchar('initial_quote_amount', { length: 78 }).notNull().default('0'),
  profits: varchar('profits', { length: 78 }).notNull().default('0'),
  fee: integer('fee').notNull(),
  compound: boolean('compound').notNull(),
  oneshot: boolean('oneshot').notNull(),
  askPrice0: varchar('ask_price0', { length: 78 }).notNull().default(''),
  askGap: varchar('ask_gap', { length: 78 }).notNull().default(''),
  bidPrice0: varchar('bid_price0', { length: 78 }).notNull().default(''),
  bidGap: varchar('bid_gap', { length: 78 }).notNull().default(''),
  status: integer('status').notNull().default(1),
  createBlock: bigint('create_block', { mode: 'number' }).notNull().default(0),
  updateBlock: bigint('update_block', { mode: 'number' }).notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('grids_chain_id_grid_id_idx').on(t.chainId, t.gridId),
  index('grids_chain_id_pair_id_idx').on(t.chainId, t.pairId),
  index('grids_chain_id_owner_idx').on(t.chainId, t.owner),
  index('grids_chain_id_status_idx').on(t.chainId, t.status),
]);

// Orders table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  // orderId can exceed JS safe integer range, store as string
  orderId: varchar('order_id', { length: 78 }).notNull(),
  chainId: integer('chain_id').notNull(),
  gridId: bigint('grid_id', { mode: 'number' }).notNull(),
  pairId: integer('pair_id').notNull(),
  isAsk: boolean('is_ask').notNull(),
  compound: boolean('compound').notNull(),
  oneshot: boolean('oneshot').notNull(),
  fee: integer('fee').notNull(),
  status: integer('status').notNull().default(0),
  amount: varchar('amount', { length: 78 }).notNull(),
  revAmount: varchar('rev_amount', { length: 78 }).notNull(),
  initialBaseAmount: varchar('initial_base_amount', { length: 78 }).notNull(),
  initialQuoteAmount: varchar('initial_quote_amount', { length: 78 }).notNull().default('0'),
  price: varchar('price', { length: 78 }).notNull(),
  revPrice: varchar('rev_price', { length: 78 }).notNull(),
  createBlock: bigint('create_block', { mode: 'number' }).notNull().default(0),
  updateBlock: bigint('update_block', { mode: 'number' }).notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('orders_chain_id_order_id_idx').on(t.chainId, t.orderId),
  index('orders_chain_id_grid_id_idx').on(t.chainId, t.gridId),
  index('orders_chain_id_pair_id_idx').on(t.chainId, t.pairId),
  index('orders_chain_id_status_idx').on(t.chainId, t.status),
]);

// Order fills table
export const orderFills = pgTable('order_fills', {
  id: serial('id').primaryKey(),
  chainId: integer('chain_id').notNull(),
  txHash: varchar('tx_hash', { length: 66 }).notNull(),
  taker: varchar('taker', { length: 42 }).notNull(),
  // orderId can exceed JS safe integer range, store as string
  orderId: varchar('order_id', { length: 78 }).notNull(),
  filledAmount: varchar('filled_amount', { length: 78 }).notNull(),
  filledVolume: varchar('filled_volume', { length: 78 }).notNull(),
  isAsk: boolean('is_ask').notNull(),
  pairId: integer('pair_id').notNull().default(0),
  timestamp: timestamp('timestamp').notNull(),
  createBlock: bigint('create_block', { mode: 'number' }).notNull().default(0),
  updateBlock: bigint('update_block', { mode: 'number' }).notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('order_fills_chain_id_order_id_idx').on(t.chainId, t.orderId),
  index('order_fills_chain_id_tx_hash_idx').on(t.chainId, t.txHash),
  index('order_fills_chain_id_taker_idx').on(t.chainId, t.taker),
  index('order_fills_chain_id_pair_id_idx').on(t.chainId, t.pairId),
]);

// Tokens table
export const tokens = pgTable(
  'tokens',
  {
    id: serial('id').primaryKey(),
    chainId: integer('chain_id').notNull(),
    address: varchar('address', { length: 42 }).notNull(),
    symbol: varchar('symbol', { length: 20 }).notNull(),
    name: varchar('name', { length: 128 }).notNull(),
    decimals: integer('decimals').notNull(),
    logo: text('logo').notNull(),
    totalSupply: varchar('total_supply', { length: 78 }),
    priority: integer('priority').notNull().default(0),
    isQuote: boolean('is_quote').notNull().default(false),
    tags: text('tags').array(),
    createBlock: bigint('create_block', { mode: 'number' }).notNull().default(0),
    updateBlock: bigint('update_block', { mode: 'number' }).notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('tokens_chain_id_address_uq').on(t.chainId, t.address),
  ]
);

// Pairs table
export const pairs = pgTable('pairs', {
  id: serial('id').primaryKey(),
  pairId: integer('pair_id').notNull(),
  chainId: integer('chain_id').notNull(),
  baseToken: varchar('base_token', { length: 20 }).notNull(),
  baseTokenAddress: varchar('base_token_address', { length: 42 }).notNull(),
  quoteToken: varchar('quote_token', { length: 20 }).notNull(),
  quoteTokenAddress: varchar('quote_token_address', { length: 42 }).notNull(),
  volume24h: varchar('volume_24h', { length: 78 }).notNull().default('0'),
  trades24h: integer('trades_24h').notNull().default(0),
  activeGrids: integer('active_grids').notNull().default(0),
  createBlock: bigint('create_block', { mode: 'number' }).notNull().default(0),
  updateBlock: bigint('update_block', { mode: 'number' }).notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('pairs_chain_id_pair_id_uq').on(t.chainId, t.pairId),
]);

// Protocol stats table
export const protocolStats = pgTable('protocol_stats', {
  id: serial('id').primaryKey(),
  chainId: integer('chain_id').notNull(),
  date: varchar('date', { length: 10 }).notNull(),
  totalVolume: varchar('total_volume', { length: 78 }).notNull().default('0'),
  totalTvl: varchar('total_tvl', { length: 78 }).notNull().default('0'),
  totalGrids: integer('total_grids').notNull().default(0),
  totalTrades: integer('total_trades').notNull().default(0),
  totalProfit: varchar('total_profit', { length: 78 }).notNull().default('0'),
  activeUsers: integer('active_users').notNull().default(0),
  createBlock: bigint('create_block', { mode: 'number' }).notNull().default(0),
  updateBlock: bigint('update_block', { mode: 'number' }).notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('protocol_stats_chain_id_date_uq').on(t.chainId, t.date),
]);

// Leaderboard table
export const leaderboard = pgTable('leaderboard', {
  id: serial('id').primaryKey(),
  chainId: integer('chain_id').notNull(),
  trader: varchar('trader', { length: 42 }).notNull(),
  pair: varchar('pair', { length: 20 }).notNull(),
  gridId: bigint('grid_id', { mode: 'number' }).notNull(),
  profit: varchar('profit', { length: 78 }).notNull().default('0'),
  profitRate: real('profit_rate').notNull().default(0),
  volume: varchar('volume', { length: 78 }).notNull().default('0'),
  trades: integer('trades').notNull().default(0),
  period: varchar('period', { length: 10 }).notNull(), // '24h', '7d', '30d', 'all'
  rank: integer('rank').notNull(),
  createBlock: bigint('create_block', { mode: 'number' }).notNull().default(0),
  updateBlock: bigint('update_block', { mode: 'number' }).notNull().default(0),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  index('leaderboard_chain_id_period_rank_idx').on(t.chainId, t.period, t.rank),
  index('leaderboard_chain_id_trader_idx').on(t.chainId, t.trader),
  index('leaderboard_chain_id_period_pair_idx').on(t.chainId, t.period, t.pair),
]);

// Indexer state table — tracks the last scanned block per chain.
// Managed by the Go indexer; included here so that db:push does NOT drop it.
export const indexerState = pgTable('indexer_state', {
  id: serial('id').primaryKey(),
  chainId: integer('chain_id').notNull(),
  lastBlock: bigint('last_block', { mode: 'number' }).notNull().default(0),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('indexer_state_chain_id_uq').on(t.chainId),
]);

// Pair daily stats table
export const pairDailyStats = pgTable('pair_daily_stats', {
  id: serial('id').primaryKey(),
  chainId: integer('chain_id').notNull(),
  pairId: integer('pair_id').notNull(),
  date: varchar('date', { length: 10 }).notNull(),
  volume: varchar('volume', { length: 78 }).notNull().default('0'),
  trades: integer('trades').notNull().default(0),
  createBlock: bigint('create_block', { mode: 'number' }).notNull().default(0),
  updateBlock: bigint('update_block', { mode: 'number' }).notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('pair_daily_stats_chain_pair_date_uq').on(t.chainId, t.pairId, t.date),
  index('pair_daily_stats_chain_id_date_idx').on(t.chainId, t.date),
]);

// Type exports
export type Grid = typeof grids.$inferSelect;
export type NewGrid = typeof grids.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderFill = typeof orderFills.$inferSelect;
export type NewOrderFill = typeof orderFills.$inferInsert;
export type Token = typeof tokens.$inferSelect;
export type NewToken = typeof tokens.$inferInsert;
export type Pair = typeof pairs.$inferSelect;
export type NewPair = typeof pairs.$inferInsert;
export type ProtocolStat = typeof protocolStats.$inferSelect;
export type NewProtocolStat = typeof protocolStats.$inferInsert;
export type LeaderboardEntry = typeof leaderboard.$inferSelect;
export type NewLeaderboardEntry = typeof leaderboard.$inferInsert;
export type IndexerState = typeof indexerState.$inferSelect;
export type NewIndexerState = typeof indexerState.$inferInsert;
export type PairDailyStat = typeof pairDailyStats.$inferSelect;
export type NewPairDailyStat = typeof pairDailyStats.$inferInsert;
