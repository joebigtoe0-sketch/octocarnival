#!/usr/bin/env node
/**
 * Devnet / unit tests for mint registry (no on-chain required).
 * Run: node scripts/test-mint-flow.js
 */
const { traitFingerprint, canonicalTraits } = require('../src/utils/traitFingerprint');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const traitsA = [
  { slotIdx: 0, slotName: 'Skin Colour', name: 'Sandman', rarity: 'common', variantSeed: 0 },
  { slotIdx: 5, slotName: 'Eyes', name: 'Beady', rarity: 'uncommon', variantSeed: 1 },
];

const traitsB = [
  { slotIdx: 5, slotName: 'Eyes', name: 'Beady', rarity: 'uncommon', variantSeed: 1 },
  { slotIdx: 0, slotName: 'Skin Colour', name: 'Sandman', rarity: 'common', variantSeed: 0 },
];

const traitsC = [
  { slotIdx: 0, slotName: 'Skin Colour', name: 'Sandman', rarity: 'common', variantSeed: 1 },
  { slotIdx: 5, slotName: 'Eyes', name: 'Beady', rarity: 'uncommon', variantSeed: 1 },
];

const fpA = traitFingerprint(traitsA);
const fpB = traitFingerprint(traitsB);
const fpC = traitFingerprint(traitsC);

assert(fpA === fpB, 'Order-independent fingerprint');
assert(fpA !== fpC, 'Different variantSeed → different fingerprint');
assert(fpA.length === 64, 'SHA-256 hex length');

const canonical = canonicalTraits([null, ...traitsA, undefined]);
assert(canonical.length === 2, 'Empty slots ignored');
assert(canonical[0].slotIdx === 0, 'Sorted by slotIdx');

console.log('✓ traitFingerprint tests passed');
console.log('  sample fingerprint:', fpA);

// Metadata render smoke test (no DB)
async function smokeMetadata() {
  const { renderRatImage, buildMetadataJson } = require('../src/services/ratMetadata');
  const rat = { id: 'test_rat_1', name: 'TestRat', traits: traitsA };
  const png = await renderRatImage(rat.traits, 42);
  assert(png.length > 1000, 'PNG buffer generated');
  const meta = buildMetadataJson(rat, fpA);
  assert(meta.attributes.length === 2, 'Metadata attributes');
  console.log('✓ ratMetadata render smoke test passed');
}

smokeMetadata().catch(err => {
  console.error('✗ smoke test failed:', err.message);
  process.exit(1);
});
