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
  console.warn('[bundle-sprites] source sprites not found — mint images may fail in prod');
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
