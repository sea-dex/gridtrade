'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
} from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { parseUnits, encodeAbiParameters, getAddress, zeroAddress } from 'viem';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ERC20_ABI } from '@/config/abi/ERC20';
import {
  GRIDEX_ADDRESSES,
  LINEAR_STRATEGY_ADDRESSES,
  WETH_ADDRESSES,
} from '@/config/chains';
import { useOrderSubmission } from '@/hooks/useOrderSubmission';
import { formatAmount, gapToContractBigInt, priceToContractBigInt } from '@/lib/tradingMath';
import { calcLinearGridTotalsWithDecimals, priceToFixedBigInt } from '@/lib/tradingTotals';
import { TransactionStatusDialog } from '@/components/trading/TransactionStatusDialog';
import type { PriceLine } from '@/types/grid';

interface LimitOrderFormProps {
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
  onPriceLinesChange?: (lines: PriceLine[]) => void;
}

/** Hardcoded fee for limit orders (0.3%) */
const LIMIT_ORDER_FEE = 3000;

function encodeCurrencyAddress(
  tokenAddress: `0x${string}`,
  nativeFlag: boolean,
  wethAddress?: `0x${string}`,
): `0x${string}` {
  if (!nativeFlag) return tokenAddress;
  if (!wethAddress) {
    throw new Error('Missing WETH address for native limit order');
  }

  // Currency uses the wrapped native token address with the low bit set for native settlement.
  const encoded = (BigInt(wethAddress) | 1n).toString(16).padStart(40, '0');
  return getAddress(`0x${encoded}`);
}

