/**
 * Achievement definitions.
 *
 * check(s) receives the full gameStore state and returns true when the
 * condition is met.  All numeric comparisons use lifetime counters or
 * current stable state (level, crewCounts, etc.).
 */

const RARITY_RANK = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5, mythic: 6 };

function highestRarity(discoveredTraits = []) {
  let best = 0;
  for (const t of discoveredTraits) {
    const r = RARITY_RANK[t.rarity] || 0;
    if (r > best) best = r;
  }
  return best;
}

function totalCrew(crewCounts = {}) {
  return Object.values(crewCounts).reduce((s, v) => s + v, 0);
}

// Icon paths
const SKULL      = '/assets/icons/achievements/skull.png';
const DIAMOND    = '/assets/icons/diamond.png';
const COINS      = '/assets/icons/coins.png';
const LOOT       = n => `/assets/icons/achievements/loot${n}.png`;
const COLL       = n => `/assets/icons/achievements/Icon${n}.png`;
const CREW_IMG   = name => `/assets/${name}.png`;
const EXP_ICON   = '/assets/icons/exp.png';

export const ACHIEVEMENTS = [
  // ── PROGRESS ────────────────────────────────────────────────────────────────
  {
    id: 'level_5',    category: 'progress',
    name: 'First Steps',      desc: 'Reach Level 5',
    icon: EXP_ICON,   reward: 1,
    check: s => s.level >= 5,
  },
  {
    id: 'level_25',   category: 'progress',
    name: 'Getting Started',  desc: 'Reach Level 25',
    icon: EXP_ICON,   reward: 3,
    check: s => s.level >= 25,
  },
  {
    id: 'level_50',   category: 'progress',
    name: 'Seasoned',         desc: 'Reach Level 50',
    icon: EXP_ICON,   reward: 8,
    check: s => s.level >= 50,
  },
  {
    id: 'level_100',  category: 'progress',
    name: 'Veteran',          desc: 'Reach Level 100',
    icon: EXP_ICON,   reward: 20,
    check: s => s.level >= 100,
  },
  {
    id: 'level_200',  category: 'progress',
    name: 'Legend',           desc: 'Reach Level 200',
    icon: EXP_ICON,   reward: 50,
    check: s => s.level >= 200,
  },

  // ── COMBAT ──────────────────────────────────────────────────────────────────
  {
    id: 'kill_1',     category: 'combat',
    name: 'First Blood',      desc: 'Kill your first enemy',
    icon: SKULL,      reward: 1,
    check: s => (s.lifetimeKills || 0) >= 1,
  },
  {
    id: 'kill_100',   category: 'combat',
    name: 'Pest Control',     desc: 'Kill 100 enemies',
    icon: SKULL,      reward: 2,
    check: s => (s.lifetimeKills || 0) >= 100,
  },
  {
    id: 'kill_1k',    category: 'combat',
    name: 'Exterminator',     desc: 'Kill 1,000 enemies',
    icon: SKULL,      reward: 5,
    check: s => (s.lifetimeKills || 0) >= 1_000,
  },
  {
    id: 'kill_10k',   category: 'combat',
    name: 'Plague',           desc: 'Kill 10,000 enemies',
    icon: SKULL,      reward: 15,
    check: s => (s.lifetimeKills || 0) >= 10_000,
  },
  {
    id: 'kill_100k',  category: 'combat',
    name: 'Extinction Event', desc: 'Kill 100,000 enemies',
    icon: SKULL,      reward: 50,
    check: s => (s.lifetimeKills || 0) >= 100_000,
  },

  // ── LOOT ────────────────────────────────────────────────────────────────────
  {
    id: 'loot_first',    category: 'loot',
    name: 'Lucky Find',       desc: 'Receive your first loot item from an NPC',
    icon: LOOT(1),    reward: 1,
    check: s => (s.lifetimeLootFound || 0) >= 1,
  },
  {
    id: 'loot_uncommon', category: 'loot',
    name: 'Uncommon Taste',   desc: 'Find an Uncommon item',
    icon: LOOT(2),    reward: 2,
    check: s => highestRarity(s.discoveredTraits) >= RARITY_RANK.uncommon,
  },
  {
    id: 'loot_rare',     category: 'loot',
    name: 'Rarity Chaser',    desc: 'Find a Rare item',
    icon: LOOT(3),    reward: 3,
    check: s => highestRarity(s.discoveredTraits) >= RARITY_RANK.rare,
  },
  {
    id: 'loot_epic',     category: 'loot',
    name: 'Epic Haul',        desc: 'Find an Epic item',
    icon: LOOT(4),    reward: 5,
    check: s => highestRarity(s.discoveredTraits) >= RARITY_RANK.epic,
  },
  {
    id: 'loot_legendary', category: 'loot',
    name: 'Legendary Loot',   desc: 'Find a Legendary item',
    icon: LOOT(5),    reward: 10,
    check: s => highestRarity(s.discoveredTraits) >= RARITY_RANK.legendary,
  },
  {
    id: 'loot_mythic',   category: 'loot',
    name: 'Mythic Drop',      desc: 'Find a Mythic item',
    icon: LOOT(6),    reward: 25,
    check: s => highestRarity(s.discoveredTraits) >= RARITY_RANK.mythic,
  },

  // ── TRADING ─────────────────────────────────────────────────────────────────
  {
    id: 'sell_1',     category: 'trade',
    name: 'First Sale',       desc: 'Sell your first rat',
    icon: COINS,      reward: 1,
    check: s => (s.lifetimeRatsSold || 0) >= 1,
  },
  {
    id: 'sell_25',    category: 'trade',
    name: 'Street Dealer',    desc: 'Sell 25 rats',
    icon: COINS,      reward: 3,
    check: s => (s.lifetimeRatsSold || 0) >= 25,
  },
  {
    id: 'sell_100',   category: 'trade',
    name: 'Merchant',         desc: 'Sell 100 rats',
    icon: COINS,      reward: 8,
    check: s => (s.lifetimeRatsSold || 0) >= 100,
  },
  {
    id: 'sell_500',   category: 'trade',
    name: 'Crime Lord',       desc: 'Sell 500 rats',
    icon: COINS,      reward: 25,
    check: s => (s.lifetimeRatsSold || 0) >= 500,
  },
  {
    id: 'coins_100k', category: 'trade',
    name: 'Coin Hoarder',     desc: 'Earn 100,000 coins total',
    icon: COINS,      reward: 3,
    check: s => (s.lifetimeCoinsEarned || 0) >= 100_000,
  },
  {
    id: 'coins_1m',   category: 'trade',
    name: 'Rich Rat',         desc: 'Earn 1,000,000 coins total',
    icon: COINS,      reward: 10,
    check: s => (s.lifetimeCoinsEarned || 0) >= 1_000_000,
  },
  {
    id: 'coins_10m',  category: 'trade',
    name: 'Untouchable',      desc: 'Earn 10,000,000 coins total',
    icon: COINS,      reward: 25,
    check: s => (s.lifetimeCoinsEarned || 0) >= 10_000_000,
  },

  // ── CREW ────────────────────────────────────────────────────────────────────
  {
    id: 'crew_first', category: 'crew',
    name: 'First Hire',       desc: 'Hire your first crew member',
    icon: CREW_IMG('gutter-pup'), reward: 1,
    check: s => totalCrew(s.crewCounts) >= 1 || (s.crewLevels?.scrapper || 0) >= 1,
  },
  {
    id: 'crew_all',   category: 'crew',
    name: 'Full Roster',      desc: 'Have at least one of every crew type',
    icon: CREW_IMG('plague-knight'), reward: 5,
    check: s => {
      const c = s.crewCounts || {};
      const l = s.crewLevels || {};
      return (l.scrapper       || 0) >= 1 &&
             (c.gutter_pup     || 0) >= 1 &&
             (c.mudlark         || 0) >= 1 &&
             (c.pipe_rat        || 0) >= 1 &&
             (c.sludge_baron    || 0) >= 1 &&
             (c.plague_knight   || 0) >= 1;
    },
  },
  {
    id: 'crew_50',    category: 'crew',
    name: 'Rat Army',         desc: 'Have 50+ total passive crew hired',
    icon: CREW_IMG('mudlark'), reward: 10,
    check: s => totalCrew(s.crewCounts) >= 50,
  },
  {
    id: 'crew_200',   category: 'crew',
    name: 'Unstoppable Force', desc: 'Have 200+ total passive crew hired',
    icon: CREW_IMG('sludge-baron'), reward: 30,
    check: s => totalCrew(s.crewCounts) >= 200,
  },
  {
    id: 'scrapper_50', category: 'crew',
    name: 'Frenzy Master',    desc: 'Reach Scrapper Level 50',
    icon: CREW_IMG('scrapper'), reward: 10,
    check: s => (s.crewLevels?.scrapper || 0) >= 50,
  },

  // ── COLLECTION ──────────────────────────────────────────────────────────────
  {
    id: 'disc_10',    category: 'collection',
    name: 'Keen Eye',         desc: 'Discover 10 unique traits',
    icon: COLL(1),    reward: 2,
    check: s => (s.discoveredTraits?.length || 0) >= 10,
  },
  {
    id: 'disc_50',    category: 'collection',
    name: 'Hoarder',          desc: 'Discover 50 unique traits',
    icon: COLL(2),    reward: 8,
    check: s => (s.discoveredTraits?.length || 0) >= 50,
  },
  {
    id: 'disc_100',   category: 'collection',
    name: 'Completionist',    desc: 'Discover 100+ unique traits',
    icon: COLL(3),    reward: 25,
    check: s => (s.discoveredTraits?.length || 0) >= 100,
  },

  // ── DIAMONDS ────────────────────────────────────────────────────────────────
  {
    id: 'diamonds_10',  category: 'special',
    name: 'Shiny Hunter',     desc: 'Collect 10 diamonds',
    icon: DIAMOND,    reward: 2,
    check: s => (s.lifetimeDiamonds || 0) >= 10,
  },
  {
    id: 'diamonds_50',  category: 'special',
    name: 'Diamond Digger',   desc: 'Collect 50 diamonds',
    icon: DIAMOND,    reward: 5,
    check: s => (s.lifetimeDiamonds || 0) >= 50,
  },
  {
    id: 'diamonds_200', category: 'special',
    name: 'Gem Tycoon',       desc: 'Collect 200 diamonds',
    icon: DIAMOND,    reward: 15,
    check: s => (s.lifetimeDiamonds || 0) >= 200,
  },

  // ── SPECIAL ─────────────────────────────────────────────────────────────────
  {
    id: 'base_first', category: 'special',
    name: 'Homestead',        desc: 'Send 3 rats to your base',
    icon: DIAMOND,    reward: 2,
    check: s => (s.baseRats?.length || 0) >= 3,
  },
  {
    id: 'prestige_1', category: 'special',
    name: 'Reborn',           desc: 'Prestige for the first time',
    icon: DIAMOND,    reward: 15,
    check: s => (s.prestigeLevel || 0) >= 1,
  },
  {
    id: 'bounty_first', category: 'special',
    name: 'Bounty Hunter',    desc: 'Complete your first bounty',
    icon: DIAMOND,    reward: 3,
    check: s => s.bounties?.list?.some(b => b.completed || b.claimed),
  },
  {
    id: 'bounty_all', category: 'special',
    name: 'Triple Threat',    desc: 'Complete all 3 bounties in one cycle',
    icon: DIAMOND,    reward: 15,
    check: s => s.bounties?.list?.every(b => b.completed || b.claimed),
  },
];

export const ACHIEVEMENT_CATEGORIES = [
  { id: 'progress',   label: 'Progress',   icon: '/assets/icons/achievements/Arrowup.png' },
  { id: 'combat',     label: 'Combat',     icon: '/assets/icons/achievements/skull.png'   },
  { id: 'loot',       label: 'Loot',       icon: '/assets/icons/achievements/loot1.png'   },
  { id: 'trade',      label: 'Trade',      icon: '/assets/icons/coins.png'                },
  { id: 'crew',       label: 'Crew',       icon: '/assets/gutter-pup.png'                 },
  { id: 'collection', label: 'Collection', icon: '/assets/icons/achievements/Icon1.png'   },
  { id: 'special',    label: 'Special',    icon: '/assets/icons/diamond.png'              },
];
