const fs   = require('fs');
const path = require('path');
const sharp = require('sharp');
const {
  SPRITE_LAYERS, resolveSpriteFile, spritePath, buildSlotMap,
} = require('../constants/ratSprites');
const { normalizePublicUrl } = require('../utils/publicUrl');

const MINTS_DIR = path.join(__dirname, '../../uploads/mints');

function ensureMintsDir() {
  fs.mkdirSync(MINTS_DIR, { recursive: true });
}

function buildMetadataJson(rat, fingerprint) {
  const traits = (rat.traits || []).filter(Boolean);
  const attributes = traits.map(t => ({
    trait_type: t.slotName || `Slot ${t.slotIdx}`,
    value:      t.name,
    rarity:     t.rarity,
  }));

  return {
    name:        `ScrapRat — ${rat.name || 'Unnamed'}`,
    symbol:      'SCRAPRAT',
    description: 'A trait-forged ScrapRat minted from the ScrapRats sewer. Burned 10,000 $scraprat to claim this unique combo.',
    image:       '', // filled after image upload
    external_url: 'https://scraprats.io',
    attributes,
    properties: {
      category: 'image',
      creators: [],
      files:    [],
    },
    scraprats: {
      traitFingerprint: fingerprint,
      ratId:            rat.id,
    },
  };
}

async function renderRatImage(traits, seed = 0) {
  const slotMap = buildSlotMap(traits, seed);
  const layerPaths = [];

  for (let i = 0; i < SPRITE_LAYERS.length; i++) {
    const layer    = SPRITE_LAYERS[i];
    const filename = resolveSpriteFile(layer, slotMap, seed + i);
    const fullPath = spritePath(filename);
    if (fs.existsSync(fullPath)) layerPaths.push(fullPath);
  }

  if (layerPaths.length === 0) {
    const { SPRITE_DIR } = require('../constants/ratSprites');
    throw new Error(`No sprite layers found for rat composite (sprite dir: ${SPRITE_DIR})`);
  }

  const first = sharp(layerPaths[0]);
  const meta  = await first.metadata();
  const w = meta.width || 512;
  const h = meta.height || 512;

  const composites = [];
  for (let i = 1; i < layerPaths.length; i++) {
    composites.push({ input: layerPaths[i], top: 0, left: 0 });
  }

  return sharp(layerPaths[0])
    .resize(w, h)
    .composite(composites)
    .png()
    .toBuffer();
}

async function uploadToStorage(fingerprint, metadata, pngBuffer, baseUrl) {
  ensureMintsDir();
  const dir = path.join(MINTS_DIR, fingerprint);
  fs.mkdirSync(dir, { recursive: true });

  const publicBase = normalizePublicUrl(baseUrl);

  const imageFilename = 'image.png';
  const imagePath     = path.join(dir, imageFilename);
  fs.writeFileSync(imagePath, pngBuffer);

  const imageUri = `${publicBase}/api/mint/assets/${fingerprint}/${imageFilename}`;
  metadata.image = imageUri;
  if (metadata.properties?.files) {
    metadata.properties.files = [{ uri: imageUri, type: 'image/png' }];
  }

  const jsonPath = path.join(dir, 'metadata.json');
  fs.writeFileSync(jsonPath, JSON.stringify(metadata, null, 2));

  const metadataUri = `${publicBase}/api/mint/assets/${fingerprint}/metadata.json`;

  // Optional NFT.Storage upload
  if (process.env.IPFS_TOKEN) {
    try {
      const ipfs = await uploadToNftStorage(metadata, pngBuffer);
      if (ipfs?.metadataUri) return { metadataUri: ipfs.metadataUri, imageUri: ipfs.imageUri || imageUri };
    } catch (e) {
      console.warn('[ratMetadata] IPFS upload failed, using backend URLs:', e.message);
    }
  }

  return { metadataUri, imageUri };
}

async function uploadToNftStorage(metadata, pngBuffer) {
  const token = process.env.IPFS_TOKEN;
  if (!token) return null;

  const imageRes = await fetch('https://api.nft.storage/upload', {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'image/png' },
    body:    pngBuffer,
  });
  if (!imageRes.ok) throw new Error(`NFT.Storage image upload failed: ${imageRes.status}`);
  const imageData = await imageRes.json();
  const imageCid  = imageData?.value?.cid;
  if (!imageCid) throw new Error('NFT.Storage image CID missing');

  const imageUri = `https://${imageCid}.ipfs.nftstorage.link`;
  metadata.image = imageUri;

  const metaRes = await fetch('https://api.nft.storage/upload', {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(metadata),
  });
  if (!metaRes.ok) throw new Error(`NFT.Storage metadata upload failed: ${metaRes.status}`);
  const metaData = await metaRes.json();
  const metaCid  = metaData?.value?.cid;
  if (!metaCid) throw new Error('NFT.Storage metadata CID missing');

  return {
    metadataUri: `https://${metaCid}.ipfs.nftstorage.link`,
    imageUri,
  };
}

async function prepareMintMetadata(rat, fingerprint, baseUrl) {
  const seed     = rat.id ? rat.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
  const metadata = buildMetadataJson(rat, fingerprint);
  const png      = await renderRatImage(rat.traits || [], seed);
  const uris     = await uploadToStorage(fingerprint, metadata, png, baseUrl);
  return uris;
}

module.exports = {
  buildMetadataJson,
  renderRatImage,
  uploadToStorage,
  prepareMintMetadata,
  MINTS_DIR,
};
