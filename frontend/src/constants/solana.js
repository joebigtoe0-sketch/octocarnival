import { clusterApiUrl } from '@solana/web3.js';

export const TOKEN_SYMBOL = '$scraprat';

/** Default pump.fun mint — override with VITE_SCRAP_MINT_ADDRESS at build time. */
export const SCRAP_MINT_ADDRESS = import.meta.env.VITE_SCRAP_MINT_ADDRESS
  || '6wDhSCLLZRQMJQwafEtoyBz4u9tQnYDwJMs98cYHpump';

export const NETWORK = import.meta.env.VITE_SOLANA_NETWORK
  || (import.meta.env.PROD ? 'mainnet-beta' : 'devnet');

export function getRpcEndpoint() {
  // Private RPC URLs (Helius, etc.) belong on the backend only — browsers get 403/CORS.
  return clusterApiUrl(NETWORK);
}
