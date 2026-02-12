'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { 
  BookOpen, 
  Code, 
  HelpCircle, 
  ExternalLink,
  ChevronRight,
  LayoutGrid,
  Zap,
  Shield
} from 'lucide-react';

export default function DocsPage() {
  const { t } = useTranslation();

  const sections = [
    {
      title: 'Getting Started',
      icon: BookOpen,
      items: [
        { title: 'What is GridEx?', href: '#what-is-gridex' },
        { title: 'How Grid Trading Works', href: '#how-it-works' },
        { title: 'Connecting Your Wallet', href: '#connect-wallet' },
        { title: 'Supported Networks', href: '#networks' },
      ],
    },
    {
      title: 'Grid Trading Guide',
      icon: LayoutGrid,
      items: [
        { title: 'Creating a Grid Order', href: '#create-grid' },
        { title: 'Understanding Price Ranges', href: '#price-ranges' },
        { title: 'Grid Count & Amount', href: '#grid-count' },
        { title: 'Compound vs Non-Compound', href: '#compound' },
        { title: 'Managing Your Grids', href: '#manage-grids' },
      ],
    },
    {
      title: 'API Documentation',
      icon: Code,
      items: [
        { title: 'REST API Overview', href: '#api-overview' },
        { title: 'Authentication', href: '#api-auth' },
        { title: 'Endpoints Reference', href: '#api-endpoints' },
        { title: 'WebSocket API', href: '#websocket' },
      ],
    },
    {
      title: 'FAQ',
      icon: HelpCircle,
      items: [
        { title: 'What are the fees?', href: '#fees' },
        { title: 'Is my funds safe?', href: '#security' },
        { title: 'How to withdraw profits?', href: '#withdraw' },
        { title: 'Troubleshooting', href: '#troubleshooting' },
      ],
    },
  ];

  return (
    <div className="p-5">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-(--text-primary) mb-1.5">{t('nav.docs')}</h1>
          <p className="text-(--text-secondary) text-sm">
            Learn how to use GridEx protocol for automated grid trading
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-3 mb-8">
          <Card variant="bordered" className="p-4 hover:border-(--accent-muted) transition-colors cursor-pointer">
            <CardContent className="p-0 flex items-center gap-3">
              <div className="p-2 bg-(--accent)/10 rounded-lg">
                <Zap className="w-5 h-5 text-(--accent)" />
              </div>
              <div>
                <h3 className="font-medium text-(--text-primary) text-sm">Quick Start</h3>
                <p className="text-xs text-(--text-tertiary)">Get started in 5 minutes</p>
              </div>
            </CardContent>
          </Card>
          <Card variant="bordered" className="p-4 hover:border-(--accent-muted) transition-colors cursor-pointer">
            <CardContent className="p-0 flex items-center gap-3">
              <div className="p-2 bg-(--accent-dim) rounded-lg">
                <LayoutGrid className="w-5 h-5 text-(--accent)" />
              </div>
              <div>
                <h3 className="font-medium text-(--text-primary) text-sm">Grid Strategies</h3>
                <p className="text-xs text-(--text-tertiary)">Learn trading strategies</p>
              </div>
            </CardContent>
          </Card>
          <Card variant="bordered" className="p-4 hover:border-(--accent-muted) transition-colors cursor-pointer">
            <CardContent className="p-0 flex items-center gap-3">
              <div className="p-2 bg-[#a855f7]/10 rounded-lg">
                <Shield className="w-5 h-5 text-[#a855f7]" />
              </div>
              <div>
                <h3 className="font-medium text-(--text-primary) text-sm">Security</h3>
                <p className="text-xs text-(--text-tertiary)">Audit reports & safety</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documentation Sections */}
        <div className="space-y-5">
          {sections.map((section, index) => (
            <Card key={index} variant="bordered">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <section.icon className="w-5 h-5 text-(--accent)" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-0.5">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <a
                        href={item.href}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-(--bg-elevated) transition-colors group"
                      >
                        <span className="text-(--text-secondary) text-sm group-hover:text-(--text-primary)">
                          {item.title}
                        </span>
                        <ChevronRight className="w-4 h-4 text-(--text-disabled) group-hover:text-(--text-primary)" />
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* What is GridEx Section */}
        <div className="mt-12" id="what-is-gridex">
          <h2 className="text-xl font-bold text-(--text-primary) mb-4">What is GridEx?</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-(--text-secondary) text-sm leading-relaxed mb-4">
              GridEx is a decentralized grid trading protocol that allows traders to automate their trading strategies on-chain. 
              Grid trading is a strategy that profits from market volatility by placing multiple buy and sell orders at predetermined price levels.
            </p>
            <p className="text-(--text-secondary) text-sm leading-relaxed mb-4">
              Unlike traditional centralized exchanges, GridEx executes all trades directly on the blockchain, ensuring:
            </p>
            <ul className="list-disc list-inside text-(--text-secondary) text-sm space-y-2 mb-4">
              <li>Full custody of your funds - you always control your assets</li>
              <li>Transparent execution - all trades are verifiable on-chain</li>
              <li>No counterparty risk - smart contracts handle all operations</li>
              <li>24/7 automated trading - grids work even when you&apos;re offline</li>
            </ul>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mt-12" id="how-it-works">
          <h2 className="text-xl font-bold text-(--text-primary) mb-4">How Grid Trading Works</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-(--text-secondary) text-sm leading-relaxed mb-4">
              Grid trading works by dividing a price range into multiple levels (grids) and placing buy orders below the current price 
              and sell orders above it. When the price moves:
            </p>
            <ol className="list-decimal list-inside text-(--text-secondary) text-sm space-y-2 mb-4">
              <li>If price goes up, sell orders are triggered, taking profit</li>
              <li>If price goes down, buy orders are triggered, accumulating assets</li>
              <li>As price oscillates, the grid continuously captures profits</li>
            </ol>
            <p className="text-(--text-secondary) text-sm leading-relaxed">
              This strategy works best in ranging markets where prices move sideways within a defined range.
            </p>
          </div>
        </div>

        {/* External Links */}
        <div className="mt-12">
          <Card variant="bordered" className="p-5">
            <CardContent className="p-0">
              <h3 className="font-medium text-(--text-primary) text-sm mb-4">External Resources</h3>
              <div className="flex flex-wrap gap-5">
                <a
                  href="https://github.com/gridex"
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
      </div>
    </div>
  );
}
