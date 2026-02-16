'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PriceLine } from '@/types/grid';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { useBaseTokens, useQuoteTokens } from '@/hooks/useTokens';
import type { TokenItem } from '@/hooks/useTokens';
import { useKline } from '@/hooks/useKline';
import type { KlineInterval } from '@/hooks/useKline';
import { TradingViewChart, inferPriceFormat } from './TradingViewChart';
import { BaseTokenDialog } from './BaseTokenDialog';
import { QuoteTokenDropdown } from './QuoteTokenDropdown';

// ---------------------------------------------------------------------------
// Interval selector options
// ---------------------------------------------------------------------------

const INTERVAL_OPTIONS: { label: string; value: KlineInterval }[] = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1H', value: '1h' },
  { label: '4H', value: '4h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface KlinePanelProps {
  /** Callback when base token changes */
  onBaseTokenChange?: (token: TokenItem) => void;
  /** Callback when quote token changes */
  onQuoteTokenChange?: (token: TokenItem) => void;
  /** Callback when the current price derived from kline data changes */
  onCurrentPriceChange?: (price: number | null) => void;
  /** Chart height in px */
  chartHeight?: number;
  /** Horizontal price lines */
  priceLines?: PriceLine[];
  /** Initial base token (optional) */
  initialBaseToken?: TokenItem | null;
  /** Initial quote token (optional) */
  initialQuoteToken?: TokenItem | null;
  /** Initial base token address from URL (optional) */
  initialBaseAddress?: string | null;
  /** Initial quote token address from URL (optional) */
  initialQuoteAddress?: string | null;
}

/**
 * Wrapper that uses selectedChainId as a React key so the inner component
 * fully remounts (and resets all local state) whenever the chain switches.
 */
export function KlinePanel(props: KlinePanelProps) {
  const selectedChainId = useStore((s) => s.selectedChainId);
  return <KlinePanelInner key={selectedChainId} {...props} />;
}

