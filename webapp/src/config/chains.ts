import { mainnet, bsc, base, bscTestnet } from 'wagmi/chains';

export const SUPPORTED_CHAINS = [mainnet, bsc, base, bscTestnet] as const;

export const CHAIN_NAMES: Record<number, string> = {
  [mainnet.id]: 'Ethereum',
  [bsc.id]: 'BNB Chain',
  [base.id]: 'Base',
  [bscTestnet.id]: 'BSC Testnet',
};

export const GRIDEX_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: '0x6fC7AB53f558788d480549C1bF0057A204cC23de',
  [bsc.id]: '0x6fC7AB53f558788d480549C1bF0057A204cC23de',
  [base.id]: '0x6fC7AB53f558788d480549C1bF0057A204cC23de',
  [bscTestnet.id]: '0x6fC7AB53f558788d480549C1bF0057A204cC23de',
};

export const LINEAR_STRATEGY_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: '0x492883d535dEE161D73A28451E53206e72d9daE4',
  [bsc.id]: '0x492883d535dEE161D73A28451E53206e72d9daE4',
  [base.id]: '0x492883d535dEE161D73A28451E53206e72d9daE4',
  [bscTestnet.id]: '0x492883d535dEE161D73A28451E53206e72d9daE4',
};

export const NATIVE_TOKENS: Record<number, { symbol: string; name: string; decimals: number }> = {
  [mainnet.id]: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  [bsc.id]: { symbol: 'BNB', name: 'BNB', decimals: 18 },
  [base.id]: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  [bscTestnet.id]: { symbol: 'tBNB', name: 'Test BNB', decimals: 18 },
};

export const DEFAULT_CHAIN = bscTestnet;
