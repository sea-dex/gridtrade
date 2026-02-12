/**
 * Unified K-line service.
 *
 * Routing logic:
 *   1. If the base token has a Binance mapping and the quote is a stablecoin
 *      → fetch from Binance.
 *   2. Otherwise → discover the best DEX pair via Moralis token price API,
 *      then fetch OHLCV candles from Moralis pair OHLCV endpoint.
 *
 * The data source is an internal detail – the response format is identical
 * regardless of where the data comes from.
 */

import { getPriceFeed } from '../config/price-feeds.js';
import { fetchBinanceKlines } from './binance.service.js';
import {
  fetchTokenInfo,
  fetchTokenOHLCV,
} from './moralis.service.js';
import type { KlineResponse, KlineInterval, TokenInfo } from '../schemas/kline.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface GetKlineParams {
  chainId: number;
  base: string;       // base token address
  quote: string;      // quote token address
  interval: KlineInterval;
  limit: number;
  startTime?: number; // unix seconds
  endTime?: number;   // unix seconds
}

/**
 * Fetch K-line candles for a base/quote pair.
 */
export async function getKlines(params: GetKlineParams): Promise<KlineResponse> {
  const { chainId, base, quote, interval, limit, startTime, endTime } = params;

  const baseFeed = getPriceFeed(chainId, base);
  const quoteFeed = getPriceFeed(chainId, quote);

  console.info('base:', base, "baseFeed:", baseFeed)

  const baseSymbol = baseFeed?.symbol ?? (await fetchTokenInfo(chainId, base))?.symbol ?? base.slice(0, 10);
  const quoteSymbol = quoteFeed?.symbol ?? (await fetchTokenInfo(chainId, quote))?.symbol ?? quote.slice(0, 10);

  // ── Route 1: Binance ────────────────────────────────────────────────
  // If the base token has a Binance mapping (e.g. BNBUSDT) we use it directly.
  if (baseFeed?.binance) {
    const candles = await fetchBinanceKlines({
      symbol: baseFeed.binance.symbol,
      interval,
      limit,
      startTime: startTime ? startTime * 1000 : undefined,
      endTime: endTime ? endTime * 1000 : undefined,
    });

    return {
      base,
      quote,
      chain_id: chainId,
      base_symbol: baseSymbol,
      quote_symbol: quoteSymbol,
      interval,
      candles,
    };
  }

  // ── Route 2: Moralis OHLCV ──────────────────────────────────────────
  // Discover the best DEX pair via Moralis token price API, then fetch
  // OHLCV candle data from the Moralis pair endpoint.
  const candles = await fetchTokenOHLCV(chainId, base, interval, limit, startTime, endTime);

  return {
    base,
    quote,
    chain_id: chainId,
    base_symbol: baseSymbol,
    quote_symbol: quoteSymbol,
    interval,
    candles,
  };
}

/**
 * Get token info (metadata).
 */
export async function getTokenInfo(chainId: number, address: string): Promise<TokenInfo | undefined> {
  return fetchTokenInfo(chainId, address);
}
