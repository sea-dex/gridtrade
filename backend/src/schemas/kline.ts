import { z } from 'zod';
import { addressSchema } from './common.js';
import { getSupportedChainIds } from '../config/chains.js';

/** chain_id is required for kline endpoints – no default value */
const requiredChainIdSchema = z.coerce
  .number()
  .refine((val) => getSupportedChainIds().includes(val), {
    message: 'Invalid chain ID',
  });

// ---------------------------------------------------------------------------
// Interval enum – matches Binance naming convention
// ---------------------------------------------------------------------------

export const klineIntervalSchema = z.enum([
  '1m', '3m', '5m', '15m', '30m',
  '1h', '2h', '4h', '6h', '8h', '12h',
  '1d', '3d', '1w', '1M',
]).default('1h');

export type KlineInterval = z.infer<typeof klineIntervalSchema>;

// ---------------------------------------------------------------------------
// Query schema
// ---------------------------------------------------------------------------

/**
 * GET /kline?chain_id=56&base=0x…&quote=0x…&interval=1h&limit=100&start=1700000000
 */
export const getKlineQuerySchema = z.object({
  chain_id: requiredChainIdSchema,
  /** Base token contract address */
  base: addressSchema,
  /** Quote token contract address */
  quote: addressSchema,
  /** K-line interval */
  interval: klineIntervalSchema,
  /** Number of candles to return (max 1000) */
  limit: z.coerce.number().min(1).max(1000).default(100),
  /** Start time – unix timestamp in seconds. Optional. */
  start: z.coerce.number().optional(),
  /** End time – unix timestamp in seconds. Optional. */
  end: z.coerce.number().optional(),
});

export type GetKlineQuery = z.infer<typeof getKlineQuerySchema>;

// ---------------------------------------------------------------------------
// Candle (single bar)
// ---------------------------------------------------------------------------

export const candleSchema = z.object({
  /** Bucket open time – unix seconds */
  t: z.number(),
  /** Open price (string to preserve precision) */
  o: z.string(),
  /** High price */
  h: z.string(),
  /** Low price */
  l: z.string(),
  /** Close price */
  c: z.string(),
  /** Volume (base token amount as string) */
  v: z.string(),
});

export type Candle = z.infer<typeof candleSchema>;

// ---------------------------------------------------------------------------
// Response schema – uniform for all data sources
// ---------------------------------------------------------------------------

export const klineResponseSchema = z.object({
  /** Base token address */
  base: z.string(),
  /** Quote token address */
  quote: z.string(),
  /** Chain ID */
  chain_id: z.number(),
  /** Base token symbol */
  base_symbol: z.string(),
  /** Quote token symbol */
  quote_symbol: z.string(),
  /** Interval */
  interval: z.string(),
  /** Array of candles, oldest first */
  candles: z.array(candleSchema),
});

export type KlineResponse = z.infer<typeof klineResponseSchema>;

// ---------------------------------------------------------------------------
// Token info (for /kline/token endpoint)
// ---------------------------------------------------------------------------

export const getTokenInfoQuerySchema = z.object({
  chain_id: requiredChainIdSchema,
  address: addressSchema,
});

export type GetTokenInfoQuery = z.infer<typeof getTokenInfoQuerySchema>;

export const tokenInfoSchema = z.object({
  address: z.string(),
  chain_id: z.number(),
  symbol: z.string(),
  name: z.string(),
  decimals: z.number(),
  logo: z.string().optional(),
});

export type TokenInfo = z.infer<typeof tokenInfoSchema>;

export const tokenInfoResponseSchema = tokenInfoSchema;
