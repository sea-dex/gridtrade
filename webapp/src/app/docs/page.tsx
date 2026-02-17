'use client';

import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent } from '@/components/ui/Card';
import { DocsPageNav } from './_components/DocsPageNav';
import {
  BookOpen,
  Code,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  LayoutGrid,
  Zap,
  Shield,
} from 'lucide-react';

export default function DocsPage() {
  const { t } = useTranslation();

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: BookOpen,
      description: 'Learn the basics of GridEx and grid trading',
      href: '/docs/user-guide',
      items: [
        'What is Grid Trading?',
        'Connecting Your Wallet',
        'Supported Networks',
      ],
    },
    {
      id: 'grid-trading',
      title: 'Grid Trading Guide',
      icon: LayoutGrid,
      description: 'Create, manage, and optimize your grid strategies',
      href: '/docs/user-guide',
      items: [
        'Creating a Grid Order',
        'Managing Your Grids',
        'Understanding Fees',
      ],
    },
    {
      id: 'api-docs',
      title: 'API Documentation',
      icon: Code,
      description: 'REST API endpoints for interacting with GridEx',
      href: '/docs/api',
      items: [
        'REST API Overview',
        'Endpoints Reference',
        'Rate Limiting',
      ],
    },
    {
      id: 'faq',
      title: 'FAQ',
      icon: HelpCircle,
      description: 'Commonly asked questions about GridEx',
      href: '/docs/user-guide#faq',
      items: [
        'Fees & Costs',
        'Security & Safety',
        'Troubleshooting',
      ],
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-(--text-primary) mb-1.5">
          {t('nav.docs')}
        </h1>
        <p className="text-(--text-secondary) text-sm">
          Learn how to use GridEx protocol for automated grid trading
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-3 mb-8">
        <Link href="/docs/user-guide">
          <Card
            variant="bordered"
            className="p-4 hover:border-(--accent-muted) transition-colors cursor-pointer"
          >
            <CardContent className="p-0 flex items-center gap-3">
              <div className="p-2 bg-(--accent)/10 rounded-lg">
                <Zap className="w-5 h-5 text-(--accent)" />
              </div>
              <div>
                <h3 className="font-medium text-(--text-primary) text-sm">
                  Quick Start
                </h3>
                <p className="text-xs text-(--text-tertiary)">
                  Get started in 5 minutes
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/docs/user-guide#creating-a-grid-order">
          <Card
            variant="bordered"
            className="p-4 hover:border-(--accent-muted) transition-colors cursor-pointer"
          >
            <CardContent className="p-0 flex items-center gap-3">
              <div className="p-2 bg-(--accent-dim) rounded-lg">
                <LayoutGrid className="w-5 h-5 text-(--accent)" />
              </div>
              <div>
                <h3 className="font-medium text-(--text-primary) text-sm">
                  Grid Strategies
                </h3>
                <p className="text-xs text-(--text-tertiary)">
                  Learn trading strategies
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/docs/api">
          <Card
            variant="bordered"
            className="p-4 hover:border-(--accent-muted) transition-colors cursor-pointer"
          >
            <CardContent className="p-0 flex items-center gap-3">
              <div className="p-2 bg-[#a855f7]/10 rounded-lg">
                <Code className="w-5 h-5 text-[#a855f7]" />
              </div>
              <div>
                <h3 className="font-medium text-(--text-primary) text-sm">
                  API Reference
                </h3>
                <p className="text-xs text-(--text-tertiary)">
                  REST API documentation
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Documentation Sections */}
      <div id="sections" className="space-y-4">
        {sections.map((section) => (
          <Link key={section.id} href={section.href}>
            <Card
              variant="bordered"
              className="p-5 hover:border-(--border-default) transition-colors cursor-pointer group"
            >
              <CardContent className="p-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-(--bg-elevated) rounded-lg shrink-0 mt-0.5">
                      <section.icon className="w-5 h-5 text-(--accent)" />
                    </div>
                    <div>
                      <h3
                        id={section.id}
                        className="font-semibold text-(--text-primary) text-sm mb-1 scroll-mt-24"
                      >
                        {section.title}
                      </h3>
                      <p className="text-xs text-(--text-tertiary) mb-2">
                        {section.description}
                      </p>
                      <ul className="flex flex-wrap gap-x-4 gap-y-1">
                        {section.items.map((item) => (
                          <li
                            key={item}
                            className="text-xs text-(--text-secondary)"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-(--text-disabled) group-hover:text-(--text-primary) shrink-0 mt-1 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* External Links */}
      <div className="mt-10" id="resources">
        <Card variant="bordered" className="p-5">
          <CardContent className="p-0">
            <h3 className="font-medium text-(--text-primary) text-sm mb-4">
              External Resources
            </h3>
            <div className="flex flex-wrap gap-5">
              <a
                href="https://github.com/sea-dex"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-(--accent) hover:text-(--accent-muted) text-sm transition-colors"
              >
                <Code className="w-4 h-4" />
                GitHub
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-(--accent) hover:text-(--accent-muted) text-sm transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Whitepaper
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-(--accent) hover:text-(--accent-muted) text-sm transition-colors"
              >
                <Shield className="w-4 h-4" />
                Audit Report
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Previous / Next */}
      <DocsPageNav />
    </div>
  );
}
