'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/Button';
import { ParticleGrid } from '@/components/animations/ParticleGrid';
import {
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
  FloatingElement,
  GlowCard,
} from '@/components/animations/ScrollReveal';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  Shield,
  TrendingUp,
  Zap,
  ArrowRight,
  BarChart3,
  Users,
  DollarSign,
  ChevronDown,
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
    <div className="min-h-screen relative">
      {/* Particle Background */}
      <ParticleGrid />

      {/* Hero */}
      <section className="relative py-24 md:py-32 px-5 overflow-hidden min-h-[85vh] flex items-center">
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[180px]"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -40, 20, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[160px]"
          style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)' }}
          animate={{
            x: [0, -40, 30, 0],
            y: [0, 30, -50, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative max-w-4xl mx-auto text-center w-full z-10">
          {/* Badge */}
          <ScrollReveal delay={0.1} distance={20}>
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-(--border-default) bg-(--bg-surface)/50 backdrop-blur-sm mb-8"
              whileHover={{ scale: 1.05 }}
            >
              <span className="w-2 h-2 rounded-full bg-(--green) animate-pulse" />
              <span className="text-xs text-(--text-secondary) font-medium">
                Live on Monad Testnet
              </span>
            </motion.div>
          </ScrollReveal>

          {/* Title with staggered letter animation */}
          <ScrollReveal delay={0.2} distance={30}>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-[1.1]">
              <span className="hero-gradient-text">{t('home.title')}</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.4} distance={20}>
            <p className="text-lg md:text-xl text-(--text-secondary) mb-4 font-medium max-w-2xl mx-auto">
              {t('home.subtitle')}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.5} distance={20}>
            <p className="text-[15px] text-(--text-tertiary) max-w-xl mx-auto mb-10 leading-relaxed">
              {t('home.description')}
            </p>
          </ScrollReveal>

          <ScrollReveal delay={0.6} distance={20}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/grid">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" className="hero-cta-button">
                    {t('home.get_started')}
                    <ArrowRight size={16} />
                  </Button>
                </motion.div>
              </Link>
              <Link href="/docs">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="secondary" size="lg">
                    {t('home.learn_more')}
                  </Button>
                </motion.div>
              </Link>
            </div>
          </ScrollReveal>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-[-60px] left-1/2 -translate-x-1/2"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-5 h-5 text-(--text-disabled)" />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-16 px-5 border-y border-(--border-subtle) z-10">
        <div className="max-w-4xl mx-auto">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4" staggerDelay={0.12}>
            {stats.map((stat, index) => (
              <StaggerItem key={index}>
                <motion.div
                  className="text-center p-6 rounded-(--radius-lg) bg-(--bg-surface)/60 backdrop-blur-sm border border-(--border-subtle) hover:border-(--border-default) transition-colors duration-300"
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <stat.icon className="w-6 h-6 mx-auto mb-3 text-(--accent)" strokeWidth={1.5} />
                  <motion.div
                    className="text-2xl md:text-3xl font-bold text-(--text-primary) mb-1 tracking-tight"
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.5, type: 'spring' }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-[12px] text-(--text-disabled)">{t(stat.labelKey)}</div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 px-5 z-10">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 tracking-tight text-(--text-primary)">
              {t('home.features.title')}
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p className="text-center text-(--text-tertiary) mb-12 max-w-lg mx-auto text-[15px]">
              Built for traders who demand performance, security, and full control over their strategies.
            </p>
          </ScrollReveal>

          <StaggerContainer className="grid md:grid-cols-2 gap-5" staggerDelay={0.15}>
            {features.map((feature, index) => (
              <StaggerItem key={index}>
                <GlowCard>
                  <motion.div
                    className="p-6 rounded-(--radius-lg) bg-(--bg-surface)/60 backdrop-blur-sm border border-(--border-subtle) hover:border-(--border-default) transition-all duration-300 h-full"
                    whileHover={{
                      boxShadow: `0 0 30px ${feature.accentDim}`,
                    }}
                  >
                    <motion.div
                      className="w-12 h-12 rounded-(--radius-md) flex items-center justify-center mb-4"
                      style={{ background: feature.accentDim }}
                      whileHover={{ rotate: 5, scale: 1.1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <feature.icon className="w-6 h-6" style={{ color: feature.accent }} strokeWidth={1.5} />
                    </motion.div>
                    <h3 className="text-[16px] font-semibold mb-2 text-(--text-primary)">{t(feature.titleKey)}</h3>
                    <p className="text-[13px] text-(--text-tertiary) leading-relaxed">{t(feature.descKey)}</p>
                  </motion.div>
                </GlowCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-20 px-5 z-10">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 tracking-tight text-(--text-primary)">
              How It Works
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p className="text-center text-(--text-tertiary) mb-14 max-w-lg mx-auto text-[15px]">
              Start grid trading in three simple steps
            </p>
          </ScrollReveal>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-(--border-default) to-transparent -translate-y-1/2" />

            <StaggerContainer className="grid md:grid-cols-3 gap-8" staggerDelay={0.2}>
              {[
                {
                  step: '01',
                  title: 'Connect Wallet',
                  desc: 'Connect your Web3 wallet to get started with grid trading on Monad.',
                  icon: '🔗',
                },
                {
                  step: '02',
                  title: 'Set Parameters',
                  desc: 'Choose your trading pair, set price range, and configure grid levels.',
                  icon: '⚙️',
                },
                {
                  step: '03',
                  title: 'Start Earning',
                  desc: 'Your grid strategy executes automatically, capturing profits from volatility.',
                  icon: '💰',
                },
              ].map((item, index) => (
                <StaggerItem key={index}>
                  <motion.div
                    className="relative text-center p-6"
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FloatingElement duration={4 + index} distance={6}>
                      <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-(--bg-surface) border border-(--border-default) flex items-center justify-center text-2xl relative z-10">
                        {item.icon}
                      </div>
                    </FloatingElement>
                    <div className="text-xs font-mono text-(--accent) mb-2 tracking-wider">{item.step}</div>
                    <h3 className="text-[16px] font-semibold mb-2 text-(--text-primary)">{item.title}</h3>
                    <p className="text-[13px] text-(--text-tertiary) leading-relaxed">{item.desc}</p>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 px-5 z-10">
        <div className="max-w-2xl mx-auto text-center">
          <ScrollReveal>
            <motion.div
              className="p-12 rounded-(--radius-xl) bg-(--bg-surface)/60 backdrop-blur-sm border border-(--border-default) relative overflow-hidden"
              whileHover={{ borderColor: 'rgba(136, 150, 171, 0.22)' }}
              transition={{ duration: 0.3 }}
            >
              {/* Animated gradient background */}
              <motion.div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  background: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.4) 0%, transparent 50%)',
                }}
                animate={{
                  background: [
                    'radial-gradient(circle at 30% 0%, rgba(99,102,241,0.4) 0%, transparent 50%)',
                    'radial-gradient(circle at 70% 0%, rgba(52,211,153,0.4) 0%, transparent 50%)',
                    'radial-gradient(circle at 50% 0%, rgba(251,191,36,0.4) 0%, transparent 50%)',
                    'radial-gradient(circle at 30% 0%, rgba(99,102,241,0.4) 0%, transparent 50%)',
                  ],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              />

              <div className="relative">
                <FloatingElement duration={5} distance={4}>
                  <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-(--accent-dim) flex items-center justify-center">
                    <LayoutGrid className="w-7 h-7 text-(--accent)" strokeWidth={1.5} />
                  </div>
                </FloatingElement>

                <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight text-(--text-primary)">
                  Ready to Start Grid Trading?
                </h2>
                <p className="text-[14px] text-(--text-tertiary) mb-8 max-w-md mx-auto leading-relaxed">
                  Connect your wallet and start earning profits from market volatility with our automated grid trading protocol.
                </p>
                <Link href="/grid">
                  <motion.div
                    className="inline-block"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button size="lg" className="hero-cta-button">
                      Launch App
                      <ArrowRight size={16} />
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </motion.div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
