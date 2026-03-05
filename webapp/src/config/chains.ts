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
  [mainnet.id]: '0xcBeA520552AC3bf1412D8516e2f35bfaC2c30680',
  [bsc.id]: '0xcBeA520552AC3bf1412D8516e2f35bfaC2c30680',
  [base.id]: '0xcBeA520552AC3bf1412D8516e2f35bfaC2c30680',
  [bscTestnet.id]: '0xcBeA520552AC3bf1412D8516e2f35bfaC2c30680',
};

export const VAULT_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: '0xaFf85438378F92E10C655d3eD2966f3f9F31f361',
  [bsc.id]: '0xaFf85438378F92E10C655d3eD2966f3f9F31f361',
  [base.id]: '0xaFf85438378F92E10C655d3eD2966f3f9F31f361',
  [bscTestnet.id]: '0xaFf85438378F92E10C655d3eD2966f3f9F31f361',
};

export const LINEAR_STRATEGY_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: '0x15A29412d8a97AB171BFe1f5Dc97B30F8F207AAa',
  [bsc.id]: '0x15A29412d8a97AB171BFe1f5Dc97B30F8F207AAa',
  [base.id]: '0x15A29412d8a97AB171BFe1f5Dc97B30F8F207AAa',
  [bscTestnet.id]: '0x15A29412d8a97AB171BFe1f5Dc97B30F8F207AAa',
};

export const GEOMETRY_STRATEGY_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: '0xAF12c459B97659C61084976a7969c80aB726a4Ba',
  [bsc.id]: '0xAF12c459B97659C61084976a7969c80aB726a4Ba',
  [base.id]: '0xAF12c459B97659C61084976a7969c80aB726a4Ba',
  [bscTestnet.id]: '0xAF12c459B97659C61084976a7969c80aB726a4Ba',
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

export const DEFAULT_CHAIN = bscTestnet;
