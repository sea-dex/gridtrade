'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface OrderDetail {
  order_id: string;
  grid_id: number;
  pair_id: number;
  is_ask: boolean;
  compound: boolean;
  oneshot: boolean;
  fee: number;
  status: number;
  amount: string;
  rev_amount: string;
  initial_base_amount: string;
  initial_quote_amount: string;
  price: string;
  rev_price: string;
}

interface UseOrderDetailParams {
  orderId?: string;
  chainId?: number;
}

interface UseOrderDetailResult {
  order: OrderDetail | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useOrderDetail(params: UseOrderDetailParams): UseOrderDetailResult {
  const selectedChainId = useStore((s) => s.selectedChainId);
  const chainId = params.chainId ?? selectedChainId;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(params.orderId));
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!params.orderId) {
      setOrder(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams({
        chain_id: String(chainId),
      });

      const res = await fetch(`${API_BASE}/orders/${params.orderId}?${searchParams.toString()}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: OrderDetail = await res.json();
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  }, [chainId, params.orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    order,
    isLoading,
    error,
    refetch: fetchOrder,
  };
}
