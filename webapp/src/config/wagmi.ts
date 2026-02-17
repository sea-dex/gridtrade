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

export const wagmiConfig = createConfig({
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
