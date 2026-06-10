/**
 * crop-sprites.js
 *
 * Trims transparent edges from every PNG in the sprites folder and
 * saves tight-cropped versions (with a small padding) to sprites/cropped/.
 *
 * Usage:  node scripts/crop-sprites.js
 *
 * The cropped images are used ONLY in the lootbox / NPC item display so
 * items fill their display box properly.  The originals stay untouched so
 * RatSprite layer-stacking still works perfectly.
 */

import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import { join, resolve } from 'path';

const SPRITES_DIR = resolve('frontend/public/assets/sprites');
const OUT_DIR     = resolve('frontend/public/assets/sprites/cropped');
const PADDING     = 6;   // px of transparent breathing room added after trim

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const files = (await readdir(SPRITES_DIR))
    .filter(f => f.endsWith('.png') && !f.startsWith('.'));

  let ok = 0, skipped = 0;

  for (const file of files) {
    const src = join(SPRITES_DIR, file);
    const dst = join(OUT_DIR, file);

    try {
      const img = sharp(src);
      const { width, height, channels } = await img.metadata();

      // Only trim images that have an alpha channel
      if (channels < 4) {
        // No alpha → copy as-is (e.g. Background.png)
        await img.toFile(dst);
        skipped++;
        continue;
      }

      // Trim transparent edges, then add uniform padding back
      await img
        .trim({ threshold: 2 })   // alpha threshold: pixels with alpha≤2 are considered transparent
        .extend({
          top:    PADDING,
          bottom: PADDING,
          left:   PADDING,
          right:  PADDING,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(dst);

      ok++;
    } catch (err) {
      // trim() throws if the whole image is transparent — skip silently
      if (err.message?.includes('does not contain') || err.message?.includes('trim')) {
        skipped++;
      } else {
        console.warn(`  ⚠ ${file}: ${err.message}`);
        skipped++;
      }
    }
  }

  console.log(`Done — ${ok} cropped, ${skipped} skipped  →  ${OUT_DIR}`);
}

main().catch(err => { console.error(err); process.exit(1); });
