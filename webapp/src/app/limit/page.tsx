'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { PriceLine } from '@/types/grid';
import { useStore } from '@/store/useStore';
import { KlinePanel } from '@/components/trading/KlinePanel';
import { LimitOrderForm } from '@/components/trading/LimitOrderForm';
import type { TokenItem } from '@/hooks/useTokens';

export default function LimitOrderPage() {
  return (
    <Suspense>
      <LimitOrderPageWithParams />
    </Suspense>
  );
}

function LimitOrderPageWithParams() {
  const selectedChainId = useStore((s) => s.selectedChainId);
  const setSelectedChainId = useStore((s) => s.setSelectedChainId);
  const searchParams = useSearchParams();

  // Sync chainId from URL on mount
  useEffect(() => {
    const chainIdParam = searchParams.get('chainId');
    if (chainIdParam) {
      const parsed = Number(chainIdParam);
      if (!isNaN(parsed) && parsed !== selectedChainId) {
        setSelectedChainId(parsed);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <LimitOrderPageInner key={selectedChainId} />;
}

function LimitOrderPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedChainId = useStore((s) => s.selectedChainId);

  const [baseToken, setBaseToken] = useState<{
    address: `0x${string}`;
    symbol: string;
    decimals: number;
  } | undefined>(undefined);

  const [quoteToken, setQuoteToken] = useState<{
    address: `0x${string}`;
    symbol: string;
    decimals: number;
  } | undefined>(undefined);

  const [priceLines, setPriceLines] = useState<PriceLine[]>([]);

  // Read initial base/quote from URL params
  const urlBase = searchParams.get('base');
  const urlQuote = searchParams.get('quote');

  const updateUrl = useCallback(
    (base?: string, quote?: string) => {
      const params = new URLSearchParams();
      params.set('chainId', String(selectedChainId));
      if (base) params.set('base', base);
      if (quote) params.set('quote', quote);
      router.replace(`/limit?${params.toString()}`, { scroll: false });
    },
    [selectedChainId, router]
  );

  const handleBaseTokenChange = (token: TokenItem) => {
    setBaseToken({
      address: token.address as `0x${string}`,
      symbol: token.symbol,
      decimals: token.decimals,
    });
    updateUrl(token.address, quoteToken?.address);
  };

  const handleQuoteTokenChange = (token: TokenItem) => {
    setQuoteToken({
      address: token.address as `0x${string}`,
      symbol: token.symbol,
      decimals: token.decimals,
    });
    updateUrl(baseToken?.address, token.address);
  };

  return (
    <div className="p-5">
      <div className="max-w-7xl mx-auto">
        {/* Top Section: Chart + Order Form */}
        <div className="grid lg:grid-cols-3 gap-5 mb-5">
          {/* Chart */}
          <div className="lg:col-span-2">
            <KlinePanel
              onBaseTokenChange={handleBaseTokenChange}
              onQuoteTokenChange={handleQuoteTokenChange}
              chartHeight={500}
              priceLines={priceLines}
              initialBaseAddress={urlBase}
              initialQuoteAddress={urlQuote}
            />
          </div>

          {/* Order Form */}
          <div className="lg:col-span-1">
            <LimitOrderForm
              baseToken={baseToken}
              quoteToken={quoteToken}
              onPriceLinesChange={setPriceLines}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
