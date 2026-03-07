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
const GRIDEX_ROUTER_ADDRESS = '0x4F805a66448F53Fb6bFa5A7E29dBaE36c158aacF';
const VAULT_ADDRESS = '0xe09799B35B5f54D7d529F4Ed3599149346Fcd403';
const LINEAR_STRATEGY_ADDRESS = '0xbD1d3a308F5e1B0E464fB488746C179805F0ADCf';
const GEOMETRY_STRATEGY_ADDRESS = '0xBEe9A1ED1fB177f0A055803fa7aa9fa2ea888414';

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
