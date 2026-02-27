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
  [mainnet.id]: '0xa91a5AAa0BC042200a3391eDb7b02d5B4aa804dB',
  [bsc.id]: '0xa91a5AAa0BC042200a3391eDb7b02d5B4aa804dB',
  [base.id]: '0xa91a5AAa0BC042200a3391eDb7b02d5B4aa804dB',
  [bscTestnet.id]: '0xa91a5AAa0BC042200a3391eDb7b02d5B4aa804dB',
};

export const VAULT_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: '0xaFf85438378F92E10C655d3eD2966f3f9F31f361',
  [bsc.id]: '0xaFf85438378F92E10C655d3eD2966f3f9F31f361',
  [base.id]: '0xaFf85438378F92E10C655d3eD2966f3f9F31f361',
  [bscTestnet.id]: '0xaFf85438378F92E10C655d3eD2966f3f9F31f361',
};

export const LINEAR_STRATEGY_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: '0x9D403942473B39123e8dAbeC529011Ae8636e61D',
  [bsc.id]: '0x9D403942473B39123e8dAbeC529011Ae8636e61D',
  [base.id]: '0x9D403942473B39123e8dAbeC529011Ae8636e61D',
  [bscTestnet.id]: '0x9D403942473B39123e8dAbeC529011Ae8636e61D',
};

export const GEOMETRY_STRATEGY_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: '0xB0281fE94d7f739142ec89c633AFaEACBd3b08e8',
  [bsc.id]: '0xB0281fE94d7f739142ec89c633AFaEACBd3b08e8',
  [base.id]: '0xB0281fE94d7f739142ec89c633AFaEACBd3b08e8',
  [bscTestnet.id]: '0xB0281fE94d7f739142ec89c633AFaEACBd3b08e8',
};

export const NATIVE_TOKENS: Record<number, { symbol: string; name: string; decimals: number }> = {
  [mainnet.id]: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  [bsc.id]: { symbol: 'BNB', name: 'BNB', decimals: 18 },
  [base.id]: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
  [bscTestnet.id]: { symbol: 'tBNB', name: 'Test BNB', decimals: 18 },
};

export const DEFAULT_CHAIN = bsc;
