import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Web3Provider } from '@/providers/Web3Provider';
import { MainLayout } from '@/components/layout/MainLayout';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'GridTrade - Decentralized Grid Trading Protocol',
  description: 'Maximize your trading profits with automated grid trading strategies on-chain',
  keywords: ['grid trading', 'defi', 'decentralized', 'crypto', 'trading', 'blockchain'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Web3Provider>
          <MainLayout>{children}</MainLayout>
        </Web3Provider>
      </body>
    </html>
  );
}
