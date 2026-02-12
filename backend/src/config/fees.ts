// ---------------------------------------------------------------------------
// Fee configuration – defines the available fee tiers for grid orders.
// The `fee` field in the GridEx contract is a uint32 representing the fee
// rate with a denominator of 1,000,000. For example, fee = 3000 means
// 3000 / 1,000,000 = 0.30%.
// ---------------------------------------------------------------------------

export interface FeeInfo {
  /** Fee value as stored on-chain (denominator = 1,000,000, i.e. 1 = 0.0001%) */
  value: number;
  /** Human-readable label, e.g. "0.30%" */
  label: string;
  /** Short description of the fee tier */
  description: string;
  /** Whether this tier is the default selection in the UI */
  isDefault: boolean;
  /** Display priority – lower number = higher priority in the list */
  priority: number;
}

// ---------------------------------------------------------------------------
// Fee tier definitions
// ---------------------------------------------------------------------------

const defaultFees: FeeInfo[] = [
  {
    value: 100,
    label: '0.010%',
    description: 'Lowest fee – best for stable pairs with tight spreads',
    isDefault: false,
    priority: 1,
  },
  {
    value: 500,
    label: '0.05%',
    description: 'Low fee – best for pairs with big volumes',
    isDefault: false,
    priority: 1,
  },
  {
    value: 1000,
    label: '0.10%',
    description: 'Low fee – recommended for most trading pairs',
    isDefault: true,
    priority: 1,
  },
  {
    value: 3000,
    label: '0.30%',
    description: 'Standard fee – recommended for most trading pairs',
    isDefault: false,
    priority: 2,
  },
  {
    value: 5000,
    label: '0.50%',
    description: 'Medium fee – suitable for moderately volatile pairs',
    isDefault: false,
    priority: 3,
  },
  {
    value: 10000,
    label: '1.00%',
    description: 'High fee – for highly volatile or low-liquidity pairs',
    isDefault: false,
    priority: 4,
  },
];

// ---------------------------------------------------------------------------
// Per-chain overrides (optional). If a chain is not listed here the default
// fee tiers above are used.
// ---------------------------------------------------------------------------

const feesByChain: Record<number, FeeInfo[]> = {
  // All chains currently share the same fee tiers.
  // Add chain-specific overrides here if needed, e.g.:
  // 97: [ ...bscTestnetFees ],
};

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Get the list of available fee tiers for a given chain, sorted by priority.
 */
export function getFees(chainId: number): FeeInfo[] {
  const fees = feesByChain[chainId] ?? defaultFees;
  return [...fees].sort((a, b) => a.priority - b.priority);
}

/**
 * Get the default fee tier for a given chain.
 */
export function getDefaultFee(chainId: number): FeeInfo | undefined {
  return getFees(chainId).find((f) => f.isDefault);
}
