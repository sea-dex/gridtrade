import { mainnet, bsc, base, bscTestnet } from 'wagmi/chains';

export const SUPPORTED_CHAINS = [mainnet, bsc, base, bscTestnet] as const;

export const CHAIN_NAMES: Record<number, string> = {
  [mainnet.id]: 'Ethereum',
  [bsc.id]: 'BNB Chain',
  [base.id]: 'Base',
  [bscTestnet.id]: 'BSC Testnet',
};

export const GRIDEX_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: '0x5974411085Cc23863b57Fe7CaF106A81142E5Aaf',
  [bsc.id]: '0x5974411085Cc23863b57Fe7CaF106A81142E5Aaf',
  [base.id]: '0x5974411085Cc23863b57Fe7CaF106A81142E5Aaf',
  [bscTestnet.id]: '0x5974411085Cc23863b57Fe7CaF106A81142E5Aaf',
};

export const LINEAR_STRATEGY_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: '0x987a453f8b49d6ccd3962f5e1f25e0cfd22c22fb',
  [bsc.id]: '0x987a453f8b49d6ccd3962f5e1f25e0cfd22c22fb',
  [base.id]: '0x987a453f8b49d6ccd3962f5e1f25e0cfd22c22fb',
  [bscTestnet.id]: '0x987a453f8b49d6ccd3962f5e1f25e0cfd22c22fb',
};

export const NATIVE_TOKENS: Record<number, { symbol: string; name: string; decimals: number }> = {
  [mainnet.id]: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  [bsc.id]: { symbol: 'BNB', name: 'BNB', decimals: 18 },
  [base.id]: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  [bscTestnet.id]: { symbol: 'tBNB', name: 'Test BNB', decimals: 18 },
};

export const DEFAULT_CHAIN = bscTestnet;
