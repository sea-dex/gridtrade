'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type TimeFilter = '24h' | '7d' | '30d' | 'all';
export type SortField = 'profit' | 'volume' | 'apr' | 'tvl' | 'profit_rate' | 'trades';
export type SortOrder = 'asc' | 'desc';

export interface LeaderboardEntry {
  rank: number;
  trader: string;
  pair: string;
  gridId: number;
  profit: number;
  profitRate: number;
  volume: number;
  trades: number;
  tvl: number;
  apr: number;
}

interface ApiLeaderboardEntry {
  rank: number;
  trader: string;
  pair: string;
  grid_id: number;
  profit: string;
  profit_rate: number;
  volume: string;
  trades: number;
  tvl: string;
  apr: number;
}

interface ApiLeaderboardResponse {
  entries: ApiLeaderboardEntry[];
  total: number;
  period: string;
}

/**
 * Convert a wei-denominated string (18 decimals) to a human-readable number.
 * Falls back to parsing as a plain number if the value is small (non-wei).
 */
function fromWei(value: string, decimals: number = 18): number {
  if (!value || value === '0') return 0;
  // If the string has a decimal point, it's already human-readable
  if (value.includes('.')) return parseFloat(value);
  // If the value is shorter than decimals digits, it's likely already a plain number
  if (value.length <= decimals) {
    const num = parseFloat(value);
    // Heuristic: if this looks like a reasonable dollar amount, return as-is
    if (num < 1e9) return num;
  }
  // Otherwise, divide by 10^decimals
  try {
    const bi = BigInt(value);
    const divisor = BigInt(10 ** decimals);
    const integer = bi / divisor;
    const remainder = bi % divisor;
    const fractional = remainder.toString().padStart(decimals, '0').slice(0, 2);
    return parseFloat(`${integer}.${fractional}`);
  } catch {
    return parseFloat(value) || 0;
  }
}

export function useLeaderboard(
  period: TimeFilter = '7d',
  limit: number = 50,
  sortBy: SortField = 'profit',
  sortOrder: SortOrder = 'desc',
) {
  const selectedChainId = useStore((s) => s.selectedChainId);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        chain_id: String(selectedChainId),
        period,
        limit: String(limit),
        sort_by: sortBy,
        order: sortOrder,
      });
      const res = await fetch(`${API_BASE}/leaderboard/?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiLeaderboardResponse = await res.json();

      const mapped: LeaderboardEntry[] = data.entries.map((e) => ({
        rank: e.rank,
        trader: e.trader,
        pair: e.pair,
        gridId: e.grid_id,
        profit: fromWei(e.profit),
        profitRate: e.profit_rate,
        volume: fromWei(e.volume),
        trades: e.trades,
        tvl: fromWei(e.tvl),
        apr: e.apr,
      }));

      setEntries(mapped);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
      setEntries([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [selectedChainId, period, limit, sortBy, sortOrder]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { entries, total, isLoading, error, refetch: fetchLeaderboard };
}
