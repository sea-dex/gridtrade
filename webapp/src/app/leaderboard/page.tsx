'use client';

import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useLeaderboard, type TimeFilter, type SortField, type SortOrder } from '@/hooks/useLeaderboard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { formatAddress, formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Trophy, Copy, TrendingUp, Loader2, ArrowUp, ArrowDown } from 'lucide-react';

type SortableColumn = {
  key: SortField;
  label: string;
  align: 'left' | 'right';
};

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d');
  const [sortBy, setSortBy] = useState<SortField>('profit');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const { entries, isLoading, error } = useLeaderboard(timeFilter, 50, sortBy, sortOrder);

  const timeFilters: { key: TimeFilter; label: string }[] = [
    { key: '24h', label: t('leaderboard.time_filter.24h') },
    { key: '7d', label: t('leaderboard.time_filter.7d') },
    { key: '30d', label: t('leaderboard.time_filter.30d') },
    { key: 'all', label: t('leaderboard.time_filter.all') },
  ];

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return null;
    return sortOrder === 'desc' ? (
      <ArrowDown size={12} className="inline ml-0.5" />
    ) : (
      <ArrowUp size={12} className="inline ml-0.5" />
    );
  };

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
                  ? 'bg-(--text-primary) text-(--bg-base)'
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
                    <th
                      className="text-right py-3.5 px-5 text-xs font-medium uppercase tracking-wider cursor-pointer select-none hover:text-(--text-primary) transition-colors"
                      onClick={() => handleSort('profit')}
                    >
                      <span className={cn(sortBy === 'profit' ? 'text-(--text-primary)' : 'text-(--text-tertiary)')}>
                        {t('leaderboard.profit')}
                        <SortIndicator field="profit" />
                      </span>
                    </th>
                    <th
                      className="text-right py-3.5 px-5 text-xs font-medium uppercase tracking-wider cursor-pointer select-none hover:text-(--text-primary) transition-colors"
                      onClick={() => handleSort('profit_rate')}
                    >
                      <span className={cn(sortBy === 'profit_rate' ? 'text-(--text-primary)' : 'text-(--text-tertiary)')}>
                        {t('leaderboard.profit_rate')}
                        <SortIndicator field="profit_rate" />
                      </span>
                    </th>
                    <th
                      className="text-right py-3.5 px-5 text-xs font-medium uppercase tracking-wider cursor-pointer select-none hover:text-(--text-primary) transition-colors"
                      onClick={() => handleSort('volume')}
                    >
                      <span className={cn(sortBy === 'volume' ? 'text-(--text-primary)' : 'text-(--text-tertiary)')}>
                        {t('leaderboard.volume')}
                        <SortIndicator field="volume" />
                      </span>
                    </th>
                    <th
                      className="text-right py-3.5 px-5 text-xs font-medium uppercase tracking-wider cursor-pointer select-none hover:text-(--text-primary) transition-colors"
                      onClick={() => handleSort('tvl')}
                    >
                      <span className={cn(sortBy === 'tvl' ? 'text-(--text-primary)' : 'text-(--text-tertiary)')}>
                        TVL
                        <SortIndicator field="tvl" />
                      </span>
                    </th>
                    <th
                      className="text-right py-3.5 px-5 text-xs font-medium uppercase tracking-wider cursor-pointer select-none hover:text-(--text-primary) transition-colors"
                      onClick={() => handleSort('apr')}
                    >
                      <span className={cn(sortBy === 'apr' ? 'text-(--text-primary)' : 'text-(--text-tertiary)')}>
                        APR
                        <SortIndicator field="apr" />
                      </span>
                    </th>
                    <th className="text-right py-3.5 px-5 text-xs font-medium text-(--text-tertiary) uppercase tracking-wider">
                      {/* Actions */}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <div className="flex items-center justify-center gap-2 text-(--text-tertiary)">
                          <Loader2 size={16} className="animate-spin" />
                          <span className="text-sm">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <span className="text-sm text-(--red)">{error}</span>
                      </td>
                    </tr>
                  ) : entries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <span className="text-sm text-(--text-tertiary)">No leaderboard data available</span>
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry, index) => (
                      <tr
                        key={`${entry.gridId}-${index}`}
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
                            <span className="font-medium text-sm">{entry.profitRate.toFixed(2)}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <span className="text-(--text-secondary) text-sm">
                            ${formatNumber(entry.volume)}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <span className="text-(--text-secondary) text-sm">
                            ${formatNumber(entry.tvl)}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <span className={cn(
                            'font-medium text-sm',
                            entry.apr > 0 ? 'text-(--green)' : 'text-(--text-secondary)'
                          )}>
                            {entry.apr.toFixed(2)}%
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
