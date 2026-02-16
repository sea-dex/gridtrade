import { z } from 'zod';
import { chainIdSchema, periodSchema, addressSchema } from './common.js';

// Leaderboard entry schema
export const leaderboardEntrySchema = z.object({
  rank: z.number(),
  trader: z.string(),
  pair: z.string(),
  grid_id: z.number(),
  profit: z.string(),
  profit_rate: z.number(),
  volume: z.string(),
  trades: z.number(),
  tvl: z.string(),
  apr: z.number(),
});

// Trader stats schema
export const traderStatsSchema = z.object({
  address: z.string(),
  rank: z.number().nullable(),
  total_profit: z.string(),
  total_volume: z.string(),
  total_trades: z.number(),
  active_grids: z.number(),
  best_pair: z.string().nullable(),
});

// Top pair schema
export const topPairSchema = z.object({
  pair: z.string(),
  total_profit: z.string(),
  total_volume: z.string(),
  total_trades: z.number(),
  active_grids: z.number(),
});

// Query schemas
export const getLeaderboardQuerySchema = z.object({
  chain_id: chainIdSchema,
  period: periodSchema,
  pair: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(10),
  sort_by: z.enum(['profit', 'volume', 'apr', 'tvl', 'profit_rate', 'trades']).default('profit'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const getTraderStatsQuerySchema = z.object({
  chain_id: chainIdSchema,
});

export const getTraderStatsParamsSchema = z.object({
  address: addressSchema,
});

export const getTopPairsQuerySchema = z.object({
  chain_id: chainIdSchema,
  period: periodSchema,
  limit: z.coerce.number().min(1).max(20).default(5),
});

// Response schemas
export const leaderboardResponseSchema = z.object({
  entries: z.array(leaderboardEntrySchema),
  total: z.number(),
  period: z.string(),
});

// Type exports
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
export type TraderStats = z.infer<typeof traderStatsSchema>;
export type TopPair = z.infer<typeof topPairSchema>;
export type GetLeaderboardQuery = z.infer<typeof getLeaderboardQuerySchema>;
export type GetTraderStatsQuery = z.infer<typeof getTraderStatsQuerySchema>;
export type GetTraderStatsParams = z.infer<typeof getTraderStatsParamsSchema>;
export type GetTopPairsQuery = z.infer<typeof getTopPairsQuerySchema>;
export type LeaderboardResponse = z.infer<typeof leaderboardResponseSchema>;
