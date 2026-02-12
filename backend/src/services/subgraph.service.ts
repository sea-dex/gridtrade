/**
 * The Graph subgraph client – fetches on-chain DEX data (pool discovery,
 * hourly/daily candle snapshots, and raw swaps) for long-tail tokens.
 *
 * Supports Uniswap V3 and PancakeSwap V3 subgraph schemas.
 *
 * The service provides two resolution tiers:
 *   1. **Hour / Day snapshots** – uses `poolHourDatas` / `poolDayDatas`
 *      entities that most V3 subgraphs already index.
 *   2. **Swap-level aggregation** – pulls individual `swaps` and buckets
 *      them into arbitrary intervals (1m, 5m, etc.).  This is heavier and
 *      should only be used when finer granularity is required.
 */

import { subgraphEndpoints, type SubgraphConfig } from '../config/price-feeds.js';
import type { Candle, KlineInterval } from '../schemas/kline.js';
import { http } from '../utils/http.js';
import { subgraphLogger as log } from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PoolInfo {
  id: string; // pool address
  token0: { id: string; symbol: string; decimals: string };
  token1: { id: string; symbol: string; decimals: string };
  totalValueLockedUSD: string;
}

interface PoolHourData {
  periodStartUnix: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volumeUSD: string;
}

interface PoolDayData {
  date: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volumeUSD: string;
}

interface SwapData {
  timestamp: string;
  amount0: string;
  amount1: string;
  sqrtPriceX96: string;
}

// ---------------------------------------------------------------------------
// GraphQL helper
// ---------------------------------------------------------------------------

async function gql<T>(endpoint: string, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const { data: json } = await http.post<{ data?: T; errors?: Array<{ message: string }> }>(
    endpoint,
    { query, variables },
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15_000,
    },
  );

  if (json.errors?.length) {
    throw new Error(`Subgraph query error: ${json.errors[0].message}`);
  }
  if (!json.data) {
    throw new Error('Subgraph returned no data');
  }
  return json.data;
}

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const poolCache = new Map<string, CacheEntry<PoolInfo | null>>();
const candleCache = new Map<string, CacheEntry<Candle[]>>();

const POOL_CACHE_TTL = 30 * 60_000; // 30 min
const CANDLE_CACHE_TTL_MAP: Record<string, number> = {
  '1h': 5 * 60_000,
  '4h': 10 * 60_000,
  '1d': 30 * 60_000,
};

// ---------------------------------------------------------------------------
// Pool discovery
// ---------------------------------------------------------------------------

/**
 * Find the most liquid pool for a given token (against common quote tokens)
 * on the specified chain.
 */
export async function findBestPool(
  chainId: number,
  tokenAddress: string,
  quoteAddress?: string,
): Promise<{ pool: PoolInfo; config: SubgraphConfig; isToken0: boolean } | undefined> {
  const endpoints = subgraphEndpoints[chainId];
  if (!endpoints?.length) return undefined;

  const normToken = tokenAddress.toLowerCase();
  const cacheKey = `pool:${chainId}:${normToken}:${quoteAddress ?? 'any'}`;
  const cached = poolCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    if (!cached.data) return undefined;
    // Find the config that was used (first one)
    return { pool: cached.data, config: endpoints[0], isToken0: cached.data.token0.id.toLowerCase() === normToken };
  }

  // Common quote tokens per chain (USDT, USDC, WETH, WBNB)
  const defaultQuotes: Record<number, string[]> = {
    1: [
      '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
    ],
    56: [
      '0x55d398326f99059ff775485246999027b3197955', // USDT
      '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // USDC
      '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', // WBNB
    ],
    8453: [
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', // USDC
      '0x4200000000000000000000000000000000000006', // WETH
    ],
  };

  const quotes = quoteAddress
    ? [quoteAddress.toLowerCase()]
    : (defaultQuotes[chainId] ?? []);

  for (const cfg of endpoints) {
    try {
      // Build OR conditions for token0/token1 combinations
      const whereConditions = quotes.map((q) =>
        `{ token0: "${normToken}", token1: "${q}" }, { token0: "${q}", token1: "${normToken}" }`
      ).join(', ');

      const query = `{
        pools(
          first: 5,
          orderBy: totalValueLockedUSD,
          orderDirection: desc,
          where: { or: [${whereConditions}] }
        ) {
          id
          token0 { id symbol decimals }
          token1 { id symbol decimals }
          totalValueLockedUSD
        }
      }`;

      const data = await gql<{ pools: PoolInfo[] }>(cfg.url, query);

      if (data.pools.length > 0) {
        const best = data.pools[0];
        poolCache.set(cacheKey, { data: best, expiresAt: Date.now() + POOL_CACHE_TTL });
        return {
          pool: best,
          config: cfg,
          isToken0: best.token0.id.toLowerCase() === normToken,
        };
      }
    } catch (err) {
      log.warn({ dex: cfg.dex, err }, 'Pool discovery failed – trying next endpoint');
    }
  }

  poolCache.set(cacheKey, { data: null, expiresAt: Date.now() + 5 * 60_000 }); // negative cache 5 min
  return undefined;
}

