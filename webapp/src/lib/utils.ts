import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number | string, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  
  if (num >= 1e9) {
    return (num / 1e9).toFixed(decimals) + 'B';
  } else if (num >= 1e6) {
    return (num / 1e6).toFixed(decimals) + 'M';
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(decimals) + 'K';
  }
  return num.toFixed(decimals);
}

export function formatAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatScaledAmount(
  value: string | bigint,
  decimals: number,
  maxFractionDigits: number = 6,
): string {
  const raw = typeof value === 'bigint' ? value : BigInt(value || '0');
  const negative = raw < 0n;
  const abs = negative ? -raw : raw;

  if (decimals <= 0) {
    return `${negative ? '-' : ''}${abs.toString()}`;
  }

  const divisor = 10n ** BigInt(decimals);
  const integerPart = abs / divisor;
  const fractionalPart = abs % divisor;
  const fractionalStr = fractionalPart
    .toString()
    .padStart(decimals, '0')
    .slice(0, Math.max(0, maxFractionDigits))
    .replace(/0+$/, '');

  return `${negative ? '-' : ''}${integerPart.toString()}${fractionalStr ? `.${fractionalStr}` : ''}`;
}

export function formatContractPrice(
  rawPrice: string | bigint,
  baseDecimals: number,
  quoteDecimals: number,
  maxFractionDigits: number = 6,
): string {
  const displayDecimals = 36 + quoteDecimals - baseDecimals;
  return formatScaledAmount(rawPrice, displayDecimals, maxFractionDigits);
}

export function formatPrice(price: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = price / divisor;
  const fractionalPart = price % divisor;
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0').slice(0, 6);
  return `${integerPart}.${fractionalStr}`;
}

export function parseAmount(amount: string, decimals: number = 18): bigint {
  const [integer, fraction = ''] = amount.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(integer + paddedFraction);
}
