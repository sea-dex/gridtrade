import { env } from './env.js';

export interface ChainConfig {
  id: number;
  name: string;
  rpcUrl: string;
  gridexAddress: string;
  linearStrategyAddress: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const chains: Record<number, ChainConfig> = {
  1: {
    id: 1,
    name: 'Ethereum',
    rpcUrl: env.ETH_RPC_URL,
    gridexAddress: env.GRIDEX_ADDRESS,
    linearStrategyAddress: '0x1cf9a206c9e416d39332530277D26090AC2692A0',
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
    gridexAddress: env.GRIDEX_ADDRESS,
    linearStrategyAddress: '0x1cf9a206c9e416d39332530277D26090AC2692A0',
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
    gridexAddress: env.GRIDEX_ADDRESS,
    linearStrategyAddress: '0x1cf9a206c9e416d39332530277D26090AC2692A0',
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
    gridexAddress: env.GRIDEX_ADDRESS,
    linearStrategyAddress: '0x1cf9a206c9e416d39332530277D26090AC2692A0',
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
