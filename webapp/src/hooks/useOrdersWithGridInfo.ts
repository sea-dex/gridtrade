'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import type { OrderWithGridInfo, OrderWithGridInfoListResponse } from '@/types/grid';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UseOrdersWithGridInfoParams {
  owner?: string;
  gridId?: number;
  page?: number;
  pageSize?: number;
  refreshInterval?: number;
}

interface UseOrdersWithGridInfoResult {
  orders: OrderWithGridInfo[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  setPage: (page: number) => void;
}

export function useOrdersWithGridInfo(params: UseOrdersWithGridInfoParams = {}): UseOrdersWithGridInfoResult {
  const selectedChainId = useStore((s) => s.selectedChainId);
  const [orders, setOrders] = useState<OrderWithGridInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(params.page ?? 1);
  const [pageSize] = useState(params.pageSize ?? 20);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    // Only show loading spinner on initial load, not on refresh
    if (isInitialLoad) {
      setIsLoading(true);
    }
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
      if (params.gridId !== undefined) {
        searchParams.set('grid_id', String(params.gridId));
      }

      const res = await fetch(`${API_BASE}/orders/with-grid-info?${searchParams}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: OrderWithGridInfoListResponse = await res.json();

      setOrders(data.orders);
      setTotal(data.total);
      setIsInitialLoad(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      setOrders([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [selectedChainId, page, pageSize, params.owner, params.gridId, isInitialLoad]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const interval = params.refreshInterval;
    if (!interval || interval <= 0) return;
    const id = setInterval(() => {
      fetchOrders();
    }, interval);
    return () => clearInterval(id);
  }, [params.refreshInterval, fetchOrders]);

  return {
    orders,
    total,
    page,
    pageSize,
    isLoading,
    error,
    refetch: fetchOrders,
    setPage,
  };
}