// ---------------------------------------------------------------------------
// Hourly / Daily candle data (pre-aggregated by subgraph)
// ---------------------------------------------------------------------------

/**
 * Fetch hourly candle data from the subgraph's `poolHourDatas` entity.
 */
export async function fetchPoolHourCandles(
  config: SubgraphConfig,
  poolId: string,
  isToken0: boolean,
  limit: number = 100,
  startTime?: number,
  endTime?: number,
): Promise<Candle[]> {
  const cacheKey = `hour:${poolId}:${isToken0}:${limit}:${startTime ?? ''}:${endTime ?? ''}`;
  const cached = candleCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  let whereClause = `pool: "${poolId.toLowerCase()}"`;
  if (startTime) whereClause += `, periodStartUnix_gte: ${startTime}`;
  if (endTime) whereClause += `, periodStartUnix_lte: ${endTime}`;

  const query = `{
    poolHourDatas(
      first: ${Math.min(limit, 1000)},
      orderBy: periodStartUnix,
      orderDirection: asc,
      where: { ${whereClause} }
    ) {
      periodStartUnix
      open
      high
      low
      close
      volumeUSD
    }
  }`;

  try {
    const data = await gql<{ poolHourDatas: PoolHourData[] }>(config.url, query);
    const candles = data.poolHourDatas.map((d) => normaliseSubgraphCandle(d.periodStartUnix, d, isToken0));
    candleCache.set(cacheKey, { data: candles, expiresAt: Date.now() + (CANDLE_CACHE_TTL_MAP['1h'] ?? 300_000) });
    return candles;
  } catch (err) {
    log.warn({ poolId, err }, 'Failed to fetch poolHourDatas');
    return [];
  }
}

/**
 * Fetch daily candle data from the subgraph's `poolDayDatas` entity.
 */
export async function fetchPoolDayCandles(
  config: SubgraphConfig,
  poolId: string,
  isToken0: boolean,
  limit: number = 100,
  startTime?: number,
  endTime?: number,
): Promise<Candle[]> {
  const cacheKey = `day:${poolId}:${isToken0}:${limit}:${startTime ?? ''}:${endTime ?? ''}`;
  const cached = candleCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  let whereClause = `pool: "${poolId.toLowerCase()}"`;
  if (startTime) whereClause += `, date_gte: ${startTime}`;
  if (endTime) whereClause += `, date_lte: ${endTime}`;

  const query = `{
    poolDayDatas(
      first: ${Math.min(limit, 1000)},
      orderBy: date,
      orderDirection: asc,
      where: { ${whereClause} }
    ) {
      date
      open
      high
      low
      close
      volumeUSD
    }
  }`;

  try {
    const data = await gql<{ poolDayDatas: PoolDayData[] }>(config.url, query);
    const candles = data.poolDayDatas.map((d) => normaliseSubgraphCandle(d.date, d, isToken0));
    candleCache.set(cacheKey, { data: candles, expiresAt: Date.now() + (CANDLE_CACHE_TTL_MAP['1d'] ?? 1_800_000) });
    return candles;
  } catch (err) {
    log.warn({ poolId, err }, 'Failed to fetch poolDayDatas');
    return [];
  }
}

// ---------------------------------------------------------------------------
// Swap-level aggregation (for minute-level candles)
// ---------------------------------------------------------------------------

/**
 * Fetch raw swaps and aggregate into candles of the requested interval.
 *
 * This is the "heavy" path – only use when hour/day entities are insufficient.
 */
