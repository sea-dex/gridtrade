'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/Button';
import {
  LayoutGrid,
  Shield,
  TrendingUp,
  Zap,
  ArrowRight,
  BarChart3,
  Users,
  DollarSign,
} from 'lucide-react';

export default function HomePage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Zap,
      titleKey: 'home.features.automated.title',
      descKey: 'home.features.automated.description',
      accent: 'var(--amber)',
      accentDim: 'var(--amber-dim)',
    },
    {
      icon: Shield,
      titleKey: 'home.features.decentralized.title',
      descKey: 'home.features.decentralized.description',
      accent: 'var(--accent)',
      accentDim: 'var(--accent-dim)',
    },
    {
      icon: TrendingUp,
      titleKey: 'home.features.profitable.title',
      descKey: 'home.features.profitable.description',
      accent: 'var(--green)',
      accentDim: 'var(--green-dim)',
    },
    {
      icon: LayoutGrid,
      titleKey: 'home.features.secure.title',
      descKey: 'home.features.secure.description',
      accent: '#a78bfa',
      accentDim: 'rgba(167, 139, 250, 0.10)',
    },
  ];

  const stats = [
    { labelKey: 'home.stats.total_volume', value: '$12.5M', icon: BarChart3 },
    { labelKey: 'home.stats.total_tvl', value: '$3.2M', icon: DollarSign },
    { labelKey: 'home.stats.total_grids', value: '1,234', icon: LayoutGrid },
    { labelKey: 'home.stats.total_users', value: '5,678', icon: Users },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 px-5 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-(--accent) opacity-[0.04] rounded-full blur-[200px]" />

        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-5 tracking-tight">
            <span className="gradient-text">{t('home.title')}</span>
          </h1>
          <p className="text-lg md:text-xl text-(--text-secondary) mb-3 font-medium">
            {t('home.subtitle')}
          </p>
          <p className="text-[15px] text-(--text-tertiary) max-w-xl mx-auto mb-10 leading-relaxed">
            {t('home.description')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/grid">
              <Button size="lg">
                {t('home.get_started')}
                <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/docs">
              <Button variant="secondary" size="lg">
                {t('home.learn_more')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 px-5 border-y border-(--border-subtle)">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-5 rounded-(--radius-lg) bg-(--bg-surface) border border-(--border-subtle)"
              >
                <stat.icon className="w-6 h-6 mx-auto mb-2.5 text-(--accent)" strokeWidth={1.5} />
                <div className="text-2xl font-bold text-(--text-primary) mb-0.5 tracking-tight">{stat.value}</div>
                <div className="text-[12px] text-(--text-disabled)">{t(stat.labelKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 tracking-tight text-(--text-primary)">
            {t('home.features.title')}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-5 rounded-(--radius-lg) bg-(--bg-surface) border border-(--border-subtle) hover:border-(--border-default) transition-colors duration-150 animate-fade-in"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div
                  className="w-10 h-10 rounded-(--radius-md) flex items-center justify-center mb-3.5"
                  style={{ background: feature.accentDim }}
                >
                  <feature.icon className="w-5 h-5" style={{ color: feature.accent }} strokeWidth={1.5} />
                </div>
                <h3 className="text-[15px] font-semibold mb-1.5 text-(--text-primary)">{t(feature.titleKey)}</h3>
                <p className="text-[13px] text-(--text-tertiary) leading-relaxed">{t(feature.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-5">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-10 rounded-(--radius-xl) bg-(--bg-surface) border border-(--border-default) relative overflow-hidden">
            {/* Subtle glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-(--accent) opacity-[0.04] blur-[100px] rounded-full" />

            <div className="relative">
              <h2 className="text-2xl font-bold mb-3 tracking-tight text-(--text-primary)">Ready to Start Grid Trading?</h2>
              <p className="text-[14px] text-(--text-tertiary) mb-7 max-w-md mx-auto leading-relaxed">
                Connect your wallet and start earning profits from market volatility with our automated grid trading protocol.
              </p>
              <Link href="/grid">
                <Button size="lg">
                  Launch App
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
