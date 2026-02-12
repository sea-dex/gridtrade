/**
 * Moralis API client – provides:
 *   1. Token metadata (name, symbol, decimals, logo)
 *   2. Token price + DEX pair discovery
 *   3. OHLCV candle data for DEX pairs
 *
 * Docs:
 *   - Metadata: https://docs.moralis.io/web3-data-api/evm/reference/get-token-metadata
 *   - Price:    https://docs.moralis.io/web3-data-api/evm/reference/get-token-price
 *   - OHLCV:   https://docs.moralis.io/web3-data-api/evm/reference/get-ohlcv-by-pair-address
 *
 * Requires a MORALIS_API_KEY environment variable.  If the key is not set the
 * service degrades gracefully and returns `undefined`.
 */

import { env } from '../config/env.js';
import type { Candle, KlineInterval, TokenInfo } from '../schemas/kline.js';
import { getPriceFeed } from '../config/price-feeds.js';
import { http } from '../utils/http.js';
import { moralisLogger as log } from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MORALIS_BASE = 'https://deep-index.moralis.io/api/v2.2';

/** Map our chainId → Moralis chain parameter */
const MORALIS_CHAIN: Record<number, string> = {
  1: '0x1',
  56: '0x38',
  8453: '0x2105',
  97: '0x61',
};

/**
 * Map our KlineInterval → Moralis OHLCV timeframe.
 * Moralis supports: 1min, 5min, 30min, 1h, 4h, 1d, 1w, 1M
 * For unsupported intervals we map to the nearest supported one.
 */
const INTERVAL_TO_MORALIS_TIMEFRAME: Record<string, string> = {
  '1m': '1min',
  '3m': '5min',   // nearest: 5min
  '5m': '5min',
  '15m': '30min',  // nearest: 30min (15min not supported)
  '30m': '30min',
  '1h': '1h',
  '2h': '4h',     // nearest: 4h
  '4h': '4h',
  '6h': '4h',     // nearest: 4h
  '8h': '1d',     // nearest: 1d
  '12h': '1d',    // nearest: 1d
  '1d': '1d',
  '3d': '1d',     // use 1d, aggregate client-side if needed
  '1w': '1w',
  '1M': '1M',
};

// ---------------------------------------------------------------------------
// In-memory caches
// ---------------------------------------------------------------------------

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const tokenInfoCache = new Map<string, CacheEntry<TokenInfo>>();
const pairCache = new Map<string, CacheEntry<PairInfo | null>>();

const TOKEN_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const PAIR_CACHE_TTL = 30 * 60 * 1000;        // 30 minutes
const PAIR_NEG_CACHE_TTL = 5 * 60 * 1000;     // 5 minutes for negative results

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PairInfo {
  /** DEX pair/pool contract address */
  pairAddress: string;
  /** DEX name (e.g. "PancakeSwap v2") */
  exchangeName: string;
  /** DEX factory address */
  exchangeAddress: string;
  /** Current USD price */
  usdPrice: number;
  /** Total liquidity in USD */
  liquidityUsd: number;
}

interface MoralisPriceResponse {
  tokenName: string;
  tokenSymbol: string;
  tokenLogo?: string;
  tokenDecimals: string;
  usdPrice: number;
  usdPriceFormatted: string;
  exchangeName: string;
  exchangeAddress: string;
  tokenAddress: string;
  pairAddress: string;
  pairTotalLiquidityUsd: string;
  nativePrice: {
    value: string;
    decimals: number;
    name: string;
    symbol: string;
    address: string;
  };
}

interface MoralisOHLCVResponse {
  pairAddress: string;
  tokenAddress: string;
  timeframe: string;
  currency: string;
  page: number;
  cursor: string | null;
  result: MoralisOHLCVCandle[];
}

interface MoralisOHLCVCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  trades: number;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function getApiKey(): string | undefined {
  return (env as Record<string, unknown>).MORALIS_API_KEY as string | undefined;
}

function getChainHex(chainId: number): string | undefined {
  return MORALIS_CHAIN[chainId];
}

