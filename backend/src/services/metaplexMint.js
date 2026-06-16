const {
  Connection, PublicKey, TransactionMessage, VersionedTransaction,
} = require('@solana/web3.js');
const {
  getAssociatedTokenAddressSync,
  createBurnCheckedInstruction,
  getMint,
} = require('@solana/spl-token');
const bs58 = require('bs58');

let umiCache = null;

function getConnection() {
  const rpc = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  return new Connection(rpc, 'confirmed');
}

function parseSecretKey(secret) {
  try {
    return bs58.decode(secret);
  } catch {
    return Uint8Array.from(JSON.parse(secret));
  }
}

async function getUmi() {
  if (umiCache) return umiCache;

  const { createUmi } = await import('@metaplex-foundation/umi-bundle-defaults');
  const { mplCore } = await import('@metaplex-foundation/mpl-core');
  const { keypairIdentity, createSignerFromKeypair } = await import('@metaplex-foundation/umi');

  const secret = process.env.MINT_AUTHORITY_SECRET;
  if (!secret) throw new Error('MINT_AUTHORITY_SECRET not configured');

  const umi = createUmi(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com').use(mplCore());
  const keypair = umi.eddsa.createKeypairFromSecretKey(parseSecretKey(secret));
  const signer  = createSignerFromKeypair(umi, keypair);
  umi.use(keypairIdentity(signer));

  umiCache = { umi, authority: signer };
  return umiCache;
}

function getBurnAmountBaseUnits(decimals) {
  const human = BigInt(process.env.MINT_BURN_AMOUNT || 10000);
  return human * BigInt(10 ** decimals);
}

async function buildBurnTransaction(walletAddress) {
  const connection = getConnection();
  const mintPubkey = new PublicKey(
    process.env.SCRAP_MINT_ADDRESS || '6wDhSCLLZRQMJQwafEtoyBz4u9tQnYDwJMs98cYHpump'
  );
  const owner = new PublicKey(walletAddress);
  const mintInfo = await getMint(connection, mintPubkey);
  const amount   = getBurnAmountBaseUnits(mintInfo.decimals);

  const ata = getAssociatedTokenAddressSync(mintPubkey, owner);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');

  const ix = createBurnCheckedInstruction(ata, mintPubkey, owner, amount, mintInfo.decimals);
  const msg = new TransactionMessage({
    payerKey:         owner,
    recentBlockhash:  blockhash,
    instructions:     [ix],
  }).compileToV0Message();

  const tx = new VersionedTransaction(msg);
  return {
    transaction:          Buffer.from(tx.serialize()).toString('base64'),
    blockhash,
    lastValidBlockHeight,
    burnAmount:           amount.toString(),
    scrapMint:            mintPubkey.toBase58(),
  };
}

async function buildMintTransaction({ walletAddress, metadataUri, name, assetSecretKey }) {
  const { umi, authority } = await getUmi();
  const { create } = await import('@metaplex-foundation/mpl-core');
  const {
    generateSigner, createSignerFromKeypair, createNoopSigner, publicKey,
  } = await import('@metaplex-foundation/umi');

  const collectionAddr = process.env.METAPLEX_COLLECTION_ADDRESS;
  if (!collectionAddr) throw new Error('METAPLEX_COLLECTION_ADDRESS not configured');

  const payer = createNoopSigner(publicKey(walletAddress));
  let asset;
  let assetSecretOut = null;

  if (assetSecretKey) {
    const kp = umi.eddsa.createKeypairFromSecretKey(parseSecretKey(assetSecretKey));
    asset = createSignerFromKeypair(umi, kp);
  } else {
    asset = generateSigner(umi);
    assetSecretOut = bs58.encode(asset.secretKey);
  }

  const txBuilder = create(umi, {
    asset,
    collection: { publicKey: publicKey(collectionAddr) },
    payer,
    owner:      publicKey(walletAddress),
    authority,
    name,
    uri:        metadataUri,
  });

  const blockhash = await umi.rpc.getLatestBlockhash();
  const builtTx   = await txBuilder.setBlockhash(blockhash).buildAndSign(umi);
  const serialized = umi.transactions.serialize(builtTx);

  return {
    transaction:          Buffer.from(serialized).toString('base64'),
    assetAddress:         asset.publicKey.toString(),
    assetSecret:          assetSecretOut,
    blockhash:            blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight,
  };
}

async function verifyBurnTransaction(signature, walletAddress) {
  const connection = getConnection();
  const tx = await connection.getParsedTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: 'confirmed',
  });
  if (!tx || tx.meta?.err) throw new Error('Burn transaction failed or not found');

  const mintStr = process.env.SCRAP_MINT_ADDRESS || '6wDhSCLLZRQMJQwafEtoyBz4u9tQnYDwJMs98cYHpump';
  const mintInfo = await getMint(connection, new PublicKey(mintStr));
  const expected = getBurnAmountBaseUnits(mintInfo.decimals);

  const inner = tx.meta?.innerInstructions || [];
  const top   = tx.transaction.message.instructions || [];
  const allIx = [...top, ...inner.flatMap(i => i.instructions)];

  let burned = 0n;
  for (const ix of allIx) {
    if (ix.program === 'spl-token' && ix.parsed?.type === 'burnChecked') {
      const info = ix.parsed.info;
      if (info.mint === mintStr && info.authority === walletAddress) {
        burned += BigInt(info.tokenAmount?.amount || info.amount || 0);
      }
    }
    if (ix.program === 'spl-token' && ix.parsed?.type === 'burn') {
      const info = ix.parsed.info;
      if (info.mint === mintStr && info.authority === walletAddress) {
        burned += BigInt(info.amount || 0);
      }
    }
  }

  if (burned < expected) {
    throw new Error(`Insufficient SCRAP burned: expected ${expected}, got ${burned}`);
  }
  return true;
}

async function verifyMintTransaction(signature, assetAddress) {
  const connection = getConnection();
  const tx = await connection.getTransaction(signature, {
    maxSupportedTransactionVersion: 0,
    commitment: 'confirmed',
  });
  if (!tx || tx.meta?.err) throw new Error('Mint transaction failed or not found');

  const info = await connection.getAccountInfo(new PublicKey(assetAddress));
  if (!info || info.data.length < 8) {
    throw new Error('Minted asset account not found on-chain');
  }
  return true;
}

module.exports = {
  getConnection,
  getUmi,
  buildBurnTransaction,
  buildMintTransaction,
  verifyBurnTransaction,
  verifyMintTransaction,
  getBurnAmountBaseUnits,
};
