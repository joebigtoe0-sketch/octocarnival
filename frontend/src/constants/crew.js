// ScrapRats — Crew definitions

// milestones for passive crew: level = # hired required
// milestones for active crew (Scrapper): level = scrapper level required
// stat types for passive milestones:
//   'ownDps'      — adds value% to this crew's own DPS (additive stack)
//   'allDps'      — adds value% to ALL crew's global DPS multiplier
//   'clickDmgPct' — adds value% to click damage (Scrapper only, additive)
//   'clickCrit'   — sets % chance for 3× crit on click (Scrapper only)

export const CREW_DEFS = [
  {
    id: 'scrapper',
    name: 'Scrapper',
    portrait: '/assets/scrapper.png',
    flavour: 'Your clicker. Levels up to boost click damage per hit.',
    type: 'active',
    levelCostBase: 75,
    levelCostMul:  1.08,
    milestones: [
      { level: 10,  type: 'active',  icon: '/assets/icons/clickfrenzyskill.png', name: 'Frenzy',
        desc: '10× click damage for 15s. CD: 10 min', cooldown: 600, duration: 15, multiplier: 10,
        cost: 600 },
      { level: 25,  type: 'passive', icon: '/assets/icons/crewskills/scrapper/Icon3.png', stat: 'clickDmgPct', value: 100,
        desc: '+100% click damage',                                                            cost: 3000 },
      { level: 50,  type: 'passive', icon: '/assets/icons/crewskills/scrapper/Icon5.png', stat: 'clickCrit',   value: 30,
        desc: '30% chance to deal 3× click damage',                                           cost: 30000 },
      { level: 100, type: 'passive', icon: '/assets/icons/crewskills/scrapper/Icon6.png', stat: 'clickDmgPct', value: 250,
        desc: '+250% click damage',                                                            cost: 150000 },
    ],
  },
  {
    id: 'gutter_pup',
    name: 'Gutter Pup',
    portrait: '/assets/gutter-pup.png',
    flavour: 'Tiny scrappy pup gnawing at ankles.',
    type: 'passive',
    baseCost: 188,
    costMul:  1.085,
    dps: 8,
    milestones: [
      { level: 10,  type: 'passive', icon: '/assets/icons/crewskills/gutterpup/Icon20.png', stat: 'ownDps', value: 100,
        desc: '+100% own DPS',                                                                 cost: 750 },
      { level: 25,  type: 'passive', icon: '/assets/icons/crewskills/gutterpup/Icon25.png', stat: 'ownDps', value: 100,
        desc: '+100% own DPS',                                                                 cost: 4500 },
      { level: 50,  type: 'passive', icon: '/assets/icons/crewskills/gutterpup/Icon26.png', stat: 'ownDps', value: 150,
        desc: '+150% own DPS',                                                                 cost: 30000 },
      { level: 100, type: 'passive', icon: '/assets/icons/crewskills/gutterpup/Icon32.png', stat: 'ownDps', value: 200,
        desc: '+200% own DPS',                                                                 cost: 112500 },
    ],
  },
  {
    id: 'mudlark',
    name: 'Mudlark',
    portrait: '/assets/mudlark.png',
    flavour: 'Sewage diver who weaponised slime.',
    type: 'passive',
    baseCost: 1125,
    costMul:  1.085,
    dps: 60,
    milestones: [
      { level: 10,  type: 'passive', icon: '/assets/icons/crewskills/mudlark/Icon17.png', stat: 'ownDps', value: 100,
        desc: '+100% own DPS',                                                                 cost: 3750 },
      { level: 25,  type: 'passive', icon: '/assets/icons/crewskills/mudlark/Icon19.png', stat: 'ownDps', value: 100,
        desc: '+100% own DPS',                                                                 cost: 18750 },
      { level: 50,  type: 'passive', icon: '/assets/icons/crewskills/mudlark/Icon22.png', stat: 'ownDps', value: 150,
        desc: '+150% own DPS',                                                                 cost: 112500 },
      { level: 100, type: 'passive', icon: '/assets/icons/crewskills/mudlark/Icon23.png', stat: 'ownDps', value: 200,
        desc: '+200% own DPS',                                                                 cost: 450000 },
    ],
  },
  {
    id: 'pipe_rat',
    name: 'Pipe Rat',
    portrait: '/assets/pipe-rat.png',
    flavour: 'Tunnel runner, fast and wiry, hits hard.',
    type: 'passive',
    baseCost: 6000,
    costMul:  1.085,
    dps: 400,
    milestones: [
      { level: 10,  type: 'passive', icon: '/assets/icons/crewskills/piperat/Icon25.png', stat: 'ownDps', value: 100,
        desc: '+100% own DPS',                                                                 cost: 15000 },
      { level: 25,  type: 'passive', icon: '/assets/icons/crewskills/piperat/Icon26.png', stat: 'ownDps', value: 100,
        desc: '+100% own DPS',                                                                 cost: 75000 },
      { level: 50,  type: 'passive', icon: '/assets/icons/crewskills/piperat/Icon29.png', stat: 'ownDps', value: 150,
        desc: '+150% own DPS',                                                                 cost: 450000 },
      { level: 100, type: 'passive', icon: '/assets/icons/crewskills/piperat/Icon38.png', stat: 'ownDps', value: 200,
        desc: '+200% own DPS',                                                                 cost: 1875000 },
    ],
  },
  {
    // "Hero" unit — milestone 10 and 50 buff ALL crew, milestone 25 buffs self
    id: 'sludge_baron',
    name: 'Sludge Baron',
    portrait: '/assets/sludge-baron.png',
    flavour: 'Fat lazy brawler who somehow devastates.',
    type: 'passive',
    baseCost: 30000,
    costMul:  1.085,
    dps: 2800,
    milestones: [
      { level: 10,  type: 'passive', icon: '/assets/icons/crewskills/sludgebaron/Icon36.png', stat: 'allDps', value: 25,
        desc: '+25% DPS for ALL crew',                                                         cost: 75000 },
      { level: 25,  type: 'passive', icon: '/assets/icons/crewskills/sludgebaron/Icon37.png', stat: 'ownDps', value: 100,
        desc: '+100% own DPS',                                                                 cost: 375000 },
      { level: 50,  type: 'passive', icon: '/assets/icons/crewskills/sludgebaron/Icon39.png', stat: 'allDps', value: 50,
        desc: '+50% DPS for ALL crew',                                                         cost: 2250000 },
      { level: 100, type: 'passive', icon: '/assets/icons/crewskills/sludgebaron/Icon46.png', stat: 'ownDps', value: 200,
        desc: '+200% own DPS',                                                                 cost: 9000000 },
    ],
  },
  {
    id: 'plague_knight',
    name: 'Plague Knight',
    portrait: '/assets/plague-knight.png',
    flavour: 'Diseased, ancient, utterly devastating.',
    type: 'passive',
    baseCost: 135000,
    costMul:  1.085,
    dps: 20000,
    milestones: [
      { level: 10,  type: 'passive', icon: '/assets/icons/crewskills/plagueknight/Icon2.png',  stat: 'ownDps', value: 100,
        desc: '+100% own DPS',                                                                 cost: 300000 },
      { level: 25,  type: 'passive', icon: '/assets/icons/crewskills/plagueknight/Icon9.png',  stat: 'ownDps', value: 100,
        desc: '+100% own DPS',                                                                 cost: 1500000 },
      { level: 50,  type: 'passive', icon: '/assets/icons/crewskills/plagueknight/Icon12.png', stat: 'ownDps', value: 150,
        desc: '+150% own DPS',                                                                 cost: 9000000 },
      { level: 100, type: 'passive', icon: '/assets/icons/crewskills/plagueknight/Icon21.png', stat: 'ownDps', value: 200,
        desc: '+200% own DPS',                                                                 cost: 45000000 },
    ],
  },
];