async function moralisFetch<T>(url: string, apiKey: string): Promise<T | undefined> {
  try {
    const { data } = await http.get<T>(url, {
      headers: {
        'X-API-Key': apiKey,
      },
      timeout: 10_000,
    });

    return data;
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status) {
      log.warn({ status, url }, 'API error');
    } else {
      log.warn({ url, err }, 'Fetch failed');
    }
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// 1. Token Metadata
// ---------------------------------------------------------------------------

/**
 * Fetch token metadata via Moralis.
 *
 * Falls back to our static price-feed config if Moralis is unavailable or
 * the API key is not configured.
 */
export async function fetchTokenInfo(
  chainId: number,
  address: string,
): Promise<TokenInfo | undefined> {
  const normAddr = address.toLowerCase();
  const cacheKey = `${chainId}:${normAddr}`;

  // 1. Check cache
  const cached = tokenInfoCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  // 2. Check static config first (no API call needed)
  const staticFeed = getPriceFeed(chainId, address);
  if (staticFeed) {
    const info: TokenInfo = {
      address: staticFeed.address,
      chain_id: chainId,
      symbol: staticFeed.symbol,
      name: staticFeed.symbol, // static config doesn't have full name
      decimals: staticFeed.decimals,
    };
    tokenInfoCache.set(cacheKey, { data: info, expiresAt: Date.now() + TOKEN_CACHE_TTL });
    return info;
  }

  // 3. Try Moralis API
  const apiKey = getApiKey();
  if (!apiKey) return undefined;

  const chain = getChainHex(chainId);
  if (!chain) return undefined;

  const url = `${MORALIS_BASE}/erc20/metadata?chain=${chain}&addresses=${encodeURIComponent(address)}`;
  const data = await moralisFetch<Array<{
    address: string;
    name: string;
    symbol: string;
    decimals: string;
    logo?: string;
    thumbnail?: string;
  }>>(url, apiKey);

  if (!data?.length) return undefined;

  const token = data[0];
  const info: TokenInfo = {
    address: token.address,
    chain_id: chainId,
    symbol: token.symbol,
    name: token.name,
    decimals: Number(token.decimals),
    logo: token.logo || token.thumbnail || undefined,
  };

  tokenInfoCache.set(cacheKey, { data: info, expiresAt: Date.now() + TOKEN_CACHE_TTL });
  return info;
}

// ---------------------------------------------------------------------------
// 2. Token Price + Pair Discovery
// ---------------------------------------------------------------------------

/**
 * Fetch the current price of a token and discover its best DEX pair.
 *
 * Returns the pair address, exchange info, price, and liquidity.
 * This is used to find the pool for OHLCV queries.
 */
export async function fetchTokenPair(
  chainId: number,
  tokenAddress: string,
): Promise<PairInfo | undefined> {
  const normAddr = tokenAddress.toLowerCase();
  const cacheKey = `pair:${chainId}:${normAddr}`;

  // Check cache
  const cached = pairCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data ?? undefined;
  }

  const apiKey = getApiKey();
  if (!apiKey) return undefined;

  const chain = getChainHex(chainId);
  if (!chain) return undefined;

  const url = `${MORALIS_BASE}/erc20/${encodeURIComponent(tokenAddress)}/price?chain=${chain}`;
  const data = await moralisFetch<MoralisPriceResponse>(url, apiKey);

  if (!data?.pairAddress) {
    pairCache.set(cacheKey, { data: null, expiresAt: Date.now() + PAIR_NEG_CACHE_TTL });
    return undefined;
  }

  const pair: PairInfo = {
    pairAddress: data.pairAddress,
    exchangeName: data.exchangeName,
    exchangeAddress: data.exchangeAddress,
    usdPrice: data.usdPrice,
    liquidityUsd: parseFloat(data.pairTotalLiquidityUsd) || 0,
  };

  pairCache.set(cacheKey, { data: pair, expiresAt: Date.now() + PAIR_CACHE_TTL });
  return pair;
}

// ---------------------------------------------------------------------------
// 3. OHLCV Candle Data
// ---------------------------------------------------------------------------

/**
 * Fetch OHLCV candle data for a DEX pair from Moralis.
 *
 * @param chainId   - Chain ID (56 for BSC, etc.)
 * @param pairAddress - DEX pair contract address
 * @param interval  - K-line interval (mapped to Moralis timeframe)
 * @param limit     - Max number of candles
 * @param startTime - Start time (unix seconds, optional)
 * @param endTime   - End time (unix seconds, optional)
 */
export async function fetchPairOHLCV(
  chainId: number,
  pairAddress: string,
  interval: KlineInterval,
  limit: number = 100,
  startTime?: number,
  endTime?: number,
): Promise<Candle[]> {
  const apiKey = getApiKey();
  if (!apiKey) return [];

  const chain = getChainHex(chainId);
  if (!chain) return [];

  const timeframe = INTERVAL_TO_MORALIS_TIMEFRAME[interval] ?? '1h';

  // Build date range
  const now = Math.floor(Date.now() / 1000);
  const effectiveEnd = endTime ?? now;
  // Default: go back enough time to fill `limit` candles
  const intervalSeconds = getIntervalSeconds(interval);
  const effectiveStart = startTime ?? (effectiveEnd - intervalSeconds * limit);

  const fromDate = new Date(effectiveStart * 1000).toISOString();
  const toDate = new Date(effectiveEnd * 1000).toISOString();

  const url = `${MORALIS_BASE}/pairs/${encodeURIComponent(pairAddress)}/ohlcv?chain=${chain}&timeframe=${timeframe}&limit=${Math.min(limit, 1000)}&fromDate=${fromDate}&toDate=${toDate}`;

  const data = await moralisFetch<MoralisOHLCVResponse>(url, apiKey);

  if (!data?.result?.length) return [];

  // Moralis returns newest first – reverse to oldest first
  const sorted = [...data.result].reverse();

  // Convert to our Candle format
  return sorted.map((c) => ({
    t: Math.floor(new Date(c.timestamp).getTime() / 1000),
    o: c.open.toString(),
    h: c.high.toString(),
    l: c.low.toString(),
    c: c.close.toString(),
    v: c.volume.toString(),
  }));
}

/**
 * High-level: fetch OHLCV candles for a token by first discovering its pair,
 * then querying the OHLCV endpoint.
 */
export async function fetchTokenOHLCV(
  chainId: number,
  tokenAddress: string,
  interval: KlineInterval,
  limit: number = 100,
  startTime?: number,
  endTime?: number,
): Promise<Candle[]> {
  const pair = await fetchTokenPair(chainId, tokenAddress);
  if (!pair) return [];

  return fetchPairOHLCV(chainId, pair.pairAddress, interval, limit, startTime, endTime);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getIntervalSeconds(interval: KlineInterval): number {
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
    '1M': 2592000,
  };
  return map[interval] ?? 3600;
}
