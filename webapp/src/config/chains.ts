import { mainnet, bsc, base, bscTestnet } from "wagmi/chains";

// export const SUPPORTED_CHAINS = [mainnet, bsc, base, bscTestnet] as const;
export const SUPPORTED_CHAINS =
  process.env.NODE_ENV === "production"
    ? ([bsc] as const)
    : ([bsc, bscTestnet] as const);

export const CHAIN_NAMES: Record<number, string> = {
  [mainnet.id]: "Ethereum",
  [bsc.id]: "BNB Chain",
  [base.id]: "Base",
  [bscTestnet.id]: "BSC Testnet",
};

// v2 contract addresses - same across all EVM chains
// Updated: Router (GridEx), Vault, Linear, Geometry
export const GRIDEX_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: "0xa0F2a4b56fbA7F98332D39fB18f4073bB2b78dd9",
  [bsc.id]: "0xa0F2a4b56fbA7F98332D39fB18f4073bB2b78dd9",
  [base.id]: "0xa0F2a4b56fbA7F98332D39fB18f4073bB2b78dd9",
  [bscTestnet.id]: "0xa0F2a4b56fbA7F98332D39fB18f4073bB2b78dd9",
};

export const VAULT_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: "0x5a93dbc8BfB3cA53cD1A3aAfdcc84aFBF5276CC8",
  [bsc.id]: "0x5a93dbc8BfB3cA53cD1A3aAfdcc84aFBF5276CC8",
  [base.id]: "0x5a93dbc8BfB3cA53cD1A3aAfdcc84aFBF5276CC8",
  [bscTestnet.id]: "0x5a93dbc8BfB3cA53cD1A3aAfdcc84aFBF5276CC8",
};

export const LINEAR_STRATEGY_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: "0xFce4A9fE4764101259E154C7E4Ebce90763A9085",
  [bsc.id]: "0xFce4A9fE4764101259E154C7E4Ebce90763A9085",
  [base.id]: "0xFce4A9fE4764101259E154C7E4Ebce90763A9085",
  [bscTestnet.id]: "0xFce4A9fE4764101259E154C7E4Ebce90763A9085",
};

export const GEOMETRY_STRATEGY_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: "0x75320716bF2Bbfb27F2e0F1cC3b2dDc7a9Da626f",
  [bsc.id]: "0x75320716bF2Bbfb27F2e0F1cC3b2dDc7a9Da626f",
  [base.id]: "0x75320716bF2Bbfb27F2e0F1cC3b2dDc7a9Da626f",
  [bscTestnet.id]: "0x75320716bF2Bbfb27F2e0F1cC3b2dDc7a9Da626f",
};

export const NATIVE_TOKENS: Record<
  number,
  { symbol: string; name: string; decimals: number }
> = {
  [mainnet.id]: { symbol: "ETH", name: "Ethereum", decimals: 18 },
  [bsc.id]: { symbol: "BNB", name: "BNB", decimals: 18 },
  [base.id]: { symbol: "ETH", name: "Ethereum", decimals: 18 },
  [bscTestnet.id]: { symbol: "tBNB", name: "Test BNB", decimals: 18 },
};

// WETH addresses for each chain
export const WETH_ADDRESSES: Record<number, `0x${string}`> = {
  [mainnet.id]: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  [bsc.id]: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
  [base.id]: "0x4200000000000000000000000000000000000006",
  [bscTestnet.id]: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd", // WBNB on testnet
};

// Deploy GridEx7702BatchExecutor per chain and fill the address here to enable
// single-transaction ERC-7702 approve + place flows in the webapp.
export const GRID_7702_EXECUTOR_ADDRESSES: Partial<
  Record<number, `0x${string}`>
> = {
  [mainnet.id]: "0x739E82B14cdBED50091452f17e3E89245D43E53C",
  [bsc.id]: "0x739E82B14cdBED50091452f17e3E89245D43E53C",
  [base.id]: "0x739E82B14cdBED50091452f17e3E89245D43E53C",
  [bscTestnet.id]: "0x739E82B14cdBED50091452f17e3E89245D43E53C",
};

export const DEFAULT_CHAIN = bscTestnet;
