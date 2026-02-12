'use client';

import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { formatAddress, formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Trophy, Copy, TrendingUp } from 'lucide-react';

type TimeFilter = '24h' | '7d' | '30d' | 'all';

interface LeaderboardEntry {
  rank: number;
  trader: string;
  pair: string;
  profit: number;
  profitRate: number;
  volume: number;
  gridId: number;
}

// Sample data for demo
const SAMPLE_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, trader: '0x1234567890abcdef1234567890abcdef12345678', pair: 'BNB/USDT', profit: 12500, profitRate: 45.2, volume: 125000, gridId: 1 },
  { rank: 2, trader: '0xabcdef1234567890abcdef1234567890abcdef12', pair: 'ETH/USDT', profit: 8900, profitRate: 38.7, volume: 98000, gridId: 2 },
  { rank: 3, trader: '0x9876543210fedcba9876543210fedcba98765432', pair: 'BTC/USDT', profit: 7500, profitRate: 32.1, volume: 85000, gridId: 3 },
  { rank: 4, trader: '0xfedcba9876543210fedcba9876543210fedcba98', pair: 'BNB/USDT', profit: 5200, profitRate: 28.5, volume: 62000, gridId: 4 },
  { rank: 5, trader: '0x5678901234abcdef5678901234abcdef56789012', pair: 'ETH/USDT', profit: 4100, profitRate: 24.3, volume: 48000, gridId: 5 },
  { rank: 6, trader: '0x2345678901abcdef2345678901abcdef23456789', pair: 'BNB/USDC', profit: 3800, profitRate: 22.1, volume: 42000, gridId: 6 },
  { rank: 7, trader: '0x8901234567abcdef8901234567abcdef89012345', pair: 'ETH/USDC', profit: 3200, profitRate: 19.8, volume: 38000, gridId: 7 },
  { rank: 8, trader: '0x3456789012abcdef3456789012abcdef34567890', pair: 'BTC/USDT', profit: 2900, profitRate: 17.5, volume: 35000, gridId: 8 },
  { rank: 9, trader: '0x7890123456abcdef7890123456abcdef78901234', pair: 'BNB/USDT', profit: 2500, profitRate: 15.2, volume: 30000, gridId: 9 },
  { rank: 10, trader: '0x4567890123abcdef4567890123abcdef45678901', pair: 'ETH/USDT', profit: 2100, profitRate: 13.8, volume: 26000, gridId: 10 },
];

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d');

  const timeFilters: { key: TimeFilter; label: string }[] = [
    { key: '24h', label: t('leaderboard.time_filter.24h') },
    { key: '7d', label: t('leaderboard.time_filter.7d') },
    { key: '30d', label: t('leaderboard.time_filter.30d') },
    { key: 'all', label: t('leaderboard.time_filter.all') },
  ];

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-[#eab308]/15 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-[#eab308]" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-8 h-8 rounded-full bg-(--text-tertiary)/15 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-(--text-tertiary)" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-8 h-8 rounded-full bg-[#f97316]/15 flex items-center justify-center">
          <Trophy className="w-4 h-4 text-[#f97316]" />
        </div>
      );
    }
    return (
      <div className="w-8 h-8 rounded-full bg-(--bg-elevated) flex items-center justify-center text-sm font-medium text-(--text-secondary)">
        {rank}
      </div>
    );
  };

  const handleCopyStrategy = (gridId: number) => {
    // In a real app, this would navigate to the grid trading page with pre-filled parameters
    console.log('Copy strategy for grid:', gridId);
  };

  return (
    <div className="p-5">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-(--text-primary) mb-1.5">{t('leaderboard.title')}</h1>
          <p className="text-(--text-secondary) text-sm">{t('leaderboard.subtitle')}</p>
        </div>

        {/* Time Filter */}
        <div className="flex gap-1.5 mb-5">
          {timeFilters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setTimeFilter(filter.key)}
              className={cn(
                'px-3.5 py-2 rounded-lg text-xs font-medium transition-colors',
                timeFilter === filter.key
                  ? 'bg-(--accent) text-white'
                  : 'bg-(--bg-elevated) text-(--text-tertiary) hover:text-(--text-primary)'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <Card variant="bordered">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-(--border-subtle)">
                    <th className="text-left py-3.5 px-5 text-xs font-medium text-(--text-tertiary) uppercase tracking-wider">
                      {t('leaderboard.rank')}
                    </th>
                    <th className="text-left py-3.5 px-5 text-xs font-medium text-(--text-tertiary) uppercase tracking-wider">
                      {t('leaderboard.trader')}
                    </th>
                    <th className="text-left py-3.5 px-5 text-xs font-medium text-(--text-tertiary) uppercase tracking-wider">
                      {t('leaderboard.pair')}
                    </th>
                    <th className="text-right py-3.5 px-5 text-xs font-medium text-(--text-tertiary) uppercase tracking-wider">
                      {t('leaderboard.profit')}
                    </th>
                    <th className="text-right py-3.5 px-5 text-xs font-medium text-(--text-tertiary) uppercase tracking-wider">
                      {t('leaderboard.profit_rate')}
                    </th>
                    <th className="text-right py-3.5 px-5 text-xs font-medium text-(--text-tertiary) uppercase tracking-wider">
                      {t('leaderboard.volume')}
                    </th>
                    <th className="text-right py-3.5 px-5 text-xs font-medium text-(--text-tertiary) uppercase tracking-wider">
                      {/* Actions */}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_LEADERBOARD.map((entry) => (
                    <tr
                      key={entry.rank}
                      className="border-b border-(--border-subtle)/50 hover:bg-(--bg-elevated)/50 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        {getRankBadge(entry.rank)}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-(--text-secondary)">
                            {formatAddress(entry.trader)}
                          </span>
                          <button
                            onClick={() => navigator.clipboard.writeText(entry.trader)}
                            className="text-(--text-disabled) hover:text-(--text-primary) transition-colors"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="font-medium text-sm text-(--text-primary)">{entry.pair}</span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span className="text-(--green) font-medium text-sm">
                          ${formatNumber(entry.profit)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1 text-(--green)">
                          <TrendingUp size={13} />
                          <span className="font-medium text-sm">{entry.profitRate}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <span className="text-(--text-secondary) text-sm">
                          ${formatNumber(entry.volume)}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyStrategy(entry.gridId)}
                        >
                          <Copy size={13} className="mr-1" />
                          {t('leaderboard.copy_strategy')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
