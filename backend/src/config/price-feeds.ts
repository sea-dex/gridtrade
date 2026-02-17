/**
 * Price feed configuration for K-line data sources.
 *
 * Major pairs are fetched from Binance (CEX) for stability and low latency.
 * Long-tail tokens fall back to on-chain data via The Graph subgraphs.
 *
 * Key: lowercase `${chainId}:${tokenAddress}`
 */

export interface BinanceMapping {
  /** Binance trading pair symbol, e.g. "ETHUSDT" */
  symbol: string;
  /** Which side of the Binance pair corresponds to this token: 'base' or 'quote' */
  side: 'base' | 'quote';
}

export interface PriceFeedEntry {
  chainId: number;
  address: string; // checksummed or lowercase – we normalise on lookup
  symbol: string;
  decimals: number;
  /** If set, K-line data is fetched from Binance using this mapping */
  binance?: BinanceMapping;
}

// ---------------------------------------------------------------------------
// Binance-backed major tokens per chain
// ---------------------------------------------------------------------------

export const priceFeeds: PriceFeedEntry[] = [
  // ── BSC (56) ──────────────────────────────────────────────────────────
  {
    chainId: 56,
    address: '0x0000000000000000000000000000000000000000', // BNB
    symbol: 'BNB',
    decimals: 18,
    binance: { symbol: 'BNBUSDT', side: 'base' },
  },
  {
    chainId: 56,
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
    symbol: 'WBNB',
    decimals: 18,
    binance: { symbol: 'BNBUSDT', side: 'base' },
  },
  {
    chainId: 56,
    address: '0x55d398326f99059fF775485246999027B3197955', // USDT (BSC)
    symbol: 'USDT',
    decimals: 18,
    // USDT is the quote – no separate K-line needed (price ≈ 1)
  },
  {
    chainId: 56,
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC (BSC)
    symbol: 'USDC',
    decimals: 18,
    binance: { symbol: 'USDCUSDT', side: 'base' },
  },
  {
    chainId: 56,
    address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', // ETH (BSC)
    symbol: 'ETH',
    decimals: 18,
    binance: { symbol: 'ETHUSDT', side: 'base' },
  },
  {
    chainId: 56,
    address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', // BTCB
    symbol: 'BTCB',
    decimals: 18,
    binance: { symbol: 'BTCUSDT', side: 'base' },
  },

  // ── Ethereum (1) ──────────────────────────────────────────────────────
    {
    chainId: 1,
    address: '0x0000000000000000000000000000000000000000', // BNB
    symbol: 'ETH',
    decimals: 18,
    binance: { symbol: 'ETHUSDT', side: 'base' },
  },
  {
    chainId: 1,
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
    symbol: 'WETH',
    decimals: 18,
    binance: { symbol: 'ETHUSDT', side: 'base' },
  },
  {
    chainId: 1,
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
    symbol: 'USDT',
    decimals: 6,
  },
  {
    chainId: 1,
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    symbol: 'USDC',
    decimals: 6,
  },
  {
    chainId: 1,
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
    symbol: 'WBTC',
    decimals: 8,
    binance: { symbol: 'BTCUSDT', side: 'base' },
  },

  // ── Base (8453) ───────────────────────────────────────────────────────
  {
    chainId: 8453,
    address: '0x4200000000000000000000000000000000000006', // WETH on Base
    symbol: 'WETH',
    decimals: 18,
    binance: { symbol: 'ETHUSDT', side: 'base' },
  },
  {
    chainId: 8453,
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
    symbol: 'USDC',
    decimals: 6,
  },

  // ── BSC Testnet (97) – map to mainnet Binance symbols for dev ─────────
  {
    chainId: 97,
    address: '0x0000000000000000000000000000000000000000', // BNB
    symbol: 'BNB',
    decimals: 18,
    binance: { symbol: 'BNBUSDT', side: 'base' },
  },
  {
    chainId: 97,
    address: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd', // WBNB testnet
    symbol: 'WBNB',
    decimals: 18,
    binance: { symbol: 'BNBUSDT', side: 'base' },
  },
  {
    chainId: 97,
    address: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd', // USDT testnet
    symbol: 'USDT',
    decimals: 18,
  },
  {
    chainId: 97,
    address: '0x8BaBbB98678facC7342735486C851ABD7A0d17Ca', // ETH testnet
    symbol: 'ETH',
    decimals: 18,
    binance: { symbol: 'ETHUSDT', side: 'base' },
  },
  {
    chainId: 97,
    address: '0x6ce8dA28E2f864420840cF74474eFf5fD80E65B8', // BTCB testnet
    symbol: 'BTCB',
    decimals: 18,
    binance: { symbol: 'BTCUSDT', side: 'base' },
  },
  {
    chainId: 97,
    address: '0x64544969ed7EBf5f083679233325356EbE738930', // USDC testnet
    symbol: 'USDC',
    decimals: 18,
    binance: { symbol: 'USDCUSDT', side: 'base' },
  },
  {
    chainId: 97,
    address: '0xFa60D973F7642B748046464e165A65B7323b0DEE', // WBTC testnet (alt address)
    symbol: 'WBTC',
    decimals: 18,
    binance: { symbol: 'BTCUSDT', side: 'base' },
  },
  {
    chainId: 97,
    address: '0xd66c6B4F0be8CE5b39D52E0Fd1344c389929B378', // ETH testnet (alt address)
    symbol: 'ETH',
    decimals: 18,
    binance: { symbol: 'ETHUSDT', side: 'base' },
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

const feedIndex = new Map<string, PriceFeedEntry>();

for (const entry of priceFeeds) {
  const key = `${entry.chainId}:${entry.address.toLowerCase()}`;
  feedIndex.set(key, entry);
}

/**
 * Look up a price feed entry by chain + token address.
 * Returns `undefined` for unknown / long-tail tokens.
 */
export function getPriceFeed(chainId: number, tokenAddress: string): PriceFeedEntry | undefined {
  return feedIndex.get(`${chainId}:${tokenAddress.toLowerCase()}`);
}

/**
 * Check whether a token has a Binance K-line mapping.
 */
export function hasBinanceMapping(chainId: number, tokenAddress: string): boolean {
  const feed = getPriceFeed(chainId, tokenAddress);
  return !!feed?.binance;
}

// ---------------------------------------------------------------------------
// Subgraph endpoints per chain (Uniswap v3 / PancakeSwap v3)
// ---------------------------------------------------------------------------

export interface SubgraphConfig {
  /** Human-readable DEX name */
  dex: string;
  /** GraphQL endpoint URL */
  url: string;
  /** Factory address (used for pool discovery if needed) */
  factory?: string;
}

/**
 * Subgraph endpoints keyed by chainId.
 * Multiple DEXes per chain are supported – we try them in order.
 */
export const subgraphEndpoints: Record<number, SubgraphConfig[]> = {
  1: [
    {
      dex: 'Uniswap V3',
      url: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3',
    },
  ],
  56: [
    {
      dex: 'PancakeSwap V3',
      url: 'https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc',
    },
  ],
  8453: [
    {
      dex: 'Uniswap V3 Base',
      url: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-base',
    },
  ],
  // Testnet – no real subgraph; will fall back gracefully
};
