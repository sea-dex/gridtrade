'use client';

import { useState } from 'react';
import type { PriceLine } from '@/types/grid';
import { useStore } from '@/store/useStore';
import { KlinePanel } from '@/components/trading/KlinePanel';
import { GridOrderForm } from '@/components/trading/GridOrderForm';
import { GridOrderList } from '@/components/trading/GridOrderList';
import type { TokenItem } from '@/hooks/useTokens';

/**
 * Wrapper that uses selectedChainId as a React key so the entire page
 * remounts (resetting all local token state) when the chain switches.
 */
export default function GridTradingPage() {
  const selectedChainId = useStore((s) => s.selectedChainId);
  return <GridTradingPageInner key={selectedChainId} />;
}

function GridTradingPageInner() {
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

  const handleBaseTokenChange = (token: TokenItem) => {
    setBaseToken({
      address: token.address as `0x${string}`,
      symbol: token.symbol,
      decimals: token.decimals,
    });
  };

  const handleQuoteTokenChange = (token: TokenItem) => {
    setQuoteToken({
      address: token.address as `0x${string}`,
      symbol: token.symbol,
      decimals: token.decimals,
    });
  };

  return (
    <div className="p-5">
      <div className="max-w-7xl mx-auto">
        {/* Top Section: Chart + Order Form */}
        <div className="grid lg:grid-cols-3 gap-5 mb-5">
          {/* Chart – no title, base/quote selectors below */}
          <div className="lg:col-span-2">
            <KlinePanel
              onBaseTokenChange={handleBaseTokenChange}
              onQuoteTokenChange={handleQuoteTokenChange}
              chartHeight={500}
              priceLines={priceLines}
            />
          </div>

          {/* Order Form */}
          <div className="lg:col-span-1">
            <GridOrderForm
              baseToken={baseToken}
              quoteToken={quoteToken}
              onPriceLinesChange={setPriceLines}
            />
          </div>
        </div>

        {/* Order List */}
        <GridOrderList />
      </div>
    </div>
  );
}
