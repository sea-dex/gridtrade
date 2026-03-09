'use client';

import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import BigNumber from 'bignumber.js';
import { HelpCircle } from 'lucide-react';
import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
} from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { parseUnits, encodeAbiParameters, parseEventLogs, zeroAddress } from 'viem';
import { useTranslation } from '@/hooks/useTranslation';
import { useFees } from '@/hooks/useFees';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/Select';
import { ERC20_ABI } from '@/config/abi/ERC20';
import {
  GRIDEX_ADDRESSES,
  LINEAR_STRATEGY_ADDRESSES,
  GEOMETRY_STRATEGY_ADDRESSES,
} from '@/config/chains';
import { useOrderSubmission } from '@/hooks/useOrderSubmission';
import { formatAmount, gapToContractBigInt, priceToContractBigInt } from '@/lib/tradingMath';
import { calcLinearGridTotalsFromContractPrice, calcQuoteAmountFromContractPrice } from '@/lib/tradingTotals';
import { cn } from '@/lib/utils';
import { TransactionStatusDialog } from '@/components/trading/TransactionStatusDialog';
import type { PriceLine } from '@/types/grid';

/** Ratio multiplier for Geometry strategy (10^18) */
const RATIO_MULTIPLIER = 10n ** 18n;
const RATIO_MULTIPLIER_BN = new BigNumber(10).pow(18);

/** Strategy types */
export type StrategyType = 'linear' | 'geometry';

export interface ExternalGridFormData {
  askPrice0?: string;
  bidPrice0?: string;
  askGap?: string;
  bidGap?: string;
  askRatio?: string;  // For geometry strategy
  bidRatio?: string;  // For geometry strategy
  askOrderCount?: string;
  bidOrderCount?: string;
  amountPerGrid?: string;
  compound?: boolean;
  askStrategy?: StrategyType;
  bidStrategy?: StrategyType;
}

interface GridOrderFormProps {
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
  externalFormData?: ExternalGridFormData;
}

const GRID_ORDER_CREATED_EVENT_ABI = [
  {
    type: 'event',
    name: 'GridOrderCreated',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: false, name: 'pairId', type: 'uint64' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'gridId', type: 'uint48' },
      { indexed: false, name: 'asks', type: 'uint32' },
      { indexed: false, name: 'bids', type: 'uint32' },
      { indexed: false, name: 'fee', type: 'uint32' },
      { indexed: false, name: 'compound', type: 'bool' },
      { indexed: false, name: 'oneshot', type: 'bool' },
    ],
  },
] as const;

/**
 * Calculate price at index for geometry strategy
 * price(i) = price0 * ratio^i / RATIO_MULTIPLIER
 */
function calcGeometryPrice(price0: bigint, ratio: bigint, idx: number): bigint {
  if (idx === 0) return price0;
  let result = RATIO_MULTIPLIER;
  let base = ratio;
  let e = idx;
  while (e > 0) {
    if ((e & 1) !== 0) {
      result = (result * base) / RATIO_MULTIPLIER;
    }
    e >>= 1;
    if (e > 0) {
      base = (base * base) / RATIO_MULTIPLIER;
    }
  }
  return (price0 * result) / RATIO_MULTIPLIER;
}

/**
 * Calculate total quote amount for geometry strategy bid orders.
 *
 * NOTE: bidPrice0 should already be in contract format.
 */
function calcGeometryGridQuoteAmount(
  baseAmt: bigint,
  bidPrice0: bigint,
  bidRatio: bigint,
  bidCount: number,
): bigint {
  let quoteAmt = 0n;
  for (let i = 0; i < bidCount; i++) {
    const price = calcGeometryPrice(bidPrice0, bidRatio, i);
    const amt = calcQuoteAmountFromContractPrice(baseAmt, price);
    quoteAmt += amt;
  }
  return quoteAmt;
}

