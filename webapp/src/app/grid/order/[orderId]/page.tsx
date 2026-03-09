'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Activity, ArrowDownUp, ArrowLeft, Check, Clock3, Copy, Hash, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { CHAIN_NAMES } from '@/config/chains';
import { useOrderDetail } from '@/hooks/useOrderDetail';
import { useOrderFills } from '@/hooks/useOrderFills';
import { useTranslation } from '@/hooks/useTranslation';
import { formatAddress, formatContractPrice, formatScaledAmount } from '@/lib/utils';
import { useStore } from '@/store/useStore';

function parsePositiveInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function GridOrderHistoryPageInner() {
  const { t } = useTranslation();
  const params = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const selectedChainId = useStore((s) => s.selectedChainId);

  const orderIdParam = params.orderId;
  const orderId = Array.isArray(orderIdParam) ? orderIdParam[0] : orderIdParam;
  const chainId = parsePositiveInt(searchParams.get('chainId')) ?? selectedChainId;
  const baseToken = searchParams.get('baseToken') ?? '';
  const quoteToken = searchParams.get('quoteToken') ?? '';
  const displayOrderId = searchParams.get('displayOrderId') ?? orderId;
  const baseDecimals = parsePositiveInt(searchParams.get('baseDecimals')) ?? 18;
  const quoteDecimals = parsePositiveInt(searchParams.get('quoteDecimals')) ?? 18;

  const { order, isLoading: isOrderLoading, error: orderError } = useOrderDetail({ orderId, chainId });
  const { fills, total, isLoading: isFillsLoading, error: fillsError } = useOrderFills({
    orderId,
    chainId,
    refreshInterval: 15_000,
  });
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const orderedFills = useMemo(
    () => [...fills].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [fills]
  );

  const isAsk = order?.is_ask ?? (searchParams.get('isAsk') === 'true');
  const filledAmountLabel = isAsk ? baseToken : quoteToken;
  const filledVolumeLabel = isAsk ? quoteToken : baseToken;
  const totalFilledAmount = useMemo(
    () => fills.reduce((sum, fill) => sum + BigInt(fill.filled_amount), 0n),
    [fills]
  );
  const totalFilledVolume = useMemo(
    () => fills.reduce((sum, fill) => sum + BigInt(fill.filled_volume), 0n),
    [fills]
  );

  const pairLabel = baseToken && quoteToken
    ? `${baseToken}/${quoteToken}`
    : order?.pair_id
      ? `Pair #${order.pair_id}`
      : '-';
  const sideLabel = isAsk ? t('grid.order_list.ask') : t('grid.order_list.bid');
  const priceLabel = order
    ? `${formatContractPrice(order.price, baseDecimals, quoteDecimals)}${quoteToken ? ` ${quoteToken}` : ''}`
    : '-';
  const orderSizeLabel = order
    ? `${formatScaledAmount(order.amount, isAsk ? baseDecimals : quoteDecimals)} ${isAsk ? baseToken : quoteToken}`.trim()
    : '-';
  const isLoading = isOrderLoading || isFillsLoading;
  const errorMessage = orderError || fillsError;

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      window.setTimeout(() => {
        setCopiedValue((current) => (current === value ? null : current));
      }, 1200);
    } catch {
      // No-op: keep interaction silent if clipboard is unavailable.
    }
  };

  return (
    <div className="p-3 sm:p-5">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col gap-3">
          <Link
            href={`/grid?chainId=${chainId}`}
            className="inline-flex items-center gap-2 text-sm text-(--text-secondary) hover:text-(--text-primary) transition-colors"
          >
            <ArrowLeft size={16} />
            {t('grid.order_history.back_to_grid')}
          </Link>

          <Card variant="bordered" className="overflow-hidden">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-(--border-subtle) bg-[rgba(136,150,171,0.08)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-(--text-secondary)">
                    {pairLabel}
                  </span>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${
                    isAsk ? 'bg-(--red-dim) text-(--red)' : 'bg-(--green-dim) text-(--green)'
                  }`}>
                    {sideLabel}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-xl sm:text-2xl">{t('grid.order_history.title')}</CardTitle>
                  <CardDescription>{t('grid.order_history.subtitle')}</CardDescription>
                </div>
              </div>

              <div className="rounded-(--radius-md) border border-(--border-subtle) bg-[rgba(136,150,171,0.05)] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-(--text-disabled)">
                  {t('grid.order_list.order_id')}
                </div>
                <div className="mt-1 font-mono text-sm text-(--text-primary)">
                  {displayOrderId}
                </div>
              </div>
            </CardHeader>

            <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryTile icon={Hash} label={t('grid.order_list.grid_id')} value={order?.grid_id ? `#${order.grid_id}` : '-'} />
              <SummaryTile icon={Wallet} label={t('grid.order_list.price')} value={priceLabel} />
              <SummaryTile icon={ArrowDownUp} label={t('grid.order_history.order_size')} value={orderSizeLabel} />
              <SummaryTile icon={Activity} label={t('grid.order_history.fill_count')} value={String(total)} />
              <SummaryTile icon={Clock3} label={t('grid.order_history.network')} value={CHAIN_NAMES[chainId] ?? `Chain ${chainId}`} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>{t('grid.order_history.summary')}</CardTitle>
              <CardDescription>{t('grid.order_history.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <MetricBlock
                label={t('grid.order_history.filled_amount')}
                value={`${formatScaledAmount(totalFilledAmount, isAsk ? baseDecimals : quoteDecimals)} ${filledAmountLabel}`.trim()}
              />
              <MetricBlock
                label={t('grid.order_history.filled_volume')}
                value={`${formatScaledAmount(totalFilledVolume, isAsk ? quoteDecimals : baseDecimals)} ${filledVolumeLabel}`.trim()}
              />
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardHeader>
              <CardTitle>{t('grid.order_history.recent_fills')}</CardTitle>
              <CardDescription>{errorMessage || t('grid.order_history.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <MetricBlock label={t('grid.order_history.fill_count')} value={String(total)} />
              <MetricBlock label={t('grid.order_list.pair')} value={pairLabel} />
            </CardContent>
          </Card>
        </div>

        <Card variant="bordered">
          <CardHeader>
            <CardTitle>{t('grid.order_history.recent_fills')}</CardTitle>
            <CardDescription>{errorMessage || t('grid.order_history.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-10 text-center text-sm text-(--text-disabled)">
                {t('common.loading')}
              </div>
            ) : orderedFills.length === 0 ? (
              <div className="py-10 text-center text-sm text-(--text-disabled)">
                {t('grid.order_history.no_fills')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-(--border-subtle)">
                      <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-(--text-disabled)">
                        {t('grid.order_history.tx_hash')}
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-(--text-disabled)">
                        {t('grid.order_history.taker')}
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-(--text-disabled)">
                        {t('grid.order_history.filled_amount')}
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-(--text-disabled)">
                        {t('grid.order_history.filled_volume')}
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-(--text-disabled)">
                        {t('grid.order_history.timestamp')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderedFills.map((fill) => (
                      <tr
                        key={`${fill.tx_hash}-${fill.timestamp}`}
                        className="border-b border-(--border-subtle) last:border-0 hover:bg-[rgba(136,150,171,0.03)] transition-colors"
                      >
                        <td className="px-5 py-3 font-mono text-[12px] text-(--text-secondary)">
                          <div className="inline-flex items-center gap-2">
                            <span>{formatAddress(fill.tx_hash, 6)}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(fill.tx_hash)}
                              className="inline-flex items-center justify-center rounded-sm text-(--text-disabled) transition-colors hover:text-(--text-primary)"
                              title={t('common.copy')}
                              aria-label={t('common.copy')}
                            >
                              {copiedValue === fill.tx_hash ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-mono text-[12px] text-(--text-secondary)">
                          <div className="inline-flex items-center gap-2">
                            <span>{formatAddress(fill.taker, 6)}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(fill.taker)}
                              className="inline-flex items-center justify-center rounded-sm text-(--text-disabled) transition-colors hover:text-(--text-primary)"
                              title={t('common.copy')}
                              aria-label={t('common.copy')}
                            >
                              {copiedValue === fill.taker ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-[13px] text-(--text-primary)">
                          {formatScaledAmount(fill.filled_amount, fill.is_ask ? baseDecimals : quoteDecimals)} {filledAmountLabel}
                        </td>
                        <td className="px-5 py-3 text-[13px] text-(--text-primary)">
                          {formatScaledAmount(fill.filled_volume, fill.is_ask ? quoteDecimals : baseDecimals)} {filledVolumeLabel}
                        </td>
                        <td className="px-5 py-3 text-[13px] text-(--text-secondary)">
                          {formatDateTime(fill.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Hash;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-(--radius-md) border border-(--border-subtle) bg-[rgba(136,150,171,0.04)] p-4">
      <div className="flex items-center gap-2 text-(--text-secondary)">
        <Icon size={14} />
        <span className="text-[11px] uppercase tracking-[0.16em]">{label}</span>
      </div>
      <div className="mt-2 text-sm font-semibold text-(--text-primary)">{value}</div>
    </div>
  );
}

function MetricBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-(--radius-md) border border-(--border-subtle) bg-[rgba(136,150,171,0.04)] p-4">
      <div className="text-[11px] uppercase tracking-[0.16em] text-(--text-disabled)">{label}</div>
      <div className="mt-2 text-lg font-semibold text-(--text-primary)">{value}</div>
    </div>
  );
}

export default function GridOrderHistoryPage() {
  return (
    <Suspense>
      <GridOrderHistoryPageInner />
    </Suspense>
  );
}
