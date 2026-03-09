'use client';

import BigNumber from 'bignumber.js';
import { PRICE_MULTIPLIER } from '@/lib/tradingMath';

const PRICE_MULTIPLIER_BN = new BigNumber(PRICE_MULTIPLIER.toString());

export function priceToFixedBigInt(priceStr: string): bigint {
  const s = (priceStr ?? '').trim();
  if (!s) return 0n;

  const bn = new BigNumber(s);
  if (!bn.isFinite() || bn.isNaN() || bn.lte(0)) return 0n;

  const scaled = bn.times(PRICE_MULTIPLIER_BN).integerValue(BigNumber.ROUND_DOWN);
  return BigInt(scaled.toFixed(0));
}

export function calcQuoteAmountFromContractPrice(baseAmt: bigint, price: bigint): bigint {
  if (price === 0n) return 0n;
  return (baseAmt * price + PRICE_MULTIPLIER - 1n) / PRICE_MULTIPLIER;
}

export function calcQuoteAmountWithDecimals(
  baseAmt: bigint,
  price: bigint,
  baseDecimals: number,
  quoteDecimals: number,
): bigint {
  if (price === 0n) return 0n;

  const decimalDiff = baseDecimals - quoteDecimals;
  let result = calcQuoteAmountFromContractPrice(baseAmt, price);

  if (decimalDiff > 0) {
    const divisor = 10n ** BigInt(decimalDiff);
    result = (result + divisor - 1n) / divisor;
  } else if (decimalDiff < 0) {
    result = result * (10n ** BigInt(-decimalDiff));
  }

  return result;
}

export function calcLinearGridTotalsFromContractPrice(
  baseAmt: bigint,
  bidPrice: bigint,
  bidGap: bigint,
  askCount: number,
  bidCount: number,
): [bigint, bigint] {
  let quoteAmt = 0n;
  let currentBidPrice = bidPrice;

  for (let i = 0; i < bidCount; i++) {
    quoteAmt += calcQuoteAmountFromContractPrice(baseAmt, currentBidPrice);
    currentBidPrice -= bidGap;
  }

  return [baseAmt * BigInt(askCount), quoteAmt];
}

export function calcLinearGridTotalsWithDecimals(
  baseAmt: bigint,
  bidPrice: bigint,
  bidGap: bigint,
  askCount: number,
  bidCount: number,
  baseDecimals: number,
  quoteDecimals: number,
): [bigint, bigint] {
  let quoteAmt = 0n;
  let currentBidPrice = bidPrice;

  for (let i = 0; i < bidCount; i++) {
    quoteAmt += calcQuoteAmountWithDecimals(baseAmt, currentBidPrice, baseDecimals, quoteDecimals);
    currentBidPrice -= bidGap;
  }

  return [baseAmt * BigInt(askCount), quoteAmt];
}
