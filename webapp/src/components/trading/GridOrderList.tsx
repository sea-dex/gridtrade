'use client';

import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { useTranslation } from '@/hooks/useTranslation';
import { useGridOrders } from '@/hooks/useGridOrders';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { GRIDEX_ABI } from '@/config/abi/GridEx';
import { GRIDEX_ADDRESSES } from '@/config/chains';
import { formatNumber } from '@/lib/utils';
import { Trash2, Download, ChevronDown, ChevronRight } from 'lucide-react';
import type { GridWithOrders, GridOrder } from '@/types/grid';

export function GridOrderList() {
  const { t } = useTranslation();
  const { address, chainId } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  const [expandedGrids, setExpandedGrids] = useState<Set<number>>(new Set());

  const { grids, total, page, pageSize, isLoading, setPage } = useGridOrders({
    owner: address?.toLowerCase(),
  });

  const toggleGrid = (gridId: number) => {
    setExpandedGrids((prev) => {
      const next = new Set(prev);
      if (next.has(gridId)) {
        next.delete(gridId);
      } else {
        next.add(gridId);
      }
      return next;
    });
  };

  const handleWithdraw = async (gridId: number) => {
    if (!address || !chainId) return;
    const gridexAddress = GRIDEX_ADDRESSES[chainId];
    if (!gridexAddress) return;

    writeContract({
      address: gridexAddress,
      abi: GRIDEX_ABI,
      functionName: 'withdrawGridProfits',
      args: [BigInt(gridId), BigInt(0), address, 0],
    });
  };

  const handleCancel = async (gridId: number) => {
    if (!address || !chainId) return;
    const gridexAddress = GRIDEX_ADDRESSES[chainId];
    if (!gridexAddress) return;

    writeContract({
      address: gridexAddress,
      abi: GRIDEX_ABI,
      functionName: 'cancelGrid',
      args: [address, BigInt(gridId), 0],
    });
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-(--green-dim) text-(--green) border border-[rgba(52,211,153,0.15)] rounded-(--radius-sm)">
            {t('grid.order_list.status_active')}
          </span>
        );
      case 2:
        return (
          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-[rgba(136,150,171,0.06)] text-(--text-disabled) border border-(--border-subtle) rounded-(--radius-sm)">
            {t('grid.order_list.status_cancelled')}
          </span>
        );
      default:
        return null;
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (!address) {
    return (
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>{t('grid.my_orders')}</CardTitle>
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
      <CardHeader>
        <CardTitle>{t('grid.my_orders')}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="text-center py-10 text-(--text-disabled) text-sm">{t('common.loading')}</div>
        ) : grids.length === 0 ? (
          <div className="text-center py-10 text-(--text-disabled) text-sm">
            {t('grid.order_list.no_orders')}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-(--border-subtle)">
                    <th className="w-8 py-2.5 px-3"></th>
                    <th className="text-left py-2.5 px-5 text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                      {t('grid.order_list.grid_id')}
                    </th>
                    <th className="text-left py-2.5 px-5 text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                      {t('grid.order_list.pair')}
                    </th>
                    <th className="text-left py-2.5 px-5 text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                      {t('grid.order_list.orders')}
                    </th>
                    <th className="text-left py-2.5 px-5 text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                      {t('grid.order_list.initial_investment')}
                    </th>
                    <th className="text-left py-2.5 px-5 text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                      {t('grid.order_list.profit')}
                    </th>
                    <th className="text-left py-2.5 px-5 text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                      {t('grid.order_list.status')}
                    </th>
                    <th className="text-right py-2.5 px-5 text-[11px] font-medium text-(--text-disabled) uppercase tracking-wider">
                      {t('grid.order_list.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {grids.map((gridWithOrders) => (
                    <GridRow
                      key={gridWithOrders.config.grid_id}
                      gridWithOrders={gridWithOrders}
                      isExpanded={expandedGrids.has(gridWithOrders.config.grid_id)}
                      onToggle={() => toggleGrid(gridWithOrders.config.grid_id)}
                      onWithdraw={handleWithdraw}
                      onCancel={handleCancel}
                      isPending={isPending}
                      getStatusBadge={getStatusBadge}
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
  getStatusBadge,
  t,
}: {
  gridWithOrders: GridWithOrders;
  isExpanded: boolean;
  onToggle: () => void;
  onWithdraw: (gridId: number) => void;
  onCancel: (gridId: number) => void;
  isPending: boolean;
  getStatusBadge: (status: number) => React.ReactNode;
  t: (key: string) => string;
}) {
  const { config, orders } = gridWithOrders;

  return (
    <>
      {/* Grid summary row */}
      <tr
        className="border-b border-(--border-subtle) last:border-0 hover:bg-[rgba(136,150,171,0.02)] transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <td className="py-3 px-3">
          {orders.length > 0 && (
            isExpanded ? (
              <ChevronDown size={14} className="text-(--text-disabled)" />
            ) : (
              <ChevronRight size={14} className="text-(--text-disabled)" />
            )
          )}
        </td>
        <td className="py-3 px-5">
          <span className="font-mono text-[13px] text-(--text-secondary)">#{config.grid_id}</span>
        </td>
        <td className="py-3 px-5">
          <span className="text-sm font-semibold text-(--text-primary)">
            {config.base_token}/{config.quote_token}
          </span>
        </td>
        <td className="py-3 px-5">
          <div className="text-[13px] flex items-center gap-1.5">
            <span className="text-(--red)">{config.ask_order_count}</span>
            <span className="text-(--text-disabled)">/</span>
            <span className="text-(--green)">{config.bid_order_count}</span>
          </div>
        </td>
        <td className="py-3 px-5">
          <div className="text-[12px] text-(--text-secondary)">
            <span>{formatNumber(Number(config.initial_base_amount) / 1e18, 4)} {config.base_token}</span>
            {config.initial_quote_amount !== '0' && (
              <>
                <span className="text-(--text-disabled) mx-1">+</span>
                <span>{formatNumber(Number(config.initial_quote_amount) / 1e18, 4)} {config.quote_token}</span>
              </>
            )}
          </div>
        </td>
        <td className="py-3 px-5">
          <span className="text-[13px] font-medium text-(--green)">
            {formatNumber(Number(config.profits) / 1e18, 4)} {config.quote_token}
          </span>
        </td>
        <td className="py-3 px-5">{getStatusBadge(config.status)}</td>
        <td className="py-3 px-5">
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {config.status === 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onWithdraw(config.grid_id)}
                  disabled={isPending}
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">{t('grid.order_list.withdraw')}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCancel(config.grid_id)}
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
      </tr>

      {/* Expanded order details */}
      {isExpanded && orders.length > 0 && (
        <tr>
          <td colSpan={8} className="p-0">
            <div className="bg-[rgba(136,150,171,0.03)] border-b border-(--border-subtle)">
              <div className="px-8 py-3">
                <table className="w-full">
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
                      <th className="text-left py-1.5 px-3 text-[10px] font-medium text-(--text-disabled) uppercase tracking-wider">
                        {t('grid.order_list.rev_amount')}
                      </th>
                      <th className="text-left py-1.5 px-3 text-[10px] font-medium text-(--text-disabled) uppercase tracking-wider">
                        {t('grid.order_list.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <OrderRow
                        key={order.order_id}
                        order={order}
                        baseToken={config.base_token}
                        quoteToken={config.quote_token}
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
  t,
}: {
  order: GridOrder;
  baseToken: string;
  quoteToken: string;
  t: (key: string) => string;
}) {
  return (
    <tr className="border-t border-[rgba(136,150,171,0.08)] hover:bg-[rgba(136,150,171,0.03)] transition-colors">
      <td className="py-1.5 px-3">
        <span className="font-mono text-[11px] text-(--text-disabled)">
          {order.order_id.length > 12
            ? `${order.order_id.slice(0, 6)}...${order.order_id.slice(-4)}`
            : order.order_id}
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
          {formatNumber(Number(order.price) / 1e18, 6)} {quoteToken}
        </span>
      </td>
      <td className="py-1.5 px-3">
        <span className="font-mono text-[11px] text-(--text-secondary)">
          {formatNumber(Number(order.amount) / 1e18, 4)} {order.is_ask ? baseToken : quoteToken}
        </span>
      </td>
      <td className="py-1.5 px-3">
        <span className="font-mono text-[11px] text-(--text-secondary)">
          {formatNumber(Number(order.rev_amount) / 1e18, 4)} {order.is_ask ? quoteToken : baseToken}
        </span>
      </td>
      <td className="py-1.5 px-3">
        {order.status === 0 ? (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-(--green-dim) text-(--green) border border-[rgba(52,211,153,0.15)] rounded-(--radius-sm)">
            {t('grid.order_list.status_active')}
          </span>
        ) : (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-[rgba(136,150,171,0.06)] text-(--text-disabled) border border-(--border-subtle) rounded-(--radius-sm)">
            {t('grid.order_list.status_cancelled')}
          </span>
        )}
      </td>
    </tr>
  );
}
