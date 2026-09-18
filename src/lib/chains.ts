import type { Chain } from "./types";

export const CHAIN_LABELS: Record<Chain, string> = {
  solana: "Solana", ethereum: "Ethereum", bnb: "BNB Chain",
  avalanche: "Avalanche", base: "Base", arbitrum: "Arbitrum",
  optimism: "Optimism", polygon: "Polygon", robinhood_chain: "Robinhood Chain",
};

export function chainLabel(chain?: Chain) { return CHAIN_LABELS[chain ?? "solana"]; }

export function transactionUrl(chain: Chain | undefined, hash: string) {
  const bases: Record<Chain, string> = {
    solana: "https://solscan.io/tx/", ethereum: "https://etherscan.io/tx/",
    bnb: "https://bscscan.com/tx/", avalanche: "https://snowtrace.io/tx/",
    base: "https://basescan.org/tx/", arbitrum: "https://arbiscan.io/tx/",
    optimism: "https://optimistic.etherscan.io/tx/", polygon: "https://polygonscan.com/tx/",
    robinhood_chain: "https://explorer.testnet.chain.robinhood.com/tx/",
  };
  return `${bases[chain ?? "solana"]}${hash}`;
}
