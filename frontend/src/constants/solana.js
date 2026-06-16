import { PublicKey, clusterApiUrl } from '@solana/web3.js';

export const TOKEN_SYMBOL = '$scraprat';

/** Default pump.fun mint — override with VITE_SCRAP_MINT_ADDRESS at build time. */
export const SCRAP_MINT_ADDRESS = import.meta.env.VITE_SCRAP_MINT_ADDRESS
  || '6wDhSCLLZRQMJQwafEtoyBz4u9tQnYDwJMs98cYHpump';

export const NETWORK = import.meta.env.VITE_SOLANA_NETWORK
  || (import.meta.env.PROD ? 'mainnet-beta' : 'devnet');

export function getRpcEndpoint() {
  return import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(NETWORK);
}

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');

function parseTokenAmount(tokenAmount) {
  if (tokenAmount.uiAmount != null) return tokenAmount.uiAmount;
  const decimals = tokenAmount.decimals ?? 0;
  return Number(tokenAmount.amount) / 10 ** decimals;
}

/** Sum SPL + Token-2022 accounts for the scraprat mint. */
export async function fetchScrapTokenBalance(connection, ownerPubkey, mintAddress = SCRAP_MINT_ADDRESS) {
  const mint = new PublicKey(mintAddress);
  let total = 0;
  let sawAccount = false;

  for (const programId of [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID]) {
    const { value } = await connection.getParsedTokenAccountsByOwner(ownerPubkey, { mint, programId });
    for (const { account } of value) {
      sawAccount = true;
      total += parseTokenAmount(account.data.parsed.info.tokenAmount);
    }
  }

  if (!sawAccount) {
    const { value } = await connection.getParsedTokenAccountsByOwner(ownerPubkey, { mint });
    for (const { account } of value) {
      total += parseTokenAmount(account.data.parsed.info.tokenAmount);
    }
  }

  return total;
}
