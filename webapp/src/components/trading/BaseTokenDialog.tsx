'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Import, Loader2, AlertCircle } from 'lucide-react';
import { cn, formatAddress } from '@/lib/utils';
import type { TokenItem } from '@/hooks/useTokens';
import { useImportToken } from '@/hooks/useTokens';

interface BaseTokenDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (token: TokenItem) => void;
  selectedToken?: TokenItem | null;
  tokens: TokenItem[];
  isLoading?: boolean;
}

export function BaseTokenDialog(props: BaseTokenDialogProps) {
  if (!props.open) return null;

  // Use key to remount inner content each time dialog opens,
  // which naturally resets all state without calling setState in effects
  return <BaseTokenDialogInner key="dialog-open" {...props} />;
}

function BaseTokenDialogInner({
  onClose,
  onSelect,
  selectedToken,
  tokens,
  isLoading = false,
}: BaseTokenDialogProps) {
  const [search, setSearch] = useState('');
  const [importAddress, setImportAddress] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importedTokens, setImportedTokens] = useState<TokenItem[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { importToken, isLoading: isImporting, error: importError } = useImportToken();

  // Focus search input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const allTokens = [...tokens, ...importedTokens];

  const filteredTokens = allTokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.name.toLowerCase().includes(search.toLowerCase()) ||
      token.address.toLowerCase().includes(search.toLowerCase())
  );

  const isAddressSearch = search.startsWith('0x') && search.length > 10;
  const noResults = filteredTokens.length === 0 && search.length > 0;

  const handleImport = async () => {
    const addr = importAddress.trim() || search.trim();
    if (!addr || !addr.startsWith('0x')) return;

    const token = await importToken(addr);
    if (token) {
      const exists = allTokens.some(
        (t) => t.address.toLowerCase() === token.address.toLowerCase()
      );
      if (!exists) {
        setImportedTokens((prev) => [...prev, token]);
      }
      onSelect(token);
      onClose();
    }
  };

  const handleSelect = (token: TokenItem) => {
    onSelect(token);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative mt-[10vh] w-full max-w-[440px] mx-4 rounded-(--radius-xl) border border-(--border-default) bg-(--bg-surface) shadow-(--shadow-lg) animate-fade-in-scale overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-base font-semibold text-(--text-primary)">
            Select Base Token
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-(--radius-sm) text-(--text-disabled) hover:text-(--text-secondary) hover:bg-(--accent-dim) transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--text-disabled)"
            />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search name, symbol, or paste address"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isAddressSearch && noResults) {
                  setImportAddress(search);
                  setShowImport(true);
                }
              }}
              className="w-full pl-10 pr-10 py-3 rounded-(--radius-md) border border-(--border-default) bg-(--bg-inset) text-sm text-(--text-primary) placeholder-(--text-disabled) focus:outline-none focus:border-(--accent-muted) transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-(--text-disabled) hover:text-(--text-secondary) transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Popular tokens (quick select chips) */}
        {!search && tokens.length > 0 && (
          <div className="px-5 pb-3 flex flex-wrap gap-2">
            {tokens.slice(0, 6).map((token) => (
              <button
                key={token.address}
                onClick={() => handleSelect(token)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-(--radius-full) border text-xs font-medium transition-all duration-150',
                  selectedToken?.address.toLowerCase() === token.address.toLowerCase()
                    ? 'border-(--accent-border-hover) bg-(--accent-dim) text-(--text-primary)'
                    : 'border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) hover:border-(--border-strong) hover:text-(--text-primary)'
                )}
              >
                {token.logo ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={token.logo}
                    alt={token.symbol}
                    className="w-4 h-4 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-(--bg-base) border border-(--border-default) flex items-center justify-center text-[8px] font-bold">
                    {token.symbol.slice(0, 1)}
                  </div>
                )}
                {token.symbol}
              </button>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-(--border-subtle)" />

        {/* Token list */}
        <div className="max-h-[360px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-(--text-disabled)" />
              <span className="ml-2 text-sm text-(--text-disabled)">Loading tokens...</span>
            </div>
          ) : filteredTokens.length === 0 ? (
            <div className="py-10 px-5 text-center">
              {isAddressSearch ? (
                <>
                  <div className="text-sm text-(--text-disabled) mb-4">
                    Token not found in list
                  </div>
                  <button
                    onClick={() => {
                      setImportAddress(search);
                      setShowImport(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-(--radius-md) bg-(--accent-dim) border border-(--accent-border) text-sm font-medium text-(--text-primary) hover:bg-(--accent-border) transition-colors"
                  >
                    <Import size={14} />
                    Import token
                  </button>
                </>
              ) : (
                <div className="text-sm text-(--text-disabled)">
                  No tokens found
                </div>
              )}
            </div>
          ) : (
            filteredTokens.map((token) => (
              <button
                key={token.address}
                onClick={() => handleSelect(token)}
                className={cn(
                  'w-full flex items-center gap-3 px-5 py-3 transition-colors duration-100',
                  selectedToken?.address.toLowerCase() === token.address.toLowerCase()
                    ? 'bg-(--accent-dim)'
                    : 'hover:bg-[rgba(136,150,171,0.04)]'
                )}
              >
                {/* Token logo */}
                <TokenLogo token={token} size={36} />

                {/* Token info */}
                <div className="text-left flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-(--text-primary)">
                      {token.symbol}
                    </span>
                    {token.tags?.includes('imported') && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-(--amber-dim) text-(--amber) font-medium">
                        Imported
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-(--text-disabled) truncate">
                    {token.name}
                  </div>
                </div>

                {/* Address */}
                <span className="text-[11px] text-(--text-disabled) font-mono shrink-0">
                  {formatAddress(token.address, 4)}
                </span>

                {/* Selected indicator */}
                {selectedToken?.address.toLowerCase() === token.address.toLowerCase() && (
                  <div className="w-2 h-2 rounded-full bg-(--accent) shrink-0" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Import section (shown when user wants to import) */}
        {showImport && (
          <>
            <div className="h-px bg-(--border-subtle)" />
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-(--text-primary)">
                <Import size={14} />
                Import Token by Address
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="0x..."
                  value={importAddress}
                  onChange={(e) => setImportAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-(--radius-md) border border-(--border-default) bg-(--bg-inset) text-sm text-(--text-primary) placeholder-(--text-disabled) font-mono focus:outline-none focus:border-(--accent-muted) transition-colors"
                />
              </div>
              {importError && (
                <div className="flex items-center gap-2 text-xs text-(--red)">
                  <AlertCircle size={12} />
                  {importError}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowImport(false);
                    setImportAddress('');
                  }}
                  className="flex-1 px-3 py-2 rounded-(--radius-md) border border-(--border-default) text-sm text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border-strong) transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importAddress.startsWith('0x') || importAddress.length < 42 || isImporting}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-(--radius-md) text-sm font-medium transition-colors',
                    importAddress.startsWith('0x') && importAddress.length >= 42 && !isImporting
                      ? 'bg-(--accent) text-(--bg-base) hover:opacity-90'
                      : 'bg-(--bg-elevated) text-(--text-disabled) cursor-not-allowed'
                  )}
                >
                  {isImporting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Import'
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Footer: Import button (always visible when not in import mode) */}
        {!showImport && (
          <>
            <div className="h-px bg-(--border-subtle)" />
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-[11px] text-(--text-disabled)">
                {allTokens.length} token{allTokens.length !== 1 ? 's' : ''} available
              </span>
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-1.5 text-xs text-(--text-tertiary) hover:text-(--text-secondary) transition-colors"
              >
                <Import size={12} />
                Import token
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Small helper for token logo with fallback */
function TokenLogo({ token, size = 36 }: { token: TokenItem; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const px = `${size / 4}`;

  if (token.logo && !imgError) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={token.logo}
        alt={token.symbol}
        className={`w-${px} h-${px} rounded-full shrink-0`}
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className="rounded-full bg-(--bg-base) border border-(--border-default) flex items-center justify-center text-xs font-bold text-(--text-secondary) shrink-0"
      style={{ width: size, height: size }}
    >
      {token.symbol.slice(0, 2)}
    </div>
  );
}
