'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Search, X } from 'lucide-react';

interface Token {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

interface TokenSelectorProps {
  label?: string;
  selectedToken?: Token | null;
  onSelect: (token: Token) => void;
  tokens: Token[];
  disabled?: boolean;
  compact?: boolean;
}

export function TokenSelector({
  label,
  selectedToken,
  onSelect,
  tokens,
  disabled = false,
  compact = false,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  const filteredTokens = tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.name.toLowerCase().includes(search.toLowerCase()) ||
      token.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-medium text-(--text-secondary) mb-1.5">{label}</label>
      )}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 rounded-(--radius-md) border border-(--border-default) bg-(--bg-elevated) transition-colors duration-150',
          compact ? 'px-2.5 py-1.5' : 'w-full justify-between px-3.5 py-2.5',
          !disabled && 'hover:border-(--border-strong)',
          disabled && 'opacity-40 pointer-events-none'
        )}
      >
        {selectedToken ? (
          <div className="flex items-center gap-2">
            {selectedToken.logoURI ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={selectedToken.logoURI}
                alt={selectedToken.symbol}
                className="w-5 h-5 rounded-full"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-(--bg-surface) border border-(--border-default) flex items-center justify-center text-[9px] font-semibold text-(--text-secondary)">
                {selectedToken.symbol.slice(0, 2)}
              </div>
            )}
            <span className="text-sm font-semibold text-(--text-primary)">{selectedToken.symbol}</span>
          </div>
        ) : (
          <span className="text-sm text-(--text-disabled)">Select token</span>
        )}
        <ChevronDown size={14} className={cn('text-(--text-disabled) transition-transform duration-150', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-64 mt-1.5 rounded-(--radius-lg) border border-(--border-default) bg-(--bg-elevated) shadow-(--shadow-lg) overflow-hidden animate-slide-down">
          {/* Search */}
          <div className="p-2.5 border-b border-(--border-subtle)">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-(--text-disabled)" />
              <input
                type="text"
                placeholder="Search by name or address"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-8 py-2 rounded-(--radius-sm) border border-(--border-default) bg-(--bg-inset) text-[13px] text-(--text-primary) placeholder-(--text-disabled) focus:outline-none focus:border-(--accent-muted) transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-(--text-disabled) hover:text-(--text-secondary) transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Token list */}
          <div className="max-h-64 overflow-y-auto">
            {filteredTokens.length === 0 ? (
              <div className="p-5 text-center text-(--text-disabled) text-[13px]">No tokens found</div>
            ) : (
              filteredTokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => {
                    onSelect(token);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors duration-100',
                    selectedToken?.address === token.address
                      ? 'bg-(--accent-dim)'
                      : 'hover:bg-[rgba(136,150,171,0.04)]'
                  )}
                >
                  {token.logoURI ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={token.logoURI}
                      alt={token.symbol}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-(--bg-surface) border border-(--border-default) flex items-center justify-center text-xs font-semibold text-(--text-secondary)">
                      {token.symbol.slice(0, 2)}
                    </div>
                  )}
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-sm font-semibold text-(--text-primary)">{token.symbol}</div>
                    <div className="text-[11px] text-(--text-disabled) truncate">{token.name}</div>
                  </div>
                  {selectedToken?.address === token.address && (
                    <div className="w-1.5 h-1.5 rounded-full bg-(--accent) shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
