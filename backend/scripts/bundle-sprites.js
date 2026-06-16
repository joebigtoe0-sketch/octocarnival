#!/usr/bin/env node
/**
 * Copy rat sprite PNGs into backend/assets/sprites for production deploys.
 * Run from repo root or backend (local dev / Railway build).
 */
const fs   = require('fs');
const path = require('path');

const candidates = [
  path.join(__dirname, '../../frontend/public/assets/sprites'),
  path.join(__dirname, '../../../frontend/public/assets/sprites'),
];

const src = candidates.find(p => fs.existsSync(p));
const dest = path.join(__dirname, '../assets/sprites');

if (!src) {
  if (fs.existsSync(dest) && fs.readdirSync(dest).some(f => f.endsWith('.png'))) {
    console.log('[bundle-sprites] using existing', dest);
    process.exit(0);
  }
  const msg = '[bundle-sprites] source sprites not found — mint images will fail in prod';
  if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT) {
    console.error(msg);
    process.exit(1);
  }
  console.warn(msg);
  process.exit(0);
}

fs.mkdirSync(dest, { recursive: true });
let count = 0;
for (const file of fs.readdirSync(src)) {
  if (!file.endsWith('.png')) continue;
  fs.copyFileSync(path.join(src, file), path.join(dest, file));
  count++;
}
console.log(`[bundle-sprites] copied ${count} sprites → ${dest}`);
if (count === 0) {
  console.error('[bundle-sprites] no PNG files copied');
  process.exit(1);
}
