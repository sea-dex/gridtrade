'use client';

import Link from 'next/link';
import { Suspense, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Activity, ArrowLeft, Clock3, DollarSign, Hash, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { CHAIN_NAMES } from '@/config/chains';
import { useGridDetail } from '@/hooks/useGridDetail';
import { useGridFills } from '@/hooks/useGridFills';
import { useTranslation } from '@/hooks/useTranslation';
import { formatAddress, formatScaledAmount } from '@/lib/utils';
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

function GridHistoryPageInner() {
  const { t } = useTranslation();
  const params = useParams<{ gridId: string }>();
  const searchParams = useSearchParams();
  const selectedChainId = useStore((s) => s.selectedChainId);

  const gridIdParam = params.gridId;
  const gridIdValue = Array.isArray(gridIdParam) ? gridIdParam[0] : gridIdParam;
  const gridId = gridIdValue ? Number(gridIdValue) : undefined;
  const chainId = parsePositiveInt(searchParams.get('chainId')) ?? selectedChainId;

  const { grid, isLoading: isGridLoading, error: gridError } = useGridDetail({ gridId, chainId });
  const { fills, total, isLoading: isFillsLoading, error: fillsError } = useGridFills({
    gridId,
    chainId,
    refreshInterval: 15_000,
  });

  const orderedFills = useMemo(
    () => [...fills].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [fills]
  );

  const config = grid?.config;
  const baseToken = config?.base_token ?? '';
  const quoteToken = config?.quote_token ?? '';
  const baseDecimals = config?.base_token_info?.decimals ?? 18;
  const quoteDecimals = config?.quote_token_info?.decimals ?? 18;

  const baseTurnover = useMemo(
    () => fills.reduce(
      (sum, fill) => sum + (fill.is_ask ? BigInt(fill.filled_amount) : BigInt(fill.filled_volume)),
      0n,
    ),
    [fills]
  );
  const quoteTurnover = useMemo(
    () => fills.reduce(
      (sum, fill) => sum + (fill.is_ask ? BigInt(fill.filled_volume) : BigInt(fill.filled_amount)),
      0n,
    ),
    [fills]
  );
  const feeCollected = useMemo(
    () => fills.reduce((sum, fill) => sum + BigInt(fill.order_fee ?? '0'), 0n),
    [fills]
  );

  const isLoading = isGridLoading || isFillsLoading;
  const errorMessage = gridError || fillsError;
  const pairLabel = config ? `${config.base_token}/${config.quote_token}` : '-';
  const gridProfit = config ? `${formatScaledAmount(config.profits, quoteDecimals)} ${quoteToken}`.trim() : '-';
  const ownerLabel = config?.owner ? formatAddress(config.owner, 6) : '-';

  return (
    <div className="p-3 sm:p-5">
      <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col gap-3">
          <Link
            href={`/grid?chainId=${chainId}`}
            className="inline-flex items-center gap-2 text-sm text-(--text-secondary) hover:text-(--text-primary) transition-colors"
          >
            <ArrowLeft size={16} />
            {t('grid.grid_history.back_to_grid')}
          </Link>

          <Card variant="bordered" className="overflow-hidden">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-(--border-subtle) bg-[rgba(136,150,171,0.08)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-(--text-secondary)">
                    {pairLabel}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-xl sm:text-2xl">{t('grid.grid_history.title')}</CardTitle>
                  <CardDescription>{t('grid.grid_history.subtitle')}</CardDescription>
                </div>
              </div>

              <div className="rounded-(--radius-md) border border-(--border-subtle) bg-[rgba(136,150,171,0.05)] px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-(--text-disabled)">
                  {t('grid.order_list.grid_id')}
                </div>
                <div className="mt-1 font-mono text-sm text-(--text-primary)">
                  {gridId !== undefined ? `#${gridId}` : '-'}
                </div>
              </div>
            </CardHeader>

            <CardContent className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-5">
              <SummaryTile icon={Hash} label={t('grid.order_list.grid_id')} value={gridId !== undefined ? `#${gridId}` : '-'} />
              <SummaryTile icon={Wallet} label={t('grid.order_list.owner')} value={ownerLabel} />
              <SummaryTile icon={Activity} label={t('grid.grid_history.fill_count')} value={String(total)} />
              <SummaryTile icon={DollarSign} label={t('grid.order_list.profit')} value={gridProfit} />
              <SummaryTile icon={Clock3} label={t('grid.grid_history.network')} value={CHAIN_NAMES[chainId] ?? `Chain ${chainId}`} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>{t('grid.grid_history.summary')}</CardTitle>
              <CardDescription>{t('grid.grid_history.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <MetricBlock
                label={t('grid.grid_history.base_turnover')}
                value={`${formatScaledAmount(baseTurnover, baseDecimals)} ${baseToken}`.trim()}
              />
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardHeader>
              <CardTitle>{t('grid.grid_history.summary')}</CardTitle>
              <CardDescription>{t('grid.grid_history.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <MetricBlock
                label={t('grid.grid_history.quote_turnover')}
                value={`${formatScaledAmount(quoteTurnover, quoteDecimals)} ${quoteToken}`.trim()}
              />
            </CardContent>
          </Card>

          <Card variant="bordered">
            <CardHeader>
              <CardTitle>{t('grid.grid_history.summary')}</CardTitle>
              <CardDescription>{errorMessage || t('grid.grid_history.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <MetricBlock
                label={t('grid.grid_history.fee_collected')}
                value={`${formatScaledAmount(feeCollected, quoteDecimals)} ${quoteToken}`.trim()}
              />
            </CardContent>
          </Card>
        </div>

        <Card variant="bordered">
          <CardHeader>
            <CardTitle>{t('grid.grid_history.recent_fills')}</CardTitle>
            <CardDescription>{errorMessage || t('grid.grid_history.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-10 text-center text-sm text-(--text-disabled)">{t('common.loading')}</div>
            ) : orderedFills.length === 0 ? (
              <div className="py-10 text-center text-sm text-(--text-disabled)">{t('grid.grid_history.no_fills')}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead>
                    <tr className="border-b border-(--border-subtle)">
                      <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-(--text-disabled)">
                        {t('grid.order_list.order_id')}
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-(--text-disabled)">
                        {t('grid.order_list.side')}
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-(--text-disabled)">
                        {t('grid.grid_history.filled_base')}
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-(--text-disabled)">
                        {t('grid.grid_history.filled_quote')}
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-(--text-disabled)">
                        {t('grid.grid_history.tx_hash')}
                      </th>
                      <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-(--text-disabled)">
                        {t('grid.grid_history.timestamp')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderedFills.map((fill) => {
                      const displayOrderId = fill.hex_order_id || fill.order_id;
                      const filledBase = fill.is_ask ? fill.filled_amount : fill.filled_volume;
                      const filledQuote = fill.is_ask ? fill.filled_volume : fill.filled_amount;

                      return (
                        <tr
                          key={`${fill.tx_hash}-${fill.order_id}-${fill.timestamp}`}
                          className="border-b border-(--border-subtle) last:border-0 hover:bg-[rgba(136,150,171,0.03)] transition-colors"
                        >
                          <td className="px-5 py-3 font-mono text-[12px] text-(--text-secondary)">
                            {displayOrderId.length > 14
                              ? `${displayOrderId.slice(0, 8)}...${displayOrderId.slice(-4)}`
                              : displayOrderId}
                          </td>
                          <td className="px-5 py-3">
                            {fill.is_ask ? (
                              <span className="text-[11px] font-medium text-(--red)">{t('grid.order_list.ask')}</span>
                            ) : (
                              <span className="text-[11px] font-medium text-(--green)">{t('grid.order_list.bid')}</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-[13px] text-(--text-primary)">
                            {formatScaledAmount(filledBase, baseDecimals)} {baseToken}
                          </td>
                          <td className="px-5 py-3 text-[13px] text-(--text-primary)">
                            {formatScaledAmount(filledQuote, quoteDecimals)} {quoteToken}
                          </td>
                          <td className="px-5 py-3 font-mono text-[12px] text-(--text-secondary)">
                            {formatAddress(fill.tx_hash, 6)}
                          </td>
                          <td className="px-5 py-3 text-[13px] text-(--text-secondary)">
                            {formatDateTime(fill.timestamp)}
                          </td>
                        </tr>
                      );
                    })}
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

export default function GridHistoryPage() {
  return (
    <Suspense>
      <GridHistoryPageInner />
    </Suspense>
  );
}
