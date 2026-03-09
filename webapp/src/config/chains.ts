import { mainnet, bsc, base, bscTestnet } from 'wagmi/chains';

export const SUPPORTED_CHAINS = [mainnet, bsc, base, bscTestnet] as const;

export const CHAIN_NAMES: Record<number, string> = {
  [mainnet.id]: 'Ethereum',
  [bsc.id]: 'BNB Chain',
  [base.id]: 'Base',
  [bscTestnet.id]: 'BSC Testnet',
};

// v2 contract addresses - same across all EVM chains
// Updated: Router (GridEx), Vault, Linear, Geometry
export const GRIDEX_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: '0x4F805a66448F53Fb6bFa5A7E29dBaE36c158aacF',
  [bsc.id]: '0x4F805a66448F53Fb6bFa5A7E29dBaE36c158aacF',
  [base.id]: '0x4F805a66448F53Fb6bFa5A7E29dBaE36c158aacF',
  [bscTestnet.id]: '0x4F805a66448F53Fb6bFa5A7E29dBaE36c158aacF',
};

export const VAULT_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: '0xe09799B35B5f54D7d529F4Ed3599149346Fcd403',
  [bsc.id]: '0xe09799B35B5f54D7d529F4Ed3599149346Fcd403',
  [base.id]: '0xe09799B35B5f54D7d529F4Ed3599149346Fcd403',
  [bscTestnet.id]: '0xe09799B35B5f54D7d529F4Ed3599149346Fcd403',
};

export const LINEAR_STRATEGY_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: '0xbD1d3a308F5e1B0E464fB488746C179805F0ADCf',
  [bsc.id]: '0xbD1d3a308F5e1B0E464fB488746C179805F0ADCf',
  [base.id]: '0xbD1d3a308F5e1B0E464fB488746C179805F0ADCf',
  [bscTestnet.id]: '0xbD1d3a308F5e1B0E464fB488746C179805F0ADCf',
};

export const GEOMETRY_STRATEGY_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: '0xBEe9A1ED1fB177f0A055803fa7aa9fa2ea888414',
  [bsc.id]: '0xBEe9A1ED1fB177f0A055803fa7aa9fa2ea888414',
  [base.id]: '0xBEe9A1ED1fB177f0A055803fa7aa9fa2ea888414',
  [bscTestnet.id]: '0xBEe9A1ED1fB177f0A055803fa7aa9fa2ea888414',
};

export const NATIVE_TOKENS: Record<number, { symbol: string; name: string; decimals: number }> = {
  [mainnet.id]: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  [bsc.id]: { symbol: 'BNB', name: 'BNB', decimals: 18 },
  [base.id]: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  [bscTestnet.id]: { symbol: 'tBNB', name: 'Test BNB', decimals: 18 },
};

// WETH addresses for each chain
export const WETH_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  [bsc.id]: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
  [base.id]: '0x4200000000000000000000000000000000000006',
  [bscTestnet.id]: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd', // WBNB on testnet
};

// Deploy GridEx7702BatchExecutor per chain and fill the address here to enable
// single-transaction ERC-7702 approve + place flows in the webapp.
export const GRID_7702_EXECUTOR_ADDRESSES: Partial<Record<number, `0x${string}`>> = {
  [mainnet.id]: '0x739E82B14cdBED50091452f17e3E89245D43E53C',
  [bsc.id]: '0x739E82B14cdBED50091452f17e3E89245D43E53C',
  [base.id]: '0x739E82B14cdBED50091452f17e3E89245D43E53C',
  [bscTestnet.id]: '0x739E82B14cdBED50091452f17e3E89245D43E53C',
};

export const DEFAULT_CHAIN = bscTestnet;