export function GridOrderForm({ baseToken, quoteToken, onPriceLinesChange, externalFormData }: GridOrderFormProps) {
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

  const { fees, defaultFee, isLoading: isFeesLoading } = useFees();

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
    askStrategy: 'linear' as StrategyType,  // strategy type for ask orders
    bidStrategy: 'linear' as StrategyType,  // strategy type for bid orders
    askPrice0: '',    // lowest ask order price
    bidPrice0: '',    // highest bid order price
    askGap: '',       // price gap between ask orders (linear)
    bidGap: '',       // price gap between bid orders (linear)
    askRatio: '',     // ratio for geometry strategy (ask)
    bidRatio: '',     // ratio for geometry strategy (bid)
    askOrderCount: '5',
    bidOrderCount: '5',
    amountPerGrid: '',
    fee: defaultFee ? String(defaultFee.value) : '',
    compound: true,
    oneshot: false,
  }));

  // Update fee when defaultFee loads and fee hasn't been set by user
  if (defaultFee && !formData.fee) {
    setFormData((prev) => ({ ...prev, fee: String(defaultFee.value) }));
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Merge external form data (e.g. from AI strategy generator) into local state
  useEffect(() => {
    if (!externalFormData) return;
    setFormData((prev) => {
      const next = { ...prev };
      if (externalFormData.askPrice0 !== undefined) next.askPrice0 = externalFormData.askPrice0;
      if (externalFormData.bidPrice0 !== undefined) next.bidPrice0 = externalFormData.bidPrice0;
      if (externalFormData.askGap !== undefined) next.askGap = externalFormData.askGap;
      if (externalFormData.bidGap !== undefined) next.bidGap = externalFormData.bidGap;
      if (externalFormData.askRatio !== undefined) next.askRatio = externalFormData.askRatio;
      if (externalFormData.bidRatio !== undefined) next.bidRatio = externalFormData.bidRatio;
      if (externalFormData.askOrderCount !== undefined) next.askOrderCount = externalFormData.askOrderCount;
      if (externalFormData.bidOrderCount !== undefined) next.bidOrderCount = externalFormData.bidOrderCount;
      if (externalFormData.amountPerGrid !== undefined) next.amountPerGrid = externalFormData.amountPerGrid;
      if (externalFormData.compound !== undefined) next.compound = externalFormData.compound;
      if (externalFormData.askStrategy !== undefined) next.askStrategy = externalFormData.askStrategy;
      if (externalFormData.bidStrategy !== undefined) next.bidStrategy = externalFormData.bidStrategy;
      return next;
    });
  }, [externalFormData]);

  // Derive effective order counts:
  // For linear: if price is 0 OR gap is 0 → order count becomes 0
  // For geometry: if price is 0 OR ratio is 0 → order count becomes 0
  const effectiveAskCount = useMemo(() => {
    const price = parseFloat(formData.askPrice0);
    if (!price) return 0;
    if (formData.askStrategy === 'linear') {
      const gap = parseFloat(formData.askGap);
      if (!gap) return 0;
    } else {
      const ratio = parseFloat(formData.askRatio);
      if (!ratio) return 0;
    }
    return parseInt(formData.askOrderCount) || 0;
  }, [formData.askPrice0, formData.askGap, formData.askRatio, formData.askOrderCount, formData.askStrategy]);

  const effectiveBidCount = useMemo(() => {
    const price = parseFloat(formData.bidPrice0);
    if (!price) return 0;
    if (formData.bidStrategy === 'linear') {
      const gap = parseFloat(formData.bidGap);
      if (!gap) return 0;
    } else {
      const ratio = parseFloat(formData.bidRatio);
      if (!ratio) return 0;
    }
    return parseInt(formData.bidOrderCount) || 0;
  }, [formData.bidPrice0, formData.bidGap, formData.bidRatio, formData.bidOrderCount, formData.bidStrategy]);

  // Calculate total base and quote amounts needed
  const totals = useMemo(() => {
    if (!baseToken || !quoteToken || !formData.amountPerGrid) {
      return { baseTotal: 0n, quoteTotal: 0n };
    }

    try {
      const baseAmt = parseUnits(formData.amountPerGrid, baseToken.decimals);
      const bidPrice0 = priceToContractBigInt(formData.bidPrice0, baseToken.decimals, quoteToken.decimals);

      let quoteTotal = 0n;

      if (formData.bidStrategy === 'linear') {
        const bidGap = priceToContractBigInt(formData.bidGap, baseToken.decimals, quoteToken.decimals);
        quoteTotal = calcLinearGridTotalsFromContractPrice(baseAmt, bidPrice0, bidGap, 0, effectiveBidCount)[1];
      } else {
        // Geometry strategy
        const bidRatioBN = new BigNumber(formData.bidRatio || '1').times(RATIO_MULTIPLIER_BN).integerValue(BigNumber.ROUND_DOWN);
        const bidRatio = BigInt(bidRatioBN.toFixed(0));
        quoteTotal = calcGeometryGridQuoteAmount(baseAmt, bidPrice0, bidRatio, effectiveBidCount);
      }

      const baseTotal = baseAmt * BigInt(effectiveAskCount);
      console.info('calculate baseTotal or quoteTotal:', baseTotal, quoteTotal)
      return { baseTotal, quoteTotal };
    } catch (err) {
      console.error('calculate baseTotal or quoteTotal failed:', err)
      return { baseTotal: 0n, quoteTotal: 0n };
    }
  }, [
    formData.amountPerGrid,
    formData.bidPrice0,
    formData.bidGap,
    formData.bidRatio,
    formData.bidStrategy,
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
    const bidP0 = parseFloat(formData.bidPrice0);

    // Ask orders
    if (Number.isFinite(askP0) && askP0 > 0 && effectiveAskCount > 0) {
      if (formData.askStrategy === 'linear') {
        const askG = parseFloat(formData.askGap);
        if (Number.isFinite(askG) && askG > 0) {
          for (let i = 0; i < effectiveAskCount; i++) {
            const p = askP0 + askG * i;
            lines.push({
              price: p,
              color: '#ef4444',
              label: `ASK #${i + 1}`,
              lineStyle: 2, // dashed
              lineWidth: 1,
            });
          }
        }
      } else {
        // Geometry strategy
        const askRatio = parseFloat(formData.askRatio);
        if (Number.isFinite(askRatio) && askRatio > 0) {
          for (let i = 0; i < effectiveAskCount; i++) {
            const p = askP0 * Math.pow(askRatio, i);
            lines.push({
              price: p,
              color: '#ef4444',
              label: `ASK #${i + 1}`,
              lineStyle: 2, // dashed
              lineWidth: 1,
            });
          }
        }
      }
    }

    // Bid orders
    if (Number.isFinite(bidP0) && bidP0 > 0 && effectiveBidCount > 0) {
      if (formData.bidStrategy === 'linear') {
        const bidG = parseFloat(formData.bidGap);
        if (Number.isFinite(bidG) && bidG > 0) {
          for (let i = 0; i < effectiveBidCount; i++) {
            const p = bidP0 - bidG * i;
            lines.push({
              price: p,
              color: '#22c55e',
              label: `BID #${i + 1}`,
              lineStyle: 2, // dashed
              lineWidth: 1,
            });
          }
        }
      } else {
        // Geometry strategy
        const bidRatio = parseFloat(formData.bidRatio);
        if (Number.isFinite(bidRatio) && bidRatio > 0) {
          for (let i = 0; i < effectiveBidCount; i++) {
            const p = bidP0 * Math.pow(bidRatio, i);
            lines.push({
              price: p,
              color: '#22c55e',
              label: `BID #${i + 1}`,
              lineStyle: 2, // dashed
              lineWidth: 1,
            });
          }
        }
      }
    }

    return lines;
  }, [
    formData.askPrice0,
    formData.askGap,
    formData.askRatio,
    formData.askStrategy,
    formData.bidPrice0,
    formData.bidGap,
    formData.bidRatio,
    formData.bidStrategy,
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

    // Native token support (token address == zeroAddress):
    // Use the payable entry and pass msg.value.
    const baseIsNative = baseToken.address === zeroAddress;
    const quoteIsNative = quoteToken.address === zeroAddress;

    // Currently only supports at most one native side.
    if (baseIsNative && quoteIsNative) return;

    const buildPlaceRequest = () => {
      const askPrice0 = priceToContractBigInt(formData.askPrice0, baseToken.decimals, quoteToken.decimals);
      const bidPrice0 = priceToContractBigInt(formData.bidPrice0, baseToken.decimals, quoteToken.decimals);

      const linearStrategy = LINEAR_STRATEGY_ADDRESSES[chainId];
      const geometryStrategy = GEOMETRY_STRATEGY_ADDRESSES[chainId];
      if (!linearStrategy || !geometryStrategy) {
        throw new Error(`Missing strategy address for chain ${chainId}`);
      }

      let askData: `0x${string}`;
      let bidData: `0x${string}`;
      let askStrategyAddress: `0x${string}`;
      let bidStrategyAddress: `0x${string}`;

      if (formData.askStrategy === 'linear') {
        const askGap = gapToContractBigInt(formData.askGap, baseToken.decimals, quoteToken.decimals);
        askData = encodeAbiParameters(
          [{ type: 'uint256' }, { type: 'int256' }],
          [askPrice0, askGap],
        );
        askStrategyAddress = linearStrategy;
      } else {
        const askRatioBN = new BigNumber(formData.askRatio || '1').times(RATIO_MULTIPLIER_BN).integerValue(BigNumber.ROUND_DOWN);
        const askRatio = BigInt(askRatioBN.toFixed(0));
        askData = encodeAbiParameters(
          [{ type: 'uint256' }, { type: 'uint256' }],
          [askPrice0, askRatio],
        );
        askStrategyAddress = geometryStrategy;
      }

      if (formData.bidStrategy === 'linear') {
        const bidGapPositive = gapToContractBigInt(formData.bidGap, baseToken.decimals, quoteToken.decimals);
        const bidGap = bidGapPositive > 0n ? -bidGapPositive : bidGapPositive;
        bidData = encodeAbiParameters(
          [{ type: 'uint256' }, { type: 'int256' }],
          [bidPrice0, bidGap],
        );
        bidStrategyAddress = linearStrategy;
      } else {
        const bidRatioBN = new BigNumber(formData.bidRatio || '1').times(RATIO_MULTIPLIER_BN).integerValue(BigNumber.ROUND_DOWN);
        const bidRatio = BigInt(bidRatioBN.toFixed(0));
        bidData = encodeAbiParameters(
          [{ type: 'uint256' }, { type: 'uint256' }],
          [bidPrice0, bidRatio],
        );
        bidStrategyAddress = geometryStrategy;
      }

      const param = {
        askStrategy: askStrategyAddress,
        bidStrategy: bidStrategyAddress,
        askData,
        bidData,
        askOrderCount: effectiveAskCount,
        bidOrderCount: effectiveBidCount,
        fee: parseInt(formData.fee),
        compound: formData.compound,
        oneshot: formData.oneshot,
        baseAmount: parseUnits(formData.amountPerGrid, baseToken.decimals),
      };

      const value = baseIsNative
        ? totals.baseTotal
        : quoteIsNative
          ? totals.quoteTotal
          : 0n;
      const functionName: 'placeETHGridOrders' | 'placeGridOrders' =
        (baseIsNative || quoteIsNative) ? 'placeETHGridOrders' : 'placeGridOrders';

      return {
        args: [baseToken.address, quoteToken.address, param] as const,
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
      onPlaceSuccess: async (receipt) => {
        const gridOrderCreatedLogs = parseEventLogs({
          abi: GRID_ORDER_CREATED_EVENT_ABI,
          logs: receipt.logs.filter(
            (log) => log.address.toLowerCase() === gridexAddress.toLowerCase(),
          ),
          eventName: 'GridOrderCreated',
          strict: false,
        });

        if (gridOrderCreatedLogs.length === 0) {
          throw new Error('GridOrderCreated event not found in transaction receipt');
        }
      },
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
        <CardTitle className="flex items-center gap-2">
          <span>{t('grid.place_order')}</span>
          <div className="group relative inline-flex items-center">
            <button
              type="button"
              aria-label={t('grid.order_form.help_label')}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-(--text-disabled) transition-colors hover:text-(--text-secondary)"
            >
              <HelpCircle size={14} />
            </button>
            <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 w-72 rounded-(--radius-lg) border border-(--border-default) bg-(--bg-elevated) p-3 opacity-0 shadow-lg transition-all duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
              <p className="text-xs leading-5 text-(--text-secondary)">
                {t('grid.order_form.help_hint')}
              </p>
              <Link
                href="/docs/user-guide#creating-a-grid-order"
                className="mt-2 inline-flex text-xs font-medium text-(--accent) underline-offset-4 hover:underline"
              >
                {t('grid.order_form.help_link')}
              </Link>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {/* Ask Strategy Selection */}
        <div className="space-y-1.5 sm:space-y-2">
          <label className="text-xs font-medium text-(--text-secondary) tracking-wide uppercase">
            {t('grid.order_form.ask_settings')}
          </label>
          <Select
            value={formData.askStrategy}
            onValueChange={(v) => handleInputChange('askStrategy', v as StrategyType)}
          >
            <SelectTrigger placeholder="Select strategy">
              {formData.askStrategy === 'linear' ? 'Linear' : 'Geometry'}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Linear (Fixed Gap)</SelectItem>
              <SelectItem value="geometry">Geometry (Ratio)</SelectItem>
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mt-1.5 sm:mt-2">
            <Input
              placeholder={t('grid.order_form.ask_price0')}
              value={formData.askPrice0}
              onChange={(e) => handleInputChange('askPrice0', e.target.value)}
              suffix={quoteToken?.symbol}
              type="number"
            />
            {formData.askStrategy === 'linear' ? (
              <Input
                placeholder={t('grid.order_form.ask_gap')}
                value={formData.askGap}
                onChange={(e) => handleInputChange('askGap', e.target.value)}
                suffix={quoteToken?.symbol}
                type="number"
              />
            ) : (
              <Input
                placeholder={t('grid.order_form.ask_ratio') || 'Ratio (e.g., 1.01)'}
                value={formData.askRatio}
                onChange={(e) => handleInputChange('askRatio', e.target.value)}
                type="number"
                step="0.001"
              />
            )}
          </div>
        </div>

        {/* Bid Strategy Selection */}
        <div className="space-y-1.5 sm:space-y-2">
          <label className="text-xs font-medium text-(--text-secondary) tracking-wide uppercase">
            {t('grid.order_form.bid_settings')}
          </label>
          <Select
            value={formData.bidStrategy}
            onValueChange={(v) => handleInputChange('bidStrategy', v as StrategyType)}
          >
            <SelectTrigger placeholder="Select strategy">
              {formData.bidStrategy === 'linear' ? 'Linear' : 'Geometry'}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Linear (Fixed Gap)</SelectItem>
              <SelectItem value="geometry">Geometry (Ratio)</SelectItem>
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mt-1.5 sm:mt-2">
            <Input
              placeholder={t('grid.order_form.bid_price0')}
              value={formData.bidPrice0}
              onChange={(e) => handleInputChange('bidPrice0', e.target.value)}
              suffix={quoteToken?.symbol}
              type="number"
            />
            {formData.bidStrategy === 'linear' ? (
              <Input
                placeholder={t('grid.order_form.bid_gap')}
                value={formData.bidGap}
                onChange={(e) => handleInputChange('bidGap', e.target.value)}
                suffix={quoteToken?.symbol}
                type="number"
              />
            ) : (
              <Input
                placeholder={t('grid.order_form.bid_ratio') || 'Ratio (e.g., 0.99)'}
                value={formData.bidRatio}
                onChange={(e) => handleInputChange('bidRatio', e.target.value)}
                type="number"
                step="0.001"
              />
            )}
          </div>
        </div>

        {/* Grid Count */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
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

        {/* Fee */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-(--text-secondary) tracking-wide uppercase">
            {t('grid.order_form.fee')}
          </label>
          <Select
            value={formData.fee}
            onValueChange={(v) => handleInputChange('fee', v)}
            disabled={isFeesLoading || fees.length === 0}
          >
            <SelectTrigger
              placeholder={isFeesLoading ? `${t('common.loading')}...` : '—'}
              disabled={isFeesLoading || fees.length === 0}
            >
              {fees.find((f) => String(f.value) === formData.fee)?.label}
            </SelectTrigger>
            <SelectContent>
              {fees.map((fee) => (
                <SelectItem
                  key={fee.value}
                  value={String(fee.value)}
                  description={fee.description}
                >
                  {fee.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Compound Toggle */}
        <div className="flex items-center justify-between px-3.5 py-3 bg-(--bg-inset) rounded-md border border-(--border-subtle)">
          <div>
            <span className="text-sm font-medium text-(--text-primary)">{t('grid.order_form.compound')}</span>
            <p className="text-[11px] text-(--text-disabled) mt-0.5">
              {t('grid.order_form.compound_desc')}
            </p>
          </div>
          <button
            onClick={() => handleInputChange('compound', !formData.compound)}
            className={cn(
              'relative w-10 h-5.5 rounded-full transition-colors duration-200 shrink-0 ml-3',
              formData.compound ? 'bg-(--accent)' : 'bg-(--bg-elevated) border border-(--border-strong)'
            )}
          >
            <span
              className={cn(
                'absolute top-0.75 left-0.75 w-4 h-4 rounded-full transition-transform duration-200',
                formData.compound
                  ? 'translate-x-4.5 bg-(--bg-base)'
                  : 'translate-x-0 bg-(--text-disabled)'
              )}
            />
          </button>
        </div>

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
            disabled={
              !baseToken ||
              !quoteToken ||
              isLoading ||
              !formData.amountPerGrid ||
              (totals.baseTotal === 0n && totals.quoteTotal === 0n)
            }
          >
            {t('grid.order_form.place_grid')}
          </Button>
        )}
      </CardContent>

      <TransactionStatusDialog
        open={txDialogOpen}
        onClose={closeTxDialog}
        title={t('grid.order_form.place_grid')}
        steps={txSteps}
        error={txError}
        chainId={chainId}
      />
    </Card>
  );
}