function KlinePanelInner({
  onBaseTokenChange,
  onQuoteTokenChange,
  onCurrentPriceChange,
  chartHeight = 500,
  priceLines = [],
  initialBaseToken,
  initialQuoteToken,
  initialBaseAddress,
  initialQuoteAddress,
}: KlinePanelProps) {
  const { theme } = useStore();
  const { tokens: baseTokens, isLoading: baseLoading } = useBaseTokens();
  const { tokens: quoteTokens, isLoading: quoteLoading } = useQuoteTokens();

  const [baseToken, setBaseToken] = useState<TokenItem | null>(initialBaseToken ?? null);
  const [quoteToken, setQuoteToken] = useState<TokenItem | null>(initialQuoteToken ?? null);

  // Resolve URL address params to tokens once token lists are loaded
  const urlResolvedRef = useRef(false);
  useEffect(() => {
    if (urlResolvedRef.current) return;
    if (baseTokens.length === 0 && quoteTokens.length === 0) return;

    let resolved = false;
    if (initialBaseAddress && baseTokens.length > 0) {
      const found = baseTokens.find(
        (t) => t.address.toLowerCase() === initialBaseAddress.toLowerCase()
      );
      if (found) {
        setBaseToken(found);
        resolved = true;
      }
    }
    if (initialQuoteAddress && quoteTokens.length > 0) {
      const found = quoteTokens.find(
        (t) => t.address.toLowerCase() === initialQuoteAddress.toLowerCase()
      );
      if (found) {
        setQuoteToken(found);
        resolved = true;
      }
    }
    if (resolved || (!initialBaseAddress && !initialQuoteAddress)) {
      urlResolvedRef.current = true;
    }
  }, [baseTokens, quoteTokens, initialBaseAddress, initialQuoteAddress]);
  const [baseDialogOpen, setBaseDialogOpen] = useState(false);
  const [interval, setInterval] = useState<KlineInterval>('1h');

  // Auto-select first tokens when loaded, ensuring base ≠ quote
  const quoteResolved = (() => {
    if (quoteToken) return quoteToken;
    if (quoteTokens.length === 0) return null;
    // Pick the first quote token that differs from the base token
    const different = quoteTokens.find(
      (t) => t.address.toLowerCase() !== baseToken?.address?.toLowerCase()
    );
    return different ?? quoteTokens[0];
  })();

  // Build selectable base list: exclude the currently selected quote token
  const selectableBaseTokens = useMemo(() => {
    if (!quoteResolved) return baseTokens;
    return baseTokens.filter(
      (t) => t.address.toLowerCase() !== quoteResolved.address.toLowerCase()
    );
  }, [baseTokens, quoteResolved]);

  // Resolve the effective base token from the selectable list.
  // If the current baseToken is not in the selectable list (e.g. it was
  // removed because it matches the newly selected quote), fall back to
  // the first available selectable token.
  const baseResolved = baseToken
    && selectableBaseTokens.some(
      (t) => t.address.toLowerCase() === baseToken.address.toLowerCase()
    )
    ? baseToken
    : selectableBaseTokens.length > 0
      ? selectableBaseTokens[0]
      : null;

  // ---------------------------------------------------------------------------
  // Sync resolved tokens to parent on initial auto-select and whenever they
  // change. Without this, the parent page never receives the default tokens,
  // causing balances/totals to show '—' and the Place Grid button to stay disabled.
  // ---------------------------------------------------------------------------

  const lastBaseSentRef = useRef<string | null>(null);
  const lastQuoteSentRef = useRef<string | null>(null);

  useEffect(() => {
    if (baseResolved?.address && lastBaseSentRef.current !== baseResolved.address) {
      lastBaseSentRef.current = baseResolved.address;
      onBaseTokenChange?.(baseResolved);
    }
  }, [baseResolved, onBaseTokenChange]);

  useEffect(() => {
    if (quoteResolved?.address && lastQuoteSentRef.current !== quoteResolved.address) {
      lastQuoteSentRef.current = quoteResolved.address;
      onQuoteTokenChange?.(quoteResolved);
    }
  }, [quoteResolved, onQuoteTokenChange]);

  // Fetch kline data with 30-second auto-refresh
  const { data: klineData, isLoading: klineLoading, error: klineError } = useKline({
    base: baseResolved?.address ?? '',
    quote: quoteResolved?.address ?? '',
    interval,
    limit: 200,
    autoRefresh: true,
  });

  const handleBaseSelect = (token: TokenItem) => {
    setBaseToken(token);
    onBaseTokenChange?.(token);
  };

  const handleQuoteSelect = (token: TokenItem) => {
    setQuoteToken(token);
    onQuoteTokenChange?.(token);

    // If the current base token is the same as the newly selected quote,
    // reset base so it falls back to the first selectable token
    if (
      baseToken &&
      baseToken.address.toLowerCase() === token.address.toLowerCase()
    ) {
      setBaseToken(null);
    }
  };

  // Derive current price from the last candle
  const lastCandle = klineData?.candles?.length
    ? klineData.candles[klineData.candles.length - 1]
    : null;
  const currentPrice = lastCandle ? parseFloat(lastCandle.c) : null;
  const prevClose = klineData?.candles?.length && klineData.candles.length >= 2
    ? parseFloat(klineData.candles[klineData.candles.length - 2].c)
    : null;
  const priceChange = currentPrice !== null && prevClose !== null
    ? ((currentPrice - prevClose) / prevClose) * 100
    : null;

  // Notify parent when current price changes
  useEffect(() => {
    onCurrentPriceChange?.(currentPrice);
  }, [currentPrice, onCurrentPriceChange]);

  // Auto-detect price display precision from candle data
  // Auto-detect price display precision from candle data
  // NOTE: useMemo dependencies must match the actual access for React Compiler.
  const pricePrecision = useMemo(() => {
    const candles = klineData?.candles;
    if (!candles?.length) return 2;
    return inferPriceFormat(candles).precision;
  }, [klineData?.candles]);

  return (
    <div className="rounded-lg border border-(--border-default) bg-(--bg-surface) overflow-hidden">
      {/* Top bar: Base / Quote selectors + interval + price */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-(--border-subtle) bg-(--bg-surface)">
        {/* Left: Base + Quote pair display */}
        <div className="flex items-center gap-2">
          {/* Base token button – opens dialog */}
          <button
            onClick={() => setBaseDialogOpen(true)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md border border-(--border-default) bg-(--bg-elevated) transition-colors duration-150',
              'hover:border-(--border-strong) hover:bg-(--bg-inset)'
            )}
          >
            {baseResolved ? (
              <>
                <TokenIcon token={baseResolved} size={20} />
                <span className="text-sm font-semibold text-(--text-primary)">
                  {baseResolved.symbol}
                </span>
              </>
            ) : (
              <span className="text-sm text-(--text-disabled)">
                {baseLoading ? 'Loading...' : 'Select Base'}
              </span>
            )}
            <ChevronDown size={12} className="text-(--text-disabled)" />
          </button>

          {/* Separator */}
          <span className="text-lg text-(--text-disabled) font-light select-none">/</span>

          {/* Quote token dropdown */}
          <QuoteTokenDropdown
            selectedToken={quoteResolved}
            onSelect={handleQuoteSelect}
            tokens={quoteTokens}
            isLoading={quoteLoading}
          />

          {/* Interval selector */}
          <div className="flex items-center gap-0.5 ml-3 px-1 py-0.5 rounded-md bg-(--bg-inset)">
            {INTERVAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setInterval(opt.value)}
                className={cn(
                  'px-2 py-1 text-xs rounded transition-colors',
                  interval === opt.value
                    ? 'bg-(--bg-elevated) text-(--text-primary) font-medium shadow-sm'
                    : 'text-(--text-tertiary) hover:text-(--text-secondary)'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Current price */}
        {baseResolved && quoteResolved && (
          <div className="text-right">
            <div className="text-xs text-(--text-disabled)">
              {baseResolved.symbol}/{quoteResolved.symbol}
            </div>
            {currentPrice !== null && (
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-(--text-primary)">
                  {currentPrice.toLocaleString(undefined, {
                    minimumFractionDigits: Math.min(pricePrecision, 2),
                    maximumFractionDigits: pricePrecision,
                  })}
                </span>
                {priceChange !== null && (
                  <span
                    className={cn(
                      'text-xs font-medium',
                      priceChange >= 0 ? 'text-(--green)' : 'text-(--red)'
                    )}
                  >
                    {priceChange >= 0 ? '+' : ''}
                    {priceChange.toFixed(2)}%
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chart area */}
      <TradingViewChart
        candles={klineData?.candles ?? []}
        priceLines={priceLines}
        theme={theme}
        height={chartHeight}
        isLoading={klineLoading}
        error={klineError ?? undefined}
      />

      {/* Base token dialog – uses filtered list excluding selected quote */}
      <BaseTokenDialog
        open={baseDialogOpen}
        onClose={() => setBaseDialogOpen(false)}
        onSelect={handleBaseSelect}
        selectedToken={baseResolved}
        tokens={selectableBaseTokens}
        isLoading={baseLoading}
      />
    </div>
  );
}

/** Small token icon helper */
function TokenIcon({ token, size = 20 }: { token: TokenItem; size?: number }) {
  const [imgError, setImgError] = useState(false);

  if (token.logo && !imgError) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={token.logo}
        alt={token.symbol}
        className="rounded-full shrink-0"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className="rounded-full bg-(--bg-base) border border-(--border-default) flex items-center justify-center text-[9px] font-bold text-(--text-secondary) shrink-0"
      style={{ width: size, height: size }}
    >
      {token.symbol.slice(0, 2)}
    </div>
  );
}
