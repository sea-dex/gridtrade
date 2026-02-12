import { mainnet, bsc, base, bscTestnet } from 'wagmi/chains';

export const SUPPORTED_CHAINS = [mainnet, bsc, base, bscTestnet] as const;

export const CHAIN_NAMES: Record<number, string> = {
  [mainnet.id]: 'Ethereum',
  [bsc.id]: 'BNB Chain',
  [base.id]: 'Base',
  [bscTestnet.id]: 'BSC Testnet',
};

export const GRIDEX_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: '0x5F7943e9424eF9370392570D06fFA630a5124e9A',
  [bsc.id]: '0x5F7943e9424eF9370392570D06fFA630a5124e9A',
  [base.id]: '0x5F7943e9424eF9370392570D06fFA630a5124e9A',
  [bscTestnet.id]: '0x5F7943e9424eF9370392570D06fFA630a5124e9A',
};

export const LINEAR_STRATEGY_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: '0x1cf9a206c9e416d39332530277D26090AC2692A0',
  [bsc.id]: '0x1cf9a206c9e416d39332530277D26090AC2692A0',
  [base.id]: '0x1cf9a206c9e416d39332530277D26090AC2692A0',
  [bscTestnet.id]: '0x1cf9a206c9e416d39332530277D26090AC2692A0',
};

export const NATIVE_TOKENS: Record<number, { symbol: string; name: string; decimals: number }> = {
  [mainnet.id]: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  [bsc.id]: { symbol: 'BNB', name: 'BNB', decimals: 18 },
  [base.id]: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  [bscTestnet.id]: { symbol: 'tBNB', name: 'Test BNB', decimals: 18 },
};

export const DEFAULT_CHAIN = bscTestnet;
