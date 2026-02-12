'use client';

import { createConfig, http } from 'wagmi';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { mainnet, bsc, base, bscTestnet } from 'wagmi/chains';
import { SUPPORTED_CHAINS } from './chains';

const projectId =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'demo-project-id';

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Popular',
      wallets: [metaMaskWallet, walletConnectWallet, coinbaseWallet, injectedWallet],
    },
  ],
  {
    appName: 'GridEx',
    projectId,
  },
);

export const wagmiConfig = createConfig({
  connectors,
  chains: SUPPORTED_CHAINS,
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [base.id]: http(),
    [bscTestnet.id]: http(),
  },
  ssr: true,
});
