'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import type { GridDetailResponse } from '@/types/grid';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UseGridDetailParams {
  gridId?: number;
  chainId?: number;
}

interface UseGridDetailResult {
  grid: GridDetailResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGridDetail(params: UseGridDetailParams): UseGridDetailResult {
  const selectedChainId = useStore((s) => s.selectedChainId);
  const chainId = params.chainId ?? selectedChainId;
  const [grid, setGrid] = useState<GridDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(params.gridId));
  const [error, setError] = useState<string | null>(null);

  const fetchGrid = useCallback(async () => {
    if (params.gridId === undefined) {
      setGrid(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams({
        chain_id: String(chainId),
      });

      const res = await fetch(`${API_BASE}/grids/${params.gridId}?${searchParams.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: GridDetailResponse = await res.json();
      setGrid(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch grid');
      setGrid(null);
    } finally {
      setIsLoading(false);
    }
  }, [chainId, params.gridId]);

  useEffect(() => {
    fetchGrid();
  }, [fetchGrid]);

  return {
    grid,
    isLoading,
    error,
    refetch: fetchGrid,
  };
}
