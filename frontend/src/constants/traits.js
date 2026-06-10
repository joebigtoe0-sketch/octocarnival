// All 16 trait slots × 7 tiers.  coinValue = base[rarity] + (slotIndex - 7) * step[rarity]
export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

export const RARITY_COLORS = {
  default:   '#5a6450',
  common:    '#9aa68b',
  uncommon:  '#7bdc1f',
  rare:      '#3d9bff',
  epic:      '#b06bff',
  legendary: '#f6c544',
  mythic:    '#ff4dff',
};

export const RARITY_GLOW = {
  common:    'rgba(154,166,139,.4)',
  uncommon:  'rgba(123,220,31,.5)',
  rare:      'rgba(61,155,255,.55)',
  epic:      'rgba(176,107,255,.6)',
  legendary: 'rgba(246,197,68,.7)',
  mythic:    'rgba(255,77,255,.8)',
};

// Tiers may have `name` (single variant) or `variants` (array, picked by variantSeed).
// [slotIndex 0–15]
export const SLOT_DEFS = [
  {
    slotName: 'Hair / Hat',
    tiers: {
      default:   { name: 'Bare Head',      coinValue: 0 },
      common:    { name: 'Beanie',         coinValue: 43 },
      uncommon:  { name: 'Silver Mop',     coinValue: 186 },
      rare:      { name: 'Wizard Hat',     coinValue: 772 },
      epic:      { name: 'Cluck Head',     coinValue: 2860 },
      legendary: { name: 'Honker Hair',    coinValue: 11300 },
      mythic:    { name: "King's Crown",   coinValue: 46500 },
    },
  },
  {
    slotName: 'Eyes',
    tiers: {
      default:   { name: 'Beady Eyes',  coinValue: 0 },
      common:    { name: 'Startled',    coinValue: 44 },
      uncommon:  { variants: ['Slits', 'Unbothered', 'Crossed', 'Glitched'], coinValue: 188 },
      rare:      { variants: ['Cyclops', 'Blocky'],                          coinValue: 776 },
      epic:      { variants: ['Black Shades', 'Yellow Shades', 'Red Shades'],coinValue: 2880 },
      legendary: { variants: ['Red Alert', 'Bagged'],                        coinValue: 11400 },
      mythic:    { name: 'The Void',    coinValue: 47000 },
    },
  },
  {
    slotName: 'Mouth',
    tiers: {
      default:   { name: 'Closed',         coinValue: 0 },
      common:    { name: 'Buckteeth',       coinValue: 45 },
      uncommon:  { name: 'Tongue Out',      coinValue: 190 },
      rare:      { name: 'Surgical Mask',   coinValue: 780 },
      epic:      { name: 'Fangs',           coinValue: 2900 },
      legendary: { name: 'Stitched Up',     coinValue: 11500 },
      mythic:    { name: 'Taped Shut',      coinValue: 47500 },
    },
  },
  {
    slotName: 'Ears',
    tiers: {
      default:   { name: 'Default Ears',  coinValue: 0 },
      common:    { name: 'Primate',        coinValue: 46 },
      uncommon:  { name: 'Half Chewed',    coinValue: 192 },
      rare:      { name: 'No Ears',        coinValue: 784 },
      epic:      { name: 'Headphones',     coinValue: 2920 },
      legendary: { name: 'Veggie Plugs',   coinValue: 11600 },
      mythic:    { name: 'Horns',          coinValue: 48000 },
    },
  },
  {
    slotName: 'Nose',
    tiers: {
      default:   { name: 'Plain Nose',  coinValue: 0 },
      common:    { name: 'Pointy',      coinValue: 47 },
      uncommon:  { name: 'Lined',       coinValue: 194 },
      rare:      { name: 'Dotted',      coinValue: 788 },
      epic:      { name: 'Tash',        coinValue: 2940 },
      legendary: { name: 'Snout',       coinValue: 11700 },
      mythic:    { name: 'Honker',      coinValue: 48500 },
    },
  },
  {
    slotName: 'Body Item',
    tiers: {
      default:   { name: 'No Shirt',        coinValue: 0 },
      common:    { name: 'Black Tee',        coinValue: 48 },
      uncommon:  { name: 'Collar Up',        coinValue: 196 },
      rare:      { name: 'Rainbow Tee',      coinValue: 792 },
      epic:      { name: 'Chained Up',       coinValue: 2960 },
      legendary: { name: 'Riot Gear',        coinValue: 11800 },
      mythic:    { name: 'The Void Chest',   coinValue: 49000 },
    },
  },
  {
    slotName: 'Leg Item',
    tiers: {
      default:   { name: 'No Pants',        coinValue: 0 },
      common:    { name: 'Ripped Shorts',    coinValue: 49 },
      uncommon:  { name: 'Baggies',          coinValue: 198 },
      rare:      { name: 'Stiff Denim',      coinValue: 796 },
      epic:      { name: 'Snow Camo',        coinValue: 2980 },
      legendary: { name: 'The Diaper',       coinValue: 11900 },
      mythic:    { name: 'Rainbow Speedos',  coinValue: 49500 },
    },
  },
  {
    slotName: 'Back Item',
    tiers: {
      default:   { name: 'Nothing',         coinValue: 0 },
      common:    { name: 'Spear Strap',      coinValue: 50 },
      uncommon:  { name: 'Rat Flag',         coinValue: 200 },
      rare:      { name: 'Red Cape',         coinValue: 800 },
      epic:      { name: 'Bee Wings',        coinValue: 3000 },
      legendary: { name: 'Twin Flames',      coinValue: 12000 },
      mythic:    { variants: ['Devil Wings', 'Unleashed'], coinValue: 50000 },
    },
  },
  {
    slotName: 'Feet Item',
    tiers: {
      default:   { name: 'Bare Claws',   coinValue: 0 },
      common:    { variants: ['Mudwalkers', 'Blackouts'], coinValue: 51 },
      uncommon:  { name: 'Fresh Whites',  coinValue: 202 },
      rare:      { name: 'Sewer Sliders', coinValue: 804 },
      epic:      { name: 'Big Tops',      coinValue: 3020 },
      legendary: { name: 'One Sock',      coinValue: 12100 },
      mythic:    { name: "Scratch 'n Cluck", coinValue: 50500 },
    },
  },
  {
    slotName: 'Skateboard',
    tiers: {
      default:   { name: 'No Board',      coinValue: 0 },
      common:    { variants: ['Blacktop', 'Blueprint'],         coinValue: 52 },
      uncommon:  { variants: ['Greenway', 'Redline'],           coinValue: 204 },
      rare:      { variants: ['Blue Speeder', 'Yellow Speeder'],coinValue: 808 },
      epic:      { name: 'Rocket Board',   coinValue: 3040 },
      legendary: { name: 'Cloud Nine',     coinValue: 12200 },
      mythic:    { variants: ['Bullish Candle', 'Void Rider'], coinValue: 51000 },
    },
  },
  {
    slotName: 'Handheld Item',
    tiers: {
      default:   { name: 'Empty Hands',   coinValue: 0 },
      common:    { name: 'Baton',          coinValue: 53 },
      uncommon:  { name: 'Crowbar',        coinValue: 206 },
      rare:      { name: 'Rusty Blade',    coinValue: 812 },
      epic:      { name: 'Pitchfork',      coinValue: 3060 },
      legendary: { name: 'Scythe',         coinValue: 12300 },
      mythic:    { name: 'Wizard Staff',   coinValue: 51500 },
    },
  },
  {
    slotName: 'Mouthheld Item',
    tiers: {
      default:   { name: 'Nothing',        coinValue: 0 },
      common:    { name: 'Toothpick',       coinValue: 54 },
      uncommon:  { name: 'Cigarette',       coinValue: 208 },
      rare:      { name: 'Candy Cane',      coinValue: 816 },
      epic:      { name: 'Gold Pick',       coinValue: 3080 },
      legendary: { name: 'Drooling',        coinValue: 12400 },
      mythic:    { name: 'Rainbow Puke',    coinValue: 52000 },
    },
  },
  {
    slotName: 'Skin Colour',
    tiers: {
      default:   { name: 'Sewer Grey',  coinValue: 0 },
      common:    { variants: ['Sandman', 'Mossy', 'Reddish'], coinValue: 55 },
      uncommon:  { name: 'Chonky',       coinValue: 210 },
      rare:      { name: 'Void Skin',    coinValue: 820 },
      epic:      { name: 'Bleached',     coinValue: 3100 },
      legendary: { name: 'Prism',        coinValue: 12500 },
      mythic:    { name: 'Ghost Mode',   coinValue: 52500 },
    },
  },
  {
    slotName: 'Neck Item',
    tiers: {
      default:   { name: 'Bare Neck',    coinValue: 0 },
      common:    { variants: ['Red Tie', 'Orange Tie', 'Blue Tie'], coinValue: 56 },
      uncommon:  { name: 'Spiked Choker', coinValue: 212 },
      rare:      { name: 'Bone String',   coinValue: 824 },
      epic:      { name: 'Tooth Charm',   coinValue: 3120 },
      legendary: { name: 'Gold Chain',    coinValue: 12600 },
      mythic:    { name: 'Gold Amulet',   coinValue: 53000 },
    },
  },
  {
    slotName: 'Wrist Item',
    tiers: {
      default:   { name: 'Bare Wrist',   coinValue: 0 },
      common:    { name: 'Rope Burn',     coinValue: 57 },
      uncommon:  { name: 'Spiked Cuffs',  coinValue: 214 },
      rare:      { variants: ['Sweatband Red', 'Sweatband Blue', 'Sweatband Green'], coinValue: 828 },
      epic:      { name: 'Shackled',      coinValue: 3140 },
      legendary: { name: 'Gold Watch',    coinValue: 12700 },
      mythic:    { name: "King's Trinket",coinValue: 53500 },
    },
  },
  {
    slotName: 'Tail',
    tiers: {
      default:   { name: 'Stubby Tail',      coinValue: 0 },
      common:    { name: 'Curved Tail',       coinValue: 58 },
      uncommon:  { name: 'C-Shape Tail',      coinValue: 216 },
      rare:      { name: 'Stubby',            coinValue: 832 },
      epic:      { name: 'Fire Diarrhea',     coinValue: 3160 },
      legendary: { name: 'Rainbow Eruption',  coinValue: 12800 },
      mythic:    { name: 'The Chosen Tail',   coinValue: 54000 },
    },
  },
];

