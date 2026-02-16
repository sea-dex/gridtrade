import { formatNumber } from './utils';

/**
 * Format a big number string (wei-level, e.g. "12500000000000000000")
 * by dividing by 10^decimals, then applying K/M/B suffixes.
 *
 * @param value    - The raw string value from the backend (e.g. "12500000000000000000")
 * @param decimals - Token decimals, default 18
 * @param displayDecimals - Number of decimal places for display, default 2
 * @returns Formatted string like "12.50M", "3.20K", etc.
 */
export function formatBigNumber(
  value: string | undefined | null,
  decimals: number = 18,
  displayDecimals: number = 2,
): string {
  if (!value || value === '0') return '0';

  try {
    // Handle values that may or may not need wei conversion
    // If the value contains a decimal point, it's already a normal number
    if (value.includes('.')) {
      return formatNumber(parseFloat(value), displayDecimals);
    }

    // For integer strings, divide by 10^decimals
    const bigVal = BigInt(value);
    const divisor = BigInt(10 ** decimals);
    const integerPart = bigVal / divisor;
    const remainder = bigVal % divisor;

    // Convert remainder to decimal fraction
    const remainderStr = remainder.toString().padStart(decimals, '0');
    // Take first 6 digits for precision
    const fractionStr = remainderStr.slice(0, 6);
    const num = parseFloat(`${integerPart}.${fractionStr}`);

    return formatNumber(num, displayDecimals);
  } catch {
    // If parsing fails, try as a plain number
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    return formatNumber(num, displayDecimals);
  }
}
