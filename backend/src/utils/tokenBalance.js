const { Connection, PublicKey } = require('@solana/web3.js');

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');

const DEFAULT_MINT = '6wDhSCLLZRQMJQwafEtoyBz4u9tQnYDwJMs98cYHpump';

function parseTokenAmount(tokenAmount) {
  if (tokenAmount.uiAmount != null) return tokenAmount.uiAmount;
  const decimals = tokenAmount.decimals ?? 0;
  return Number(tokenAmount.amount) / 10 ** decimals;
}

async function fetchTokenBalance(walletAddress, mintAddress = process.env.SCRAP_MINT_ADDRESS || DEFAULT_MINT) {
  const rpc = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  const connection = new Connection(rpc, 'confirmed');
  const owner = new PublicKey(walletAddress);
  const mint = new PublicKey(mintAddress);

  let total = 0;
  let sawAccount = false;

  for (const programId of [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID]) {
    const { value } = await connection.getParsedTokenAccountsByOwner(owner, { mint, programId });
    for (const { account } of value) {
      sawAccount = true;
      total += parseTokenAmount(account.data.parsed.info.tokenAmount);
    }
  }

  if (!sawAccount) {
    const { value } = await connection.getParsedTokenAccountsByOwner(owner, { mint });
    for (const { account } of value) {
      total += parseTokenAmount(account.data.parsed.info.tokenAmount);
    }
  }

  return total;
}

module.exports = { fetchTokenBalance, DEFAULT_MINT };
