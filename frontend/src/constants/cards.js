// ScrapRats — Level-up card pool (GDD v0.6 §7)
// Each card: { id, name, rarity, stat, value, description }
// stat types: luck | cardLuck | rate | speed | greed | stealth | dps | clickPower
//             | wild_crew | wild_reroll | wild_exp | wild_lootbox

export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

// Base rarity draw weights (GDD v0.6 §7, no Card Luck)
export const BASE_RARITY_WEIGHTS = {
  common:    63,
  uncommon:  20,
  rare:      10,
  epic:       5,
  legendary:  2,
  mythic:     0, // only accessible via Card Luck or prestige bonuses
};

/**
 * Dynamic rarity weights accounting for prestige + Card Luck stat.
 * Card Luck: each point shifts -0.3% from Common → split toward Legendary (+0.1%)
 * and the rest (+0.2%) distributed across uncommon/rare/epic/mythic.
 */
function getRarityWeights(prestigeLevel = 0, cardLuck = 0) {
  const p  = Math.min(prestigeLevel, 10);
  const cl = Math.max(0, cardLuck);
  return {
    common:    Math.max(5,   63 - cl * 0.30 - p * 2),
    uncommon:  Math.min(35,  20 + cl * 0.02 + p * 0.5),
    rare:      Math.min(25,  10 + cl * 0.05 + p * 0.5),
    epic:      Math.min(15,   5 + cl * 0.06 + p * 0.3),
    legendary: Math.min(25,   2 + cl * 0.10 + p * 0.3),
    mythic:    Math.min(10,   0 + cl * 0.07 + p * 0.1),
  };
}

function rollRarity(prestigeLevel = 0, cardLuck = 0) {
  const w = getRarityWeights(prestigeLevel, cardLuck);
  const total = Object.values(w).reduce((s, v) => s + v, 0);
  let rand = Math.random() * total;
  for (const r of RARITIES) {
    rand -= w[r];
    if (rand <= 0) return r;
  }
  return 'common';
}

