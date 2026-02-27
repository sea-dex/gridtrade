import { env } from './env.js';

export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  gridexAddress: string;
  vaultAddress: string;
  linearStrategyAddress: string;
  geometryStrategyAddress: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// v2 contract addresses - same across all EVM chains
const GRIDEX_ROUTER_ADDRESS = '0xa91a5AAa0BC042200a3391eDb7b02d5B4aa804dB';
const VAULT_ADDRESS = '0xaFf85438378F92E10C655d3eD2966f3f9F31f361';
const LINEAR_STRATEGY_ADDRESS = '0x9D403942473B39123e8dAbeC529011Ae8636e61D';
const GEOMETRY_STRATEGY_ADDRESS = '0xB0281fE94d7f739142ec89c633AFaEACBd3b08e8';

export const chains: Record<number, ChainConfig> = {
  1: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: env.ETH_RPC_URL,
    gridexAddress: GRIDEX_ROUTER_ADDRESS,
    vaultAddress: VAULT_ADDRESS,
    linearStrategyAddress: LINEAR_STRATEGY_ADDRESS,
    geometryStrategyAddress: GEOMETRY_STRATEGY_ADDRESS,
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  56: {
    id: 56,
    name: 'BNB Smart Chain',
    rpcUrl: env.BSC_RPC_URL,
    gridexAddress: GRIDEX_ROUTER_ADDRESS,
    vaultAddress: VAULT_ADDRESS,
    linearStrategyAddress: LINEAR_STRATEGY_ADDRESS,
    geometryStrategyAddress: GEOMETRY_STRATEGY_ADDRESS,
    blockExplorer: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
  },
  8453: {
    id: 8453,
    name: 'Base',
    rpcUrl: env.BASE_RPC_URL,
    gridexAddress: GRIDEX_ROUTER_ADDRESS,
    vaultAddress: VAULT_ADDRESS,
    linearStrategyAddress: LINEAR_STRATEGY_ADDRESS,
    geometryStrategyAddress: GEOMETRY_STRATEGY_ADDRESS,
    blockExplorer: 'https://basescan.org',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  97: {
    id: 97,
    name: 'BNB Smart Chain Testnet',
    rpcUrl: env.BSC_TESTNET_RPC_URL,
    gridexAddress: GRIDEX_ROUTER_ADDRESS,
    vaultAddress: VAULT_ADDRESS,
    linearStrategyAddress: LINEAR_STRATEGY_ADDRESS,
    geometryStrategyAddress: GEOMETRY_STRATEGY_ADDRESS,
    blockExplorer: 'https://testnet.bscscan.com',
    nativeCurrency: {
      name: 'tBNB',
      symbol: 'tBNB',
      decimals: 18,
    },
  },
};

export const getChainConfig = (chainId: number): ChainConfig | undefined => {
  return chains[chainId];
};

export const getSupportedChainIds = (): number[] => {
  return Object.keys(chains).map(Number);
};
