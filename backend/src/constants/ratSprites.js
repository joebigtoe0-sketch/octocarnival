const path = require('path');
const fs   = require('fs');

// Mirrors frontend RatSprite.jsx — keep in sync when adding traits/sprites.
const RARITY_NUM = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6 };

const SPRITE_VARIANTS = {
  Backitem:      { 1: ['Backitem1.png'], 2: ['Backitem2.png'], 3: ['Backitem3.png'], 4: ['Backitem4.png'], 5: ['Backitem5.png'], 6: ['Backitem6.1.png', 'Backitem6.2.png'] },
  Bodyitem:      { 1: ['Bodyitem1.png'], 2: ['Bodyitem2.png'], 3: ['Bodyitem3.png'], 4: ['Bodyitem4.png'], 5: ['Bodyitem5.1.png', 'Bodyitem5.2.png'], 6: ['Bodyitem6.png'] },
  Ears:          { 1: ['Ears1.png'], 2: ['Ears2.png'], 3: ['Ears3.png'], 4: ['Ears4.png'], 5: ['Ears5.png'], 6: ['Ears6.png'] },
  Eyes:          { 1: ['Eyes1.png'], 2: ['Eyes2.1.png', 'Eyes2.2.png', 'Eyes2.3.png', 'Eyes2.4.png'], 3: ['Eyes3.1.png', 'Eyes3.2.png'], 4: ['Eyes4.1.png', 'Eyes4.2.png', 'Eyes4.3.png'], 5: ['Eyes5.1.png', 'Eyes5.2.png', 'Eyes5.3.png'], 6: ['Eyes6.png'] },
  Feet:          { 1: ['Feet1.1.png', 'Feet1.2.png'], 2: ['Feet2.png'], 3: ['Feet3.png'], 4: ['Feet4.png'], 5: ['Feet5.png'], 6: ['Feet6.png'] },
  Hair:          { 1: ['Hair1.png'], 2: ['Hair2.png'], 3: ['Hair3.png'], 4: ['Hair4.png'], 5: ['Hair5.1.png', 'Hair5.2.png'], 6: ['Hair6.png'] },
  Handitem:      { 1: ['Handitem1.png'], 2: ['Handitem2.png'], 3: ['Handitem3.png'], 4: ['Handitem4.png'], 5: ['Handitem5.png'], 6: ['Handitem6.png'] },
  Legs:          { 1: ['Legs1.png'], 2: ['Legs2.png'], 3: ['Legs3.png'], 4: ['Legs4.png'], 5: ['Legs5.png'], 6: ['Legs6.png'] },
  Mouth:         { 1: ['Mouth1.png'], 2: ['Mouth2.png'], 3: ['Mouth3.png'], 4: ['Mouth4.png'], 5: ['Mouth5.png'] },
  Mouthhelditem: { 1: ['Mouthhelditem1.png'], 2: ['Mouthhelditem2.png'], 3: ['Mouthhelditem3.png'], 4: ['Mouthhelditem4.png'], 5: ['Mouthhelditem5.png'], 6: ['Mouthhelditem6.png'] },
  Neck:          { 1: ['Neck1.1.png', 'Neck1.2.png', 'Neck1.3.png'], 2: ['Neck2.png'], 3: ['Neck3.png'], 4: ['Neck4.png'], 5: ['Neck5.png'], 6: ['Neck6.png'] },
  Nose:          { 1: ['Nose1.png'], 2: ['Nose2.png'], 3: ['Nose3.png'], 4: ['Nose4.png'], 5: ['Nose5.png'], 6: ['Nose6.png'] },
  Skate:         { 1: ['Skate1.1.png', 'Skate1.2.png'], 2: ['Skate2.1.png', 'Skate2.2.png'], 3: ['Skate3.1.png', 'Skate3.2.png'], 4: ['Skate4.png'], 5: ['Skate5.1.png', 'Skate5.2.png'], 6: ['Skate6.1.png', 'Skate6.2.png'] },
  Skin:          { 1: ['Skin1.1.png', 'Skin1.2.png', 'Skin1.3.png'], 2: ['Skin2.png'], 3: ['Skin3.png'], 4: ['Skin4.png'], 5: ['Skin5.png'], 6: ['Skin6.png'] },
  Tail:          { 1: ['Tail1.png'], 2: ['Tail2.png'], 3: ['Tail3.png'], 4: ['Tail4.png'], 5: ['Tail5.png'], 6: ['Tail6.png'] },
  Wrist:         { 1: ['Wrist1.png'], 2: ['Wrist2.png'], 3: ['Wrist3.1.png', 'Wrist3.2.png', 'Wrist3.3.png'], 4: ['Wrist4.png'], 5: ['Wrist5.png'], 6: ['Wrist6.png'] },
};