export async function fetchSwapAggregatedCandles(
  config: SubgraphConfig,
  poolId: string,
  isToken0: boolean,
  interval: KlineInterval,
  limit: number = 100,
  startTime?: number,
  endTime?: number,
): Promise<Candle[]> {
  const intervalSeconds = intervalToSeconds(interval);
  const now = Math.floor(Date.now() / 1000);
  const effectiveEnd = endTime ?? now;
  const effectiveStart = startTime ?? (effectiveEnd - intervalSeconds * limit);

  const whereClause = `pool: "${poolId.toLowerCase()}", timestamp_gte: "${effectiveStart}", timestamp_lte: "${effectiveEnd}"`;

  // Fetch up to 1000 swaps (subgraph limit per query)
  const query = `{
    swaps(
      first: 1000,
      orderBy: timestamp,
      orderDirection: asc,
      where: { ${whereClause} }
    ) {
      timestamp
      amount0
      amount1
      sqrtPriceX96
    }
  }`;

  try {
    const data = await gql<{ swaps: SwapData[] }>(config.url, query);

    if (!data.swaps.length) return [];

    return aggregateSwapsToCandles(data.swaps, isToken0, intervalSeconds, limit);
  } catch (err) {
    log.warn({ poolId, err }, 'Failed to fetch swaps');
    return [];
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normaliseSubgraphCandle(
  timestamp: number,
  raw: { open: string; high: string; low: string; close: string; volumeUSD: string },
  isToken0: boolean,
): Candle {
  // Subgraph stores price as token0Price (price of token0 in terms of token1).
  // If our target token IS token0, the price is already correct.
  // If our target token IS token1, we need to invert.
  // However, the poolHourDatas/poolDayDatas `open/high/low/close` fields
  // represent token0Price. For simplicity and because we're providing
  // "reference price", we use them directly and note the direction.
  //
  // For token1-based tokens, we invert the prices.
  if (isToken0) {
    return {
      t: timestamp,
      o: raw.open,
      h: raw.high,
      l: raw.low,
      c: raw.close,
      v: raw.volumeUSD,
    };
  }

  // Invert: price of token1 = 1 / price of token0
  return {
    t: timestamp,
    o: safeInvert(raw.open),
    h: safeInvert(raw.low),  // inverted high ↔ low
    l: safeInvert(raw.high),
    c: safeInvert(raw.close),
    v: raw.volumeUSD,
  };
}

function safeInvert(priceStr: string): string {
  const p = parseFloat(priceStr);
  if (!p || !isFinite(p)) return '0';
  return (1 / p).toPrecision(12);
}

function aggregateSwapsToCandles(
  swaps: SwapData[],
  isToken0: boolean,
  intervalSeconds: number,
  maxCandles: number,
): Candle[] {
  const buckets = new Map<number, { o: number; h: number; l: number; c: number; v: number }>();

  for (const swap of swaps) {
    const ts = Number(swap.timestamp);
    const bucketStart = Math.floor(ts / intervalSeconds) * intervalSeconds;

    // Derive price from sqrtPriceX96
    let price = sqrtPriceX96ToPrice(swap.sqrtPriceX96);
    if (!isToken0 && price > 0) {
      price = 1 / price;
    }

    // Volume approximation: |amount0| or |amount1| depending on direction
    const vol = Math.abs(parseFloat(isToken0 ? swap.amount0 : swap.amount1));

    const existing = buckets.get(bucketStart);
    if (existing) {
      existing.h = Math.max(existing.h, price);
      existing.l = Math.min(existing.l, price);
      existing.c = price;
      existing.v += vol;
    } else {
      buckets.set(bucketStart, { o: price, h: price, l: price, c: price, v: vol });
    }
  }

  // Sort by time, take last N
  const sorted = Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .slice(-maxCandles);

  return sorted.map(([t, bar]) => ({
    t,
    o: bar.o.toPrecision(12),
    h: bar.h.toPrecision(12),
    l: bar.l.toPrecision(12),
    c: bar.c.toPrecision(12),
    v: bar.v.toPrecision(12),
  }));
}

/**
 * Convert sqrtPriceX96 to a human-readable price (token0 per token1).
 * price = (sqrtPriceX96 / 2^96)^2
 */
function sqrtPriceX96ToPrice(sqrtPriceX96Str: string): number {
  const sqrtPrice = Number(sqrtPriceX96Str);
  if (!sqrtPrice) return 0;
  const price = (sqrtPrice / 2 ** 96) ** 2;
  return price;
}

/**
 * Convert a K-line interval string to seconds.
 */
export function intervalToSeconds(interval: KlineInterval): number {
  const map: Record<string, number> = {
    '1m': 60,
    '3m': 180,
    '5m': 300,
    '15m': 900,
    '30m': 1800,
    '1h': 3600,
    '2h': 7200,
    '4h': 14400,
    '6h': 21600,
    '8h': 28800,
    '12h': 43200,
    '1d': 86400,
    '3d': 259200,
    '1w': 604800,
    '1M': 2592000, // ~30 days
  };
  return map[interval] ?? 3600;
}
