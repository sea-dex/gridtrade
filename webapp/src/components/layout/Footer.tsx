'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import {
  Github,
  Twitter,
  BookOpen,
  ExternalLink,
  Mail,
} from 'lucide-react';

const socialLinks = [
  { icon: Twitter, href: 'https://x.com/sea_protocol', label: 'Twitter' },
  { icon: Github, href: 'https://github.com/sea-dex', label: 'GitHub' },
  { icon: BookOpen, href: 'https://medium.com/@seaprotocol', label: 'Medium' },
];

export function Footer() {
  const { t } = useTranslation();

  const productLinks = [
    { label: t('footer.grid_trading'), href: '/grid' },
    { label: t('footer.limit_order'), href: '/limit' },
    { label: t('footer.leaderboard'), href: '/leaderboard' },
    { label: t('footer.analytics'), href: '/info' },
  ];

  const resourceLinks = [
    { label: t('footer.documentation'), href: '/docs' },
    { label: t('footer.api_reference'), href: '/docs/api', external: false },
    { label: t('footer.smart_contracts'), href: 'https://bscscan.com', external: true },
    { label: t('footer.bug_bounty'), href: 'https://github.com/sea-dex/security', external: true },
  ];

  const communityLinks = [
    { label: 'Twitter / X', href: 'https://x.com/sea_protocol', external: true },
    { label: 'Medium', href: 'https://medium.com/@seaprotocol', external: true },
    { label: 'GitHub', href: 'https://github.com/sea-dex', external: true },
    { label: t('footer.governance'), href: '#', external: false },
  ];

  return (
    <footer className="relative z-10 border-t border-[rgba(136,150,171,0.06)] bg-[#080e1a]">
      {/* Main footer content */}
      <div className="max-w-6xl mx-auto px-5 md:px-6 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
          {/* Brand column */}
          <div className="md:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5">
              <Image
                src="/logo.svg"
                alt="GridTrade Logo"
                width={28}
                height={28}
                className="w-7 h-7"
                unoptimized
              />
              <span className="font-semibold text-[17px] text-white tracking-[-0.02em]">
                GridTrade
              </span>
            </Link>
            <p className="text-[13px] text-[#5a6a80] leading-relaxed max-w-70 mb-6">
              {t('footer.tagline')}
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-[rgba(136,150,171,0.04)] border border-[rgba(136,150,171,0.06)] text-[#5a6a80] hover:text-[#c0cad8] hover:border-[rgba(136,150,171,0.14)] hover:bg-[rgba(136,150,171,0.08)] transition-all duration-200"
                >
                  <social.icon size={16} strokeWidth={1.8} />
                </a>
              ))}
            </div>
          </div>

          {/* Product column */}
          <div className="md:col-span-2">
            <h4 className="text-[12px] font-semibold text-[#8896ab] uppercase tracking-[0.08em] mb-4">
              {t('footer.product')}
            </h4>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-[#5a6a80] hover:text-[#c0cad8] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources column */}
          <div className="md:col-span-3">
            <h4 className="text-[12px] font-semibold text-[#8896ab] uppercase tracking-[0.08em] mb-4">
              {t('footer.resources')}
            </h4>
            <ul className="space-y-2.5">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[13px] text-[#5a6a80] hover:text-[#c0cad8] transition-colors duration-200"
                    >
                      {link.label}
                      <ExternalLink size={11} className="opacity-50" />
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-[13px] text-[#5a6a80] hover:text-[#c0cad8] transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Community column */}
          <div className="md:col-span-3">
            <h4 className="text-[12px] font-semibold text-[#8896ab] uppercase tracking-[0.08em] mb-4">
              {t('footer.community')}
            </h4>
            <ul className="space-y-2.5">
              {communityLinks.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[13px] text-[#5a6a80] hover:text-[#c0cad8] transition-colors duration-200"
                    >
                      {link.label}
                      <ExternalLink size={11} className="opacity-50" />
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-[13px] text-[#5a6a80] hover:text-[#c0cad8] transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[rgba(136,150,171,0.06)]">
        <div className="max-w-6xl mx-auto px-5 md:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="text-[12px] text-[#3d4d63]">
              © {new Date().getFullYear()} GridTrade
            </span>
            <span className="hidden sm:inline text-[#3d4d63]/40">·</span>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
              <span className="text-[11px] text-[#3d4d63]">
                {t('footer.all_systems_operational')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <Link
              href="/terms"
              className="text-[12px] text-[#3d4d63] hover:text-[#5a6a80] transition-colors"
            >
              {t('footer.terms')}
            </Link>
            <Link
              href="/privacy"
              className="text-[12px] text-[#3d4d63] hover:text-[#5a6a80] transition-colors"
            >
              {t('footer.privacy')}
            </Link>
            <a
              href="mailto:seaprotocol@outlook.com"
              className="text-[12px] text-[#3d4d63] hover:text-[#5a6a80] transition-colors inline-flex items-center gap-1"
            >
              <Mail size={11} />
              {t('footer.contact')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
