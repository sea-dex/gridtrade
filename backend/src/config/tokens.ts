// ---------------------------------------------------------------------------
// Token configuration – defines which tokens are available as base / quote
// tokens on each supported chain, along with metadata (logo, decimals, etc.)
// ---------------------------------------------------------------------------

export interface TokenInfo {
  /** Contract address (checksummed) – use 0x0000…0000 for native tokens */
  address: string;
  /** On-chain symbol, e.g. "WETH" */
  symbol: string;
  /** Human-readable name, e.g. "Wrapped Ether" */
  name: string;
  /** Token decimals */
  decimals: number;
  /** URL to the token logo image */
  logo: string;
  /** Total / max supply as a string (to preserve precision). Optional. */
  totalSupply?: string;
  /** Display priority – lower number = higher priority in the list */
  priority: number;
  /** Whether this token can be used as a quote token */
  isQuote: boolean;
  /** Optional tags for filtering, e.g. ["stablecoin", "defi"] */
  tags?: string[];
}

// ---------------------------------------------------------------------------
// Per-chain token lists
// ---------------------------------------------------------------------------

const bscTestnetTokens: TokenInfo[] = [
  // ── Quote tokens ──────────────────────────────────────────────────────
  {
    address: '0x64544969ed7EBf5f083679233325356EbE738930',
    symbol: 'USDC',
    name: 'USD Coin (Testnet)',
    decimals: 18,
    logo: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png',
    priority: 1<<20,
    isQuote: true,
    tags: ['stablecoin'],
  },
  {
    address: '0x5abDc7d6A08AE1975CB9DA9281de41A092a4b85b',
    symbol: 'MockUSDT',
    name: 'MockUSDT',
    decimals: 18,
    logo: 'https://assets.coingecko.com/coins/images/325/standard/Tether.png',
    priority: 1048575,
    isQuote: true,
    tags: ['stablecoin'],
  },
  {
    address: '0x7A05B59A7788aE08AAFAf86b4be90942E311815e',
    symbol: 'MockUSDC',
    name: 'MockUSDC',
    decimals: 6,
    logo: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png',
    priority: 1048574,
    isQuote: true,
    tags: ['stablecoin'],
  },
  {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'tBNB',
    name: 'Testnet BNB',
    decimals: 18,
    logo: 'https://assets.coingecko.com/coins/images/825/standard/bnb-icon2_2x.png',
    priority: 1<<19,
    isQuote: true,
    tags: ['native'],
  },
  {
    address: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
    symbol: 'USDT',
    name: 'Tether USD (Testnet)',
    decimals: 18,
    logo: 'https://assets.coingecko.com/coins/images/325/standard/Tether.png',
    priority: 1000000,
    isQuote: true,
    tags: ['stablecoin'],
  },

  // ── Base tokens ───────────────────────────────────────────────────────
  {
    address: '0xFa60D973F7642B748046464e165A65B7323b0DEE',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin (Testnet)',
    decimals: 18,
    logo: 'https://assets.coingecko.com/coins/images/7598/standard/wrapped_bitcoin_wbtc.png',
    priority: 1,
    isQuote: false,
    tags: ['wrapped'],
  },
  {
    address: '0xd66c6B4F0be8CE5b39D52E0Fd1344c389929B378',
    symbol: 'ETH',
    name: 'Ethereum (Testnet)',
    decimals: 18,
    logo: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
    priority: 2,
    isQuote: false,
    tags: ['wrapped'],
  },
  {
    address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
    symbol: 'WBNB',
    name: 'Wrapped BNB (Testnet)',
    decimals: 18,
    logo: 'https://assets.coingecko.com/coins/images/825/standard/bnb-icon2_2x.png',
    priority: 3,
    isQuote: false,
    tags: ['wrapped', 'native'],
  },
];

const bscMainnetTokens: TokenInfo[] = [
  // ── Quote tokens ──────────────────────────────────────────────────────
  {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'BNB',
    name: 'BNB',
    decimals: 18,
    logo: 'https://assets.coingecko.com/coins/images/825/standard/bnb-icon2_2x.png',
    priority: 1<<19,
    isQuote: true,
    tags: ['native'],
  },
  {
    address: '0x55d398326f99059fF775485246999027B3197955',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 18,
    logo: 'https://assets.coingecko.com/coins/images/325/standard/Tether.png',
    priority: 1<<20,
    isQuote: true,
    tags: ['stablecoin'],
  },
  {
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 18,
    logo: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png',
    priority: 1<<18,
    isQuote: true,
    tags: ['stablecoin'],
  },

  // ── Base tokens ───────────────────────────────────────────────────────
  {
    address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    symbol: 'BTCB',
    name: 'Bitcoin BEP2',
    decimals: 18,
    logo: 'https://assets.coingecko.com/coins/images/7598/standard/wrapped_bitcoin_wbtc.png',
    priority: 1,
    isQuote: false,
    tags: ['wrapped'],
  },
  {
    address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    symbol: 'ETH',
    name: 'Ethereum Token',
    decimals: 18,
    logo: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
    priority: 2,
    isQuote: false,
    tags: ['wrapped'],
  },
  {
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    symbol: 'WBNB',
    name: 'Wrapped BNB',
    decimals: 18,
    logo: 'https://assets.coingecko.com/coins/images/825/standard/bnb-icon2_2x.png',
    priority: 3,
    isQuote: false,
    tags: ['wrapped', 'native'],
  },
];

