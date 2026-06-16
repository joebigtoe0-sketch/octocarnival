import { clusterApiUrl } from '@solana/web3.js';

export const TOKEN_SYMBOL = '$scraprat';

/** Default pump.fun mint — override with VITE_SCRAP_MINT_ADDRESS at build time. */
export const SCRAP_MINT_ADDRESS = import.meta.env.VITE_SCRAP_MINT_ADDRESS
  || '6wDhSCLLZRQMJQwafEtoyBz4u9tQnYDwJMs98cYHpump';

export const NETWORK = import.meta.env.VITE_SOLANA_NETWORK
  || (import.meta.env.PROD ? 'mainnet-beta' : 'devnet');

export function getRpcEndpoint() {
  // Browser → our backend → Helius (SOLANA_RPC_URL). Public Solana RPC blocks browsers (403).
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/solana/rpc`;
  }
  return clusterApiUrl(NETWORK);
}
