import { mainnet, bsc, base, bscTestnet } from 'wagmi/chains';

export const SUPPORTED_CHAINS = [mainnet, bsc, base, bscTestnet] as const;

export const CHAIN_NAMES: Record<number, string> = {
  [mainnet.id]: 'Ethereum',
  [bsc.id]: 'BNB Chain',
  [base.id]: 'Base',
  [bscTestnet.id]: 'BSC Testnet',
};

export const GRIDEX_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: '0xb2eFe2C5291C5Fc8189eCEd4D1aeE6069C7FBC5e',
  [bsc.id]: '0xb2eFe2C5291C5Fc8189eCEd4D1aeE6069C7FBC5e',
  [base.id]: '0xb2eFe2C5291C5Fc8189eCEd4D1aeE6069C7FBC5e',
  [bscTestnet.id]: '0xb2eFe2C5291C5Fc8189eCEd4D1aeE6069C7FBC5e',
};

export const LINEAR_STRATEGY_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: '0xA7a92FdBFEac632C45F4aAD466e0aE0a430A8dDd',
  [bsc.id]: '0xA7a92FdBFEac632C45F4aAD466e0aE0a430A8dDd',
  [base.id]: '0xA7a92FdBFEac632C45F4aAD466e0aE0a430A8dDd',
  [bscTestnet.id]: '0xA7a92FdBFEac632C45F4aAD466e0aE0a430A8dDd',
};

export const NATIVE_TOKENS: Record<number, { symbol: string; name: string; decimals: number }> = {
  [mainnet.id]: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  [bsc.id]: { symbol: 'BNB', name: 'BNB', decimals: 18 },
  [base.id]: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  [bscTestnet.id]: { symbol: 'tBNB', name: 'Test BNB', decimals: 18 },
};

export const DEFAULT_CHAIN = bsc;