const ethereumTokens: TokenInfo[] = [
  // ── Quote tokens ──────────────────────────────────────────────────────
  {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    logo: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
    priority: 1<<19,
    isQuote: true,
    tags: ['native'],
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logo: 'https://assets.coingecko.com/coins/images/325/standard/Tether.png',
    priority: 1<<20,
    isQuote: true,
    tags: ['stablecoin'],
  },
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logo: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png',
    priority: (1<<20)-100,
    isQuote: true,
    tags: ['stablecoin'],
  },

  // ── Base tokens ───────────────────────────────────────────────────────
  {
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    logo: 'https://assets.coingecko.com/coins/images/7598/standard/wrapped_bitcoin_wbtc.png',
    priority: 1,
    isQuote: false,
    tags: ['wrapped'],
  },
  {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    logo: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
    priority: 2,
    isQuote: false,
    tags: ['wrapped', 'native'],
  },
];

const baseChainTokens: TokenInfo[] = [
  // ── Quote tokens ──────────────────────────────────────────────────────
  {
    address: '0x0000000000000000000000000000000000000000',
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    logo: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
    priority: 1<<19,
    isQuote: true,
    tags: ['native'],
  },
  {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 1<<20,
    logo: 'https://assets.coingecko.com/coins/images/6319/standard/usdc.png',
    priority: 2,
    isQuote: true,
    tags: ['stablecoin'],
  },

  // ── Base tokens ───────────────────────────────────────────────────────
  {
    address: '0x4200000000000000000000000000000000000006',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    logo: 'https://assets.coingecko.com/coins/images/279/standard/ethereum.png',
    priority: 1,
    isQuote: false,
    tags: ['wrapped', 'native'],
  },
  {
    address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    logo: 'https://assets.coingecko.com/coins/images/9956/standard/Badge_Dai.png',
    priority: 2,
    isQuote: false,
    tags: ['stablecoin'],
  },
];

// ---------------------------------------------------------------------------
// Master registry – keyed by chain ID
// ---------------------------------------------------------------------------

const tokensByChain: Record<number, TokenInfo[]> = {
  1: ethereumTokens,
  56: bscMainnetTokens,
  97: bscTestnetTokens,
  8453: baseChainTokens,
};

// ---------------------------------------------------------------------------
// WETH addresses per chain (for native token substitution)
// ---------------------------------------------------------------------------

export const WETH_ADDRESSES: Record<number, string> = {
  1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  56: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB on BSC
  97: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd', // WBNB on BSC Testnet
  8453: '0x4200000000000000000000000000000000000006',
};

/**
 * Get WETH address for a chain. Returns undefined if chain not supported.
 */
export function getWethAddress(chainId: number): string | undefined {
  return WETH_ADDRESSES[chainId];
}

/**
 * Normalize token address - replace 0x0 address with WETH address for the chain.
 * This is used when looking up pairs where native ETH (0x0) should match WETH.
 */
export function normalizeTokenAddress(address: string, chainId: number): string {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  if (address.toLowerCase() === ZERO_ADDRESS.toLowerCase()) {
    return WETH_ADDRESSES[chainId]?.toLowerCase() || address.toLowerCase();
  }
  return address.toLowerCase();
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Get all tokens for a given chain.
 */
export function getTokensByChain(chainId: number): TokenInfo[] {
  return tokensByChain[chainId] ?? [];
}

/**
 * Get all tokens for a given chain sorted by priority (ascending).
 * Any token can be used as a base token.
 */
export function getBaseTokens(chainId: number): TokenInfo[] {
  return getTokensByChain(chainId).sort((a, b) => b.priority - a.priority);
}

/**
 * Get quote tokens for a given chain, sorted by priority (ascending).
 */
export function getQuoteTokens(chainId: number): TokenInfo[] {
  return getTokensByChain(chainId)
    .filter((t) => t.isQuote)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Look up a single token by address on a given chain (case-insensitive).
 */
export function getTokenByAddress(
  chainId: number,
  address: string,
): TokenInfo | undefined {
  const lower = address.toLowerCase();
  return getTokensByChain(chainId).find(
    (t) => t.address.toLowerCase() === lower,
  );
}
