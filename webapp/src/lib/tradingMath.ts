'use client';

import BigNumber from 'bignumber.js';
import { formatUnits } from 'viem';

export const PRICE_MULTIPLIER = 10n ** 36n;
const PRICE_MULTIPLIER_BN = new BigNumber(10).pow(36);

export function formatAmount(value: bigint, decimals: number, maxFractionDigits = 6): string {
  const s = formatUnits(value, decimals);
  const [intPart, fracPartRaw = ''] = s.split('.');
  const fracPart = fracPartRaw.slice(0, Math.max(0, maxFractionDigits)).replace(/0+$/, '');
  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

export function priceToContractBigInt(
  priceStr: string,
  baseDecimals: number,
  quoteDecimals: number,
): bigint {
  const s = (priceStr ?? '').trim();
  if (!s) return 0n;

  const bn = new BigNumber(s);
  if (!bn.isFinite() || bn.isNaN() || bn.lte(0)) return 0n;

  const decimalAdjustment = new BigNumber(10).pow(quoteDecimals - baseDecimals);
  const scaled = bn
    .times(PRICE_MULTIPLIER_BN)
    .times(decimalAdjustment)
    .integerValue(BigNumber.ROUND_DOWN);

  return BigInt(scaled.toFixed(0));
}

export function gapToContractBigInt(
  gapStr: string,
  baseDecimals: number,
  quoteDecimals: number,
): bigint {
  return priceToContractBigInt(gapStr, baseDecimals, quoteDecimals);
}
