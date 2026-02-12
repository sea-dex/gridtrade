/**
 * Integration tests for K-line data sources (Moralis-based).
 *
 * These tests hit the REAL Moralis API to verify that our service layer can:
 *   1. Fetch token metadata
 *   2. Discover DEX pairs via token price API
 *   3. Fetch OHLCV candle data for pairs
 *   4. End-to-end: getKlines() returns proper candle data
 *
 * Target token: 0x987e6269c6b7ea6898221882f11ea16f87b97777 (HODLAI) on BSC (chainId 56)
 *
 * Run:  cd backend && npx vitest run src/__tests__/kline-data-sources.test.ts
 */

import { describe, it, expect, beforeAll } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';

// Load .env BEFORE any service imports so MORALIS_API_KEY is in process.env
dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') });

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHAIN_ID = 56; // BSC
const TOKEN_ADDRESS = '0x987e6269c6b7ea6898221882f11ea16f87b97777';
const USDT_BSC = '0x55d398326f99059ff775485246999027b3197955';
const WBNB_BSC = '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';

function getApiKey(): string | undefined {
  return process.env.MORALIS_API_KEY;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Moralis Token Metadata
// ═══════════════════════════════════════════════════════════════════════════

describe('Moralis fetchTokenInfo()', () => {
  it('should fetch metadata for HODLAI token', async () => {
    if (!getApiKey()) { console.warn('⚠️  MORALIS_API_KEY not set – skipping'); return; }

    const { fetchTokenInfo } = await import('../services/moralis.service.js');
    const info = await fetchTokenInfo(CHAIN_ID, TOKEN_ADDRESS);

    console.info('[fetchTokenInfo HODLAI]', JSON.stringify(info, null, 2));

    expect(info).toBeDefined();
    expect(info!.address.toLowerCase()).toBe(TOKEN_ADDRESS.toLowerCase());
    expect(info!.chain_id).toBe(CHAIN_ID);
    expect(info!.symbol).toBe('HODLAI');
    expect(info!.name).toContain('HODL AI');
    expect(info!.decimals).toBe(18);
    expect(info!.logo).toBeTypeOf('string');

    console.info(`✅ ${info!.symbol} (${info!.name}), decimals=${info!.decimals}, logo=${info!.logo}`);
  });

  it('should return WBNB from static config (no API call)', async () => {
    const { fetchTokenInfo } = await import('../services/moralis.service.js');
    const info = await fetchTokenInfo(CHAIN_ID, WBNB_BSC);

    expect(info).toBeDefined();
    expect(info!.symbol).toBe('WBNB');
    expect(info!.decimals).toBe(18);
    console.info(`✅ WBNB from static config`);
  });

  it('should return USDT from static config', async () => {
    const { fetchTokenInfo } = await import('../services/moralis.service.js');
    const info = await fetchTokenInfo(CHAIN_ID, USDT_BSC);

    expect(info).toBeDefined();
    expect(info!.symbol).toBe('USDT');
    expect(info!.decimals).toBe(18);
    console.info(`✅ USDT from static config`);
  });

  it('should handle non-existent token gracefully', async () => {
    if (!getApiKey()) { console.warn('⚠️  MORALIS_API_KEY not set – skipping'); return; }

    const { fetchTokenInfo } = await import('../services/moralis.service.js');
    const info = await fetchTokenInfo(CHAIN_ID, '0x0000000000000000000000000000000000000001');

    // Should not throw
    console.info(`✅ Non-existent token returned: ${info ? info.symbol : 'undefined'}`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Moralis Pair Discovery (Token Price API)
// ═══════════════════════════════════════════════════════════════════════════

describe('Moralis fetchTokenPair()', () => {
  it('should discover DEX pair for HODLAI', async () => {
    if (!getApiKey()) { console.warn('⚠️  MORALIS_API_KEY not set – skipping'); return; }

    const { fetchTokenPair } = await import('../services/moralis.service.js');
    const pair = await fetchTokenPair(CHAIN_ID, TOKEN_ADDRESS);

    console.info('[fetchTokenPair HODLAI]', JSON.stringify(pair, null, 2));

    expect(pair).toBeDefined();
    expect(pair!.pairAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(pair!.exchangeName).toBeTypeOf('string');
    expect(pair!.exchangeName.length).toBeGreaterThan(0);
    expect(pair!.exchangeAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(pair!.usdPrice).toBeTypeOf('number');
    expect(pair!.usdPrice).toBeGreaterThan(0);
    expect(pair!.liquidityUsd).toBeTypeOf('number');
    expect(pair!.liquidityUsd).toBeGreaterThan(0);

    console.info(`✅ Pair: ${pair!.pairAddress}`);
    console.info(`   Exchange: ${pair!.exchangeName}`);
    console.info(`   USD Price: $${pair!.usdPrice}`);
    console.info(`   Liquidity: $${pair!.liquidityUsd}`);
  });

  it('should cache pair info on second call', async () => {
    if (!getApiKey()) { console.warn('⚠️  MORALIS_API_KEY not set – skipping'); return; }

    const { fetchTokenPair } = await import('../services/moralis.service.js');

    const start = Date.now();
    const pair1 = await fetchTokenPair(CHAIN_ID, TOKEN_ADDRESS);
    const t1 = Date.now() - start;

    const start2 = Date.now();
    const pair2 = await fetchTokenPair(CHAIN_ID, TOKEN_ADDRESS);
    const t2 = Date.now() - start2;

    expect(pair1).toBeDefined();
    expect(pair2).toBeDefined();
    expect(pair1!.pairAddress).toBe(pair2!.pairAddress);

    // Second call should be much faster (cached)
    console.info(`✅ First call: ${t1}ms, Second call (cached): ${t2}ms`);
    expect(t2).toBeLessThanOrEqual(t1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Moralis OHLCV Candle Data
// ═══════════════════════════════════════════════════════════════════════════

describe('Moralis fetchPairOHLCV()', () => {
  let pairAddress: string | undefined;

  beforeAll(async () => {
    if (!getApiKey()) return;
    const { fetchTokenPair } = await import('../services/moralis.service.js');
    const pair = await fetchTokenPair(CHAIN_ID, TOKEN_ADDRESS);
    pairAddress = pair?.pairAddress;
  });

  it('should fetch 1h candles', async () => {
    if (!getApiKey() || !pairAddress) { console.warn('⚠️  Skipping – no API key or pair'); return; }

    const { fetchPairOHLCV } = await import('../services/moralis.service.js');
    const now = Math.floor(Date.now() / 1000);
    const candles = await fetchPairOHLCV(CHAIN_ID, pairAddress, '1h', 24, now - 86400, now);

    console.info(`[fetchPairOHLCV 1h] ${candles.length} candles`);

    expect(candles.length).toBeGreaterThan(0);

    for (const c of candles) {
      expect(c.t).toBeTypeOf('number');
      expect(c.t).toBeGreaterThan(0);
      expect(c.o).toBeTypeOf('string');
      expect(c.h).toBeTypeOf('string');
      expect(c.l).toBeTypeOf('string');
      expect(c.c).toBeTypeOf('string');
      expect(c.v).toBeTypeOf('string');
      expect(parseFloat(c.o)).toBeGreaterThan(0);
      expect(parseFloat(c.h)).toBeGreaterThanOrEqual(parseFloat(c.l));
    }

    // Should be sorted ascending by time
    for (let i = 1; i < candles.length; i++) {
      expect(candles[i].t).toBeGreaterThanOrEqual(candles[i - 1].t);
    }

    const first = candles[0];
    const last = candles[candles.length - 1];
    console.info(`✅ ${candles.length} hourly candles`);
    console.info(`   First: ${new Date(first.t * 1000).toISOString()} o=${first.o} c=${first.c}`);
    console.info(`   Last:  ${new Date(last.t * 1000).toISOString()} o=${last.o} c=${last.c}`);
  });

  it('should fetch 1d candles', async () => {
    if (!getApiKey() || !pairAddress) { console.warn('⚠️  Skipping'); return; }

    const { fetchPairOHLCV } = await import('../services/moralis.service.js');
    const now = Math.floor(Date.now() / 1000);
    const candles = await fetchPairOHLCV(CHAIN_ID, pairAddress, '1d', 7, now - 7 * 86400, now);

    console.info(`[fetchPairOHLCV 1d] ${candles.length} candles`);

    expect(candles.length).toBeGreaterThan(0);

    for (const c of candles) {
      expect(parseFloat(c.h)).toBeGreaterThanOrEqual(parseFloat(c.l));
    }

    console.info(`✅ ${candles.length} daily candles`);
    candles.forEach((c) => {
      console.info(`   ${new Date(c.t * 1000).toISOString().slice(0, 10)}: o=${parseFloat(c.o).toFixed(8)} c=${parseFloat(c.c).toFixed(8)} v=${parseFloat(c.v).toFixed(2)}`);
    });
  });

  it('should fetch 5m candles', async () => {
    if (!getApiKey() || !pairAddress) { console.warn('⚠️  Skipping'); return; }

    const { fetchPairOHLCV } = await import('../services/moralis.service.js');
    const now = Math.floor(Date.now() / 1000);
    const candles = await fetchPairOHLCV(CHAIN_ID, pairAddress, '5m', 50, now - 6 * 3600, now);

    console.info(`[fetchPairOHLCV 5m] ${candles.length} candles`);

    expect(candles.length).toBeGreaterThan(0);

    for (const c of candles) {
      expect(parseFloat(c.h)).toBeGreaterThanOrEqual(parseFloat(c.l));
    }

    console.info(`✅ ${candles.length} 5-minute candles`);
    if (candles.length > 0) {
      const first = candles[0];
      const last = candles[candles.length - 1];
      console.info(`   Range: ${new Date(first.t * 1000).toISOString()} → ${new Date(last.t * 1000).toISOString()}`);
    }
  });

  it('should fetch 30m candles', async () => {
    if (!getApiKey() || !pairAddress) { console.warn('⚠️  Skipping'); return; }

    const { fetchPairOHLCV } = await import('../services/moralis.service.js');
    const now = Math.floor(Date.now() / 1000);
    const candles = await fetchPairOHLCV(CHAIN_ID, pairAddress, '30m', 24, now - 12 * 3600, now);

    console.info(`[fetchPairOHLCV 30m] ${candles.length} candles`);

    expect(candles.length).toBeGreaterThan(0);
    console.info(`✅ ${candles.length} 30-minute candles`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Moralis fetchTokenOHLCV() – high-level (pair discovery + OHLCV)
// ═══════════════════════════════════════════════════════════════════════════

describe('Moralis fetchTokenOHLCV() – auto pair discovery', () => {
  it('should fetch 1h candles by token address (auto-discovers pair)', async () => {
    if (!getApiKey()) { console.warn('⚠️  MORALIS_API_KEY not set – skipping'); return; }

    const { fetchTokenOHLCV } = await import('../services/moralis.service.js');
    const now = Math.floor(Date.now() / 1000);
    const candles = await fetchTokenOHLCV(CHAIN_ID, TOKEN_ADDRESS, '1h', 12, now - 12 * 3600, now);

    console.info(`[fetchTokenOHLCV 1h] ${candles.length} candles`);

    expect(candles.length).toBeGreaterThan(0);

    for (const c of candles) {
      expect(c.t).toBeGreaterThan(0);
      expect(parseFloat(c.o)).toBeGreaterThan(0);
    }

    console.info(`✅ Auto-discovered pair and fetched ${candles.length} hourly candles`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. Unified getKlines() – end-to-end
// ═══════════════════════════════════════════════════════════════════════════

describe('Unified getKlines() – BSC HODLAI token', () => {
  it('should return 1h candles for HODLAI/USDT', async () => {
    if (!getApiKey()) { console.warn('⚠️  MORALIS_API_KEY not set – skipping'); return; }

    const { getKlines } = await import('../services/kline.service.js');

    const result = await getKlines({
      chainId: CHAIN_ID,
      base: TOKEN_ADDRESS,
      quote: USDT_BSC,
      interval: '1h',
      limit: 24,
    });

    console.info('[getKlines 1h]', {
      base_symbol: result.base_symbol,
      quote_symbol: result.quote_symbol,
      interval: result.interval,
      candles_count: result.candles.length,
    });

    expect(result.base).toBe(TOKEN_ADDRESS);
    expect(result.quote).toBe(USDT_BSC);
    expect(result.chain_id).toBe(CHAIN_ID);
    expect(result.interval).toBe('1h');
    expect(result.base_symbol).toBe('HODLAI');
    expect(result.quote_symbol).toBe('USDT');
    expect(Array.isArray(result.candles)).toBe(true);
    expect(result.candles.length).toBeGreaterThan(0);

    // Validate candle data
    for (const c of result.candles) {
      expect(c.t).toBeGreaterThan(0);
      expect(parseFloat(c.o)).toBeGreaterThan(0);
      expect(parseFloat(c.h)).toBeGreaterThanOrEqual(parseFloat(c.l));
    }

    const last = result.candles[result.candles.length - 1];
    console.info(`✅ ${result.base_symbol}/${result.quote_symbol}: ${result.candles.length} hourly candles`);
    console.info(`   Latest: ${new Date(last.t * 1000).toISOString()} close=$${last.c}`);
  });

  it('should return 1d candles for HODLAI/WBNB', async () => {
    if (!getApiKey()) { console.warn('⚠️  MORALIS_API_KEY not set – skipping'); return; }

    const { getKlines } = await import('../services/kline.service.js');

    const result = await getKlines({
      chainId: CHAIN_ID,
      base: TOKEN_ADDRESS,
      quote: WBNB_BSC,
      interval: '1d',
      limit: 7,
    });

    console.info('[getKlines 1d]', {
      base_symbol: result.base_symbol,
      quote_symbol: result.quote_symbol,
      candles_count: result.candles.length,
    });

    expect(result.chain_id).toBe(CHAIN_ID);
    expect(result.interval).toBe('1d');
    expect(result.base_symbol).toBe('HODLAI');
    expect(result.quote_symbol).toBe('WBNB');
    expect(result.candles.length).toBeGreaterThan(0);

    console.info(`✅ ${result.base_symbol}/${result.quote_symbol}: ${result.candles.length} daily candles`);
  });

  it('should return 5m candles for HODLAI/USDT', async () => {
    if (!getApiKey()) { console.warn('⚠️  MORALIS_API_KEY not set – skipping'); return; }

    const { getKlines } = await import('../services/kline.service.js');

    const now = Math.floor(Date.now() / 1000);
    const result = await getKlines({
      chainId: CHAIN_ID,
      base: TOKEN_ADDRESS,
      quote: USDT_BSC,
      interval: '5m',
      limit: 50,
      startTime: now - 6 * 3600,
      endTime: now,
    });

    console.info('[getKlines 5m]', {
      base_symbol: result.base_symbol,
      quote_symbol: result.quote_symbol,
      candles_count: result.candles.length,
    });

    expect(result.interval).toBe('5m');
    expect(result.candles.length).toBeGreaterThan(0);

    console.info(`✅ ${result.base_symbol}/${result.quote_symbol}: ${result.candles.length} 5m candles`);
  });
});
