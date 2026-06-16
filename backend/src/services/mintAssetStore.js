const { query } = require('../db');

async function saveMintAssets(fingerprint, metadata, imagePng) {
  await query(
    `INSERT INTO mint_asset_blobs (trait_fingerprint, metadata_json, image_png)
     VALUES ($1, $2, $3)
     ON CONFLICT (trait_fingerprint) DO UPDATE
       SET metadata_json = EXCLUDED.metadata_json,
           image_png     = EXCLUDED.image_png`,
    [fingerprint, metadata, imagePng]
  );
}

async function loadMintAssets(fingerprint) {
  const { rows: [row] } = await query(
    'SELECT metadata_json, image_png FROM mint_asset_blobs WHERE trait_fingerprint=$1',
    [fingerprint]
  );
  if (!row) return null;
  return {
    metadata: row.metadata_json,
    imagePng: row.image_png,
  };
}

module.exports = { saveMintAssets, loadMintAssets };