export function LimitOrderForm({ baseToken, quoteToken, onPriceLinesChange }: LimitOrderFormProps) {
  const { t } = useTranslation();
  const { address, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();

  const gridexAddress = useMemo(() => (chainId ? GRIDEX_ADDRESSES[chainId] : undefined), [chainId]);

  const { writeContractAsync, isPending } = useWriteContract();
  const {
    closeTxDialog,
    isSubmitting,
    submitOrder,
    txDialogOpen,
    txError,
    txSteps,
  } = useOrderSubmission({ chainId, t, writeContractAsync });

  // For native tokens (zeroAddress), don't pass token parameter to get native balance
  const baseTokenAddress = baseToken?.address === zeroAddress ? undefined : baseToken?.address;
  const quoteTokenAddress = quoteToken?.address === zeroAddress ? undefined : quoteToken?.address;

  const {
    data: baseBalance,
    isLoading: isBaseBalanceLoading,
    isError: isBaseBalanceError,
  } = useBalance({
    address,
    chainId,
    token: baseTokenAddress,
    query: { enabled: !!address && !!chainId && !!baseToken },
  });

  const {
    data: quoteBalance,
    isLoading: isQuoteBalanceLoading,
    isError: isQuoteBalanceError,
  } = useBalance({
    address,
    chainId,
    token: quoteTokenAddress,
    query: { enabled: !!address && !!chainId && !!quoteToken },
  });

  const [formData, setFormData] = useState(() => ({
    askPrice0: '',    // lowest ask order price
    bidPrice0: '',    // highest bid order price
    askGap: '',       // price gap between ask orders
    bidGap: '',       // price gap between bid orders
    askOrderCount: '5',
    bidOrderCount: '5',
    amountPerGrid: '',
  }));

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Derive effective order counts:
  // Per contract requirement: if price is 0 OR gap is 0 → order count becomes 0
  const effectiveAskCount = useMemo(() => {
    const price = parseFloat(formData.askPrice0);
    const gap = parseFloat(formData.askGap);
    if (!price || !gap) return 0;
    return parseInt(formData.askOrderCount) || 0;
  }, [formData.askPrice0, formData.askGap, formData.askOrderCount]);

  const effectiveBidCount = useMemo(() => {
    const price = parseFloat(formData.bidPrice0);
    const gap = parseFloat(formData.bidGap);
    if (!price || !gap) return 0;
    return parseInt(formData.bidOrderCount) || 0;
  }, [formData.bidPrice0, formData.bidGap, formData.bidOrderCount]);

  // Calculate total base and quote amounts needed
  const totals = useMemo(() => {
    if (!baseToken || !quoteToken || !formData.amountPerGrid) {
      return { baseTotal: 0n, quoteTotal: 0n };
    }

    try {
      const baseAmt = parseUnits(formData.amountPerGrid, baseToken.decimals);
      const bidPrice = priceToFixedBigInt(formData.bidPrice0);
      const bidGap = priceToFixedBigInt(formData.bidGap);

      const [totalBase, totalQuote] = calcLinearGridTotalsWithDecimals(
        baseAmt,
        bidPrice,
        bidGap,
        effectiveAskCount,
        effectiveBidCount,
        baseToken.decimals,
        quoteToken.decimals,
      );

      return { baseTotal: totalBase, quoteTotal: totalQuote };
    } catch {
      return { baseTotal: 0n, quoteTotal: 0n };
    }
  }, [
    formData.amountPerGrid,
    formData.bidPrice0,
    formData.bidGap,
    effectiveAskCount,
    effectiveBidCount,
    baseToken,
    quoteToken,
  ]);

  const needsBaseApproval =
    !!baseToken && baseToken.address !== zeroAddress && totals.baseTotal > 0n;
  const needsQuoteApproval =
    !!quoteToken && quoteToken.address !== zeroAddress && totals.quoteTotal > 0n;

  const { data: baseAllowance } = useReadContract({
    address: baseToken?.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, gridexAddress as `0x${string}`],
    query: {
      enabled: !!address && !!gridexAddress && needsBaseApproval,
    },
  });

  const { data: quoteAllowance } = useReadContract({
    address: quoteToken?.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, gridexAddress as `0x${string}`],
    query: {
      enabled: !!address && !!gridexAddress && needsQuoteApproval,
    },
  });

  // Emit price lines for TradingView: each order draws one horizontal line.
  const priceLines = useMemo<PriceLine[]>(() => {
    const lines: PriceLine[] = [];

    const askP0 = parseFloat(formData.askPrice0);
    const askG = parseFloat(formData.askGap);
    const bidP0 = parseFloat(formData.bidPrice0);
    const bidG = parseFloat(formData.bidGap);

    if (Number.isFinite(askP0) && Number.isFinite(askG) && askP0 > 0 && askG > 0 && effectiveAskCount > 0) {
      for (let i = 0; i < effectiveAskCount; i++) {
        const p = askP0 + askG * i;
        lines.push({
          price: p,
          color: '#ef4444',
          label: `ASK #${i + 1}`,
          lineStyle: 2,
          lineWidth: 1,
        });
      }
    }

    if (Number.isFinite(bidP0) && Number.isFinite(bidG) && bidP0 > 0 && bidG > 0 && effectiveBidCount > 0) {
      for (let i = 0; i < effectiveBidCount; i++) {
        const p = bidP0 - bidG * i;
        lines.push({
          price: p,
          color: '#22c55e',
          label: `BID #${i + 1}`,
          lineStyle: 2,
          lineWidth: 1,
        });
      }
    }

    return lines;
  }, [
    formData.askPrice0,
    formData.askGap,
    formData.bidPrice0,
    formData.bidGap,
    effectiveAskCount,
    effectiveBidCount,
  ]);

  // Push up to parent
  useEffect(() => {
    onPriceLinesChange?.(priceLines);
  }, [onPriceLinesChange, priceLines]);

  const handleSubmit = async () => {
    if (!address || !chainId || !baseToken || !quoteToken) return;
    if (!gridexAddress) return;

    const baseIsNative = baseToken.address === zeroAddress;
    const quoteIsNative = quoteToken.address === zeroAddress;
    const wethAddress = chainId ? WETH_ADDRESSES[chainId] : undefined;

    if (baseIsNative && quoteIsNative) return;

    const buildPlaceRequest = () => {
      const askPrice0 = priceToContractBigInt(formData.askPrice0, baseToken.decimals, quoteToken.decimals);
      const askGap = gapToContractBigInt(formData.askGap, baseToken.decimals, quoteToken.decimals);
      const bidPrice0 = priceToContractBigInt(formData.bidPrice0, baseToken.decimals, quoteToken.decimals);
      const bidGap = gapToContractBigInt(formData.bidGap, baseToken.decimals, quoteToken.decimals);

      const linearStrategy = LINEAR_STRATEGY_ADDRESSES[chainId];
      if (!linearStrategy) {
        throw new Error(`Missing strategy address for chain ${chainId}`);
      }

      console.info('limit order - baseDecimals:', baseToken.decimals, 'quoteDecimals:', quoteToken.decimals);
      console.info('limit order - askPrice0:', askPrice0, 'askGap:', askGap);
      console.info('limit order - bidPrice0:', bidPrice0, 'bidGap:', bidGap);

      const askData = encodeAbiParameters(
        [{ type: 'uint256' }, { type: 'int256' }],
        [askPrice0, askGap],
      );

      const bidGapPositive = bidGap;
      const bidGapNegative = bidGapPositive > 0n ? -bidGapPositive : bidGapPositive;

      const bidData = encodeAbiParameters(
        [{ type: 'uint256' }, { type: 'int256' }],
        [bidPrice0, bidGapNegative],
      );

      const param = {
        askStrategy: linearStrategy,
        bidStrategy: linearStrategy,
        askData,
        bidData,
        askOrderCount: effectiveAskCount,
        bidOrderCount: effectiveBidCount,
        fee: LIMIT_ORDER_FEE,
        compound: false,
        oneshot: true,
        baseAmount: parseUnits(formData.amountPerGrid, baseToken.decimals),
      };

      const value = baseIsNative
        ? totals.baseTotal
        : quoteIsNative
          ? totals.quoteTotal
          : 0n;
      const baseCurrency = encodeCurrencyAddress(baseToken.address, baseIsNative, wethAddress);
      const quoteCurrency = encodeCurrencyAddress(quoteToken.address, quoteIsNative, wethAddress);
      const functionName: 'placeETHGridOrders' | 'placeGridOrders' =
        value > 0n ? 'placeETHGridOrders' : 'placeGridOrders';

      return {
        args: [baseCurrency, quoteCurrency, param] as const,
        functionName,
        value,
      };
    };

    await submitOrder({
      address,
      baseApproval: {
        currentAllowance: (baseAllowance as bigint | undefined) ?? 0n,
        enabled: needsBaseApproval,
        requiredAmount: totals.baseTotal,
        stage: 'approving_base',
        symbol: baseToken.symbol,
        tokenAddress: baseToken.address,
      },
      buildPlaceRequest,
      gridexAddress,
      quoteApproval: {
        currentAllowance: (quoteAllowance as bigint | undefined) ?? 0n,
        enabled: needsQuoteApproval,
        requiredAmount: totals.quoteTotal,
        stage: 'approving_quote',
        symbol: quoteToken.symbol,
        tokenAddress: quoteToken.address,
      },
    });
  };

  const isLoading = isPending || isSubmitting;

  return (
    <Card variant="bordered">
      <CardHeader>
        <CardTitle>{t('limit.place_order')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ask Price & Gap */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-(--text-secondary) tracking-wide uppercase">
            {t('grid.order_form.ask_settings')}
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <Input
              placeholder={t('grid.order_form.ask_price0')}
              value={formData.askPrice0}
              onChange={(e) => handleInputChange('askPrice0', e.target.value)}
              suffix={quoteToken?.symbol}
              type="number"
            />
            <Input
              placeholder={t('grid.order_form.ask_gap')}
              value={formData.askGap}
              onChange={(e) => handleInputChange('askGap', e.target.value)}
              suffix={quoteToken?.symbol}
              type="number"
            />
          </div>
        </div>

        {/* Bid Price & Gap */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-(--text-secondary) tracking-wide uppercase">
            {t('grid.order_form.bid_settings')}
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <Input
              placeholder={t('grid.order_form.bid_price0')}
              value={formData.bidPrice0}
              onChange={(e) => handleInputChange('bidPrice0', e.target.value)}
              suffix={quoteToken?.symbol}
              type="number"
            />
            <Input
              placeholder={t('grid.order_form.bid_gap')}
              value={formData.bidGap}
              onChange={(e) => handleInputChange('bidGap', e.target.value)}
              suffix={quoteToken?.symbol}
              type="number"
            />
          </div>
        </div>

        {/* Grid Count */}
        <div className="grid grid-cols-2 gap-2.5">
          <Input
            label={t('grid.order_form.ask_orders')}
            value={formData.askOrderCount}
            onChange={(e) => handleInputChange('askOrderCount', e.target.value)}
            type="number"
            min="0"
            max="100"
          />
          <Input
            label={t('grid.order_form.bid_orders')}
            value={formData.bidOrderCount}
            onChange={(e) => handleInputChange('bidOrderCount', e.target.value)}
            type="number"
            min="0"
            max="100"
          />
        </div>

        {/* Effective counts hint when price/gap is 0 */}
        {(effectiveAskCount !== (parseInt(formData.askOrderCount) || 0) ||
          effectiveBidCount !== (parseInt(formData.bidOrderCount) || 0)) && (
          <div className="px-3 py-2 bg-(--bg-inset) rounded-md border border-(--border-subtle) text-[11px] text-(--text-disabled)">
            {t('grid.order_form.effective_counts')}: Ask {effectiveAskCount} / Bid {effectiveBidCount}
          </div>
        )}

        {/* Amount Per Grid */}
        <Input
          label={t('grid.order_form.amount_per_grid')}
          value={formData.amountPerGrid}
          onChange={(e) => handleInputChange('amountPerGrid', e.target.value)}
          suffix={baseToken?.symbol}
          type="number"
        />

        {/* Balance */}
        <div className="px-3.5 py-3 bg-(--bg-inset) rounded-md border border-(--border-subtle) space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-(--text-tertiary)">{t('grid.order_form.base_balance')}</span>
            <span className="font-semibold text-(--text-primary)">
              {!address || !baseToken
                ? '—'
                : isBaseBalanceLoading
                  ? t('common.loading')
                  : isBaseBalanceError
                    ? '—'
                    : baseBalance
                      ? `${formatAmount(baseBalance.value, baseToken.decimals)} ${baseToken.symbol}`
                      : `0 ${baseToken.symbol}`}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-(--text-tertiary)">{t('grid.order_form.quote_balance')}</span>
            <span className="font-semibold text-(--text-primary)">
              {!address || !quoteToken
                ? '—'
                : isQuoteBalanceLoading
                  ? t('common.loading')
                  : isQuoteBalanceError
                    ? '—'
                    : quoteBalance
                      ? `${formatAmount(quoteBalance.value, quoteToken.decimals)} ${quoteToken.symbol}`
                      : `0 ${quoteToken.symbol}`}
            </span>
          </div>
        </div>

        {/* Total Investment — shows both base and quote token amounts */}
        <div className="px-3.5 py-3 bg-(--bg-inset) rounded-md border border-(--border-subtle) space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-(--text-tertiary)">{t('grid.order_form.total_base')}</span>
            <span className="font-semibold text-(--text-primary)">
              {baseToken
                ? `${formatAmount(totals.baseTotal, baseToken.decimals)} ${baseToken.symbol}`
                : '—'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-(--text-tertiary)">{t('grid.order_form.total_quote')}</span>
            <span className="font-semibold text-(--text-primary)">
              {quoteToken
                ? `${formatAmount(totals.quoteTotal, quoteToken.decimals)} ${quoteToken.symbol}`
                : '—'}
            </span>
          </div>
        </div>

        {/* Submit */}
        {!address ? (
          <Button
            className="w-full"
            size="lg"
            onClick={openConnectModal}
          >
            {t('common.connect_wallet')}
          </Button>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!baseToken || !quoteToken || isLoading}
          >
            {t('limit.order_form.place_order')}
          </Button>
        )}
      </CardContent>

      <TransactionStatusDialog
        open={txDialogOpen}
        onClose={closeTxDialog}
        title={t('limit.order_form.place_order')}
        steps={txSteps}
        error={txError}
        chainId={chainId}
      />
    </Card>
  );
}
