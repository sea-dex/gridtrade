'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface TokenItem {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logo: string;
  totalSupply?: string;
  priority: number;
  isQuote: boolean;
  tags?: string[];
}

interface TokenListResponse {
  chain_id: number;
  tokens: TokenItem[];
}

export function useBaseTokens() {
  const selectedChainId = useStore((s) => s.selectedChainId);
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/tokens/base?chain_id=${selectedChainId}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: TokenListResponse = await res.json();
      setTokens(data.tokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch base tokens');
      // Fallback: empty list
      setTokens([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedChainId]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  return { tokens, isLoading, error, refetch: fetchTokens };
}

export function useQuoteTokens() {
  const selectedChainId = useStore((s) => s.selectedChainId);
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/tokens/quote?chain_id=${selectedChainId}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: TokenListResponse = await res.json();
      setTokens(data.tokens);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch quote tokens');
      setTokens([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedChainId]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  return { tokens, isLoading, error, refetch: fetchTokens };
}

/**
 * Import a token by address – calls /kline/token to get metadata
 */
export function useImportToken() {
  const selectedChainId = useStore((s) => s.selectedChainId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importToken = useCallback(
    async (address: string): Promise<TokenItem | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/kline/token?chain_id=${selectedChainId}&address=${address}`
        );
        if (!res.ok) {
          if (res.status === 404) {
            setError('Token not found');
            return null;
          }
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        // Map kline token info to TokenItem shape
        const token: TokenItem = {
          address: data.address,
          symbol: data.symbol,
          name: data.name,
          decimals: data.decimals,
          logo: data.logo || '',
          priority: 999,
          isQuote: false,
          tags: ['imported'],
        };
        return token;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to import token');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedChainId]
  );

  return { importToken, isLoading, error };
}
