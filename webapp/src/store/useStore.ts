import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Locale, defaultLocale } from '@/i18n';
import { DEFAULT_CHAIN } from '@/config/chains';

interface Token {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

interface TradingPair {
  base: Token;
  quote: Token;
  pairId: number;
}

interface AppState {
  // Locale
  locale: Locale;
  setLocale: (locale: Locale) => void;

  // Selected chain
  selectedChainId: number;
  setSelectedChainId: (chainId: number) => void;

  // Trading pair
  selectedPair: TradingPair | null;
  setSelectedPair: (pair: TradingPair | null) => void;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Sidebar (mobile)
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Locale
      locale: defaultLocale,
      setLocale: (locale) => set({ locale }),

      // Selected chain (default to BSC Testnet)
      selectedChainId: DEFAULT_CHAIN.id,
      setSelectedChainId: (chainId) => set({ selectedChainId: chainId }),

      // Trading pair
      selectedPair: null,
      setSelectedPair: (pair) => set({ selectedPair: pair }),

      // Theme
      theme: 'dark',
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

      // Sidebar (mobile)
      isSidebarOpen: false,
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
    }),
    {
      name: 'gridex-storage',
      partialize: (state) => ({
        locale: state.locale,
        selectedChainId: state.selectedChainId,
        theme: state.theme,
      }),
    }
  )
);