// Full card pool — GDD v0.6 §7
export const CARD_POOL = [
  // ---- Luck ----
  { id: 'luck_c',  name: '+1 Luck',  rarity: 'common',    stat: 'luck',     value: 1, description: 'Better NPC trait quality.' },
  { id: 'luck_u',  name: '+2 Luck',  rarity: 'uncommon',  stat: 'luck',     value: 2, description: 'Better NPC trait quality.' },
  { id: 'luck_r',  name: '+3 Luck',  rarity: 'rare',      stat: 'luck',     value: 3, description: 'Better NPC trait quality.' },
  { id: 'luck_e',  name: '+4 Luck',  rarity: 'epic',      stat: 'luck',     value: 4, description: 'Better NPC trait quality.' },
  { id: 'luck_l',  name: '+5 Luck',  rarity: 'legendary', stat: 'luck',     value: 5, description: 'Better NPC trait quality.' },

  // ---- Card Luck ----
  { id: 'cl_c',  name: '+1 Card Luck', rarity: 'common',    stat: 'cardLuck', value: 1, description: 'Better level-up card offers.' },
  { id: 'cl_u',  name: '+2 Card Luck', rarity: 'uncommon',  stat: 'cardLuck', value: 2, description: 'Better level-up card offers.' },
  { id: 'cl_r',  name: '+3 Card Luck', rarity: 'rare',      stat: 'cardLuck', value: 3, description: 'Better level-up card offers.' },
  { id: 'cl_e',  name: '+4 Card Luck', rarity: 'epic',      stat: 'cardLuck', value: 4, description: 'Better level-up card offers.' },
  { id: 'cl_l',  name: '+5 Card Luck', rarity: 'legendary', stat: 'cardLuck', value: 5, description: 'Better level-up card offers.' },

  // ---- Rate ----
  { id: 'rate_c', name: '+1 Rate', rarity: 'common',    stat: 'rate', value: 1, description: 'More NPCs carry loot.' },
  { id: 'rate_u', name: '+2 Rate', rarity: 'uncommon',  stat: 'rate', value: 2, description: 'More NPCs carry loot.' },
  { id: 'rate_r', name: '+3 Rate', rarity: 'rare',      stat: 'rate', value: 3, description: 'More NPCs carry loot.' },
  { id: 'rate_e', name: '+4 Rate', rarity: 'epic',      stat: 'rate', value: 4, description: 'More NPCs carry loot.' },
  { id: 'rate_l', name: '+5 Rate', rarity: 'legendary', stat: 'rate', value: 5, description: 'More NPCs carry loot.' },

  // ---- Speed ----
  { id: 'speed_c', name: '+1 Speed', rarity: 'common',    stat: 'speed', value: 1, description: 'NPCs move faster.' },
  { id: 'speed_u', name: '+2 Speed', rarity: 'uncommon',  stat: 'speed', value: 2, description: 'NPCs move faster.' },
  { id: 'speed_r', name: '+3 Speed', rarity: 'rare',      stat: 'speed', value: 3, description: 'NPCs move faster.' },
  { id: 'speed_e', name: '+4 Speed', rarity: 'epic',      stat: 'speed', value: 4, description: 'NPCs move faster.' },
  { id: 'speed_l', name: '+5 Speed', rarity: 'legendary', stat: 'speed', value: 5, description: 'NPCs move faster.' },

  // ---- Greed ----
  { id: 'greed_c', name: '+1 Greed', rarity: 'common',    stat: 'greed', value: 1, description: 'Sell rats for more coins.' },
  { id: 'greed_u', name: '+2 Greed', rarity: 'uncommon',  stat: 'greed', value: 2, description: 'Sell rats for more coins.' },
  { id: 'greed_r', name: '+3 Greed', rarity: 'rare',      stat: 'greed', value: 3, description: 'Sell rats for more coins.' },
  { id: 'greed_e', name: '+4 Greed', rarity: 'epic',      stat: 'greed', value: 4, description: 'Sell rats for more coins.' },
  { id: 'greed_l', name: '+5 Greed', rarity: 'legendary', stat: 'greed', value: 5, description: 'Sell rats for more coins.' },

  // ---- Stealth ----
  { id: 'stl_c', name: '+1 Stealth', rarity: 'common',    stat: 'stealth', value: 1, description: 'Sell charges recharge faster.' },
  { id: 'stl_u', name: '+2 Stealth', rarity: 'uncommon',  stat: 'stealth', value: 2, description: 'Sell charges recharge faster.' },
  { id: 'stl_r', name: '+3 Stealth', rarity: 'rare',      stat: 'stealth', value: 3, description: 'Sell charges recharge faster.' },
  { id: 'stl_e', name: '+4 Stealth', rarity: 'epic',      stat: 'stealth', value: 4, description: 'Sell charges recharge faster.' },
  { id: 'stl_l', name: '+5 Stealth', rarity: 'legendary', stat: 'stealth', value: 5, description: 'Sell charges recharge faster.' },

  // ---- Crew DPS ----
  { id: 'dps_c', name: '+1 Crew DPS', rarity: 'common',    stat: 'dps', value: 1, description: 'All crew deal more damage.' },
  { id: 'dps_u', name: '+2 Crew DPS', rarity: 'uncommon',  stat: 'dps', value: 2, description: 'All crew deal more damage.' },
  { id: 'dps_r', name: '+3 Crew DPS', rarity: 'rare',      stat: 'dps', value: 3, description: 'All crew deal more damage.' },
  { id: 'dps_e', name: '+4 Crew DPS', rarity: 'epic',      stat: 'dps', value: 4, description: 'All crew deal more damage.' },
  { id: 'dps_l', name: '+5 Crew DPS', rarity: 'legendary', stat: 'dps', value: 5, description: 'All crew deal more damage.' },

  // ---- Click Power ----
  { id: 'click_c', name: '+1 Click Power', rarity: 'common',    stat: 'clickPower', value: 1, description: 'Your clicks deal more damage.' },
  { id: 'click_u', name: '+2 Click Power', rarity: 'uncommon',  stat: 'clickPower', value: 2, description: 'Your clicks deal more damage.' },
  { id: 'click_r', name: '+3 Click Power', rarity: 'rare',      stat: 'clickPower', value: 3, description: 'Your clicks deal more damage.' },
  { id: 'click_e', name: '+4 Click Power', rarity: 'epic',      stat: 'clickPower', value: 4, description: 'Your clicks deal more damage.' },
  { id: 'click_l', name: '+5 Click Power', rarity: 'legendary', stat: 'clickPower', value: 5, description: 'Your clicks deal more damage.' },

  // ---- Influence ----
  { id: 'inf_c', name: '+1 Influence', rarity: 'common',    stat: 'influence', value: 1, description: 'Crew hire & level-up costs reduced.' },
  { id: 'inf_u', name: '+2 Influence', rarity: 'uncommon',  stat: 'influence', value: 2, description: 'Crew hire & level-up costs reduced.' },
  { id: 'inf_r', name: '+3 Influence', rarity: 'rare',      stat: 'influence', value: 3, description: 'Crew hire & level-up costs reduced.' },
  { id: 'inf_e', name: '+4 Influence', rarity: 'epic',      stat: 'influence', value: 4, description: 'Crew hire & level-up costs reduced.' },
  { id: 'inf_l', name: '+5 Influence', rarity: 'legendary', stat: 'influence', value: 5, description: 'Crew hire & level-up costs reduced.' },

  // ---- Wild cards ----
  { id: 'wild_loot_r', name: 'Lucky Box',      rarity: 'rare',      stat: 'wild_lootbox', value: 1,  description: 'Instantly receive 1 free Rare lootbox.' },
  { id: 'wild_exp_e',  name: 'Kill Frenzy',    rarity: 'epic',      stat: 'wild_exp',     value: 50, description: 'Double EXP from next 50 enemy kills.' },
  { id: 'wild_crew_l', name: 'Drill Sergeant', rarity: 'legendary', stat: 'wild_crew',    value: 1,  description: 'All current crew members gain +1 level.' },
  { id: 'wild_roll_m', name: 'Card Hoarder',   rarity: 'mythic',    stat: 'wild_reroll',  value: 1,  description: 'Gain +1 permanent reroll on all future level-ups.' },
];

