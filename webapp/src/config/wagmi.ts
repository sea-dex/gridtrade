'use client';

import { createConfig, http } from 'wagmi';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  walletConnectWallet,
  baseAccount,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { mainnet, bsc, base, bscTestnet } from 'wagmi/chains';
import { SUPPORTED_CHAINS } from './chains';

const projectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project-id';

// Global singleton pattern to prevent multiple WalletConnect initializations
// This is necessary because in development mode with React Strict Mode and HMR,
// the module can be re-evaluated multiple times, causing WalletConnect to be
// initialized repeatedly
declare global {
  // eslint-disable-next-line no-var
  var wagmiConfigSingleton: ReturnType<typeof createConfig> | undefined;
}

function getWagmiConfig() {
  // Check global singleton first (persists across HMR)
  if (globalThis.wagmiConfigSingleton) {
    return globalThis.wagmiConfigSingleton;
  }

  const connectors = connectorsForWallets(
    [
      {
        groupName: 'Popular',
        wallets: [metaMaskWallet, walletConnectWallet, baseAccount, injectedWallet],
      },
    ],
    {
      appName: 'GridTrade',
      projectId,
    },
  );

  globalThis.wagmiConfigSingleton = createConfig({
    connectors,
    chains: SUPPORTED_CHAINS,
    transports: {
      [mainnet.id]: http(),
      [bsc.id]: http('https://bsc-dataseed1.binance.org'),
      [base.id]: http(),
      [bscTestnet.id]: http(),
    },
    ssr: true,
  });

  return globalThis.wagmiConfigSingleton;
}

export const wagmiConfig = getWagmiConfig();
