'use client';

import { useState } from 'react';
import { useAccount, usePublicClient, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { parseUnits, encodeFunctionData, zeroAddress } from 'viem';
import { useTranslation } from '@/hooks/useTranslation';
import { TradingViewChart } from '@/components/trading/TradingViewChart';
import { TokenSelector } from '@/components/trading/TokenSelector';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ERC20_ABI } from '@/config/abi/ERC20';
import { GRIDEX_ABI } from '@/config/abi/GridEx';
import { GRIDEX_ADDRESSES, LINEAR_STRATEGY_ADDRESSES } from '@/config/chains';
import { useStore } from '@/store/useStore';
import { useKline } from '@/hooks/useKline';
import { cn } from '@/lib/utils';

// Sample tokens for demo
const SAMPLE_TOKENS = [
  {
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' as `0x${string}`,
    symbol: 'WBNB',
    name: 'Wrapped BNB',
    decimals: 18,
  },
  {
    address: '0x55d398326f99059fF775485246999027B3197955' as `0x${string}`,
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 18,
  },
  {
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' as `0x${string}`,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 18,
  },
];

export default function LimitOrderPage() {
  const { t } = useTranslation();
  const { theme } = useStore();
  const { address, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();

  const gridexAddress = chainId ? GRIDEX_ADDRESSES[chainId] : undefined;
  const publicClient = usePublicClient({ chainId });
  const { writeContractAsync, isPending } = useWriteContract();

  const [placeHash, setPlaceHash] = useState<`0x${string}` | undefined>(undefined);
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: placeHash });

  const [baseToken, setBaseToken] = useState(SAMPLE_TOKENS[0]);
  const [quoteToken, setQuoteToken] = useState(SAMPLE_TOKENS[1]);
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');

  const baseIsNative = baseToken.address === zeroAddress;
  const quoteIsNative = quoteToken.address === zeroAddress;

  const baseAmount = amount ? parseUnits(amount, baseToken.decimals) : 0n;
  const quoteAmount = price && amount ? parseUnits((parseFloat(price) * parseFloat(amount)).toFixed(18), 18) : 0n;

  const needsBaseApproval = !!address && !!gridexAddress && !baseIsNative && side === 'sell' && baseAmount > 0n;
  const needsQuoteApproval = !!address && !!gridexAddress && !quoteIsNative && side === 'buy' && quoteAmount > 0n;

  const { data: baseAllowance } = useReadContract({
    address: baseToken.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, gridexAddress as `0x${string}`],
    query: { enabled: needsBaseApproval },
  });

  const { data: quoteAllowance } = useReadContract({
    address: quoteToken.address,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, gridexAddress as `0x${string}`],
    query: { enabled: needsQuoteApproval },
  });

  const total = price && amount ? (parseFloat(price) * parseFloat(amount)).toFixed(4) : '0';

  // Fetch kline data with 30-second auto-refresh
  const { data: klineData, isLoading: klineLoading } = useKline({
    base: baseToken?.address ?? '',
    quote: quoteToken?.address ?? '',
    interval: '1h',
    limit: 200,
    autoRefresh: true,
  });

  const handleSubmit = async () => {
    if (!address || !chainId || !baseToken || !quoteToken || !price || !amount) return;
    if (!gridexAddress) return;
    if (!publicClient) return;

    // Currently only supports at most one native side.
    if (baseIsNative && quoteIsNative) return;

    const approveIfNeeded = async (
      tokenAddress: `0x${string}`,
      requiredAmount: bigint,
      currentAllowance: bigint,
    ) => {
      if (tokenAddress === zeroAddress) return;
      if (requiredAmount <= 0n) return;
      if (currentAllowance >= requiredAmount) return;

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

      // Approve required side
      if (side === 'sell') {
        await approveIfNeeded(
          baseToken.address,
          baseAmount,
          (baseAllowance as bigint | undefined) ?? 0n,
        );
      } else {
        await approveIfNeeded(
          quoteToken.address,
          quoteAmount,
          (quoteAllowance as bigint | undefined) ?? 0n,
        );
      }

      const priceValue = parseUnits(price, 18);

      const linearStrategy = LINEAR_STRATEGY_ADDRESSES[chainId];
      if (!linearStrategy) return;

      const strategyData = encodeFunctionData({
        abi: [{ type: 'function', name: 'encode', inputs: [{ type: 'uint256' }, { type: 'uint256' }] }],
        functionName: 'encode',
        args: [priceValue, 0n],
      });

      const param = {
        askStrategy: linearStrategy,
        bidStrategy: linearStrategy,
        askData: side === 'sell' ? strategyData : '0x',
        bidData: side === 'buy' ? strategyData : '0x',
        askOrderCount: side === 'sell' ? 1 : 0,
        bidOrderCount: side === 'buy' ? 1 : 0,
        fee: 3000, // 0.3% (denominator = 1,000,000)
        compound: false,
        oneshot: true, // Limit order is oneshot
        baseAmount: baseAmount,
      };

      const value = baseIsNative ? baseAmount : quoteIsNative ? quoteAmount : 0n;

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
      console.error('Error placing limit order:', error);
    }
  };

  const isLoading = isPending || isConfirming;

  return (
    <div className="p-5">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-(--text-primary)">{t('limit.title')}</h1>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <Card variant="bordered" className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <TokenSelector
                    selectedToken={baseToken}
                    onSelect={setBaseToken}
                    tokens={SAMPLE_TOKENS.filter(t => t.address !== quoteToken?.address)}
                  />
                  <span className="text-(--text-disabled)">/</span>
                  <TokenSelector
                    selectedToken={quoteToken}
                    onSelect={setQuoteToken}
                    tokens={SAMPLE_TOKENS.filter(t => t.address !== baseToken?.address)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <TradingViewChart
                  candles={klineData?.candles ?? []}
                  theme={theme}
                  height={500}
                  isLoading={klineLoading}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Form Section */}
          <div className="lg:col-span-1">
            <Card variant="bordered">
              <CardHeader>
                <CardTitle>{t('limit.place_order')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Buy/Sell Toggle */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-(--bg-inset) rounded-lg">
                  <button
                    onClick={() => setSide('buy')}
                    className={cn(
                      'py-2.5 rounded-md text-sm font-medium transition-colors',
                      side === 'buy'
                        ? 'bg-(--green) text-(--bg-base)'
                        : 'text-(--text-tertiary) hover:text-(--text-primary)'
                    )}
                  >
                    {t('limit.order_form.buy')}
                  </button>
                  <button
                    onClick={() => setSide('sell')}
                    className={cn(
                      'py-2.5 rounded-md text-sm font-medium transition-colors',
                      side === 'sell'
                        ? 'bg-(--red) text-white'
                        : 'text-(--text-tertiary) hover:text-(--text-primary)'
                    )}
                  >
                    {t('limit.order_form.sell')}
                  </button>
                </div>

                {/* Price Input */}
                <Input
                  label={t('limit.order_form.price')}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  suffix={quoteToken?.symbol}
                  type="number"
                  placeholder="0.00"
                />

                {/* Amount Input */}
                <Input
                  label={t('limit.order_form.amount')}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  suffix={baseToken?.symbol}
                  type="number"
                  placeholder="0.00"
                />

                {/* Total Display */}
                <div className="p-3.5 bg-(--bg-inset) rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-(--text-tertiary)">{t('limit.order_form.total')}</span>
                    <span className="font-medium text-(--text-primary)">
                      {total} {quoteToken?.symbol}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
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
                    className={cn(
                      'w-full',
                      side === 'buy'
                        ? 'bg-(--green) hover:brightness-90 text-(--bg-base)'
                        : 'bg-(--red) hover:brightness-90 text-white'
                    )}
                    size="lg"
                    onClick={handleSubmit}
                    isLoading={isLoading}
                    disabled={!price || !amount || isLoading}
                  >
                    {isLoading
                      ? t('common.loading')
                      : `${side === 'buy' ? t('limit.order_form.buy') : t('limit.order_form.sell')} ${baseToken?.symbol}`}
                  </Button>
                )}

                {isSuccess && (
                  <div className="p-3 bg-(--green-dim) border border-[rgba(52,211,153,0.20)] rounded-lg text-sm text-(--green)">
                    {t('common.success')}! Order placed successfully.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
