'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '@/store/useStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** Polling interval in milliseconds (30 seconds) */
const POLL_INTERVAL = 30_000;

// ---------------------------------------------------------------------------
// Types – mirrors backend schema
// ---------------------------------------------------------------------------

export interface Candle {
  /** Bucket open time – unix seconds */
  t: number;
  /** Open price */
  o: string;
  /** High price */
  h: string;
  /** Low price */
  l: string;
  /** Close price */
  c: string;
  /** Volume */
  v: string;
}

export interface KlineResponse {
  base: string;
  quote: string;
  chain_id: number;
  base_symbol: string;
  quote_symbol: string;
  interval: string;
  candles: Candle[];
}

export type KlineInterval =
  | '1m' | '3m' | '5m' | '15m' | '30m'
  | '1h' | '2h' | '4h' | '6h' | '8h' | '12h'
  | '1d' | '3d' | '1w' | '1M';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseKlineOptions {
  base: string;
  quote: string;
  interval?: KlineInterval;
  limit?: number;
  /** Whether to enable 30-second auto-refresh (default: true) */
  autoRefresh?: boolean;
}

export function useKline({
  base,
  quote,
  interval = '1h',
  limit = 200,
  autoRefresh = true,
}: UseKlineOptions) {
  const selectedChainId = useStore((s) => s.selectedChainId);
  const [data, setData] = useState<KlineResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the latest params so the interval callback always uses fresh values
  const paramsRef = useRef({ selectedChainId, base, quote, interval, limit });
  paramsRef.current = { selectedChainId, base, quote, interval, limit };

  const fetchKline = useCallback(async () => {
    const { selectedChainId: chainId, base: b, quote: q, interval: iv, limit: lim } = paramsRef.current;
    if (!b || !q || b === q) return;

    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        chain_id: String(chainId),
        base: b,
        quote: q,
        interval: iv,
        limit: String(lim),
      });
      const res = await fetch(`${API_BASE}/kline?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: KlineResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch kline data');
    } finally {
      setIsLoading(false);
    }
  }, []); // stable – reads from paramsRef

  // Initial fetch + re-fetch when params change
  useEffect(() => {
    if (!base || !quote || base === quote) return;
    fetchKline();
  }, [selectedChainId, base, quote, interval, limit, fetchKline]);

  // 30-second polling
  useEffect(() => {
    if (!autoRefresh || !base || !quote || base === quote) return;

    const id = setInterval(() => {
      fetchKline();
    }, POLL_INTERVAL);

    return () => clearInterval(id);
  }, [autoRefresh, base, quote, fetchKline]);

  return { data, isLoading, error, refetch: fetchKline };
}
