const { query } = require('../db');

const BASE_RARITIES = ['default', 'common', 'uncommon', 'rare', 'epic', 'legendary'];

// Returns rarity weights adjusted by player Luck stat
function getRarityWeights(luck = 0, prestigeLevel = 0) {
  const includesMythic = prestigeLevel >= 3;
  const weights = [
    { rarity: 'common',    w: Math.max(5, 100 - luck * 6) },
    { rarity: 'uncommon',  w: Math.min(80, 40 + luck * 2) },
    { rarity: 'rare',      w: Math.min(60, 15 + luck * 3) },
    { rarity: 'epic',      w: Math.min(30, 5 + luck) },
    { rarity: 'legendary', w: Math.min(10, 1 + Math.floor(luck / 2)) },
  ];
  if (includesMythic) weights.push({ rarity: 'mythic', w: Math.floor(luck / 8) });
  return weights.filter(r => r.w > 0);
}

function rollRarity(luck, prestigeLevel) {
  const weights  = getRarityWeights(luck, prestigeLevel);
  const total    = weights.reduce((s, r) => s + r.w, 0);
  let rand = Math.random() * total;
  for (const { rarity, w } of weights) {
    rand -= w;
    if (rand <= 0) return rarity;
  }
  return 'common';
}

// Roll one NPC loot trait (returns null if no loot this NPC)
function rollNpcLoot(luck = 0, rate = 0, prestigeLevel = 0) {
  const lootChance = Math.min(0.95, 0.4 + rate * 0.05 + luck * 0.02);
  if (Math.random() > lootChance) return null;

  const rarity  = rollRarity(luck, prestigeLevel);
  const slotIdx = Math.floor(Math.random() * 15);
  return { slotIdx, rarity };
}

// Fetch full trait definition from DB and compose full loot object
async function resolveTraitDef(slotIdx, rarity) {
  const slot = slotIdx + 1;
  const { rows } = await query(
    'SELECT * FROM trait_definitions WHERE slot=$1 AND rarity=$2',
    [slot, rarity]
  );
  if (!rows.length) return null;
  const row = rows[0];
  return {
    id:        row.id,
    slotIdx,
    lootSlot:  slot,
    slotName:  row.slot_name,
    name:      row.name,
    rarity:    row.rarity,
    coinValue: row.coin_value,
  };
}

// Generate a batch of NPC configs for the parade
async function generateNpcBatch(count, luck, rate, speed, prestigeLevel) {
  const travelTime = Math.max(8, 16 - speed * 0.5);
  const npcs = [];
  for (let i = 0; i < count; i++) {
    const lootRoll = rollNpcLoot(luck, rate, prestigeLevel);
    let loot = null;
    if (lootRoll) {
      loot = await resolveTraitDef(lootRoll.slotIdx, lootRoll.rarity);
    }
    npcs.push({
      id:         require('crypto').randomUUID(),
      position:   i,
      travelTime,
      hasLoot:    !!loot,
      loot,
    });
  }
  return npcs;
}

module.exports = { rollNpcLoot, resolveTraitDef, generateNpcBatch, rollRarity };
