require('dotenv').config();
const { query } = require('./index');

// All 15 slots × 7 tiers (including default) = 105 rows
const SLOT_DEFS = [
  { slot: 1,  slotName: 'Hair / Hat',     tiers: { default:'Mangy Tuft',   common:'Flat Cap',      uncommon:'Mohawk',          rare:'Top Hat',           epic:'Plague Hood',       legendary:'Crown of Filth',      mythic:"The Rat King's Circlet" }},
  { slot: 2,  slotName: 'Eyes',           tiers: { default:'Beady Eyes',   common:'Bloodshot Eyes',uncommon:'Sunglasses',       rare:'Monocle',           epic:'Glowing Red Eyes',  legendary:'Golden Eyes',         mythic:'Void Eyes' }},
  { slot: 3,  slotName: 'Mouth',          tiers: { default:'Sneer',        common:'Chipped Tooth', uncommon:'Gold Tooth',       rare:'Fangs',             epic:'Plague Mask Grin',  legendary:'Diamond Grill',       mythic:'Cursed Jaw' }},
  { slot: 4,  slotName: 'Ears',           tiers: { default:'Ratty Ears',   common:'Stud Earring',  uncommon:'Hoop Earring',     rare:'Skull Earring',     epic:'Sewer Pearl',       legendary:'Golden Ear Cuff',     mythic:'Cursed Rune Ring' }},
  { slot: 5,  slotName: 'Nose',           tiers: { default:'Snout',        common:'Nose Ring',     uncommon:'Wart',             rare:'Jewelled Stud',     epic:'Glowing Piercing',  legendary:'Golden Snout Ring',   mythic:'Plague Blossom' }},
  { slot: 6,  slotName: 'Body Item',      tiers: { default:'Ragged Vest',  common:'Dirty Tee',     uncommon:'Leather Jacket',   rare:'Sewer Guard Coat',  epic:'Plague Doctor Coat',legendary:'Gilded Robe',         mythic:'Rot Armour' }},
  { slot: 7,  slotName: 'Leg Item',       tiers: { default:'Torn Trousers',common:'Patched Pants', uncommon:'Cargo Shorts',     rare:'Leather Trousers',  epic:'Spiked Legwraps',   legendary:'Gilded Breeches',     mythic:'Shadowweave Pants' }},
  { slot: 8,  slotName: 'Back Item',      tiers: { default:'Hunch',        common:'Bindle Sack',   uncommon:'Tattered Cape',    rare:'Sewer Wings',       epic:'Plague Banner',     legendary:'Golden Cape',         mythic:'Void Wings' }},
  { slot: 9,  slotName: 'Feet Item',      tiers: { default:'Bare Claws',   common:'Worn Boots',    uncommon:'Chunky Sneakers',  rare:'Steel Toe Boots',   epic:'Sewer Stompers',    legendary:'Golden Kicks',        mythic:'Wraithwalkers' }},
  { slot: 10, slotName: 'Skateboard',     tiers: { default:'Busted Plank', common:'Scratched Board',uncommon:'Painted Deck',    rare:'Chrome Board',      epic:'Sewer Slick',       legendary:'Gold Deck',           mythic:'Void Rider' }},
  { slot: 11, slotName: 'Handheld Item',  tiers: { default:'Empty Hands',  common:'Trash Bag',     uncommon:'Lead Pipe',        rare:'Rusty Sword',       epic:'Sewer Trident',     legendary:'Golden Cleaver',      mythic:'The Doomfork' }},
  { slot: 12, slotName: 'Mouthheld Item', tiers: { default:'Nothing',      common:'Toothpick',     uncommon:'Cigarette',        rare:'Candy Cane',        epic:'Plague Stem',       legendary:'Golden Toothpick',    mythic:'The Eternal Smoke' }},
  { slot: 13, slotName: 'Skin Colour',    tiers: { default:'Sewer Grey',   common:'Muddy Brown',   uncommon:'Mossy Green',      rare:'Pale Bone',         epic:'Toxic Green',       legendary:'Pure Gold',           mythic:'Void Black' }},
  { slot: 14, slotName: 'Neck Item',      tiers: { default:'Bare Neck',    common:'Frayed Scarf',  uncommon:'Spiked Collar',    rare:'Bone Necklace',     epic:'Plague Amulet',     legendary:'Gold Chain',          mythic:"The Rat King's Seal" }},
  { slot: 15, slotName: 'Wrist Item',     tiers: { default:'Bare Wrist',   common:'Frayed Rope',   uncommon:'Spiked Wristband', rare:'Shackle',           epic:'Plague Bangle',     legendary:'Golden Watch',        mythic:"The Rat King's Brand" }},
];

const BASE = { common:50, uncommon:200, rare:800, epic:3000, legendary:12000, mythic:50000 };
const STEP = { common:1,  uncommon:2,   rare:4,   epic:20,   legendary:100,   mythic:500  };

function coinValue(slotIndex, rarity) {
  if (rarity === 'default') return 0;
  return BASE[rarity] + (slotIndex - 7) * STEP[rarity];
}

async function seed() {
  console.log('Seeding trait_definitions…');
  let inserted = 0;
  for (const def of SLOT_DEFS) {
    const slotIndex = def.slot - 1; // 0-based for formula
    for (const [rarity, name] of Object.entries(def.tiers)) {
      const cv = coinValue(slotIndex, rarity);
      await query(
        `INSERT INTO trait_definitions (slot, slot_name, rarity, name, coin_value)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (slot, rarity) DO UPDATE SET name = EXCLUDED.name, coin_value = EXCLUDED.coin_value`,
        [def.slot, def.slotName, rarity, name, cv]
      );
      inserted++;
    }
  }
  console.log(`Seeded ${inserted} trait definitions.`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
