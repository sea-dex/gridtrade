'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface FeeItem {
  /** Fee value on-chain (uint32, denominator = 1,000,000) */
  value: number;
  /** Human-readable label, e.g. "0.30%" */
  label: string;
  /** Short description of the fee tier */
  description: string;
  /** Whether this tier is the default selection */
  isDefault: boolean;
  /** Display priority – lower = higher in list */
  priority: number;
}

interface FeeListResponse {
  chain_id: number;
  fees: FeeItem[];
}

export function useFees() {
  const selectedChainId = useStore((s) => s.selectedChainId);
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/fees?chain_id=${selectedChainId}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: FeeListResponse = await res.json();
      setFees(data.fees);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch fees');
      setFees([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedChainId]);

  useEffect(() => {
    fetchFees();
  }, [fetchFees]);

  /** Return the default fee value, or the first fee if no default is set */
  const defaultFee = fees.find((f) => f.isDefault) ?? fees[0];

  return { fees, defaultFee, isLoading, error, refetch: fetchFees };
}
