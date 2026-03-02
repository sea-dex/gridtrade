'use client';

import { useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UsePairIdParams {
  baseToken?: string;
  quoteToken?: string;
}

interface UsePairIdResult {
  pairId: number | null;
  normalizedBaseToken: string;
  normalizedQuoteToken: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to get pair ID by base and quote token addresses.
 * Native token (0x0) addresses are automatically converted to WETH on the backend.
 */
export function usePairId(params: UsePairIdParams): UsePairIdResult {
  const selectedChainId = useStore((s) => s.selectedChainId);
  const [pairId, setPairId] = useState<number | null>(null);
  const [normalizedBaseToken, setNormalizedBaseToken] = useState<string>('');
  const [normalizedQuoteToken, setNormalizedQuoteToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPairId = useCallback(async () => {
    if (!params.baseToken || !params.quoteToken) {
      setPairId(null);
      setNormalizedBaseToken('');
      setNormalizedQuoteToken('');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams({
        chain_id: String(selectedChainId),
        base_token: params.baseToken,
        quote_token: params.quoteToken,
      });

      const res = await fetch(`${API_BASE}/grids/pair-id?${searchParams}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setPairId(data.pair_id);
      setNormalizedBaseToken(data.base_token);
      setNormalizedQuoteToken(data.quote_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pair ID');
      setPairId(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedChainId, params.baseToken, params.quoteToken]);

  // Expose refetch for manual triggering
  const refetch = useCallback(() => {
    fetchPairId();
  }, [fetchPairId]);

  return {
    pairId,
    normalizedBaseToken,
    normalizedQuoteToken,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Utility function to fetch pair ID without React hooks.
 * Useful for one-time lookups outside of component context.
 */
export async function fetchPairId(
  chainId: number,
  baseToken: string,
  quoteToken: string
): Promise<{ pairId: number | null; normalizedBaseToken: string; normalizedQuoteToken: string }> {
  const searchParams = new URLSearchParams({
    chain_id: String(chainId),
    base_token: baseToken,
    quote_token: quoteToken,
  });

  const res = await fetch(`${API_BASE}/grids/pair-id?${searchParams}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  return {
    pairId: data.pair_id,
    normalizedBaseToken: data.base_token,
    normalizedQuoteToken: data.quote_token,
  };
}
