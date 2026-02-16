'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// --- TypeScript interfaces matching backend statsResponseSchema ---

export interface ProtocolStats {
  total_volume: string;
  total_tvl: string;
  total_grids: number;
  total_trades: number;
  total_profit: string;
  active_users: number;
}

export interface VolumeData {
  date: string;
  volume: string;
}

export interface TVLData {
  date: string;
  tvl: string;
}

interface StatsResponse {
  protocol: ProtocolStats;
  volume_history: VolumeData[];
  tvl_history: TVLData[];
}

export function useStats() {
  const selectedChainId = useStore((s) => s.selectedChainId);
  const [stats, setStats] = useState<ProtocolStats | null>(null);
  const [volumeHistory, setVolumeHistory] = useState<VolumeData[]>([]);
  const [tvlHistory, setTvlHistory] = useState<TVLData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/stats/?chain_id=${selectedChainId}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: StatsResponse = await res.json();
      setStats(data.protocol);
      setVolumeHistory(data.volume_history ?? []);
      setTvlHistory(data.tvl_history ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      setStats(null);
      setVolumeHistory([]);
      setTvlHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedChainId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, volumeHistory, tvlHistory, isLoading, error, refetch: fetchStats };
}
