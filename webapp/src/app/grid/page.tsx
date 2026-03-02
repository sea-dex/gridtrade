'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { PriceLine } from '@/types/grid';
import { useStore } from '@/store/useStore';
import { KlinePanel } from '@/components/trading/KlinePanel';
import { GridOrderForm } from '@/components/trading/GridOrderForm';
import type { ExternalGridFormData } from '@/components/trading/GridOrderForm';
import { GridOrderList } from '@/components/trading/GridOrderList';
import { AiStrategyInput } from '@/components/trading/AiStrategyInput';
import type { TokenItem } from '@/hooks/useTokens';
import type { AiStrategyResult } from '@/hooks/useAiStrategy';
import type { KlineInterval } from '@/hooks/useKline';

// Default interval for kline
const DEFAULT_INTERVAL: KlineInterval = '4h';

export default function GridTradingPage() {
  return (
    <Suspense>
      <GridTradingPageWithParams />
    </Suspense>
  );
}

function GridTradingPageWithParams() {
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

  return <GridTradingPageInner key={selectedChainId} />;
}

function GridTradingPageInner() {
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
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [externalFormData, setExternalFormData] = useState<ExternalGridFormData | undefined>(undefined);

  // Read interval from URL, default to 4h
  const urlInterval = searchParams.get('interval') as KlineInterval | null;
  const [interval, setInterval] = useState<KlineInterval>(
    urlInterval && ['1m', '5m', '15m', '1h', '4h', '1d', '1w'].includes(urlInterval)
      ? urlInterval
      : DEFAULT_INTERVAL
  );

  const handleStrategyGenerated = useCallback((strategy: AiStrategyResult) => {
    setExternalFormData({ ...strategy });
  }, []);

  // Read initial base/quote from URL params
  const urlBase = searchParams.get('base');
  const urlQuote = searchParams.get('quote');

  const updateUrl = useCallback(
    (base?: string, quote?: string, newInterval?: KlineInterval) => {
      const params = new URLSearchParams();
      params.set('chainId', String(selectedChainId));
      if (base) params.set('base', base);
      if (quote) params.set('quote', quote);
      params.set('interval', newInterval ?? interval);
      router.replace(`/grid?${params.toString()}`, { scroll: false });
    },
    [selectedChainId, router, interval]
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

  const handleIntervalChange = (newInterval: KlineInterval) => {
    setInterval(newInterval);
    updateUrl(baseToken?.address, quoteToken?.address, newInterval);
  };

  return (
    <div className="p-5">
      <div className="max-w-7xl mx-auto">
        {/* Top Section: Chart + Order Form */}
        <div className="grid lg:grid-cols-3 gap-5 mb-5">
          {/* Chart + AI Input */}
          <div className="lg:col-span-2">
            <KlinePanel
              onBaseTokenChange={handleBaseTokenChange}
              onQuoteTokenChange={handleQuoteTokenChange}
              onCurrentPriceChange={setCurrentPrice}
              chartHeight={500}
              priceLines={priceLines}
              initialBaseAddress={urlBase}
              initialQuoteAddress={urlQuote}
              initialInterval={interval}
              onIntervalChange={handleIntervalChange}
            />
            <AiStrategyInput
              baseToken={baseToken}
              quoteToken={quoteToken}
              currentPrice={currentPrice}
              onStrategyGenerated={handleStrategyGenerated}
            />
          </div>

          {/* Order Form */}
          <div className="lg:col-span-1">
            <GridOrderForm
              baseToken={baseToken}
              quoteToken={quoteToken}
              onPriceLinesChange={setPriceLines}
              externalFormData={externalFormData}
            />
          </div>
        </div>

        {/* Order List */}
        <GridOrderList />
      </div>
    </div>
  );
}
