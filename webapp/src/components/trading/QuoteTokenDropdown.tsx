'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TokenItem } from '@/hooks/useTokens';

interface QuoteTokenDropdownProps {
  selectedToken?: TokenItem | null;
  onSelect: (token: TokenItem) => void;
  tokens: TokenItem[];
  isLoading?: boolean;
}

export function QuoteTokenDropdown({
  selectedToken,
  onSelect,
  tokens,
  isLoading = false,
}: QuoteTokenDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (token: TokenItem) => {
    onSelect(token);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-(--radius-md) border border-(--border-default) bg-(--bg-elevated) transition-colors duration-150',
          !isLoading && 'hover:border-(--border-strong)',
          isLoading && 'opacity-40 pointer-events-none'
        )}
      >
        {selectedToken ? (
          <div className="flex items-center gap-1.5">
            <QuoteLogo token={selectedToken} />
            <span className="text-sm font-semibold text-(--text-primary)">
              {selectedToken.symbol}
            </span>
          </div>
        ) : (
          <span className="text-sm text-(--text-disabled)">Quote</span>
        )}
        <ChevronDown
          size={14}
          className={cn(
            'text-(--text-disabled) transition-transform duration-150',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && tokens.length > 0 && (
        <div className="absolute z-50 w-48 mt-1.5 right-0 rounded-(--radius-md) border border-(--border-default) bg-(--bg-elevated) shadow-(--shadow-lg) overflow-hidden animate-slide-down">
          {tokens.map((token) => (
            <button
              key={token.address}
              onClick={() => handleSelect(token)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors duration-100',
                selectedToken?.address.toLowerCase() === token.address.toLowerCase()
                  ? 'bg-(--accent-dim)'
                  : 'hover:bg-[rgba(136,150,171,0.04)]'
              )}
            >
              <QuoteLogo token={token} />
              <div className="text-left flex-1 min-w-0">
                <div className="text-sm font-semibold text-(--text-primary)">
                  {token.symbol}
                </div>
                <div className="text-[11px] text-(--text-disabled) truncate">
                  {token.name}
                </div>
              </div>
              {selectedToken?.address.toLowerCase() === token.address.toLowerCase() && (
                <div className="w-1.5 h-1.5 rounded-full bg-(--accent) shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function QuoteLogo({ token }: { token: TokenItem }) {
  const [imgError, setImgError] = useState(false);

  if (token.logo && !imgError) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={token.logo}
        alt={token.symbol}
        className="w-5 h-5 rounded-full"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="w-5 h-5 rounded-full bg-(--bg-surface) border border-(--border-default) flex items-center justify-center text-[9px] font-semibold text-(--text-secondary)">
      {token.symbol.slice(0, 2)}
    </div>
  );
}