const EARS_DEFAULT_BY_SKIN = ['Ears-Default1.1.png', 'Ears-Default1.2.png', 'Ears-Default1.3.png'];

const SPRITE_LAYERS = [
  { prefix: 'Backitem',      slotName: 'Back Item'      },
  { prefix: 'Tail',          slotName: 'Tail'           },
  { prefix: 'Skate',         slotName: 'Skateboard'     },
  { prefix: 'Skin',          slotName: 'Skin Colour'    },
  { prefix: 'Legs',          slotName: 'Leg Item'       },
  { prefix: 'Feet',          slotName: 'Feet Item'      },
  { prefix: 'Bodyitem',      slotName: 'Body Item'      },
  { prefix: 'Wrist',         slotName: 'Wrist Item'     },
  { prefix: 'Neck',          slotName: 'Neck Item'      },
  { prefix: 'Handitem',      slotName: 'Handheld Item'  },
  { prefix: 'Mouthhelditem', slotName: 'Mouthheld Item' },
  { prefix: 'Mouth',         slotName: 'Mouth'          },
  { prefix: 'Nose',          slotName: 'Nose'           },
  { prefix: 'Ears',          slotName: 'Ears'           },
  { prefix: 'Eyes',          slotName: 'Eyes'           },
  { prefix: 'Hair',          slotName: 'Hair / Hat'     },
];

const SPRITE_DIR = path.join(__dirname, '../../../frontend/public/assets/sprites');

function resolveSpriteFile(layer, slotMap, fallbackSeed) {
  const entry = slotMap.get(layer.slotName);

  if (layer.prefix === 'Ears' && !entry) {
    const skinEntry = slotMap.get('Skin Colour');
    if (skinEntry && skinEntry.rarity === 'common') {
      const skinSeed  = skinEntry.variantSeed ?? fallbackSeed;
      const skinCount = SPRITE_VARIANTS.Skin?.[1]?.length ?? 3;
      const skinIdx   = skinSeed % skinCount;
      const earsDefault = EARS_DEFAULT_BY_SKIN[skinIdx];
      if (earsDefault) return earsDefault;
    }
    return 'Ears-Default.png';
  }

  if (!entry) return `${layer.prefix}-Default.png`;

  const rarityNum = RARITY_NUM[entry.rarity] ?? 1;
  const variants  = SPRITE_VARIANTS[layer.prefix]?.[rarityNum];
  if (!variants || variants.length === 0) return `${layer.prefix}-Default.png`;

  const seed = entry.variantSeed ?? fallbackSeed;
  return variants[seed % variants.length];
}

function spritePath(filename) {
  return path.join(SPRITE_DIR, filename);
}

function buildSlotMap(traits = [], seed = 0) {
  return new Map(
    traits.filter(Boolean).map(t => [t.slotName, { ...t, variantSeed: t.variantSeed ?? seed }])
  );
}

module.exports = {
  SPRITE_LAYERS,
  SPRITE_DIR,
  resolveSpriteFile,
  spritePath,
  buildSlotMap,
};
