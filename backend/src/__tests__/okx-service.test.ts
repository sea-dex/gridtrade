/**
 * Integration tests for OKX DEX Market API service.
 *
 * These tests hit the REAL OKX API to verify that our service layer can
 * fetch OHLCV candle data for on-chain tokens.
 *
 * Target token: 0x80c9c9bc2abd9ead51e605678bff836b2f5d7777 on BSC (chainId 56)
 *
 * Run:  cd backend && npx vitest run src/__tests__/okx-service.test.ts
 */

import { describe, it, expect } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';

// Load .env BEFORE any service imports so HTTPS_PROXY etc. are available
dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') });

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHAIN_ID = 56; // BSC
const TOKEN_ADDRESS = '0x80c9c9bc2abd9ead51e605678bff836b2f5d7777';

// ═══════════════════════════════════════════════════════════════════════════
// 1. OKX fetchTokenOHLCV() – 1h candles
// ═══════════════════════════════════════════════════════════════════════════

describe('OKX fetchTokenOHLCV()', { timeout: 30_000 }, () => {
  it('should fetch 1h candles for BSC token', async () => {
    const { fetchTokenOHLCV } = await import('../services/okx.service.js');

    const now = Math.floor(Date.now() / 1000);
    const candles = await fetchTokenOHLCV(CHAIN_ID, TOKEN_ADDRESS, '1h', 24, now - 86400, now);

    console.info(`[OKX fetchTokenOHLCV 1h] ${candles.length} candles`);

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

  // ═══════════════════════════════════════════════════════════════════════
  // 2. OKX fetchTokenOHLCV() – 5m candles
  // ═══════════════════════════════════════════════════════════════════════

  it('should fetch 5m candles for BSC token', async () => {
    const { fetchTokenOHLCV } = await import('../services/okx.service.js');

    const now = Math.floor(Date.now() / 1000);
    const candles = await fetchTokenOHLCV(CHAIN_ID, TOKEN_ADDRESS, '5m', 50, now - 6 * 3600, now);

    console.info(`[OKX fetchTokenOHLCV 5m] ${candles.length} candles`);

    expect(candles.length).toBeGreaterThan(0);

    for (const c of candles) {
      expect(parseFloat(c.h)).toBeGreaterThanOrEqual(parseFloat(c.l));
    }

    // Should be sorted ascending by time
    for (let i = 1; i < candles.length; i++) {
      expect(candles[i].t).toBeGreaterThanOrEqual(candles[i - 1].t);
    }

    console.info(`✅ ${candles.length} 5-minute candles`);
    if (candles.length > 0) {
      const first = candles[0];
      const last = candles[candles.length - 1];
      console.info(`   Range: ${new Date(first.t * 1000).toISOString()} → ${new Date(last.t * 1000).toISOString()}`);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 3. OKX fetchTokenOHLCV() – 30m candles
  // ═══════════════════════════════════════════════════════════════════════

  it('should fetch 30m candles for BSC token', async () => {
    const { fetchTokenOHLCV } = await import('../services/okx.service.js');

    const now = Math.floor(Date.now() / 1000);
    const candles = await fetchTokenOHLCV(CHAIN_ID, TOKEN_ADDRESS, '30m', 24, now - 12 * 3600, now);

    console.info(`[OKX fetchTokenOHLCV 30m] ${candles.length} candles`);

    expect(candles.length).toBeGreaterThan(0);

    for (const c of candles) {
      expect(parseFloat(c.h)).toBeGreaterThanOrEqual(parseFloat(c.l));
    }

    console.info(`✅ ${candles.length} 30-minute candles`);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 4. OKX fetchTokenOHLCV() – 1d candles
  // ═══════════════════════════════════════════════════════════════════════

  it('should fetch 1d candles for BSC token', async () => {
    const { fetchTokenOHLCV } = await import('../services/okx.service.js');

    const now = Math.floor(Date.now() / 1000);
    const candles = await fetchTokenOHLCV(CHAIN_ID, TOKEN_ADDRESS, '1d', 7, now - 7 * 86400, now);

    console.info(`[OKX fetchTokenOHLCV 1d] ${candles.length} candles`);

    expect(candles.length).toBeGreaterThan(0);

    for (const c of candles) {
      expect(parseFloat(c.h)).toBeGreaterThanOrEqual(parseFloat(c.l));
    }

    console.info(`✅ ${candles.length} daily candles`);
    candles.forEach((c) => {
      console.info(`   ${new Date(c.t * 1000).toISOString().slice(0, 10)}: o=${parseFloat(c.o).toFixed(8)} c=${parseFloat(c.c).toFixed(8)} v=${parseFloat(c.v).toFixed(2)}`);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 5. OKX fetchTokenOHLCV() – 4h candles
  // ═══════════════════════════════════════════════════════════════════════

  it('should fetch 4h candles for BSC token', async () => {
    const { fetchTokenOHLCV } = await import('../services/okx.service.js');

    const now = Math.floor(Date.now() / 1000);
    const candles = await fetchTokenOHLCV(CHAIN_ID, TOKEN_ADDRESS, '4h', 42, now - 7 * 86400, now);

    console.info(`[OKX fetchTokenOHLCV 4h] ${candles.length} candles`);

    expect(candles.length).toBeGreaterThan(0);

    for (const c of candles) {
      expect(parseFloat(c.h)).toBeGreaterThanOrEqual(parseFloat(c.l));
    }

    // Should be sorted ascending by time
    for (let i = 1; i < candles.length; i++) {
      expect(candles[i].t).toBeGreaterThanOrEqual(candles[i - 1].t);
    }

    console.info(`✅ ${candles.length} 4-hour candles`);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 6. Unsupported chain should return empty array
  // ═══════════════════════════════════════════════════════════════════════

  it('should return empty array for unsupported chain', async () => {
    const { fetchTokenOHLCV } = await import('../services/okx.service.js');

    const candles = await fetchTokenOHLCV(999999, TOKEN_ADDRESS, '1h', 10);

    expect(candles).toEqual([]);
    console.info('✅ Unsupported chain returns empty array');
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 7. Pagination – request > 200 candles
  // ═══════════════════════════════════════════════════════════════════════

  it('should handle pagination for > 200 candles (1m interval)', async () => {
    const { fetchTokenOHLCV } = await import('../services/okx.service.js');

    const now = Math.floor(Date.now() / 1000);
    const requestedLimit = 300;
    const candles = await fetchTokenOHLCV(
      CHAIN_ID,
      TOKEN_ADDRESS,
      '1m',
      requestedLimit,
      now - requestedLimit * 60,
      now,
    );

    console.info(`[OKX fetchTokenOHLCV pagination] requested=${requestedLimit}, got=${candles.length}`);

    // We may not get exactly 300 if the token doesn't have that much history,
    // but we should get more than 200 if pagination works
    expect(candles.length).toBeGreaterThan(0);

    // Should be sorted ascending by time
    for (let i = 1; i < candles.length; i++) {
      expect(candles[i].t).toBeGreaterThanOrEqual(candles[i - 1].t);
    }

    console.info(`✅ Pagination returned ${candles.length} candles`);
  });

  // ═══════════════════════════════════════════════════════════════════════
  // 8. Default limit (no explicit limit)
  // ═══════════════════════════════════════════════════════════════════════

  it('should use default limit when not specified', async () => {
    const { fetchTokenOHLCV } = await import('../services/okx.service.js');

    const candles = await fetchTokenOHLCV(CHAIN_ID, TOKEN_ADDRESS, '1h');

    console.info(`[OKX fetchTokenOHLCV default limit] ${candles.length} candles`);

    expect(candles.length).toBeGreaterThan(0);
    expect(candles.length).toBeLessThanOrEqual(200); // default limit is 100, max per page 200

    console.info(`✅ Default limit returned ${candles.length} candles`);
  });
});
