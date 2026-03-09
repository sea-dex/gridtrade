'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { useTranslation } from '@/hooks/useTranslation';
import { useGridOrders } from '@/hooks/useGridOrders';
import { useOrdersWithGridInfo } from '@/hooks/useOrdersWithGridInfo';
import { useBaseTokens, useQuoteTokens } from '@/hooks/useTokens';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { GRIDEX_ABI } from '@/config/abi/GridEx';
import { GRIDEX_ADDRESSES, WETH_ADDRESSES } from '@/config/chains';
import { formatContractPrice, formatNumber, cn } from '@/lib/utils';
import { Trash2, Download, ChevronDown, ChevronRight, History, HelpCircle } from 'lucide-react';
import type { GridWithOrders, GridOrder, OrderWithGridInfo } from '@/types/grid';

type OrderTab = 'my_grids' | 'all_grids';
type StatusFilter = 'active' | 'cancelled' | 'all';

function CompoundProfitValue({
  compound,
  value,
  quoteToken,
  t,
}: {
  compound: boolean;
  value: string;
  quoteToken: string;
  t: (key: string) => string;
}) {
  if (!compound) {
    return (
      <span className="text-[12px] sm:text-[13px] font-medium text-(--green)">
        {value} {quoteToken}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-[12px] sm:text-[13px] font-medium text-(--text-secondary)">
      <span>-</span>
      <span
        className="text-(--text-disabled)"
        title={`${t('grid.order_list.compound')}: ${t('grid.order_form.compound_desc')}`}
      >
        <HelpCircle size={13} />
      </span>
    </span>
  );
}

interface GridOrderListProps {
  baseToken?: {
    address: `0x${string}`;
    symbol: string;
    decimals: number;
  };
  quoteToken?: {
    address: `0x${string}`;
    symbol: string;
    decimals: number;
  };
  oneshot?: boolean;
}

function buildOrderHistoryHref({
  orderId,
  chainId,
  displayOrderId,
  baseToken,
  quoteToken,
  baseDecimals,
  quoteDecimals,
}: {
  orderId: string;
  chainId: number;
  displayOrderId: string;
  baseToken: string;
  quoteToken: string;
  baseDecimals: number;
  quoteDecimals: number;
}) {
  const searchParams = new URLSearchParams({
    chainId: String(chainId),
    displayOrderId,
    baseToken,
    quoteToken,
    baseDecimals: String(baseDecimals),
    quoteDecimals: String(quoteDecimals),
  });

  return `/grid/order/${encodeURIComponent(orderId)}?${searchParams.toString()}`;
}

function buildGridHistoryHref({
  gridId,
  chainId,
}: {
  gridId: number;
  chainId: number;
}) {
  const searchParams = new URLSearchParams({
    chainId: String(chainId),
  });

  return `/grid/history/${gridId}?${searchParams.toString()}`;
}

export function GridOrderList({ baseToken, quoteToken, oneshot = false }: GridOrderListProps) {
  const { t } = useTranslation();
  const { address, chainId } = useAccount();
  const selectedChainId = useStore((s) => s.selectedChainId);
  const { writeContract, isPending } = useWriteContract();
  const [manuallyToggledGrids, setManuallyToggledGrids] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<OrderTab>(address ? 'my_grids' : 'all_grids');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [showAllPairs, setShowAllPairs] = useState(false);

  // My grids: filtered by connected wallet owner
  // status=1 for active, status=2 for cancelled, undefined for all
  // When showAllPairs is false, filter by selected trading pair
  const myGridsResult = useGridOrders({
    owner: address?.toLowerCase(),
    refreshInterval: 10_000,
    oneshot,
    status: statusFilter === 'all' ? undefined : statusFilter === 'active' ? 1 : 2,
    baseToken: showAllPairs ? undefined : baseToken?.address,
    quoteToken: showAllPairs ? undefined : quoteToken?.address,
  });

  // All grids: flat order list with grid info
  const allOrdersResult = useOrdersWithGridInfo({
    refreshInterval: 10_000,
    oneshot,
    status: statusFilter === 'all' ? undefined : statusFilter === 'active' ? 1 : 2,
    baseToken: showAllPairs ? undefined : baseToken?.address,
    quoteToken: showAllPairs ? undefined : quoteToken?.address,
  });

  // Token lists for symbol-to-address mapping (used for cancel/withdraw actions)
  const { tokens: baseTokens } = useBaseTokens();
  const { tokens: quoteTokens } = useQuoteTokens();

  // Create symbol-to-address mapping from token lists (for cancel/withdraw actions)
  const symbolToAddressMap = useMemo(() => {
    const map = new Map<string, string>();
    const allTokens = [...baseTokens, ...quoteTokens];
    for (const token of allTokens) {
      // Store lowercase symbol for case-insensitive lookup
      map.set(token.symbol.toLowerCase(), token.address);
    }
    return map;
  }, [baseTokens, quoteTokens]);

  // Helper function to get token address by symbol
  const getTokenAddress = (symbol: string): string | undefined => {
    return symbolToAddressMap.get(symbol.toLowerCase());
  };

  const isMyGrids = activeTab === 'my_grids';

  // Derive variables based on active tab
  const isLoading = isMyGrids ? myGridsResult.isLoading : allOrdersResult.isLoading;
  const total = isMyGrids ? myGridsResult.total : allOrdersResult.total;
  const page = isMyGrids ? myGridsResult.page : allOrdersResult.page;
  const pageSize = isMyGrids ? myGridsResult.pageSize : allOrdersResult.pageSize;
  const setPage = isMyGrids ? myGridsResult.setPage : allOrdersResult.setPage;
  const grids = myGridsResult.grids;
  const allOrders = allOrdersResult.orders;

  // For My Grids, auto-expand all grids by default (user can manually toggle)
  const expandedGrids = useMemo(() => {
    if (isMyGrids && grids.length > 0) {
      // Start with all grids expanded, then apply manual toggles
      const allGridIds = new Set(grids.map((g) => g.config.grid_id));
      // Remove any that were manually toggled off
      manuallyToggledGrids.forEach((id) => {
        if (allGridIds.has(id)) {
          allGridIds.delete(id);
        }
      });
      return allGridIds;
    }
    return manuallyToggledGrids;
  }, [isMyGrids, grids, manuallyToggledGrids]);

  const toggleGrid = (gridId: number) => {
    setManuallyToggledGrids((prev) => {
      const next = new Set(prev);
      if (next.has(gridId)) {
        next.delete(gridId);
      } else {
        next.add(gridId);
      }
      return next;
    });
  };

  const handleWithdraw = async (gridId: number, quoteTokenSymbol: string) => {
    if (!address || !chainId) return;
    const gridexAddress = GRIDEX_ADDRESSES[chainId];
    if (!gridexAddress) return;

    // Get quote token address from symbol, then compare with WETH address
    const wethAddress = WETH_ADDRESSES[chainId];
    const quoteTokenAddress = getTokenAddress(quoteTokenSymbol);
    const isQuoteWeth = wethAddress && quoteTokenAddress &&
      quoteTokenAddress.toLowerCase() === wethAddress.toLowerCase();
    const flag: number = isQuoteWeth ? 1 : 0;

    writeContract({
      address: gridexAddress,
      abi: GRIDEX_ABI,
      functionName: 'withdrawGridProfits',
      args: [gridId, BigInt(0), address, flag],
    });
  };

  const handleCancel = async (gridId: number, baseTokenSymbol: string, quoteTokenSymbol: string) => {
    if (!address || !chainId) return;
    const gridexAddress = GRIDEX_ADDRESSES[chainId];
    if (!gridexAddress) return;

    // Get token addresses from symbols, then compare with WETH address
    const wethAddress = WETH_ADDRESSES[chainId];
    const baseTokenAddress = getTokenAddress(baseTokenSymbol);
    const quoteTokenAddress = getTokenAddress(quoteTokenSymbol);
    
    // Determine flag based on WETH address: 1 if base is WETH, 2 if quote is WETH
    const isBaseWeth = wethAddress && baseTokenAddress &&
      baseTokenAddress.toLowerCase() === wethAddress.toLowerCase();
    const isQuoteWeth = wethAddress && quoteTokenAddress &&
      quoteTokenAddress.toLowerCase() === wethAddress.toLowerCase();
    const flag: number = isBaseWeth ? 1 : (isQuoteWeth ? 2 : 0);

    writeContract({
      address: gridexAddress,
      abi: GRIDEX_ABI,
      functionName: 'cancelGrid',
      args: [address, gridId, flag],
    });
  };

  // Grid status badge: 1=active, 2=cancelled
  const getGridStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-(--green-dim) text-(--green) border border-[rgba(52,211,153,0.15)] rounded-sm">
            {t('grid.order_list.status_active')}
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-[rgba(136,150,171,0.06)] text-(--text-disabled) border border-(--border-subtle) rounded-sm">
            {t('grid.order_list.status_cancelled')}
          </span>
        );
      default:
        return null;
    }
  };

  // Order status badge: 0=active, 1=filled/cancelled
  const getOrderStatusBadge = (status: number) => {
    if (status === 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-(--green-dim) text-(--green) border border-[rgba(52,211,153,0.15)] rounded-sm">
          {t('grid.order_list.status_active')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-[rgba(136,150,171,0.06)] text-(--text-disabled) border border-(--border-subtle) rounded-sm">
        {t('grid.order_list.status_cancelled')}
      </span>
    );
  };

  const totalPages = Math.ceil(total / pageSize);

  // Tab buttons component - tabs on leftmost, toggles on right
  const tabButtons = (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full">
      {/* My Grids / All Grids tabs - leftmost position */}
      <div className="flex gap-1">
        <button
          type="button"
          className={`px-3 py-1.5 text-[12px] font-medium rounded-sm transition-colors ${
            activeTab === 'my_grids'
              ? 'bg-(--accent-dim) text-(--accent) border border-(--accent)/20'
              : 'text-(--text-disabled) hover:text-(--text-secondary) hover:bg-[rgba(136,150,171,0.05)]'
          }`}
          onClick={() => setActiveTab('my_grids')}
        >
          {t('grid.tab_my_grids')}
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 text-[12px] font-medium rounded-sm transition-colors ${
            activeTab === 'all_grids'
              ? 'bg-(--accent-dim) text-(--accent) border border-(--accent)/20'
              : 'text-(--text-disabled) hover:text-(--text-secondary) hover:bg-[rgba(136,150,171,0.05)]'
          }`}
          onClick={() => setActiveTab('all_grids')}
        >
          {t('grid.tab_all_grids')}
        </button>
      </div>
      {/* Toggles row - on mobile, show in a row below tabs */}
      <div className="flex items-center gap-3 sm:gap-4 sm:ml-auto">
        {/* Show all pairs toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] sm:text-[12px] text-(--text-secondary)">
            {t('grid.order_list.show_all_pairs')}
          </span>
          <button
            onClick={() => setShowAllPairs(!showAllPairs)}
            className={cn(
              'relative w-9 h-5 sm:w-10 sm:h-5.5 rounded-full transition-colors duration-200 shrink-0',
              showAllPairs ? 'bg-(--accent)' : 'bg-(--bg-elevated) border border-(--border-strong)'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 sm:top-0.75 sm:left-0.75 w-4 h-4 rounded-full transition-transform duration-200',
                showAllPairs
                  ? 'translate-x-4 sm:translate-x-4.5 bg-(--bg-base)'
                  : 'translate-x-0 bg-(--text-disabled)'
              )}
            />
          </button>
        </div>
        {/* Show cancelled toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] sm:text-[12px] text-(--text-secondary)">
            {t('grid.order_list.show_cancelled')}
          </span>
          <button
            onClick={() => setStatusFilter(statusFilter === 'all' ? 'active' : 'all')}
            className={cn(
              'relative w-9 h-5 sm:w-10 sm:h-5.5 rounded-full transition-colors duration-200 shrink-0',
              statusFilter === 'all' ? 'bg-(--accent)' : 'bg-(--bg-elevated) border border-(--border-strong)'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 sm:top-0.75 sm:left-0.75 w-4 h-4 rounded-full transition-transform duration-200',
                statusFilter === 'all'
                  ? 'translate-x-4 sm:translate-x-4.5 bg-(--bg-base)'
                  : 'translate-x-0 bg-(--text-disabled)'
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );

  // When "My Grids" is active and wallet is not connected, show prompt
  if (isMyGrids && !address) {
    return (
      <Card variant="bordered">
        <CardHeader className="flex flex-row items-center">
          {tabButtons}
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 text-(--text-disabled) text-sm">
            {t('errors.wallet_not_connected')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="bordered">
      <CardHeader className="flex flex-row items-center">
        {tabButtons}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="text-center py-10 text-(--text-disabled) text-sm">{t('common.loading')}</div>
        ) : isMyGrids ? (
          // My Grids: Show grids with expandable orders
          grids.length === 0 ? (
            <div className="text-center py-10 text-(--text-disabled) text-sm">
              {t('grid.order_list.no_orders')}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-(--border-subtle)">
                      <th className="w-8 py-2 sm:py-2.5 px-2 sm:px-3"></th>
                      <th className="text-left py-2 sm:py-2.5 px-3 sm:px-5 text-[10px] sm:text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                        {t('grid.order_list.grid_id')}
                      </th>
                      <th className="text-left py-2 sm:py-2.5 px-3 sm:px-5 text-[10px] sm:text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                        {t('grid.order_list.pair')}
                      </th>
                      <th className="text-left py-2 sm:py-2.5 px-3 sm:px-5 text-[10px] sm:text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                        {t('grid.order_list.orders')}
                      </th>
                      <th className="text-left py-2 sm:py-2.5 px-3 sm:px-5 text-[10px] sm:text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                        {t('grid.order_list.initial_investment')}
                      </th>
                      <th className="text-left py-2 sm:py-2.5 px-3 sm:px-5 text-[10px] sm:text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                        {t('grid.order_list.profit')}
                      </th>
                      <th className="text-left py-2 sm:py-2.5 px-3 sm:px-5 text-[10px] sm:text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                        {t('grid.order_list.status')}
                      </th>
                      <th className="text-right py-2 sm:py-2.5 px-3 sm:px-5 text-[10px] sm:text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                        {t('grid.order_list.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {grids.map((gridWithOrders: GridWithOrders) => (
                      <GridRow
                        key={gridWithOrders.config.grid_id}
                        gridWithOrders={gridWithOrders}
                        isExpanded={expandedGrids.has(gridWithOrders.config.grid_id)}
                        onToggle={() => toggleGrid(gridWithOrders.config.grid_id)}
                        onWithdraw={handleWithdraw}
                        onCancel={handleCancel}
                        isPending={isPending}
                        getGridStatusBadge={getGridStatusBadge}
                        showActions={true}
                        showOwner={false}
                        showHistory={!oneshot}
                        showReverseFields={!oneshot}
                        chainId={selectedChainId}
                        t={t}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-(--border-subtle)">
                  <span className="text-[12px] text-(--text-disabled)">
                    {t('grid.order_list.page_info')
                      .replace('{page}', String(page))
                      .replace('{total}', String(totalPages))}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      {t('grid.order_list.page_prev')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      {t('grid.order_list.page_next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )
        ) : (
          // All Grids: Show flat order list
          allOrders.length === 0 ? (
            <div className="text-center py-10 text-(--text-disabled) text-sm">
              {t('grid.order_list.no_orders')}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-(--border-subtle)">
                      <th className="text-left py-2 sm:py-2.5 px-3 sm:px-5 text-[10px] sm:text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                        {t('grid.order_list.grid_id')}
                      </th>
                      <th className="text-left py-2 sm:py-2.5 px-3 sm:px-5 text-[10px] sm:text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                        {t('grid.order_list.owner')}
                      </th>
                      <th className="text-left py-2 sm:py-2.5 px-3 sm:px-5 text-[10px] sm:text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                        {t('grid.order_list.pair')}
                      </th>
                      <th className="text-left py-2 sm:py-2.5 px-3 sm:px-5 text-[10px] sm:text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                        {t('grid.order_list.side')}
                      </th>
                      <th className="text-left py-2 sm:py-2.5 px-3 sm:px-5 text-[10px] sm:text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                        {t('grid.order_list.price')}
                      </th>
                      <th className="text-left py-2 sm:py-2.5 px-3 sm:px-5 text-[10px] sm:text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                        {t('grid.order_list.amount')}
                      </th>
                      <th className="text-left py-2 sm:py-2.5 px-3 sm:px-5 text-[10px] sm:text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                        {t('grid.order_list.status')}
                      </th>
                      {!oneshot && (
                        <th className="text-right py-2 sm:py-2.5 px-3 sm:px-5 text-[10px] sm:text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                          {t('grid.order_list.actions')}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {allOrders.map((order: OrderWithGridInfo) => (
                      <FlatOrderRow
                        key={order.order_id}
                        order={order}
                        getOrderStatusBadge={getOrderStatusBadge}
                        showHistory={!oneshot}
                        chainId={selectedChainId}
                        t={t}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-(--border-subtle)">
                  <span className="text-[12px] text-(--text-disabled)">
                    {t('grid.order_list.page_info')
                      .replace('{page}', String(page))
                      .replace('{total}', String(totalPages))}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      {t('grid.order_list.page_prev')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      {t('grid.order_list.page_next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )
        )}
      </CardContent>
    </Card>
  );
}

/** A single grid row + expandable order details */
function GridRow({
  gridWithOrders,
  isExpanded,
  onToggle,
  onWithdraw,
  onCancel,
  isPending,
  getGridStatusBadge,
  showActions,
  showOwner,
  showHistory,
  showReverseFields,
  chainId,
  t,
}: {
  gridWithOrders: GridWithOrders;
  isExpanded: boolean;
  onToggle: () => void;
  onWithdraw: (gridId: number, quoteToken: string) => void;
  onCancel: (gridId: number, baseToken: string, quoteToken: string) => void;
  isPending: boolean;
  getGridStatusBadge: (status: number) => React.ReactNode;
  showActions: boolean;
  showOwner: boolean;
  showHistory: boolean;
  showReverseFields: boolean;
  chainId: number;
  t: (key: string) => string;
}) {
  const { config, orders } = gridWithOrders;
  const colSpan = 7 + (showOwner ? 1 : 0) + (showActions ? 1 : 0);
  // Use token info from API response (accurate decimals by token address)
  const baseDecimals = config.base_token_info?.decimals ?? 18;
  const quoteDecimals = config.quote_token_info?.decimals ?? 18;
  const gridHistoryHref = buildGridHistoryHref({
    gridId: config.grid_id,
    chainId,
  });

  return (
    <>
      {/* Grid summary row */}
      <tr
        className="border-b border-(--border-subtle) last:border-0 hover:bg-[rgba(136,150,171,0.02)] transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="py-2 sm:py-3 px-2 sm:px-3">
          {orders.length > 0 && (
            isExpanded ? (
              <ChevronDown size={14} className="text-(--text-disabled)" />
            ) : (
              <ChevronRight size={14} className="text-(--text-disabled)" />
            )
          )}
        </td>
        <td className="py-2 sm:py-3 px-3 sm:px-5">
          <span className="font-mono text-[12px] sm:text-[13px] text-(--text-secondary)">#{config.grid_id}</span>
        </td>
        {showOwner && (
          <td className="py-2 sm:py-3 px-3 sm:px-5">
            <span className="font-mono text-[10px] sm:text-[11px] text-(--text-disabled)">
              {config.owner
                ? `${config.owner.slice(0, 6)}...${config.owner.slice(-4)}`
                : '-'}
            </span>
          </td>
        )}
        <td className="py-2 sm:py-3 px-3 sm:px-5">
          <span className="text-xs sm:text-sm font-semibold text-(--text-primary)">
            {config.base_token}/{config.quote_token}
          </span>
        </td>
        <td className="py-2 sm:py-3 px-3 sm:px-5">
          <div className="text-[12px] sm:text-[13px] flex items-center gap-1.5">
            <span className="text-(--red)">{config.ask_order_count}</span>
            <span className="text-(--text-disabled)">/</span>
            <span className="text-(--green)">{config.bid_order_count}</span>
          </div>
        </td>
        <td className="py-2 sm:py-3 px-3 sm:px-5">
          <div className="text-[11px] sm:text-[12px] text-(--text-secondary)">
            <span>{formatNumber(Number(config.initial_base_amount) / Math.pow(10, baseDecimals), 4)} {config.base_token}</span>
            {config.initial_quote_amount !== '0' && (
              <>
                <span className="text-(--text-disabled) mx-1">+</span>
                <span>{formatNumber(Number(config.initial_quote_amount) / Math.pow(10, quoteDecimals), 4)} {config.quote_token}</span>
              </>
            )}
          </div>
        </td>
        <td className="py-2 sm:py-3 px-3 sm:px-5">
          <CompoundProfitValue
            compound={config.compound}
            value={formatNumber(Number(config.profits) / Math.pow(10, quoteDecimals), 4)}
            quoteToken={config.quote_token}
            t={t}
          />
        </td>
        <td className="py-2 sm:py-3 px-3 sm:px-5">{getGridStatusBadge(config.status)}</td>
        {showActions && (
          <td className="py-2 sm:py-3 px-3 sm:px-5">
            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              {showHistory && (
                <OrderHistoryLink href={gridHistoryHref} label={t('grid.order_list.view_grid_history')} />
              )}
              {config.status === 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onWithdraw(config.grid_id, config.quote_token)}
                    disabled={isPending}
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">{t('grid.order_list.withdraw')}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCancel(config.grid_id, config.base_token, config.quote_token)}
                    disabled={isPending}
                    className="text-(--red) hover:text-(--red) hover:bg-(--red-dim)"
                  >
                    <Trash2 size={14} />
                    <span className="hidden sm:inline">{t('grid.order_list.cancel')}</span>
                  </Button>
                </>
              )}
            </div>
          </td>
        )}
      </tr>

      {/* Expanded order details */}
      {isExpanded && orders.length > 0 && (
        <tr>
          <td colSpan={colSpan} className="p-0">
            <div className="bg-[rgba(136,150,171,0.03)] border-b border-(--border-subtle)">
              <div className="overflow-x-auto px-4 sm:px-8 py-2 sm:py-3">
                <table className={cn('w-full', showReverseFields || showHistory ? 'min-w-[760px]' : 'min-w-[520px]')}>
                  <thead>
                    <tr>
                      <th className="text-left py-1.5 px-3 text-[10px] font-medium text-(--text-disabled) uppercase tracking-wider">
                        {t('grid.order_list.order_id')}
                      </th>
                      <th className="text-left py-1.5 px-3 text-[10px] font-medium text-(--text-disabled) uppercase tracking-wider">
                        {t('grid.order_list.side')}
                      </th>
                      <th className="text-left py-1.5 px-3 text-[10px] font-medium text-(--text-disabled) uppercase tracking-wider">
                        {t('grid.order_list.price')}
                      </th>
                      <th className="text-left py-1.5 px-3 text-[10px] font-medium text-(--text-disabled) uppercase tracking-wider">
                        {t('grid.order_list.amount')}
                      </th>
                      {showReverseFields && (
                        <th className="text-left py-1.5 px-3 text-[10px] font-medium text-(--text-disabled) uppercase tracking-wider">
                          {t('grid.order_list.rev_price')}
                        </th>
                      )}
                      {showReverseFields && (
                        <th className="text-left py-1.5 px-3 text-[10px] font-medium text-(--text-disabled) uppercase tracking-wider">
                          {t('grid.order_list.rev_amount')}
                        </th>
                      )}
                      <th className="text-left py-1.5 px-3 text-[10px] font-medium text-(--text-disabled) uppercase tracking-wider">
                        {t('grid.order_list.status')}
                      </th>
                      {showHistory && (
                        <th className="text-right py-1.5 px-3 text-[10px] font-medium text-(--text-disabled) uppercase tracking-wider">
                          {t('grid.order_list.actions')}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <OrderRow
                        key={order.order_id}
                        order={order}
                        baseToken={config.base_token}
                        quoteToken={config.quote_token}
                        baseDecimals={baseDecimals}
                        quoteDecimals={quoteDecimals}
                        showHistory={showHistory}
                        showReverseFields={showReverseFields}
                        chainId={chainId}
                        t={t}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/** A single order row inside the expanded grid */
function OrderRow({
  order,
  baseToken,
  quoteToken,
  baseDecimals,
  quoteDecimals,
  showHistory,
  showReverseFields,
  chainId,
  t,
}: {
  order: GridOrder;
  baseToken: string;
  quoteToken: string;
  baseDecimals: number;
  quoteDecimals: number;
  showHistory: boolean;
  showReverseFields: boolean;
  chainId: number;
  t: (key: string) => string;
}) {
  // For ask orders: amount is in base token, rev_amount is in quote token
  // For bid orders: amount is in quote token, rev_amount is in base token
  const amountDecimals = order.is_ask ? baseDecimals : quoteDecimals;
  const revAmountDecimals = order.is_ask ? quoteDecimals : baseDecimals;
  const displayOrderId = order.hex_order_id || order.order_id;
  const historyHref = showHistory
    ? buildOrderHistoryHref({
        orderId: order.order_id,
        chainId,
        displayOrderId,
        baseToken,
        quoteToken,
        baseDecimals,
        quoteDecimals,
      })
    : '';

  return (
    <tr className="border-t border-[rgba(136,150,171,0.08)] hover:bg-[rgba(136,150,171,0.03)] transition-colors">
      <td className="py-1.5 px-3">
        <span className="font-mono text-[11px] text-(--text-disabled)">
          {displayOrderId.length > 12
            ? `${displayOrderId.slice(0, 6)}...${displayOrderId.slice(-4)}`
            : displayOrderId}
        </span>
      </td>
      <td className="py-1.5 px-3">
        {order.is_ask ? (
          <span className="text-[11px] font-medium text-(--red)">{t('grid.order_list.ask')}</span>
        ) : (
          <span className="text-[11px] font-medium text-(--green)">{t('grid.order_list.bid')}</span>
        )}
      </td>
      <td className="py-1.5 px-3">
        <span className="font-mono text-[11px] text-(--text-secondary)">
          {formatContractPrice(order.price, baseDecimals, quoteDecimals)} {quoteToken}
        </span>
      </td>
      <td className="py-1.5 px-3">
        <span className="font-mono text-[11px] text-(--text-secondary)">
          {formatNumber(Number(order.amount) / Math.pow(10, amountDecimals), 4)} {order.is_ask ? baseToken : quoteToken}
        </span>
      </td>
      {showReverseFields && (
        <td className="py-1.5 px-3">
          <span className="font-mono text-[11px] text-(--text-secondary)">
            {formatContractPrice(order.rev_price, baseDecimals, quoteDecimals)} {quoteToken}
          </span>
        </td>
      )}
      {showReverseFields && (
        <td className="py-1.5 px-3">
          <span className="font-mono text-[11px] text-(--text-secondary)">
            {formatNumber(Number(order.rev_amount) / Math.pow(10, revAmountDecimals), 4)} {order.is_ask ? quoteToken : baseToken}
          </span>
        </td>
      )}
      <td className="py-1.5 px-3">
        {order.status === 0 ? (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-(--green-dim) text-(--green) border border-[rgba(52,211,153,0.15)] rounded-sm">
            {t('grid.order_list.status_active')}
          </span>
        ) : (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-[rgba(136,150,171,0.06)] text-(--text-disabled) border border-(--border-subtle) rounded-sm">
            {t('grid.order_list.status_cancelled')}
          </span>
        )}
      </td>
      {showHistory && (
        <td className="py-1.5 px-3 text-right">
          <OrderHistoryLink href={historyHref} label={t('grid.order_list.view_order_history')} />
        </td>
      )}
    </tr>
  );
}

/** A flat order row for All Grids view */
function FlatOrderRow({
  order,
  getOrderStatusBadge,
  showHistory,
  chainId,
  t,
}: {
  order: OrderWithGridInfo;
  getOrderStatusBadge: (status: number) => React.ReactNode;
  showHistory: boolean;
  chainId: number;
  t: (key: string) => string;
}) {
  // Use token info from API response (accurate decimals by token address)
  const baseDecimals = order.base_token_info?.decimals ?? 18;
  const quoteDecimals = order.quote_token_info?.decimals ?? 18;
  // For ask orders: amount is in base token
  // For bid orders: amount is in quote token
  const amountDecimals = order.is_ask ? baseDecimals : quoteDecimals;
  const historyHref = showHistory
    ? buildGridHistoryHref({
        gridId: order.grid_id,
        chainId,
      })
    : '';

  return (
    <tr className="border-b border-(--border-subtle) last:border-0 hover:bg-[rgba(136,150,171,0.02)] transition-colors">
      <td className="py-2 sm:py-3 px-3 sm:px-5">
        <span className="font-mono text-[12px] sm:text-[13px] text-(--text-secondary)">#{order.grid_id}</span>
      </td>
      <td className="py-2 sm:py-3 px-3 sm:px-5">
        <span className="font-mono text-[10px] sm:text-[11px] text-(--text-disabled)">
          {order.owner
            ? `${order.owner.slice(0, 6)}...${order.owner.slice(-4)}`
            : '-'}
        </span>
      </td>
      <td className="py-2 sm:py-3 px-3 sm:px-5">
        <span className="text-xs sm:text-sm font-semibold text-(--text-primary)">
          {order.base_token}/{order.quote_token}
        </span>
      </td>
      <td className="py-2 sm:py-3 px-3 sm:px-5">
        {order.is_ask ? (
          <span className="text-[10px] sm:text-[11px] font-medium text-(--red)">{t('grid.order_list.ask')}</span>
        ) : (
          <span className="text-[10px] sm:text-[11px] font-medium text-(--green)">{t('grid.order_list.bid')}</span>
        )}
      </td>
      <td className="py-2 sm:py-3 px-3 sm:px-5">
        <span className="font-mono text-[10px] sm:text-[11px] text-(--text-secondary)">
          {formatContractPrice(order.price, baseDecimals, quoteDecimals)} {order.quote_token}
        </span>
      </td>
      <td className="py-2 sm:py-3 px-3 sm:px-5">
        <span className="font-mono text-[10px] sm:text-[11px] text-(--text-secondary)">
          {formatNumber(Number(order.amount) / Math.pow(10, amountDecimals), 4)} {order.is_ask ? order.base_token : order.quote_token}
        </span>
      </td>
      <td className="py-2 sm:py-3 px-3 sm:px-5">{getOrderStatusBadge(order.status)}</td>
      {showHistory && (
        <td className="py-2 sm:py-3 px-3 sm:px-5 text-right">
          <OrderHistoryLink href={historyHref} label={t('grid.order_list.view_grid_history')} />
        </td>
      )}
    </tr>
  );
}

function OrderHistoryLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-(--radius-sm) px-2.5 py-1.5 text-[11px] font-medium text-(--accent) hover:bg-(--accent-dim) transition-colors"
    >
      <History size={13} />
      <span>{label}</span>
    </Link>
  );
}
