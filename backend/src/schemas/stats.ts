import { z } from 'zod';
import { chainIdSchema, periodSchema } from './common.js';

// Protocol stats schema
export const protocolStatsSchema = z.object({
  total_volume: z.string(),
  total_tvl: z.string(),
  total_grids: z.number(),
  total_trades: z.number(),
  total_profit: z.string(),
  active_users: z.number(),
});

// Volume data schema
export const volumeDataSchema = z.object({
  date: z.string(),
  volume: z.string(),
});

// TVL data schema
export const tvlDataSchema = z.object({
  date: z.string(),
  tvl: z.string(),
});

// Pair stats schema
export const pairStatsSchema = z.object({
  pair_id: z.number(),
  base_token: z.string(),
  quote_token: z.string(),
  volume_24h: z.string(),
  trades_24h: z.number(),
  active_grids: z.number(),
});

// Token breakdown schema
export const tokenBreakdownSchema = z.object({
  token: z.string(),
  amount: z.string(),
});

// Query schemas
export const getStatsQuerySchema = z.object({
  chain_id: chainIdSchema,
});

export const getVolumeQuerySchema = z.object({
  chain_id: chainIdSchema,
  period: periodSchema,
});

// Response schemas
export const statsResponseSchema = z.object({
  protocol: protocolStatsSchema,
  volume_history: z.array(volumeDataSchema),
  tvl_history: z.array(tvlDataSchema),
});

export const pairStatsResponseSchema = z.object({
  pairs: z.array(pairStatsSchema),
});

export const volumeStatsResponseSchema = z.object({
  period: z.string(),
  total_volume: z.string(),
  total_trades: z.number(),
  avg_trade_size: z.string(),
});

export const tvlStatsResponseSchema = z.object({
  total_tvl: z.string(),
  breakdown: z.array(tokenBreakdownSchema),
});

// Type exports
export type ProtocolStats = z.infer<typeof protocolStatsSchema>;
export type VolumeData = z.infer<typeof volumeDataSchema>;
export type TVLData = z.infer<typeof tvlDataSchema>;
export type PairStats = z.infer<typeof pairStatsSchema>;
export type TokenBreakdown = z.infer<typeof tokenBreakdownSchema>;
export type GetStatsQuery = z.infer<typeof getStatsQuerySchema>;
export type GetVolumeQuery = z.infer<typeof getVolumeQuerySchema>;
export type StatsResponse = z.infer<typeof statsResponseSchema>;
export type PairStatsResponse = z.infer<typeof pairStatsResponseSchema>;
export type VolumeStatsResponse = z.infer<typeof volumeStatsResponseSchema>;
export type TVLStatsResponse = z.infer<typeof tvlStatsResponseSchema>;