export const CARD_MAP = Object.fromEntries(CARD_POOL.map(c => [c.id, c]));

export const CARD_RARITY_COLORS = {
  common:    '#9aa68b',
  uncommon:  '#7bdc1f',
  rare:      '#3d9bff',
  epic:      '#b06bff',
  legendary: '#f6c544',
  mythic:    '#ff4dff',
};

export const CARD_RARITY_GLOW = {
  common:    'rgba(154,166,139,.3)',
  uncommon:  'rgba(123,220,31,.45)',
  rare:      'rgba(61,155,255,.5)',
  epic:      'rgba(176,107,255,.55)',
  legendary: 'rgba(246,197,68,.6)',
  mythic:    'rgba(255,77,255,.75)',
};

/**
 * Draw `count` unique cards weighted by rarity.
 * Prestige shifts weights toward higher rarities.
 * Card Luck stat also improves weights (resets on prestige).
 */
export function drawCards(prestigeLevel = 0, count = 3, cardLuck = 0) {
  const cards = [];
  const used  = new Set();

  const byRarity = {};
  for (const r of RARITIES) byRarity[r] = CARD_POOL.filter(c => c.rarity === r);

  let attempts = 0;
  while (cards.length < count && attempts < 200) {
    attempts++;
    const rarity    = rollRarity(prestigeLevel, cardLuck);
    const pool      = byRarity[rarity];
    if (!pool.length) continue;
    const candidate = pool[Math.floor(Math.random() * pool.length)];
    if (used.has(candidate.id)) continue;
    used.add(candidate.id);
    cards.push(candidate);
  }
  return cards;
}
