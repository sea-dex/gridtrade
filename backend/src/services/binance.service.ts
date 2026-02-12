/**
 * Binance public K-line (candlestick) API client.
 *
 * Docs: https://binance-docs.github.io/apidocs/spot/en/#kline-candlestick-data
 *
 * Rate limit: 1200 req/min (IP-based) – we add a simple in-memory cache
 * to avoid hammering the endpoint on repeated requests.
 *
 * Resilience:
 *   - Configurable base URL via BINANCE_API_BASE env var
 *   - Automatic fallback across multiple Binance API endpoints
 *   - Retry with exponential back-off on transient failures
 *   - Proxy support via HTTP_PROXY / HTTPS_PROXY env vars (through axios)
 */

import type { Candle, KlineInterval } from '../schemas/kline.js';
import { env } from '../config/env.js';
import { http } from '../utils/http.js';
import { binanceLogger as log } from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Ordered list of Binance API base URLs to try.
 * If BINANCE_API_BASE is set, it takes priority as the first endpoint.
 */
const BINANCE_ENDPOINTS: string[] = [
  ...(env.BINANCE_API_BASE ? [env.BINANCE_API_BASE] : []),
  'https://api1.binance.com',
  'https://api2.binance.com',
  'https://api3.binance.com',
  'https://api.binance.com',
].filter((v, i, a) => a.indexOf(v) === i); // deduplicate

const KLINE_ENDPOINT = '/api/v3/klines';

/** Per-request timeout (ms) */
const REQUEST_TIMEOUT = 8_000;

/** Maximum retry attempts across all endpoints */
const MAX_RETRIES = 3;

/** Base delay for exponential back-off (ms) */
const RETRY_BASE_DELAY = 500;

/** Cache TTL per interval (in ms) */
const CACHE_TTL: Record<string, number> = {
  '1m': 30_000,       // 30 s
  '3m': 60_000,
  '5m': 60_000,
  '15m': 2 * 60_000,
  '30m': 5 * 60_000,
  '1h': 5 * 60_000,
  '2h': 10 * 60_000,
  '4h': 10 * 60_000,
  '6h': 15 * 60_000,
  '8h': 15 * 60_000,
  '12h': 30 * 60_000,
  '1d': 60 * 60_000,
  '3d': 60 * 60_000,
  '1w': 60 * 60_000,
  '1M': 60 * 60_000,
};

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: Candle[];
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(symbol: string, interval: string, limit: number, startTime?: number, endTime?: number): string {
  return `${symbol}:${interval}:${limit}:${startTime ?? ''}:${endTime ?? ''}`;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Sleep for `ms` milliseconds. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Attempt a single fetch against one Binance base URL.
 * Throws on network / timeout / non-2xx errors.
 */
async function tryFetch(baseUrl: string, searchParams: URLSearchParams): Promise<unknown[][]> {
  const url = `${baseUrl}${KLINE_ENDPOINT}?${searchParams.toString()}`;

  const { data } = await http.get<unknown[][]>(url, {
    timeout: REQUEST_TIMEOUT,
  });

  return data;
}

/**
 * Fetch with automatic endpoint fallback and retry.
 *
 * Strategy:
 *   1. Try each endpoint in order.
 *   2. On timeout / network error, move to the next endpoint.
 *   3. If all endpoints fail in one round, wait (exponential back-off) and retry.
 *   4. Give up after MAX_RETRIES total rounds.
 */
async function fetchWithRetry(searchParams: URLSearchParams): Promise<unknown[][]> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    for (const baseUrl of BINANCE_ENDPOINTS) {
      try {
        return await tryFetch(baseUrl, searchParams);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const isTransient =
          lastError.message.includes('timeout') ||
          lastError.message.includes('ETIMEDOUT') ||
          lastError.message.includes('ECONNREFUSED') ||
          lastError.message.includes('ENOTFOUND') ||
          lastError.message.includes('ECONNRESET') ||
          lastError.message.includes('ECONNABORTED') ||
          lastError.message.includes('Network Error');

        if (isTransient) {
          log.warn(
            { baseUrl, attempt: attempt + 1, maxRetries: MAX_RETRIES, error: lastError.message },
            'Timeout/network error – trying next endpoint',
          );
          // Try next endpoint immediately
          continue;
        }

        // Non-transient error (e.g. 4xx) – don't retry
        throw lastError;
      }
    }

    // All endpoints failed this round – back off before retrying
    if (attempt < MAX_RETRIES - 1) {
      const delay = RETRY_BASE_DELAY * 2 ** attempt;
      log.warn({ attempt: attempt + 1, delayMs: delay }, 'All endpoints failed – retrying after backoff');
      await sleep(delay);
    }
  }

  throw new Error(
    `[binance] All ${BINANCE_ENDPOINTS.length} endpoints failed after ${MAX_RETRIES} attempts. Last error: ${lastError?.message}`,
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface BinanceKlineParams {
  /** Binance symbol, e.g. "ETHUSDT" */
  symbol: string;
  interval: KlineInterval;
  limit?: number;
  /** Start time in **milliseconds** */
  startTime?: number;
  /** End time in **milliseconds** */
  endTime?: number;
}

/**
 * Fetch K-line data from Binance and return normalised {@link Candle} array.
 *
 * The returned candles are sorted oldest-first (ascending time).
 */
export async function fetchBinanceKlines(params: BinanceKlineParams): Promise<Candle[]> {
  const { symbol, interval, limit = 100, startTime, endTime } = params;

  // Check cache
  const key = cacheKey(symbol, interval, limit, startTime, endTime);
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  // Build search params
  const searchParams = new URLSearchParams();
  searchParams.set('symbol', symbol);
  searchParams.set('interval', interval);
  searchParams.set('limit', String(limit));
  if (startTime !== undefined) searchParams.set('startTime', String(startTime));
  if (endTime !== undefined) searchParams.set('endTime', String(endTime));

  const raw = await fetchWithRetry(searchParams);

  const candles: Candle[] = raw.map((k) => ({
    t: Math.floor((k[0] as number) / 1000), // openTime ms → seconds
    o: k[1] as string,
    h: k[2] as string,
    l: k[3] as string,
    c: k[4] as string,
    v: k[5] as string, // base asset volume
  }));

  // Store in cache
  const ttl = CACHE_TTL[interval] ?? 60_000;
  cache.set(key, { data: candles, expiresAt: Date.now() + ttl });

  return candles;
}

/**
 * Fetch the latest price for a Binance symbol.
 */
export async function fetchBinancePrice(symbol: string): Promise<string> {
  const searchParams = new URLSearchParams();
  searchParams.set('symbol', symbol);

  let lastError: Error | undefined;

  for (const baseUrl of BINANCE_ENDPOINTS) {
    try {
      const url = `${baseUrl}/api/v3/ticker/price?${searchParams.toString()}`;
      const { data } = await http.get<{ symbol: string; price: string }>(url, {
        timeout: REQUEST_TIMEOUT,
      });

      return data.price;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      log.warn({ baseUrl, error: lastError.message }, 'Price fetch failed – trying next endpoint');
      continue;
    }
  }

  throw new Error(
    `[binance] Price fetch failed from all endpoints. Last error: ${lastError?.message}`,
  );
}
