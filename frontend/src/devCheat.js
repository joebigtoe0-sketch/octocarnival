/**
 * Dev-only save editor for screen recordings / testing.
 * Enable: localStorage.setItem('scraprats_dev', '1') then refresh.
 * Or runs automatically in Vite dev mode.
 */
import { useGameStore } from './stores/gameStore.js';
import { CREW_DEFS } from './constants/crew.js';
import { rollDistinctShowcaseTrait } from './constants/traits.js';

const ENABLED = import.meta.env.DEV || localStorage.getItem('scraprats_dev') === '1';

function equipRandomTraits(rat, count = 6) {
  const traits = Array(16).fill(null);
  for (let i = 0; i < count; i++) {
    const t = rollDistinctShowcaseTrait(traits.filter(Boolean), 50);
    if (t) traits[t.slotIdx] = t;
  }
  return { ...rat, traits };
}

/** Apply a partial patch to game state, respawn enemy, optionally cloud-save. */
export async function scrapratsCheat(patch = {}, { save = true } = {}) {
  const store = useGameStore.getState();
  useGameStore.setState(patch);
  store.spawnEnemy();
  if (save && !store.isGuest && store.userId) {
    await useGameStore.getState().saveToServer();
  }
  return useGameStore.getState();
}

/** Mid-game preset — good for gameplay trailers (~level 28 look). */
export async function scrapratsDemo() {
  const crewCounts = Object.fromEntries(CREW_DEFS.map(d => [d.id, 0]));
  const crewLevels = Object.fromEntries(CREW_DEFS.map(d => [d.id, 0]));
  crewCounts.gutter_pup = 4;
  crewCounts.mudlark    = 2;
  crewCounts.pipe_rat   = 1;
  crewLevels.scrapper   = 28;

  return scrapratsCheat({
    coins:    24_000,
    diamonds: 26,
    level:    28,
    accountLevel: 28,
    totalExp:   50_000,
    expInLevel: 120,
    crewCounts,
    crewLevels,
    sellCharges:    3,
    maxSellCharges: 3,
    activeRat: equipRandomTraits({ id: 'demo_rat', name: 'GRIMLOOT', traits: Array(16).fill(null) }),
    lootboxes: { common: 2, uncommon: 1, rare: 0, epic: 0, legendary: 0, mythic: 0 },
    keys:      { common: 0, uncommon: 0, rare: 1, epic: 0, legendary: 0, mythic: 0 },
    stats: {
      luck: 78, cardLuck: 62, rate: 71, speed: 54, greed: 58,
      stealth: 46, dps: 92, clickPower: 105, influence: 48,
    },
    unlockedMilestones: {
      scrapper_0: true,   // Frenzy @ lvl 10
      scrapper_1: true,   // +100% click @ lvl 25
      gutter_pup_0: true, // own DPS @ 10 hired
    },
    crewLeaderId: 'gutter_pup',
    lifetimeKills: 2400,
  });
}

export function installDevCheat() {
  if (!ENABLED) return;

  window.scrapratsCheat = scrapratsCheat;
  window.scrapratsDemo  = scrapratsDemo;

  console.info(
    '%cScrapRats dev cheat enabled',
    'color:#9bdc1f;font-weight:bold',
    '\n  scrapratsDemo()           — mid-game preset for recordings',
    '\n  scrapratsCheat({ coins: 99999, level: 50, accountLevel: 50 })',
    '\n  Disable: localStorage.removeItem("scraprats_dev")',
  );
}
