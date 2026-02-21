'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/hooks/useTranslation';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  ArrowLeftRight,
  Trophy,
  BarChart3,
  FileText,
  Home,
  ExternalLink,
  Github,
  Twitter,
  MessageCircle,
  Send,
} from 'lucide-react';

const navItems = [
  { href: '/', icon: Home, labelKey: 'nav.home' },
  { href: '/grid', icon: LayoutGrid, labelKey: 'nav.grid_trading' },
  { href: '/limit', icon: ArrowLeftRight, labelKey: 'nav.limit_order' },
  { href: '/leaderboard', icon: Trophy, labelKey: 'nav.leaderboard' },
  { href: '/info', icon: BarChart3, labelKey: 'nav.info' },
  { href: '/docs', icon: FileText, labelKey: 'nav.docs' },
];

const socialLinks = [
  { href: 'https://twitter.com', icon: Twitter, label: 'Twitter' },
  { href: 'https://t.me/gridtradexyz', icon: Send, label: 'Telegram' },
  { href: 'https://discord.com', icon: MessageCircle, label: 'Discord' },
  { href: 'https://github.com', icon: Github, label: 'GitHub' },
];

export function Sidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { isSidebarOpen } = useStore();

  return (
    <>
      {/* Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-(--bg-base)/70 backdrop-blur-sm z-30 md:hidden" />
      )}

      <aside
        className={cn(
          'fixed left-0 top-[calc(3.5rem+33px)] z-40 h-[calc(100vh-3.5rem-33px)] w-56 border-r border-(--border-subtle) bg-(--bg-base) transition-transform duration-200 ease-out md:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Nav */}
          <nav className="flex-1 flex flex-col gap-0.5 p-3 pt-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-(--radius-sm) text-[13px] font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-[rgba(136,150,171,0.08)] text-(--text-primary)'
                      : 'text-(--text-secondary) hover:bg-[rgba(136,150,171,0.04)] hover:text-(--text-primary)'
                  )}
                >
                  <item.icon size={16} strokeWidth={isActive ? 2 : 1.5} className={isActive ? 'text-(--accent)' : ''} />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>

          {/* Bottom */}
          <div className="p-3 border-t border-(--border-subtle)">
            <div className="mb-3 space-y-0.5">
              <a
                href="https://docs.gridex.io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-(--radius-sm) text-[13px] text-(--text-tertiary) hover:bg-[rgba(136,150,171,0.04)] hover:text-(--text-secondary) transition-colors"
              >
                <span>Documentation</span>
                <ExternalLink size={12} />
              </a>
              <a
                href="https://github.com/gridex"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-(--radius-sm) text-[13px] text-(--text-tertiary) hover:bg-[rgba(136,150,171,0.04)] hover:text-(--text-secondary) transition-colors"
              >
                <span>Security</span>
                <ExternalLink size={12} />
              </a>
            </div>

            {/* Social */}
            <div className="flex items-center justify-center gap-1">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-(--radius-sm) text-(--text-disabled) hover:text-(--text-secondary) hover:bg-[rgba(136,150,171,0.04)] transition-colors"
                  title={link.label}
                >
                  <link.icon size={15} />
                </a>
              ))}
            </div>

            <div className="mt-3 text-center">
              <span className="text-[11px] text-(--text-disabled)">v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
