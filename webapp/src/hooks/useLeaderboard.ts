'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type TimeFilter = '24h' | '7d' | '30d' | 'all';
export type SortField = 'profit' | 'volume' | 'apr' | 'tvl' | 'profit_rate' | 'trades' | 'real_apy' | 'grid_apy';
export type SortOrder = 'asc' | 'desc';

export interface LeaderboardEntry {
  rank: number;
  trader: string;
  pair: string;
  gridId: number;
  quoteDecimals: number;
  volume: string;
  trades: number;
  tvl: string;
  realApy: number;
  gridApy: number;
}

interface ApiLeaderboardEntry {
  rank: number;
  trader: string;
  pair: string;
  grid_id: number;
  quote_decimals?: number;
  profit: string;
  profit_rate: number;
  volume: string;
  trades: number;
  tvl: string;
  apr: number;
  real_apy: number;
  grid_apy: number;
}

interface ApiLeaderboardResponse {
  entries: ApiLeaderboardEntry[];
  total: number;
  period: string;
}

export function useLeaderboard(
  period: TimeFilter = '7d',
  limit: number = 50,
  sortBy: SortField = 'real_apy',
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
        quoteDecimals: e.quote_decimals ?? 18,
        volume: e.volume,
        trades: e.trades,
        tvl: e.tvl,
        realApy: e.real_apy,
        gridApy: e.grid_apy,
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
