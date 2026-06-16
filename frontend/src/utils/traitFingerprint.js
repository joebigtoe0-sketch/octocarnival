/**
 * Canonical trait fingerprint for global mint uniqueness.
 * Equipped traits only, sorted by slotIdx; SHA-256 of stable JSON.
 */
export function canonicalTraits(traits = []) {
  return traits
    .filter(Boolean)
    .sort((a, b) => (a.slotIdx ?? 0) - (b.slotIdx ?? 0))
    .map(t => ({
      slotIdx: t.slotIdx,
      slotName: t.slotName,
      name: t.name,
      rarity: t.rarity,
      variantSeed: t.variantSeed ?? 0,
    }));
}

export async function traitFingerprint(traits = []) {
  const json = JSON.stringify(canonicalTraits(traits));
  const data = new TextEncoder().encode(json);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
