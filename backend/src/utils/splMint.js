const { PublicKey } = require('@solana/web3.js');
const {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getAssociatedTokenAddressSync,
} = require('@solana/spl-token');

const DEFAULT_SCRAP_MINT = '6wDhSCLLZRQMJQwafEtoyBz4u9tQnYDwJMs98cYHpump';

function scrapMintAddress() {
  return process.env.SCRAP_MINT_ADDRESS || DEFAULT_SCRAP_MINT;
}

async function resolveScrapMint(connection, mintAddress = scrapMintAddress()) {
  const mintPubkey = new PublicKey(mintAddress);

  for (const tokenProgramId of [TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID]) {
    try {
      const mintInfo = await getMint(connection, mintPubkey, undefined, tokenProgramId);
      return { mintPubkey, mintInfo, tokenProgramId };
    } catch {
      // try next program
    }
  }

  throw new Error(`Token mint not found on-chain: ${mintPubkey.toBase58()}`);
}

function getScrapAta(ownerPubkey, mintCtx) {
  const { mintPubkey, tokenProgramId } = mintCtx;
  return getAssociatedTokenAddressSync(mintPubkey, ownerPubkey, false, tokenProgramId);
}

module.exports = {
  DEFAULT_SCRAP_MINT,
  scrapMintAddress,
  resolveScrapMint,
  getScrapAta,
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
};
