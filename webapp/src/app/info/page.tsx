'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { SimpleBarChart } from '@/components/ui/SimpleBarChart';
import { formatNumber } from '@/lib/utils';
import {
  BarChart3,
  DollarSign,
  LayoutGrid,
  Activity,
  TrendingUp,
  Users,
} from 'lucide-react';

const PROTOCOL_STATS = {
  totalVolume: 12500000,
  totalTVL: 3200000,
  totalGrids: 1234,
  totalTrades: 45678,
  totalProfit: 890000,
  activeUsers: 5678,
};

const VOLUME_DATA = [
  { date: '2024-01', volume: 850000 },
  { date: '2024-02', volume: 1200000 },
  { date: '2024-03', volume: 980000 },
  { date: '2024-04', volume: 1500000 },
  { date: '2024-05', volume: 1800000 },
  { date: '2024-06', volume: 2100000 },
  { date: '2024-07', volume: 2400000 },
];

const TVL_DATA = [
  { date: '2024-01', tvl: 500000 },
  { date: '2024-02', tvl: 750000 },
  { date: '2024-03', tvl: 1000000 },
  { date: '2024-04', tvl: 1500000 },
  { date: '2024-05', tvl: 2000000 },
  { date: '2024-06', tvl: 2800000 },
  { date: '2024-07', tvl: 3200000 },
];

export default function InfoPage() {
  const { t } = useTranslation();

  const stats = [
    {
      label: t('info.total_volume'),
      value: `$${formatNumber(PROTOCOL_STATS.totalVolume)}`,
      icon: BarChart3,
      accent: 'var(--accent)',
      accentDim: 'var(--accent-dim)',
    },
    {
      label: t('info.total_tvl'),
      value: `$${formatNumber(PROTOCOL_STATS.totalTVL)}`,
      icon: DollarSign,
      accent: 'var(--green)',
      accentDim: 'var(--green-dim)',
    },
    {
      label: t('info.total_grids'),
      value: formatNumber(PROTOCOL_STATS.totalGrids, 0),
      icon: LayoutGrid,
      accent: '#a78bfa',
      accentDim: 'rgba(167,139,250,0.10)',
    },
    {
      label: t('info.total_trades'),
      value: formatNumber(PROTOCOL_STATS.totalTrades, 0),
      icon: Activity,
      accent: 'var(--amber)',
      accentDim: 'var(--amber-dim)',
    },
    {
      label: t('info.total_profit'),
      value: `$${formatNumber(PROTOCOL_STATS.totalProfit)}`,
      icon: TrendingUp,
      accent: 'var(--green)',
      accentDim: 'var(--green-dim)',
    },
    {
      label: 'Active Users',
      value: formatNumber(PROTOCOL_STATS.activeUsers, 0),
      icon: Users,
      accent: '#f472b6',
      accentDim: 'rgba(244,114,182,0.10)',
    },
  ];

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
              <SimpleBarChart data={VOLUME_DATA} dataKey="volume" color="bg-(--accent)" />
              <div className="mt-3 flex items-center justify-between text-[13px]">
                <span className="text-(--text-disabled)">Monthly Trading Volume</span>
                <span className="text-(--accent) font-medium">
                  +{((VOLUME_DATA[VOLUME_DATA.length - 1].volume - VOLUME_DATA[0].volume) / VOLUME_DATA[0].volume * 100).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardHeader>
              <CardTitle>{t('info.tvl_chart')}</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={TVL_DATA} dataKey="tvl" color="bg-(--green)" />
              <div className="mt-3 flex items-center justify-between text-[13px]">
                <span className="text-(--text-disabled)">Total Value Locked</span>
                <span className="text-(--green) font-medium">
                  +{((TVL_DATA[TVL_DATA.length - 1].tvl - TVL_DATA[0].tvl) / TVL_DATA[0].tvl * 100).toFixed(1)}%
                </span>
              </div>
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
