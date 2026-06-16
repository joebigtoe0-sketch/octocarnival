const crypto = require('crypto');

function canonicalTraits(traits = []) {
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

function traitFingerprint(traits = []) {
  const json = JSON.stringify(canonicalTraits(traits));
  return crypto.createHash('sha256').update(json).digest('hex');
}

module.exports = { canonicalTraits, traitFingerprint };