// GDD v0.6 §5 — rarity level gates (hard block, checked client-side)
export const RARITY_GATE_LEVEL = {
  common:    1,
  uncommon:  1,
  rare:      1,
  epic:      20,
  legendary: 40,
  mythic:    80,
};

// Step 1 — base chance that an NPC carries ANY loot item at all.
// Rate stat adds +0.5% per point on top of this.
const BASE_CARRY_CHANCE = 0.50; // 50% of NPCs carry something by default

// Step 2 — rarity weight table (sums to 100) used once a carrier is confirmed.
// Luck stat shifts weight away from Common toward higher rarities.
const BASE_RARITY_WEIGHTS = [
  { rarity: 'mythic',    w: 0.2  },
  { rarity: 'legendary', w: 0.8  },
  { rarity: 'epic',      w: 2.0  },
  { rarity: 'rare',      w: 7.0  },
  { rarity: 'uncommon',  w: 18.0 },
  { rarity: 'common',    w: 72.0 },
];

/**
 * Roll a loot trait for an NPC — two-step system:
 *
 *  1. Carrier check  — does the NPC carry anything?
 *     carryChance = min(BASE_CARRY_CHANCE + rate × 0.005, 0.95)
 *
 *  2. Rarity roll    — if carrying, which rarity?
 *     Luck shifts weight from Common to higher tiers (each point = 0.5% shift, cap 60%).
 *     Hard level gates still apply regardless of luck.
 */
