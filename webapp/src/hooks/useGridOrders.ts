'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import type { GridWithOrders, GridWithOrdersListResponse } from '@/types/grid';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UseGridOrdersParams {
  owner?: string;
  status?: number;
  page?: number;
  pageSize?: number;
}

interface UseGridOrdersResult {
  grids: GridWithOrders[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  setPage: (page: number) => void;
}

export function useGridOrders(params: UseGridOrdersParams = {}): UseGridOrdersResult {
  const selectedChainId = useStore((s) => s.selectedChainId);
  const [grids, setGrids] = useState<GridWithOrders[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(params.page ?? 1);
  const [pageSize] = useState(params.pageSize ?? 20);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGridsWithOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams({
        chain_id: String(selectedChainId),
        page: String(page),
        page_size: String(pageSize),
      });

      if (params.owner) {
        searchParams.set('owner', params.owner);
      }
      if (params.status !== undefined) {
        searchParams.set('status', String(params.status));
      }

      const res = await fetch(`${API_BASE}/grids/with-orders?${searchParams}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: GridWithOrdersListResponse = await res.json();

      setGrids(data.grids);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch grids');
      setGrids([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [selectedChainId, page, pageSize, params.owner, params.status]);

  useEffect(() => {
    fetchGridsWithOrders();
  }, [fetchGridsWithOrders]);

  return {
    grids,
    total,
    page,
    pageSize,
    isLoading,
    error,
    refetch: fetchGridsWithOrders,
    setPage,
  };
}