export const CREW_MAP = Object.fromEntries(CREW_DEFS.map(c => [c.id, c]));

export function crewCost(def, countOrLevel) {
  if (def.type === 'active') {
    return Math.floor(def.levelCostBase * Math.pow(def.levelCostMul, countOrLevel));
  }
  return Math.floor(def.baseCost * Math.pow(def.costMul, countOrLevel));
}

/**
 * Total raw DPS from all passive crew, applying:
 *   - per-crew ownDps milestone bonuses (additive stack, e.g. +100% +100% +150% = ×4.5)
 *   - global allDps milestone bonuses (Sludge Baron hero milestones)
 *   - active skill boosts (skillBoosts)
 *   - global dpsBonusPct stat
 *
 * @param {object} crewCounts
 * @param {object} crewLevels
 * @param {number} dpsBonusPct  — from stats.dps card stat
 * @param {object} skillBoosts  — { crewId: multiplier } for active skills
 * @param {object} unlockedMilestones — { 'crewId_index': true }
 */
/**
 * Curved DPS scale factor based on how many of a crew type are hired.
 * Stays near 1× at low counts, then accelerates sharply at high counts.
 *   n=10  → ~2.1×   n=25 → ~5.6×
 *   n=50  → ~16.5×  n=100 → ~57×
 */
