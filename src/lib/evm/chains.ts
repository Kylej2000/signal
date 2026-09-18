import type { Chain } from "@/lib/types";

export interface EvmChainConfig {
  id: Exclude<Chain, "solana">;
  label: string;
  dexScreenerId: string;
  rpcUrl: string | undefined;
  explorer: string;
  nativeSymbol: string;
  quoteTokens: Record<string, string>;
}

const q = (pairs: Array<[string, string]>) =>
  Object.fromEntries(pairs.map(([address, symbol]) => [address.toLowerCase(), symbol]));

export function evmChains(): EvmChainConfig[] {
  return [
    { id: "ethereum", label: "Ethereum", dexScreenerId: "ethereum", rpcUrl: process.env.ETHEREUM_RPC_URL || "https://ethereum-rpc.publicnode.com", explorer: "https://etherscan.io", nativeSymbol: "ETH", quoteTokens: q([["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "ETH"], ["0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "USDC"], ["0xdAC17F958D2ee523a2206206994597C13D831ec7", "USDT"]]) },
    { id: "bnb", label: "BNB Chain", dexScreenerId: "bsc", rpcUrl: process.env.BNB_RPC_URL || "https://bsc-rpc.publicnode.com", explorer: "https://bscscan.com", nativeSymbol: "BNB", quoteTokens: q([["0xBB4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", "BNB"], ["0x55d398326f99059fF775485246999027B3197955", "USDT"], ["0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", "USDC"]]) },
    { id: "avalanche", label: "Avalanche", dexScreenerId: "avalanche", rpcUrl: process.env.AVALANCHE_RPC_URL || "https://avalanche-c-chain-rpc.publicnode.com", explorer: "https://snowtrace.io", nativeSymbol: "AVAX", quoteTokens: q([["0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7", "AVAX"], ["0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", "USDC"], ["0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", "USDT"]]) },
    { id: "base", label: "Base", dexScreenerId: "base", rpcUrl: process.env.BASE_RPC_URL || "https://base-rpc.publicnode.com", explorer: "https://basescan.org", nativeSymbol: "ETH", quoteTokens: q([["0x4200000000000000000000000000000000000006", "ETH"], ["0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", "USDC"]]) },
    { id: "arbitrum", label: "Arbitrum", dexScreenerId: "arbitrum", rpcUrl: process.env.ARBITRUM_RPC_URL || "https://arbitrum-one-rpc.publicnode.com", explorer: "https://arbiscan.io", nativeSymbol: "ETH", quoteTokens: q([["0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", "ETH"], ["0xaf88d065e77c8cC2239327C5EDb3A432268e5831", "USDC"], ["0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", "USDT"]]) },
    { id: "optimism", label: "Optimism", dexScreenerId: "optimism", rpcUrl: process.env.OPTIMISM_RPC_URL || "https://optimism-rpc.publicnode.com", explorer: "https://optimistic.etherscan.io", nativeSymbol: "ETH", quoteTokens: q([["0x4200000000000000000000000000000000000006", "ETH"], ["0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", "USDC"], ["0x94b008aA00579c1307B0EF2c499aD98a8ce58e58", "USDT"]]) },
    { id: "polygon", label: "Polygon", dexScreenerId: "polygon", rpcUrl: process.env.POLYGON_RPC_URL || "https://polygon-bor-rpc.publicnode.com", explorer: "https://polygonscan.com", nativeSymbol: "POL", quoteTokens: q([["0x0d500B1d8E8eDB8E10D9757a82e2279Bf0eE0D3", "POL"], ["0x3c499c542cEF5E3811e1192ce70d8cC03D5c3359", "USDC"], ["0xc2132D05D31c914a87C6611C10748AaCBaB04B58e8F", "USDT"]]) },
    { id: "robinhood_chain", label: "Robinhood Chain", dexScreenerId: "robinhood", rpcUrl: process.env.ROBINHOOD_CHAIN_RPC_URL, explorer: process.env.ROBINHOOD_CHAIN_EXPLORER || "https://explorer.testnet.chain.robinhood.com", nativeSymbol: "ETH", quoteTokens: q([]) },
  ];
}

export function evmChain(id: Chain): EvmChainConfig | undefined {
  return evmChains().find((chain) => chain.id === id && chain.rpcUrl);
}
