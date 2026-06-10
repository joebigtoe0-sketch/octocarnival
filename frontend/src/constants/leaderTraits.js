/**
 * Crew Leader Rat — trait-to-stat mapping and boost calculation.
 *
 * Each of the 16 trait slots contributes to one of the 9 player stats
 * when that trait is worn by the assigned crew leader rat.
 *
 *  Stats that get boosts from TWO slots (7 stats × 2 = 14):
 *    luck, greed, rate, stealth, influence, speed, cardLuck
 *  Stats that get a boost from ONE slot (2 stats × 1 = 2):
 *    clickPower (Handheld Item), dps / Crew DPS (Wrist Item)
 *  Total: 14 + 2 = 16 ✓
 */

/** slotName → gameStore stat key */
export const LEADER_SLOT_STAT = {
  'Hair / Hat':     'greed',
  'Eyes':           'luck',
  'Mouth':          'greed',
  'Ears':           'luck',
  'Nose':           'rate',
  'Body Item':      'influence',
  'Leg Item':       'stealth',
  'Back Item':      'speed',
  'Feet Item':      'speed',
  'Skateboard':     'stealth',
  'Handheld Item':  'clickPower',
  'Mouthheld Item': 'rate',
  'Skin Colour':    'cardLuck',
  'Neck Item':      'influence',
  'Wrist Item':     'dps',
  'Tail':           'cardLuck',
};

/** Rarity → flat stat point bonus */
export const LEADER_RARITY_VALUE = {
  common:    1,
  uncommon:  2,
  rare:      3,
  epic:      5,
  legendary: 7,
  mythic:    10,
};

/**
 * Given the full baseRats array and a leaderId, compute the cumulative
 * stat boosts the leader rat's equipped traits provide.
 *
 * Returns an object with the same keys as `stats` in gameStore.
 * Slots without a trait equipped contribute 0.
 */
export function computeLeaderBoosts(baseRats = [], leaderId = null) {
  const zero = {
    luck: 0, cardLuck: 0, rate: 0, speed: 0,
    greed: 0, stealth: 0, dps: 0, clickPower: 0, influence: 0,
  };
  if (!leaderId) return zero;

  const leader = baseRats.find(r => r.id === leaderId);
  if (!leader) return zero;

  const boosts = { ...zero };
  for (const trait of leader.traits) {
    if (!trait) continue;
    const stat  = LEADER_SLOT_STAT[trait.slotName];
    const value = LEADER_RARITY_VALUE[trait.rarity] ?? 0;
    if (stat && value > 0) boosts[stat] += value;
  }
  return boosts;
}

/**
 * Returns a human-readable label for a stat key.
 */
export const STAT_LABELS = {
  luck:       'Luck',
  cardLuck:   'Card Luck',
  rate:       'Rate',
  speed:      'Speed',
  greed:      'Greed',
  stealth:    'Stealth',
  dps:        'Crew DPS',
  clickPower: 'Click Power',
  influence:  'Influence',
};
