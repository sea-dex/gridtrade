'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import type { GridFill, GridFillsResponse } from '@/types/grid';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UseGridFillsParams {
  gridId?: number;
  chainId?: number;
  refreshInterval?: number;
}

interface UseGridFillsResult {
  fills: GridFill[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGridFills(params: UseGridFillsParams): UseGridFillsResult {
  const selectedChainId = useStore((s) => s.selectedChainId);
  const chainId = params.chainId ?? selectedChainId;
  const [fills, setFills] = useState<GridFill[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(Boolean(params.gridId));
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFills = useCallback(async () => {
    if (params.gridId === undefined) {
      setFills([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }

    if (isInitialLoad) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const searchParams = new URLSearchParams({
        chain_id: String(chainId),
      });

      const res = await fetch(`${API_BASE}/grids/${params.gridId}/fills?${searchParams.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: GridFillsResponse = await res.json();
      setFills(data.fills ?? []);
      setTotal(data.total ?? 0);
      setIsInitialLoad(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch grid fills');
      setFills([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [chainId, isInitialLoad, params.gridId]);

  useEffect(() => {
    fetchFills();
  }, [fetchFills]);

  useEffect(() => {
    const interval = params.refreshInterval;
    if (!interval || interval <= 0) return;

    const id = setInterval(() => {
      fetchFills();
    }, interval);

    return () => clearInterval(id);
  }, [fetchFills, params.refreshInterval]);

  return {
    fills,
    total,
    isLoading,
    error,
    refetch: fetchFills,
  };
}
