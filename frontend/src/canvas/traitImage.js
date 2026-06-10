import { RARITY_COLORS } from '../constants/traits.js';

const cache = new Map();

/**
 * Returns a data-URL for the base rat sprite overlaid with a trait badge.
 * Cached by (rarity, slotName, traitName) key.
 */
export async function buildTraitImage(baseSrc, traitName, slotName, rarity) {
  const cacheKey = `${rarity}_${slotName}_${traitName}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  return new Promise(resolve => {
    const img = new Image();
    img.src = baseSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      // Base sprite
      ctx.drawImage(img, 0, 0);

      const color = RARITY_COLORS[rarity] || RARITY_COLORS.common;

      // Rarity border glow
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.strokeStyle = color;
      ctx.lineWidth   = 6;
      ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
      ctx.restore();

      // Badge background
      const badgeH = Math.floor(canvas.height * 0.18);
      const badgeY = 0;
      ctx.fillStyle = 'rgba(0,0,0,0.72)';
      ctx.fillRect(0, badgeY, canvas.width, badgeH);

      // Rarity colour stripe
      ctx.fillStyle = color;
      ctx.fillRect(0, badgeY, 4, badgeH);

      // Slot name (small)
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = `bold ${Math.floor(badgeH * 0.32)}px 'Pixelify Sans', monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(slotName.toUpperCase(), canvas.width / 2, badgeY + badgeH * 0.38);

      // Trait name (larger)
      ctx.fillStyle = color;
      ctx.font = `bold ${Math.floor(badgeH * 0.44)}px 'Pixelify Sans', monospace`;
      ctx.fillText(traitName, canvas.width / 2, badgeY + badgeH * 0.82);

      const url = canvas.toDataURL('image/png');
      cache.set(cacheKey, url);
      resolve(url);
    };
    img.onerror = () => resolve(baseSrc); // fallback to plain sprite
  });
}

/**
 * Lighter version: draws directly onto a provided canvas element.
 * Used for the Your Rat portrait to show equipped traits as badges.
 */
export function drawRatWithTraits(canvas, baseSrc, traits) {
  const img = new Image();
  img.src = baseSrc;
  img.onload = () => {
    const ctx = canvas.getContext('2d');
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    // Draw colored rarity dots for each equipped (non-null) trait
    const equipped = traits.filter(Boolean);
    if (!equipped.length) return;

    const dotR = Math.floor(canvas.width * 0.04);
    const cols  = 5;
    const startX = dotR + 4;
    const startY = canvas.height - dotR * 2 - 6;
    equipped.forEach((t, i) => {
      const x = startX + (i % cols) * (dotR * 2 + 4);
      const y = startY - Math.floor(i / cols) * (dotR * 2 + 4);
      ctx.beginPath();
      ctx.arc(x, y, dotR, 0, Math.PI * 2);
      ctx.fillStyle = RARITY_COLORS[t.rarity] || '#fff';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  };
}
