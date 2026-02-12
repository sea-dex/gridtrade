'use client';

import { useState, useMemo, useEffect } from 'react';
import BigNumber from 'bignumber.js';
import {
  useAccount,
  useBalance,
  usePublicClient,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { parseUnits, encodeAbiParameters, formatUnits, zeroAddress } from 'viem';
import { useTranslation } from '@/hooks/useTranslation';
import { useFees } from '@/hooks/useFees';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/Select';
import { ERC20_ABI } from '@/config/abi/ERC20';
import { GRIDEX_ABI } from '@/config/abi/GridEx';
import { GRIDEX_ADDRESSES, LINEAR_STRATEGY_ADDRESSES } from '@/config/chains';
import { cn } from '@/lib/utils';
import type { PriceLine } from '@/types/grid';

function formatAmount(value: bigint, decimals: number, maxFractionDigits = 6): string {
  const s = formatUnits(value, decimals);
  const [intPart, fracPartRaw = ''] = s.split('.');
  const fracPart = fracPartRaw.slice(0, Math.max(0, maxFractionDigits)).replace(/0+$/, '');
  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

/** Price multiplier for fixed-point arithmetic (10^36) — matches the contract constant */
const PRICE_MULTIPLIER = 10n ** 36n;
const PRICE_MULTIPLIER_BN = new BigNumber(10).pow(36);

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
}

/**
 * Multiply a human-readable price string by PRICE_MULTIPLIER (10^36).
 *
 * Uses bignumber.js to avoid floating-point precision issues and to support
 * inputs like scientific notation (e.g. "1e-8").
 */
function priceToBigInt(priceStr: string): bigint {
  const s = (priceStr ?? '').trim();
  if (!s) return 0n;

  const bn = new BigNumber(s);
  if (!bn.isFinite() || bn.isNaN() || bn.lte(0)) return 0n;

  // Truncate (round down) any precision beyond 36 decimals.
  const scaled = bn.times(PRICE_MULTIPLIER_BN).integerValue(BigNumber.ROUND_DOWN);
  return BigInt(scaled.toFixed(0));
}

/**
 * Replicate the Solidity calcQuoteAmount: quoteAmt = baseAmt * price / PRICE_MULTIPLIER
 * Uses standard bigint division (rounds down, i.e. roundUp = false).
 */
function calcQuoteAmount(baseAmt: bigint, price: bigint): bigint {
  if (price === 0n) return 0n;
  return (baseAmt * price) / PRICE_MULTIPLIER;
}

/**
 * Replicate the Solidity calcGridAmount logic.
 * Returns [totalBaseAmt, totalQuoteAmt].
 */
function calcGridAmount(
  baseAmt: bigint,
  bidPrice: bigint,
  bidGap: bigint,
  askCount: number,
  bidCount: number,
): [bigint, bigint] {
  let quoteAmt = 0n;
  let currentBidPrice = bidPrice;

  for (let i = 0; i < bidCount; i++) {
    const amt = calcQuoteAmount(baseAmt, currentBidPrice);
    quoteAmt += amt;
    currentBidPrice -= bidGap;
  }

  return [baseAmt * BigInt(askCount), quoteAmt];
}

export function GridOrderForm({ baseToken, quoteToken, onPriceLinesChange }: GridOrderFormProps) {
  const { t } = useTranslation();
  const { address, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();

  const gridexAddress = useMemo(() => (chainId ? GRIDEX_ADDRESSES[chainId] : undefined), [chainId]);

  const publicClient = usePublicClient({ chainId });
  const { writeContractAsync, isPending } = useWriteContract();

  const [placeHash, setPlaceHash] = useState<`0x${string}` | undefined>(undefined);
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: placeHash });

  const [submitStage, setSubmitStage] = useState<
    'idle' | 'approving_base' | 'approving_quote' | 'placing'
  >('idle');

  const { fees, defaultFee, isLoading: isFeesLoading } = useFees();

  const {
    data: baseBalance,
    isLoading: isBaseBalanceLoading,
    isError: isBaseBalanceError,
  } = useBalance({
    address,
    chainId,
    token: baseToken?.address,
    query: { enabled: !!address && !!chainId && !!baseToken?.address },
  });

  const {
    data: quoteBalance,
    isLoading: isQuoteBalanceLoading,
    isError: isQuoteBalanceError,
  } = useBalance({
    address,
    chainId,
    token: quoteToken?.address,
    query: { enabled: !!address && !!chainId && !!quoteToken?.address },
  });

  const [formData, setFormData] = useState(() => ({
    askPrice0: '',    // lowest ask order price
    bidPrice0: '',    // highest bid order price
    askGap: '',       // price gap between ask orders
    bidGap: '',       // price gap between bid orders
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
    if (!baseToken || !formData.amountPerGrid) {
      return { baseTotal: 0n, quoteTotal: 0n };
    }

    try {
      const baseAmt = parseUnits(formData.amountPerGrid, baseToken.decimals);
      const bidPrice = priceToBigInt(formData.bidPrice0);
      const bidGap = priceToBigInt(formData.bidGap);

      const [totalBase, totalQuote] = calcGridAmount(
        baseAmt,
        bidPrice,
        bidGap,
        effectiveAskCount,
        effectiveBidCount,
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
          lineStyle: 2, // dashed
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
          lineStyle: 2, // dashed
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

    // Native token support (token address == zeroAddress):
    // Use the payable entry and pass msg.value.
    const baseIsNative = baseToken.address === zeroAddress;
    const quoteIsNative = quoteToken.address === zeroAddress;

    // Currently only supports at most one native side.
    if (baseIsNative && quoteIsNative) return;

    const approveIfNeeded = async (
      tokenAddress: `0x${string}`,
      requiredAmount: bigint,
      currentAllowance: bigint,
      stage: 'approving_base' | 'approving_quote',
    ) => {
      if (!publicClient) throw new Error('Missing public client');
      if (tokenAddress === zeroAddress) return;
      if (requiredAmount <= 0n) return;
      if (currentAllowance >= requiredAmount) return;

      setSubmitStage(stage);

      // Some tokens (e.g. USDT) require setting allowance to 0 before increasing.
      if (currentAllowance > 0n) {
        const hash0 = await writeContractAsync({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [gridexAddress, 0n],
        });
        await publicClient.waitForTransactionReceipt({ hash: hash0 });
      }

      const hash1 = await writeContractAsync({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [gridexAddress, requiredAmount],
      });
      await publicClient.waitForTransactionReceipt({ hash: hash1 });
    };

    try {
      setPlaceHash(undefined);

      // Ensure approvals (must be confirmed before placing)
      await approveIfNeeded(
        baseToken.address,
        totals.baseTotal,
        (baseAllowance as bigint | undefined) ?? 0n,
        'approving_base',
      );

      await approveIfNeeded(
        quoteToken.address,
        totals.quoteTotal,
        (quoteAllowance as bigint | undefined) ?? 0n,
        'approving_quote',
      );

      setSubmitStage('placing');

      const askPrice0 = priceToBigInt(formData.askPrice0);
      const askGap = priceToBigInt(formData.askGap);
      const bidPrice0 = priceToBigInt(formData.bidPrice0);
      const bidGap = priceToBigInt(formData.bidGap);

      console.info('ask price:', askPrice0)
      console.info('ask gap:', askGap)
      console.info('bid price:', bidPrice0)
      console.info('ask price:', askPrice0)
      
      const linearStrategy = LINEAR_STRATEGY_ADDRESSES[chainId];
      if (!linearStrategy) return;

      const askData = encodeAbiParameters(
        [{ type: 'uint256' }, { type: 'uint256' }],
        [askPrice0, askGap],
      );

      const bidData = encodeAbiParameters(
        [{ type: 'uint256' }, { type: 'uint256' }],
        [bidPrice0, bidGap],
      );

      const param = {
        askStrategy: linearStrategy,
        bidStrategy: linearStrategy,
        askData: askData,
        bidData: bidData,
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

      const txHash =
        value > 0n
          ? await writeContractAsync({
              address: gridexAddress,
              abi: GRIDEX_ABI,
              functionName: 'placeETHGridOrders',
              args: [baseToken.address, quoteToken.address, param],
              value,
            })
          : await writeContractAsync({
              address: gridexAddress,
              abi: GRIDEX_ABI,
              functionName: 'placeGridOrders',
              args: [baseToken.address, quoteToken.address, param],
            });

      setPlaceHash(txHash);
    } catch (error) {
      console.error('Error placing grid order:', error);
    } finally {
      setSubmitStage('idle');
    }
  };

  const isLoading = isPending || isConfirming || submitStage !== 'idle';

  return (
    <Card variant="bordered">
      <CardHeader>
        <CardTitle>{t('grid.place_order')}</CardTitle>
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
            disabled={!baseToken || !quoteToken || isLoading}
          >
            {isLoading
              ? submitStage === 'approving_base'
                ? t('grid.order_form.approving_base')
                : submitStage === 'approving_quote'
                  ? t('grid.order_form.approving_quote')
                  : submitStage === 'placing'
                    ? t('grid.order_form.placing_order')
                    : t('common.loading')
              : t('grid.order_form.place_grid')}
          </Button>
        )}

        {isSuccess && (
          <div className="px-3.5 py-2.5 bg-(--green-dim) border border-[rgba(52,211,153,0.15)] rounded-md text-[13px] text-(--green)">
            {t('common.success')}! Transaction confirmed.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
