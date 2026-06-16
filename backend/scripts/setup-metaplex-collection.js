#!/usr/bin/env node
/**
 * One-time Metaplex Core collection setup.
 * Run: node scripts/setup-metaplex-collection.js
 * Saves collection address to stdout; store in METAPLEX_COLLECTION_ADDRESS env.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bs58 = require('bs58');

async function main() {
  const { createUmi } = await import('@metaplex-foundation/umi-bundle-defaults');
  const { mplCore, createCollection } = await import('@metaplex-foundation/mpl-core');
  const { generateSigner, keypairIdentity, createSignerFromKeypair } = await import('@metaplex-foundation/umi');
  const { base58: b58 } = await import('@metaplex-foundation/umi/serializers');

  const rpc = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const secret = process.env.MINT_AUTHORITY_SECRET;
  if (!secret) {
    console.error('Set MINT_AUTHORITY_SECRET in .env (base58 or JSON byte array)');
    process.exit(1);
  }

  let secretKey;
  try { secretKey = bs58.decode(secret); } catch { secretKey = Uint8Array.from(JSON.parse(secret)); }

  const umi = createUmi(rpc).use(mplCore());
  const kp  = umi.eddsa.createKeypairFromSecretKey(secretKey);
  umi.use(keypairIdentity(createSignerFromKeypair(umi, kp)));

  const collection = generateSigner(umi);
  const name = process.env.METAPLEX_COLLECTION_NAME || 'ScrapRats';
  const uri  = process.env.METAPLEX_COLLECTION_URI || 'https://scraprats.io';

  console.log('Creating collection with authority:', kp.publicKey);
  const tx = await createCollection(umi, {
    collection,
    name,
    uri,
  }).sendAndConfirm(umi);

  const sig = b58.deserialize(tx.signature)[0];
  console.log('\nCollection created!');
  console.log('METAPLEX_COLLECTION_ADDRESS=' + collection.publicKey);
  console.log('Transaction:', sig);
}

main().catch(err => { console.error(err); process.exit(1); });
