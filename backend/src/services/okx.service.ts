/**
 * OKX DEX Market API client – provides OHLCV candle data for on-chain tokens.
 *
 * Uses the OKX Web3 DEX Market API v6 candlestick endpoint:
 *   https://web3.okx.com/api/v6/dex/market/candles
 *
 * Docs:
 *   https://web3.okx.com/zh-hans/build/dev-docs/wallet-api/market-candlesticks
 *
 * This is a free API – no API key required.
 */

import type { Candle, KlineInterval } from '../schemas/kline.js';
import { http } from '../utils/http.js';
import { okxLogger as log } from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OKX_BASE = 'https://web3.okx.com/api/v6/dex/market';

/**
 * Map our chainId → OKX chainIndex parameter.
 *
 * OKX uses the standard EVM chain IDs as string values.
 * See: https://web3.okx.com/zh-hans/build/dev-docs/wallet-api/supported-chains
 */
const OKX_CHAIN_INDEX: Record<number, string> = {
  1: '1',       // Ethereum
  56: '56',     // BNB Smart Chain
  8453: '8453', // Base
  97: '97',     // BSC Testnet (may not be supported by OKX)
};

/**
 * Map our KlineInterval → OKX bar parameter.
 *
 * OKX supports: 1m, 5m, 30m, 1H, 4H, 1D, 1W, 1M, 1Y
 * For unsupported intervals we map to the nearest supported one.
 */
const INTERVAL_TO_OKX_BAR: Record<string, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '30m',  // nearest: 30m (15m not supported)
  '30m': '30m',
  '1h': '1H',
  '2h': '4H',    // nearest: 4H
  '4h': '4H',
  '6h': '4H',    // nearest: 4H
  '8h': '1D',    // nearest: 1D
  '12h': '1D',   // nearest: 1D
  '1d': '1D',
  '3d': '1D',    // use 1D, aggregate client-side if needed
  '1w': '1W',
  '1M': '1M',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * OKX API response wrapper.
 */
interface OKXResponse {
  code: string;
  data: string[][];
  msg: string;
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function getChainIndex(chainId: number): string | undefined {
  return OKX_CHAIN_INDEX[chainId];
}

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

// ---------------------------------------------------------------------------
// OHLCV Candle Data
// ---------------------------------------------------------------------------

/**
 * Fetch OHLCV candle data for a token from OKX DEX Market API.
 *
 * The OKX API returns data sorted newest-first. We reverse it to return
 * oldest-first, consistent with the rest of the application.
 *
 * OKX API limits:
 *   - Max 200 candles per request
 *   - Pagination via `after` (older) / `before` (newer) timestamp in ms
 *
 * @param chainId        - Chain ID (1 for ETH, 56 for BSC, 8453 for Base)
 * @param tokenAddress   - Token contract address
 * @param interval       - K-line interval (mapped to OKX bar)
 * @param limit          - Max number of candles (will paginate if > 200)
 * @param startTime      - Start time (unix seconds, optional)
 * @param endTime        - End time (unix seconds, optional)
 */
export async function fetchTokenOHLCV(
  chainId: number,
  tokenAddress: string,
  interval: KlineInterval,
  limit: number = 100,
  startTime?: number,
  endTime?: number,
): Promise<Candle[]> {
  const chainIndex = getChainIndex(chainId);
  if (!chainIndex) {
    log.warn({ chainId }, 'Unsupported chain for OKX API');
    return [];
  }

  const bar = INTERVAL_TO_OKX_BAR[interval] ?? '1H';

  // OKX uses millisecond timestamps for `after` and `before` params.
  // `after` = return data older than this timestamp (pagination backward)
  // `before` = return data newer than this timestamp (pagination forward)
  const now = Math.floor(Date.now() / 1000);
  const effectiveEnd = endTime ?? now;
  const intervalSec = getIntervalSeconds(interval);
  const effectiveStart = startTime ?? (effectiveEnd - intervalSec * limit);

  // OKX max per request is 200
  const OKX_MAX_PER_PAGE = 200;

  // If limit <= 200, single request is enough
  if (limit <= OKX_MAX_PER_PAGE) {
    return fetchOKXCandlesPage(
      chainIndex,
      tokenAddress,
      bar,
      Math.min(limit, OKX_MAX_PER_PAGE),
      effectiveStart * 1000,
      effectiveEnd * 1000,
    );
  }

  // For limit > 200, paginate backwards from endTime
  const allCandles: Candle[] = [];
  let remaining = limit;
  let currentAfter = effectiveEnd * 1000; // start from the end, go backwards

  while (remaining > 0) {
    const pageSize = Math.min(remaining, OKX_MAX_PER_PAGE);
    const candles = await fetchOKXCandlesPage(
      chainIndex,
      tokenAddress,
      bar,
      pageSize,
      effectiveStart * 1000,
      currentAfter,
    );

    if (candles.length === 0) break;

    // candles are already sorted oldest-first from fetchOKXCandlesPage
    allCandles.unshift(...candles);
    remaining -= candles.length;

    // Move the cursor to before the oldest candle we received
    const oldestTs = candles[0].t;
    currentAfter = oldestTs * 1000;

    // If we got fewer than requested, no more data available
    if (candles.length < pageSize) break;
  }

  // Trim to requested limit (keep the newest `limit` candles)
  if (allCandles.length > limit) {
    return allCandles.slice(allCandles.length - limit);
  }

  return allCandles;
}

/**
 * Fetch a single page of candles from OKX.
 *
 * @returns Candles sorted oldest-first.
 */
async function fetchOKXCandlesPage(
  chainIndex: string,
  tokenAddress: string,
  bar: string,
  limit: number,
  beforeMs: number,
  afterMs: number,
): Promise<Candle[]> {
  const params = new URLSearchParams({
    chainIndex,
    tokenContractAddress: tokenAddress,
    bar,
    limit: String(limit),
    after: String(afterMs),
    before: String(beforeMs),
  });

  const url = `${OKX_BASE}/candles?${params.toString()}`;

  try {
    const { data: resp } = await http.get<OKXResponse>(url, {
      timeout: 10_000,
    });

    if (!resp || resp.code !== '0' || !resp.data?.length) {
      if (resp?.code !== '0') {
        log.warn({ code: resp?.code, msg: resp?.msg, url }, 'OKX API error');
      }
      return [];
    }

    // OKX returns newest-first: [[ts, o, h, l, c, vol], ...]
    // Reverse to oldest-first
    const sorted = [...resp.data].reverse();

    return sorted.map((item) => ({
      t: Math.floor(Number(item[0]) / 1000), // ms → seconds
      o: item[1],
      h: item[2],
      l: item[3],
      c: item[4],
      v: item[5],
    }));
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status) {
      log.warn({ status, url }, 'OKX API HTTP error');
    } else {
      log.warn({ url, err }, 'OKX API fetch failed');
    }
    return [];
  }
}
