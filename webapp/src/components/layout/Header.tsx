'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useTranslation } from '@/hooks/useTranslation';
import { localeNames, Locale } from '@/i18n';
import { cn } from '@/lib/utils';
import { Menu, X, Globe, ChevronDown, Bell } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';

export function Header() {
  const { t, locale, setLocale } = useTranslation();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);

  const navItems = [
    { href: '/', label: t('nav.home') },
    { href: '/grid', label: t('nav.grid_trading') },
    { href: '/limit', label: t('nav.limit_order') },
    { href: '/leaderboard', label: t('nav.leaderboard') },
    { href: '/info', label: t('nav.info') },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Promo banner — Kamino style */}
      <div className="bg-[#111a2e]/80 border-b border-[rgba(136,150,171,0.06)]">
        <div className="flex items-center justify-center gap-2 py-2 px-4 text-[13px] tracking-[-0.01em]">
          <span className="text-[#6b7a8d]">Start grid trading and earn up to</span>
          <span className="font-semibold text-(--accent)">30% APY</span>
          <Link href="/grid" className="inline-flex items-center gap-1.5 text-(--accent) hover:text-(--accent-muted) transition-colors font-medium">
            Start Now
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Main header — Kamino style: dark bg, no heavy borders, generous height */}
      <div className="relative flex h-[60px] items-center px-5 md:px-6 bg-[#0b1221]/95 backdrop-blur-xl border-b border-[rgba(136,150,171,0.06)]">
        {/* Logo — Kamino-style lowercase branding */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-(--accent) flex items-center justify-center">
            <span className="text-[#0b1221] font-bold text-xs tracking-tight">GX</span>
          </div>
          <span className="font-semibold text-[20px] text-white hidden sm:block tracking-[-0.02em]">gridex</span>
        </Link>

        {/* Centered Navigation — desktop, Kamino style */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-[15px] font-medium transition-all duration-200 whitespace-nowrap tracking-[-0.01em]',
                  isActive
                    ? 'text-white'
                    : 'text-[#6b7a8d] hover:text-[#c0cad8]'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Notifications — Kamino style */}
          <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[rgba(136,150,171,0.06)] text-[#5a6a80] hover:text-[#8896ab] transition-colors relative">
            <Bell size={18} strokeWidth={1.8} />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-(--accent) rounded-full" />
          </button>

          {/* Language */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-1.5 h-10 px-3 rounded-xl hover:bg-[rgba(136,150,171,0.06)] text-[#5a6a80] hover:text-[#8896ab] transition-colors"
            >
              <Globe size={16} strokeWidth={1.8} />
              <span className="hidden sm:inline text-[14px] font-medium">{localeNames[locale]}</span>
              <ChevronDown size={13} className={cn('transition-transform duration-200', isLangOpen && 'rotate-180')} />
            </button>
            {isLangOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl bg-[#162036] border border-[rgba(136,150,171,0.10)] shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-1.5 z-50 animate-slide-down">
                {(Object.keys(localeNames) as Locale[]).map((loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      setLocale(loc);
                      setIsLangOpen(false);
                    }}
                    className={cn(
                      'w-full px-4 py-2.5 text-left text-[14px] font-medium transition-colors',
                      locale === loc
                        ? 'text-(--accent) bg-[rgba(255,255,255,0.06)]'
                        : 'text-[#8896ab] hover:bg-[rgba(136,150,171,0.06)] hover:text-white'
                    )}
                  >
                    {localeNames[loc]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Wallet — Kamino style: outlined/ghost button */}
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    style: {
                      opacity: 0,
                      pointerEvents: 'none' as const,
                      userSelect: 'none' as const,
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          className="h-10 px-5 rounded-xl bg-transparent text-white text-[14px] font-semibold border border-[rgba(136,150,171,0.18)] hover:border-[rgba(136,150,171,0.30)] hover:bg-[rgba(136,150,171,0.04)] active:scale-[0.98] transition-all duration-200 tracking-[-0.01em]"
                        >
                          Connect Wallet
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          className="h-10 px-5 rounded-xl bg-[rgba(248,113,113,0.08)] text-[#f87171] text-[14px] font-semibold border border-[rgba(248,113,113,0.15)] hover:bg-[rgba(248,113,113,0.14)] transition-colors"
                        >
                          Wrong network
                        </button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={openChainModal}
                          className="flex items-center gap-1.5 h-10 px-3 rounded-xl bg-transparent border border-[rgba(136,150,171,0.14)] hover:border-[rgba(136,150,171,0.25)] transition-colors"
                        >
                          {chain.hasIcon && (
                            <div
                              className="w-5 h-5 rounded-full overflow-hidden"
                              style={{ background: chain.iconBackground }}
                            >
                              {chain.iconUrl && (
                                <Image
                                  alt={chain.name ?? 'Chain icon'}
                                  src={chain.iconUrl}
                                  width={20}
                                  height={20}
                                  className="w-5 h-5"
                                  unoptimized
                                />
                              )}
                            </div>
                          )}
                        </button>

                        <button
                          onClick={openAccountModal}
                          className="flex items-center gap-2.5 h-10 px-4 rounded-xl bg-transparent border border-[rgba(136,150,171,0.14)] hover:border-[rgba(136,150,171,0.25)] transition-colors"
                        >
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-white to-[#8896ab]" />
                          <span className="text-[14px] font-medium text-white tracking-[-0.01em]">
                            {account.displayName}
                          </span>
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>

          {/* Mobile menu toggle — Kamino style */}
          <button
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="ml-1 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[rgba(136,150,171,0.06)] text-[#8896ab] hover:text-white transition-colors md:hidden"
          >
            {isMobileMenuOpen ? <X size={20} strokeWidth={1.8} /> : <Menu size={20} strokeWidth={1.8} />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer — Kamino style */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#0b1221]/80 backdrop-blur-sm z-40 md:hidden"
            onClick={closeMobileMenu}
          />
          {/* Drawer */}
          <div className="fixed top-[calc(60px+41px)] left-0 right-0 z-50 md:hidden animate-slide-down">
            <nav className="bg-[#111a2e] border-b border-[rgba(136,150,171,0.08)] px-5 py-4 flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={cn(
                      'px-4 py-3 rounded-xl text-[16px] font-medium transition-all duration-200 tracking-[-0.01em]',
                      isActive
                        ? 'text-white'
                        : 'text-[#6b7a8d] hover:text-white'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
