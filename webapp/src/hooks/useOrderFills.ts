'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface OrderFill {
  tx_hash: string;
  taker: string;
  order_id: string;
  filled_amount: string;
  filled_volume: string;
  is_ask: boolean;
  timestamp: string;
}

interface UseOrderFillsParams {
  orderId?: string;
  chainId?: number;
  refreshInterval?: number;
}

interface UseOrderFillsResult {
  fills: OrderFill[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useOrderFills(params: UseOrderFillsParams): UseOrderFillsResult {
  const selectedChainId = useStore((s) => s.selectedChainId);
  const chainId = params.chainId ?? selectedChainId;
  const [fills, setFills] = useState<OrderFill[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(Boolean(params.orderId));
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFills = useCallback(async () => {
    if (!params.orderId) {
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

      const res = await fetch(`${API_BASE}/orders/${params.orderId}/fills?${searchParams.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: { fills: OrderFill[]; total: number } = await res.json();
      setFills(data.fills ?? []);
      setTotal(data.total ?? 0);
      setIsInitialLoad(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order fills');
      setFills([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [chainId, isInitialLoad, params.orderId]);

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
