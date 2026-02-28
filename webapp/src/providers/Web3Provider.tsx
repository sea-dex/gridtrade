'use client';

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, useAccount } from 'wagmi';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from '@/config/wagmi';
import { useStore } from '@/store/useStore';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

/**
 * Syncs the connected wallet's chainId to the Zustand store so that
 * token lists (base / quote) and other chain-dependent data stay in sync
 * when the user switches networks via the wallet.
 */
function ChainSyncManager() {
  const { chainId, isConnected } = useAccount();
  const setSelectedChainId = useStore((s) => s.setSelectedChainId);

  useEffect(() => {
    if (isConnected && chainId) {
      setSelectedChainId(chainId);
    }
  }, [chainId, isConnected, setSelectedChainId]);

  return null;
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const theme = useStore((state) => state.theme);
  const locale = useStore((state) => state.locale);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={theme === 'dark' ? darkTheme() : lightTheme()}
          modalSize="compact"
          locale={locale}
        >
          <ChainSyncManager />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