function countDpsScale(n) {
  return 1 + 0.06 * n + 0.005 * n * n;
}

export function totalCrewDps(crewCounts, crewLevels, dpsBonusPct = 0, skillBoosts = {}, unlockedMilestones = {}, prestigeLevel = 0) {

  // Collect allDps bonuses from hero milestones (Sludge Baron)
  let allDpsPct = 0;
  for (const def of CREW_DEFS) {
    const reached = def.type === 'passive' ? (crewCounts[def.id] || 0) : (crewLevels[def.id] || 0);
    def.milestones?.forEach((m, i) => {
      if (m.stat === 'allDps' && reached >= m.level && unlockedMilestones[`${def.id}_${i}`]) {
        allDpsPct += m.value;
      }
    });
  }

  let raw = 0;
  for (const def of CREW_DEFS) {
    if (def.type !== 'passive') continue;
    const count = crewCounts[def.id] || 0;
    if (count === 0) continue;

    let ownDpsBonus = 0;
    def.milestones?.forEach((m, i) => {
      if (m.stat === 'ownDps' && count >= m.level && unlockedMilestones[`${def.id}_${i}`]) {
        ownDpsBonus += m.value;
      }
    });

    const scaleMult = countDpsScale(count);
    const perUnit   = def.dps * scaleMult * (1 + ownDpsBonus / 100);
    raw += perUnit * count;
  }

  // +20% total DPS per prestige level
  const prestigeBonus = 1 + prestigeLevel * 0.20;
  return raw * (1 + (dpsBonusPct + allDpsPct) / 100) * prestigeBonus;
}

/**
 * Returns Scrapper's effective click damage multiplier from passive milestones.
 * { dmgMult, critChance } — dmgMult is applied to base damage, critChance [0–1].
 */
export function scrapperClickBonus(scrapperLevel, unlockedMilestones = {}) {
  const def = CREW_DEFS.find(d => d.id === 'scrapper');
  let dmgMult   = 1;
  let critChance = 0;
  def.milestones?.forEach((m, i) => {
    if (m.type !== 'passive') return;
    if (scrapperLevel < m.level) return;
    if (!unlockedMilestones[`scrapper_${i}`]) return;
    if (m.stat === 'clickDmgPct') dmgMult  += m.value / 100;
    if (m.stat === 'clickCrit')   critChance = Math.max(critChance, m.value / 100);
  });
  return { dmgMult, critChance };
}

/**
 * Base click damage (before clickPower stat multiplier).
 */
export function clickDamageBase(scrapperLevel = 0) {
  return 25 + scrapperLevel * 20;
}