export function rollLootTrait(luck = 0, rate = 0, accountLevel = 1) {
  // Step 1 — carrier check
  const carryChance = Math.min(BASE_CARRY_CHANCE + rate * 0.005, 0.95);
  if (Math.random() >= carryChance) return null;

  // Step 2 — rarity weights adjusted by Luck
  const luckShift = Math.min(luck * 0.5, 60); // max 60% shift out of Common
  const weights = BASE_RARITY_WEIGHTS
    .filter(({ rarity }) => accountLevel >= RARITY_GATE_LEVEL[rarity])
    .map(({ rarity, w }) => ({
      rarity,
      w: rarity === 'common'
        ? Math.max(10, w - luckShift)           // drain Common, floor at 10
        : w * (1 + luck / 100),                 // boost all other rarities
    }));

  const total = weights.reduce((s, e) => s + e.w, 0);
  let r = Math.random() * total;
  for (const { rarity, w } of weights) {
    r -= w;
    if (r <= 0) {
      const slotIdx     = Math.floor(Math.random() * SLOT_DEFS.length);
      const def         = SLOT_DEFS[slotIdx];
      const tier        = def.tiers[rarity];
      const variantSeed = Math.floor(Math.random() * 9973);
      // Pick name from variants array if present (ensures name matches the sprite shown)
      const name = tier.variants
        ? tier.variants[variantSeed % tier.variants.length]
        : tier.name;
      return {
        slotIdx,
        lootSlot:    slotIdx + 1,
        slotName:    def.slotName,
        name,
        rarity,
        coinValue:   tier.coinValue,
        variantSeed,
      };
    }
  }
  return null;
}

export function calcSellValue(traits, greedLevel = 0) {
  const base = traits.reduce((s, t) => s + (t ? t.coinValue : 0), 0);
  const bonus = 1 + greedLevel / 100;
  return Math.floor(base * bonus);
}
