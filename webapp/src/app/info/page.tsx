'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useStats } from '@/hooks/useStats';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { SimpleBarChart } from '@/components/ui/SimpleBarChart';
import { formatNumber } from '@/lib/utils';
import { formatBigNumber } from '@/lib/formatBigNumber';
import {
  BarChart3,
  DollarSign,
  LayoutGrid,
  Activity,
  TrendingUp,
  Users,
} from 'lucide-react';

export default function InfoPage() {
  const { t } = useTranslation();
  const { stats: protocolStats, volumeHistory, tvlHistory, isLoading } = useStats();

  // Convert volume_history string values to numbers for the chart
  const volumeChartData = volumeHistory.map((d) => ({
    date: d.date,
    volume: parseFloat(d.volume) || 0,
  }));

  // Convert tvl_history string values to numbers for the chart
  const tvlChartData = tvlHistory.map((d) => ({
    date: d.date,
    tvl: parseFloat(d.tvl) || 0,
  }));

  const stats = [
    {
      label: t('info.total_volume'),
      value: isLoading || !protocolStats ? '--' : `$${formatBigNumber(protocolStats.total_volume)}`,
      icon: BarChart3,
      accent: 'var(--accent)',
      accentDim: 'var(--accent-dim)',
    },
    {
      label: t('info.total_tvl'),
      value: isLoading || !protocolStats ? '--' : `$${formatBigNumber(protocolStats.total_tvl)}`,
      icon: DollarSign,
      accent: 'var(--green)',
      accentDim: 'var(--green-dim)',
    },
    {
      label: t('info.total_grids'),
      value: isLoading || !protocolStats ? '--' : formatNumber(protocolStats.total_grids, 0),
      icon: LayoutGrid,
      accent: '#a78bfa',
      accentDim: 'rgba(167,139,250,0.10)',
    },
    {
      label: t('info.total_trades'),
      value: isLoading || !protocolStats ? '--' : formatNumber(protocolStats.total_trades, 0),
      icon: Activity,
      accent: 'var(--amber)',
      accentDim: 'var(--amber-dim)',
    },
    {
      label: t('info.total_profit'),
      value: isLoading || !protocolStats ? '--' : `$${formatBigNumber(protocolStats.total_profit)}`,
      icon: TrendingUp,
      accent: 'var(--green)',
      accentDim: 'var(--green-dim)',
    },
    {
      label: 'Active Users',
      value: isLoading || !protocolStats ? '--' : formatNumber(protocolStats.active_users, 0),
      icon: Users,
      accent: '#f472b6',
      accentDim: 'rgba(244,114,182,0.10)',
    },
  ];

  // Calculate growth percentages for chart footers
  const volumeGrowth = volumeChartData.length >= 2
    ? ((volumeChartData[volumeChartData.length - 1].volume - volumeChartData[0].volume) /
        (volumeChartData[0].volume || 1) * 100).toFixed(1)
    : '0.0';

  const tvlGrowth = tvlChartData.length >= 2
    ? ((tvlChartData[tvlChartData.length - 1].tvl - tvlChartData[0].tvl) /
        (tvlChartData[0].tvl || 1) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="p-5">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-(--text-primary) tracking-tight mb-1">{t('info.title')}</h1>
          <p className="text-[13px] text-(--text-tertiary)">{t('info.overview')}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {stats.map((stat, index) => (
            <Card key={index} variant="bordered" className="p-4">
              <CardContent className="p-0">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[12px] text-(--text-disabled) mb-1">{stat.label}</p>
                    <p className="text-xl font-bold text-(--text-primary) tracking-tight">{stat.value}</p>
                  </div>
                  <div
                    className="p-2 rounded-(--radius-sm)"
                    style={{ background: stat.accentDim }}
                  >
                    <stat.icon className="w-4 h-4" style={{ color: stat.accent }} strokeWidth={1.5} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>{t('info.volume_chart')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading || volumeChartData.length === 0 ? (
                <div className="flex items-center justify-center h-44 text-(--text-disabled) text-sm">
                  {isLoading ? 'Loading...' : 'No data'}
                </div>
              ) : (
                <>
                  <SimpleBarChart data={volumeChartData} dataKey="volume" color="bg-(--accent)" />
                  <div className="mt-3 flex items-center justify-between text-[13px]">
                    <span className="text-(--text-disabled)">Trading Volume</span>
                    <span className="text-(--accent) font-medium">
                      +{volumeGrowth}%
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardHeader>
              <CardTitle>{t('info.tvl_chart')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading || tvlChartData.length === 0 ? (
                <div className="flex items-center justify-center h-44 text-(--text-disabled) text-sm">
                  {isLoading ? 'Loading...' : 'No data'}
                </div>
              ) : (
                <>
                  <SimpleBarChart data={tvlChartData} dataKey="tvl" color="bg-(--green)" />
                  <div className="mt-3 flex items-center justify-between text-[13px]">
                    <span className="text-(--text-disabled)">Total Value Locked</span>
                    <span className="text-(--green) font-medium">
                      +{tvlGrowth}%
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Protocol Info */}
        <div className="mt-5">
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>Protocol Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <h4 className="text-sm font-medium text-(--text-primary) mb-2.5">Supported Chains</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {['Ethereum', 'BNB Chain', 'Base', 'BSC Testnet'].map((chain) => (
                      <span
                        key={chain}
                        className="px-2.5 py-1 bg-(--bg-elevated) border border-(--border-subtle) rounded-(--radius-full) text-[12px] text-(--text-secondary)"
                      >
                        {chain}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-(--text-primary) mb-2.5">Contract Addresses</h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-3 py-2 bg-(--bg-inset) border border-(--border-subtle) rounded-(--radius-sm)">
                      <span className="text-[12px] text-(--text-disabled)">GridEx</span>
                      <code className="text-[12px] font-mono text-(--text-secondary)">0x4027...BCD8</code>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
