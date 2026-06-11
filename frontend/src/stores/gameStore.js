import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CREW_DEFS, crewCost, totalCrewDps } from '../constants/crew.js';
import { calcSellValue, SLOT_DEFS } from '../constants/traits.js';
import { drawCards, CARD_MAP } from '../constants/cards.js';
import { ACHIEVEMENTS } from '../constants/achievements.js';

// ── Bounty helpers ────────────────────────────────────────────────────────────
const BOUNTY_TIERS = {
  common: { label: 'COMMON BOUNTY', rarities: ['common', 'uncommon'] },
  rare:   { label: 'RARE BOUNTY',   rarities: ['rare',   'epic']     },
  elite:  { label: 'ELITE BOUNTY',  rarities: ['legendary', 'mythic'] },
};

function genBountyTraits(rarities) {
  const count = 3 + Math.floor(Math.random() * 3); // 3–5
  const result = [];
  const usedSlots = new Set();
  let attempts = 0;
  while (result.length < count && attempts < 200) {
    attempts++;
    const slotIdx = Math.floor(Math.random() * SLOT_DEFS.length);
    if (usedSlots.has(slotIdx)) continue;
    const rarity  = rarities[Math.floor(Math.random() * rarities.length)];
    const tier    = SLOT_DEFS[slotIdx].tiers[rarity];
    if (!tier) continue;
    const variantSeed = Math.floor(Math.random() * 9973);
    const name = tier.variants
      ? tier.variants[variantSeed % tier.variants.length]
      : tier.name;
    result.push({
      slotIdx,
      slotName:    SLOT_DEFS[slotIdx].slotName,
      rarity,
      name,
      variantSeed,
      coinValue:   tier.coinValue,
    });
    usedSlots.add(slotIdx);
  }
  return result;
}

function generateBounties() {
  const resetAt = Date.now() + 24 * 60 * 60 * 1000;
  return {
    resetAt,
    list: Object.entries(BOUNTY_TIERS).map(([id, cfg]) => ({
      id,
      label:     cfg.label,
      traits:    genBountyTraits(cfg.rarities),
      completed: false,
      claimed:   false,
    })),
  };
}

const SELL_MAX     = 3;
const SELL_MAX_CAP = 10;
const RECHARGE_SEC = 120;
const BASE_CAPACITY_START = 3;
const BASE_CAPACITY_CAP   = 10;

const LOOTBOX_DROP_CHANCES = [
  { rarity: 'mythic',    chance: 0.0005 },
  { rarity: 'legendary', chance: 0.0025 },
  { rarity: 'epic',      chance: 0.01   },
  { rarity: 'rare',      chance: 0.03   },
  { rarity: 'uncommon',  chance: 0.08   },
  { rarity: 'common',    chance: 0.15   },
];

function makeDefaultRat(id = 'local_0', name = 'GRIMLOOT') {
  return { id, name, traits: Array(16).fill(null) };
}

function initialCrewCounts() {
  return Object.fromEntries(CREW_DEFS.map(d => [d.id, 0]));
}
function initialCrewLevels() {
  return Object.fromEntries(CREW_DEFS.map(d => [d.id, 0]));
}
function initialCrewSkills() {
  return Object.fromEntries(CREW_DEFS.map(d => [d.id, []]));
}
function emptyRarityMap() {
  return { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 };
}

export function expNeed(lvl) {
  // base 40 (−20%), ×1.12 per level
  return Math.floor(40 * Math.pow(1.12, lvl - 1));
}

/**
 * Scale factor for enemy count at a given account level.
 * Grows as lvl^0.25: ×1 at lvl 1, ×2.5 at lvl 40, ×3.2 at lvl 100.
 * Enemy HP is divided by the same factor so total HP-to-deal per level stays constant.
 */
function enemyCountScale(lvl) {
  return Math.pow(Math.max(1, lvl), 0.25);
}

/** Kills required to level up at this account level. */
export function killsPerLevel(lvl) {
  return Math.max(1, Math.round(7 * enemyCountScale(lvl)));
}

function enemyMaxHpFor(accountLevel) {
  const raw = accountLevel - 1;
  // Levels 1-30: normal 1.22× growth.
  // Levels 30+: each extra level adds 83% of the normal exponent step,
  // giving ~1.9M HP at level 60 (down from 5.4M original).
  const exp = raw <= 29 ? raw : 29 + (raw - 29) * 0.83;
  const baseHp = Math.floor(120 * Math.pow(1.22, exp));
  return Math.max(1, Math.floor(baseHp / enemyCountScale(accountLevel)));
}

function expPerKillFor(accountLevel) {
  return Math.ceil(expNeed(accountLevel) / killsPerLevel(accountLevel));
}


function rollLootbox() {
  const r = Math.random();
  let cumulative = 0;
  for (const { rarity, chance } of LOOTBOX_DROP_CHANCES) {
    cumulative += chance;
    if (r < cumulative) return rarity;
  }
  return null;
}

// Each point of Influence = 1% crew cost reduction, capped at 50% discount.
function applyInfluenceDiscount(cost, influence = 0) {
  const discount = Math.min(influence * 0.0025, 0.50); // 0.25% per point, max 50%
  return Math.max(1, Math.floor(cost * (1 - discount)));
}

export const useGameStore = create(
  persist(
    (set, get) => ({
      // ---- currencies ----
      coins:    300,
      diamonds: 0,

      // ---- EXP / leveling ----
      totalExp:   0,
      expInLevel: 0,
      level:      1,

      // ---- stats (set via level-up cards; no manual upgrades) ----
      stats: {
        luck:       0,
        cardLuck:   0,
        rate:       0,
        speed:      0,
        greed:      0,
        stealth:    0,
        dps:        0,
        clickPower: 0,
        influence:  0,
      },

      // ---- crew ----
      crewCounts: initialCrewCounts(),
      crewLevels: initialCrewLevels(),
      crewSkills: initialCrewSkills(),

      // ---- sell system ----
      sellCharges:     SELL_MAX,
      maxSellCharges:  SELL_MAX,   // starts at 3, max 10 via Diamond Shop
      sellSlotsBought: 0,          // how many extra slots purchased (0–7)

      // ---- timed item boosts (not persisted — intentionally reset on reload) ----
      itemDpsMul:      1.0,
      sellRechargeMul: 1.0,        // 2× faster sell recharge from Coin Storm

      // ---- rats ----
      activeRat:      makeDefaultRat(),
      baseRats:       [],
      maxBaseSlots:   BASE_CAPACITY_START,
      baseSlotsBought: 0,

      // ---- prestige ----
      prestigeLevel:      0,
      prestigeMultiplier: 1.0,
      accountLevel:       1,

      // ---- discovered traits ----
      discoveredTraits: [],

      // ---- bounties ----
      bounties: null,

      // ---- crew leader ----
      crewLeaderId: null,

      // ---- lifetime counters (for achievements) ----
      lifetimeKills:         0,
      lifetimeRatsSold:      0,
      lifetimeCoinsEarned:   0,
      lifetimeDiamonds:      0,
      lifetimeLootFound:     0,

      // ---- achievements ----
      claimedAchievements:   [], // ids that have been claimed
      newAchievements:       [], // ids unlocked but not yet claimed (for badge)

      // ---- inventory (shop consumables + keys) ----
      inventory: [],

      // ---- combat ----
      enemyHp:    0,
      enemyMaxHp: 0,
      enemyLevel: 1,

      // ---- level-up cards ----
      pendingLevelUp:    false,
      pendingCards:      [],
      levelUpRerollsLeft: 0,
      storedRerolls:     0,

      // ---- keys & lootboxes (collection counters) ----
      keys:      emptyRarityMap(),
      lootboxes: emptyRarityMap(),

      // ---- active skills ----
      skillCooldowns: {},

      // ---- unlocked milestones: { "crewId_milestoneIndex": true } ----
      unlockedMilestones: {},

      // ---- offline progress tracking ----
      lastTickTime: Date.now(),

      // ---- auth (persisted so session survives refresh) ----
      userId:   null,
      username: null,
      isGuest:  true,
      token:    null,

      setUser(userId, username, token) {
        set({ userId, username, isGuest: false, token: token || null });
        // Attach token to all future API requests (needed for cross-domain Railway)
        import('../api/client.js').then(m => m.setAuthToken(token));
      },
      clearUser() {
        set({ userId: null, username: null, isGuest: true, token: null });
        import('../api/client.js').then(m => m.setAuthToken(null));
      },

      // ---- server save (no-op for guests) ----
      async saveToServer() {
        const s = get();
        if (s.isGuest || !s.userId) return;
        try {
          const { gameApi } = await import('../api/client.js');
          // Build the same object partialize returns
          const blob = {
            coins: s.coins, diamonds: s.diamonds, totalExp: s.totalExp,
            expInLevel: s.expInLevel, level: s.level, stats: s.stats,
            crewCounts: s.crewCounts, crewLevels: s.crewLevels, crewSkills: s.crewSkills,
            sellCharges: s.sellCharges, maxSellCharges: s.maxSellCharges,
            sellSlotsBought: s.sellSlotsBought,
            activeRat: s.activeRat, baseRats: s.baseRats,
            maxBaseSlots: s.maxBaseSlots, baseSlotsBought: s.baseSlotsBought,
            prestigeLevel: s.prestigeLevel, prestigeMultiplier: s.prestigeMultiplier,
            accountLevel: s.accountLevel, discoveredTraits: s.discoveredTraits,
            inventory: s.inventory, storedRerolls: s.storedRerolls,
            keys: s.keys, lootboxes: s.lootboxes, lastTickTime: s.lastTickTime,
            enemyHp: s.enemyHp, enemyMaxHp: s.enemyMaxHp, enemyLevel: s.enemyLevel,
            skillCooldowns: s.skillCooldowns, unlockedMilestones: s.unlockedMilestones,
            bounties: s.bounties, lifetimeKills: s.lifetimeKills,
            lifetimeRatsSold: s.lifetimeRatsSold, lifetimeCoinsEarned: s.lifetimeCoinsEarned,
            lifetimeDiamonds: s.lifetimeDiamonds, lifetimeLootFound: s.lifetimeLootFound,
            claimedAchievements: s.claimedAchievements, crewLeaderId: s.crewLeaderId,
          };
          await gameApi.saveState(blob);
        } catch {
          // Silent fail — local save still works
        }
      },

      // ---- computed helpers ----
      getExpToNext() {
        return expNeed(get().level);
      },
      getSellValue() {
        const { activeRat, stats } = get();
        return calcSellValue(activeRat.traits, stats.greed);
      },

      // ---- EXP / level (internal) ----
      addExp(amount, onLevelUp) {
        set(s => {
          const multiplied = Math.floor(amount * s.prestigeMultiplier);
          if (multiplied <= 0) return {};
          const newTotal = s.totalExp + multiplied;
          let expInLevel = s.expInLevel + multiplied;
          let level = s.level;
          let leveled = false;
          let need = expNeed(level);
          while (expInLevel >= need) {
            expInLevel -= need;
            level++;
            leveled = true;
            need = expNeed(level);
          }
          if (leveled && onLevelUp) onLevelUp(level);
          return {
            totalExp: newTotal,
            expInLevel,
            level,
            accountLevel: Math.max(s.accountLevel, level),
          };
        });
      },

      addCoins(amount) {
        set(s => ({ coins: s.coins + amount }));
      },

      spendCoins(amount) {
        if (get().coins < amount) return false;
        set(s => ({ coins: s.coins - amount }));
        return true;
      },

      addDiamonds(amount) {
        set(s => ({
          diamonds:         s.diamonds + amount,
          lifetimeDiamonds: (s.lifetimeDiamonds || 0) + amount,
        }));
      },

      spendDiamonds(amount) {
        if (get().diamonds < amount) return false;
        set(s => ({ diamonds: s.diamonds - amount }));
        return true;
      },

      // Instantly refill 1 sell charge (Energy Drink item)
      addSellCharge() {
        set(s => ({ sellCharges: Math.min(s.maxSellCharges, s.sellCharges + 1) }));
      },

      // ---- combat ----
      spawnEnemy() {
        const { accountLevel } = get();
        const maxHp = enemyMaxHpFor(accountLevel);
        set({ enemyHp: maxHp, enemyMaxHp: maxHp, enemyLevel: accountLevel });
      },

      applyDamage(amount) {
        set(s => {
          const newHp = s.enemyHp - amount;
          if (newHp <= 0) return { enemyHp: 0 };
          return { enemyHp: newHp };
        });
        // killEnemy is triggered by Game.jsx when it detects hp === 0
      },

      killEnemy() {
        const s = get();
        const expGain   = expPerKillFor(s.accountLevel);
        const expAmount = Math.floor(expGain * s.prestigeMultiplier);

        // Roll for lootbox
        const lootRarity = rollLootbox();

        // Leave the enemy dead (hp stays 0). Game.jsx will call spawnEnemy() after a
        // short delay so there's a visible pause before the next enemy appears.
        if (lootRarity) {
          set(s2 => ({
            lootboxes:      { ...s2.lootboxes, [lootRarity]: s2.lootboxes[lootRarity] + 1 },
            lifetimeKills:  (s2.lifetimeKills || 0) + 1,
          }));
        } else {
          set(s2 => ({ lifetimeKills: (s2.lifetimeKills || 0) + 1 }));
        }

        return { lootboxDropped: lootRarity, expAmount };
      },

      // Called once per EXP particle collected (1/5 of a kill's EXP).
      collectExpParticle(amount) {
        if (!amount || amount <= 0) return;
        set(s => {
          const totalExp   = s.totalExp + amount;
          let expInLevel   = s.expInLevel + amount;
          let level        = s.level;
          let leveled      = false;
          let need         = expNeed(level);
          while (expInLevel >= need) {
            expInLevel -= need;
            level++;
            leveled = true;
            need = expNeed(level);
          }
          const newAccountLevel = Math.max(s.accountLevel, level);
          const updates = { totalExp, expInLevel, level, accountLevel: newAccountLevel };
          if (leveled) {
            const cards = drawCards(s.prestigeLevel, 3, s.stats.cardLuck || 0);
            updates.pendingLevelUp     = true;
            updates.pendingCards       = cards;
            updates.levelUpRerollsLeft = 1 + s.storedRerolls;
          }
          return updates;
        });
      },

      applyCard(cardId) {
        const { pendingCards, stats, crewLevels, storedRerolls } = get();
        const card = pendingCards.find(c => c.id === cardId) || CARD_MAP[cardId];
        if (!card) return false;

        const updates = { pendingLevelUp: false, pendingCards: [] };

        switch (card.stat) {
          case 'luck':
          case 'cardLuck':
          case 'rate':
          case 'speed':
          case 'greed':
          case 'stealth':
          case 'dps':
          case 'clickPower':
          case 'influence':
            updates.stats = { ...stats, [card.stat]: (stats[card.stat] || 0) + card.value };
            break;

          case 'wild_crew': {
            // All crew levels +1
            const newLevels = Object.fromEntries(
              Object.entries(crewLevels).map(([id, lv]) => [id, lv + card.value])
            );
            updates.crewLevels = newLevels;
            break;
          }

          case 'wild_reroll':
            updates.storedRerolls = storedRerolls + card.value;
            break;

          case 'wild_exp':
            // Double EXP tracking can be added; for now skip (future feature)
            break;

          case 'wild_lootbox': {
            const s = get();
            updates.lootboxes = { ...s.lootboxes, rare: s.lootboxes.rare + 1 };
            break;
          }

          default:
            break;
        }

        set(updates);
        // Return the applied card so callers can show a notification
        return card;
      },

      rerollCards() {
        const { levelUpRerollsLeft, accountLevel, prestigeLevel, coins, stats } = get();
        if (levelUpRerollsLeft <= 0) return false;
        const cost = 50 * accountLevel;
        if (coins < cost) return false;
        const newCards = drawCards(prestigeLevel, 3, stats.cardLuck || 0);
        set(s => ({
          coins: s.coins - cost,
          pendingCards: newCards,
          levelUpRerollsLeft: s.levelUpRerollsLeft - 1,
        }));
        return true;
      },

      addKey(rarity) {
        set(s => ({ keys: { ...s.keys, [rarity]: s.keys[rarity] + 1 } }));
      },

      addLootbox(rarity) {
        set(s => ({ lootboxes: { ...s.lootboxes, [rarity]: s.lootboxes[rarity] + 1 } }));
      },

      // ---- crew ----
      hireCrew(crewId, effectiveInfluence) {
        const { crewCounts, coins, stats } = get();
        const def = CREW_DEFS.find(d => d.id === crewId);
        if (!def) return false;
        const rawCost = crewCost(def, crewCounts[crewId]);
        const influence = effectiveInfluence ?? stats.influence;
        const cost = applyInfluenceDiscount(rawCost, influence);
        if (coins < cost) return false;
        set(s => ({
          coins: s.coins - cost,
          crewCounts: { ...s.crewCounts, [crewId]: s.crewCounts[crewId] + 1 },
        }));
        return true;
      },

      levelUpCrew(crewId, effectiveInfluence) {
        const { crewLevels, coins, stats } = get();
        const def = CREW_DEFS.find(d => d.id === crewId);
        if (!def || def.type !== 'active') return false;
        const currentLevel = crewLevels[crewId];
        const rawCost = crewCost(def, currentLevel);
        const influence = effectiveInfluence ?? stats.influence;
        const cost = applyInfluenceDiscount(rawCost, influence);
        if (coins < cost) return false;
        const newLevel = currentLevel + 1;
        const skills = [...(get().crewSkills[crewId] || [])];
        if ([10, 25, 50].includes(newLevel)) skills.push(newLevel);
        set(s => ({
          coins: s.coins - cost,
          crewLevels: { ...s.crewLevels, [crewId]: newLevel },
          crewSkills: { ...s.crewSkills, [crewId]: skills },
        }));
        return true;
      },

      // ---- lootbox opening ----
      consumeLootbox(rarity) {
        set(s => ({
          keys:      { ...s.keys,      [rarity]: Math.max(0, s.keys[rarity]      - 1) },
          lootboxes: { ...s.lootboxes, [rarity]: Math.max(0, s.lootboxes[rarity] - 1) },
        }));
      },

      // ---- trait claiming ----
      claimTrait(lootTrait, onDiscover) {
        const { activeRat, discoveredTraits } = get();
        const slotIdx = lootTrait.slotIdx;
        const newTraits = [...activeRat.traits];
        newTraits[slotIdx] = {
          slotIdx,
          slotName:    lootTrait.slotName,
          name:        lootTrait.name,
          rarity:      lootTrait.rarity,
          coinValue:   lootTrait.coinValue,
          variantSeed: lootTrait.variantSeed,
        };
        const key = `${slotIdx}_${lootTrait.rarity}_${lootTrait.name}`;
        let newDiscovered = discoveredTraits;
        if (!discoveredTraits.find(d => d.key === key)) {
          newDiscovered = [...discoveredTraits, { key, slotIdx, rarity: lootTrait.rarity, name: lootTrait.name }];
        }
        if (onDiscover) onDiscover(lootTrait);
        set(s => ({
          activeRat:         { ...s.activeRat, traits: newTraits },
          discoveredTraits:  newDiscovered,
          lifetimeLootFound: (s.lifetimeLootFound || 0) + 1,
        }));
      },

      // ---- sell active rat ----
      sellRat(onComplete) {
        const { sellCharges, activeRat, stats, bounties } = get();
        if (sellCharges < 1) return false;
        const value = calcSellValue(activeRat.traits, stats.greed);

        // Check if this sell completes any bounties (check BEFORE rat is wiped)
        let newBounties = bounties;
        if (bounties) {
          const newList = bounties.list.map(bounty => {
            if (bounty.completed || bounty.claimed) return bounty;
            const satisfied = bounty.traits.every(req => {
              const t = activeRat.traits[req.slotIdx];
              return t && t.name === req.name && t.rarity === req.rarity;
            });
            return satisfied ? { ...bounty, completed: true } : bounty;
          });
          newBounties = { ...bounties, list: newList };
        }

        set(s => ({
          coins:              s.coins + value,
          sellCharges:        Math.max(0, s.sellCharges - 1),
          activeRat:          makeDefaultRat(s.activeRat.id, s.activeRat.name),
          bounties:           newBounties,
          lifetimeRatsSold:   (s.lifetimeRatsSold  || 0) + 1,
          lifetimeCoinsEarned:(s.lifetimeCoinsEarned || 0) + value,
        }));
        if (onComplete) onComplete(value);
        return true;
      },

      tickSellCharge() {
        const rechargeTick = 1 / (RECHARGE_SEC * 4);
        const { stats, sellRechargeMul } = get();
        const speedBonus = (1 + stats.stealth / 100) * (sellRechargeMul || 1.0);
        set(s => ({
          sellCharges: Math.min(s.maxSellCharges, s.sellCharges + rechargeTick * speedBonus),
        }));
      },

      renameActiveRat(name) {
        const trimmed = name.trim().slice(0, 24);
        if (!trimmed) return;
        set(s => ({ activeRat: { ...s.activeRat, name: trimmed } }));
      },

      renameBaseRat(ratId, name) {
        const trimmed = name.trim().slice(0, 24);
        if (!trimmed) return;
        set(s => ({ baseRats: s.baseRats.map(r => r.id === ratId ? { ...r, name: trimmed } : r) }));
      },

      sendToBase() {
        const { activeRat, baseRats } = get();
        if (baseRats.length >= get().maxBaseSlots) return false;
        set(s => ({
          baseRats:  [...s.baseRats, s.activeRat],
          activeRat: makeDefaultRat(`local_${Date.now()}`),
        }));
        return true;
      },

      activateBaseRat(ratId) {
        const { baseRats, activeRat } = get();
        const idx = baseRats.findIndex(r => r.id === ratId);
        if (idx === -1) return;
        const newBase = [...baseRats];
        newBase[idx] = activeRat;
        set({ activeRat: baseRats[idx], baseRats: newBase });
      },

      sellBaseRat(ratId) {
        const { baseRats, stats, sellCharges } = get();
        if (sellCharges < 1) return null;
        const rat = baseRats.find(r => r.id === ratId);
        if (!rat) return null;
        const value = calcSellValue(rat.traits, stats.greed);
        set(s => ({
          coins:      s.coins + value,
          baseRats:   s.baseRats.filter(r => r.id !== ratId),
          sellCharges: Math.max(0, s.sellCharges - 1),
        }));
        return value;
      },

      swapTrait(rat1Id, rat2Id, slotIdx) {
        const { inventory, activeRat, baseRats } = get();
        const hasToken = inventory.some(i => i.key === 'swap_token' && i.quantity > 0);
        if (!hasToken) return { error: 'No Swap Token' };
        const allRats = [activeRat, ...baseRats];
        const rat1 = allRats.find(r => r.id === rat1Id);
        const rat2 = allRats.find(r => r.id === rat2Id);
        if (!rat1 || !rat2 || rat1Id === rat2Id) return { error: 'Invalid selection' };
        const t1 = rat1.traits[slotIdx] ?? null;
        const t2 = rat2.traits[slotIdx] ?? null;
        const updated1 = { ...rat1, traits: rat1.traits.map((t, i) => i === slotIdx ? t2 : t) };
        const updated2 = { ...rat2, traits: rat2.traits.map((t, i) => i === slotIdx ? t1 : t) };
        const newInventory = inventory
          .map(i => i.key === 'swap_token' ? { ...i, quantity: i.quantity - 1 } : i)
          .filter(i => i.quantity > 0);
        set(s => ({
          inventory: newInventory,
          activeRat: s.activeRat.id === rat1Id ? updated1 : s.activeRat.id === rat2Id ? updated2 : s.activeRat,
          baseRats:  s.baseRats.map(r => r.id === rat1Id ? updated1 : r.id === rat2Id ? updated2 : r),
        }));
        return { ok: true };
      },

      // ---- unlock milestone (pay coins) ----
      unlockMilestone(crewId, milestoneIndex) {
        const { coins, unlockedMilestones } = get();
        const def = CREW_DEFS.find(d => d.id === crewId);
        if (!def) return false;
        const m = def.milestones?.[milestoneIndex];
        if (!m || !m.cost) return false;
        const key = `${crewId}_${milestoneIndex}`;
        if (unlockedMilestones[key]) return false; // already unlocked
        if (coins < m.cost) return false;
        set(s => ({
          coins: s.coins - m.cost,
          unlockedMilestones: { ...s.unlockedMilestones, [key]: true },
        }));
        return true;
      },

      // ---- active skill ----
      activateSkill(crewId) {
        const { crewLevels, skillCooldowns } = get();
        const def = CREW_DEFS.find(d => d.id === crewId);
        if (!def) return false;
        const activeMilestone = def.milestones?.find(m => m.type === 'active');
        if (!activeMilestone) return false;
        if ((crewLevels[crewId] || 0) < activeMilestone.level) return false;

        const now = Date.now();
        const lastUsed = skillCooldowns[crewId] || 0;
        const cooldownMs = activeMilestone.cooldown * 1000;
        if (now - lastUsed < cooldownMs) return false; // still on cooldown

        set(s => ({
          skillCooldowns: { ...s.skillCooldowns, [crewId]: now },
        }));
        return { duration: activeMilestone.duration, multiplier: activeMilestone.multiplier, allCrew: activeMilestone.allCrew };
      },

      // ---- tick timestamp (call every 250ms from Game.jsx) ----
      stampTick() {
        set({ lastTickTime: Date.now() });
      },

      // ---- offline / background-tab progress catch-up ----
      // Called on mount and whenever the tab becomes visible again.
      // Simulates crew DPS damage + kills that happened while away.
      // Caps at 8 hours so it never feels exploitable.
      processOfflineProgress() {
        const s = get();
        const now      = Date.now();
        const elapsed  = Math.min(now - s.lastTickTime, 8 * 60 * 60 * 1000); // ms, max 8h
        if (elapsed < 2000) {
          // Less than 2s — just stamp the time, nothing meaningful to simulate
          set({ lastTickTime: now });
          return null;
        }

        const dps = totalCrewDps(s.crewCounts, s.crewLevels, s.stats.dps * 0.25, {}, s.unlockedMilestones, s.prestigeLevel);
        if (dps <= 0) {
          set({ lastTickTime: now });
          return null;
        }

        const elapsedSec    = elapsed / 1000;
        const newLootboxes  = { ...s.lootboxes };
        let remainingDmg    = dps * elapsedSec;
        let hp              = s.enemyHp > 0 ? s.enemyHp : enemyMaxHpFor(s.accountLevel);
        let maxHp           = s.enemyMaxHp > 0 ? s.enemyMaxHp : hp;
        let kills           = 0;
        let totalExpGain    = 0;
        let acctLvl         = s.accountLevel;

        // Simulate damage loop (each iteration = one enemy killed or damage exhausted)
        while (remainingDmg > 0) {
          if (remainingDmg >= hp) {
            remainingDmg  -= hp;
            kills++;
            totalExpGain  += expPerKillFor(acctLvl);
            const lr = rollLootbox();
            if (lr) newLootboxes[lr]++;
            // Spawn next enemy at current account level
            maxHp = enemyMaxHpFor(acctLvl);
            hp    = maxHp;
          } else {
            hp          -= remainingDmg;
            remainingDmg = 0;
          }
        }

        // Apply accumulated EXP — walk through levels
        const multiplied = Math.floor(totalExpGain * s.prestigeMultiplier);
        let expInLevel   = s.expInLevel + multiplied;
        let level        = s.level;
        let levelsGained = 0;
        let need         = expNeed(level);
        while (expInLevel >= need) {
          expInLevel -= need;
          level++;
          levelsGained++;
          need = expNeed(level);
        }
        acctLvl = Math.max(acctLvl, level);

        const updates = {
          lastTickTime: now,
          totalExp:     s.totalExp + multiplied,
          expInLevel,
          level,
          accountLevel: acctLvl,
          lootboxes:    newLootboxes,
          enemyHp:      hp,
          enemyMaxHp:   enemyMaxHpFor(acctLvl),
          enemyLevel:   acctLvl,
        };

        // Queue a single level-up card pick if levels were gained
        if (levelsGained > 0 && !s.pendingLevelUp) {
          const cards = drawCards(s.prestigeLevel, 3, s.stats.cardLuck || 0);
          updates.pendingLevelUp     = true;
          updates.pendingCards       = cards;
          updates.levelUpRerollsLeft = 1 + s.storedRerolls;
        }

        set(updates);
        return { kills, levelsGained, elapsedSec: Math.round(elapsedSec) };
      },

      // ---- prestige ----
      canPrestige() {
        return get().level >= 100;
      },

      prestige() {
        if (!get().canPrestige()) return false;
        const { prestigeLevel, diamonds, stats } = get();
        const newPrestigeLevel = prestigeLevel + 1;

        // Keep 20% of each stat gained through cards
        const keptStats = {};
        for (const key of Object.keys(stats)) {
          keptStats[key] = Math.floor((stats[key] || 0) * 0.2);
        }

        set({
          // full wipe
          coins:           300,
          totalExp:        0,
          expInLevel:      0,
          level:           1,
          accountLevel:    1,
          crewCounts:      initialCrewCounts(),
          crewLevels:      initialCrewLevels(),
          crewSkills:      initialCrewSkills(),
          sellCharges:     SELL_MAX,
          maxSellCharges:  SELL_MAX,
          sellSlotsBought: 0,
          activeRat:       makeDefaultRat(),
          baseRats:        [],
          maxBaseSlots:    BASE_CAPACITY_START,
          baseSlotsBought: 0,
          crewLeaderId:    null,
          discoveredTraits: [],
          inventory:       [],
          enemyHp:         0,
          enemyMaxHp:      0,
          enemyLevel:      1,
          pendingLevelUp:  false,
          pendingCards:    [],
          levelUpRerollsLeft: 0,
          storedRerolls:   0,
          keys:            emptyRarityMap(),
          lootboxes:       emptyRarityMap(),
          unlockedMilestones: {},
          skillCooldowns:  {},
          // carry forward
          diamonds,
          stats:           keptStats,
          prestigeLevel:   newPrestigeLevel,
          prestigeMultiplier: 1.0, // EXP multiplier no longer used; DPS bonus applied in totalCrewDps
        });
        get().spawnEnemy();
        return true;
      },

      // ---- inventory ----
      addToInventory(item) {
        set(s => {
          const existing = s.inventory.find(i => i.key === item.key);
          if (existing) {
            return { inventory: s.inventory.map(i =>
              i.key === item.key ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i
            )};
          }
          return { inventory: [...s.inventory, { ...item, quantity: item.quantity || 1 }] };
        });
      },

      useInventoryItem(key) {
        const item = get().inventory.find(i => i.key === key);
        if (!item || item.quantity < 1) return false;
        set(s => ({
          inventory: s.inventory
            .map(i => i.key === key ? { ...i, quantity: i.quantity - 1 } : i)
            .filter(i => i.quantity > 0),
        }));
        return item;
      },

      // ---- achievements ----
      claimAchievement(achievementId) {
        const state = get();
        const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!ach) return 0;
        if ((state.claimedAchievements || []).includes(achievementId)) return 0;
        if (!ach.check(state)) return 0;
        set(s => ({
          diamonds:            s.diamonds + ach.reward,
          lifetimeDiamonds:    (s.lifetimeDiamonds || 0) + ach.reward,
          claimedAchievements: [...(s.claimedAchievements || []), achievementId],
        }));
        return ach.reward;
      },

      // ---- crew leader ----
      assignCrewLeader(ratId) {
        set(s => ({
          crewLeaderId: s.crewLeaderId === ratId ? null : ratId,
        }));
      },

      // ---- bounties ----
      ensureBounties() {
        const { bounties } = get();
        if (!bounties || Date.now() >= bounties.resetAt) {
          set({ bounties: generateBounties() });
        }
      },

      claimBounty(bountyId) {
        const { bounties } = get();
        if (!bounties) return 0;
        const bounty = bounties.list.find(b => b.id === bountyId);
        if (!bounty || !bounty.completed || bounty.claimed) return 0;
        const reward = bounty.traits.reduce((s, t) => s + t.coinValue, 0) * 5;
        set(s => ({
          coins:    s.coins + reward,
          bounties: {
            ...s.bounties,
            list: s.bounties.list.map(b =>
              b.id === bountyId ? { ...b, claimed: true } : b
            ),
          },
        }));
        return reward;
      },

      // ---- add a Card Reroll Token (from shop) ----
      addStoredReroll() {
        set(s => ({ storedRerolls: s.storedRerolls + 1 }));
      },

      // ---- permanent sell-slot upgrade (Diamond Shop, up to SELL_MAX_CAP) ----
      incMaxSellCharges() {
        const s = get();
        if (s.maxSellCharges >= SELL_MAX_CAP) return false;
        set(st => ({
          maxSellCharges:  st.maxSellCharges + 1,
          sellCharges:     Math.min(st.maxSellCharges + 1, st.sellCharges + 1),
          sellSlotsBought: st.sellSlotsBought + 1,
        }));
        return true;
      },

      // ---- permanent base slot upgrade (Diamond Shop, up to BASE_CAPACITY_CAP) ----
      incMaxBaseSlots() {
        const s = get();
        if (s.maxBaseSlots >= BASE_CAPACITY_CAP) return false;
        set(st => ({
          maxBaseSlots:    st.maxBaseSlots + 1,
          baseSlotsBought: st.baseSlotsBought + 1,
        }));
        return true;
      },

      // ---- timed sell recharge speed boost ----
      applySellRechargeBoost(mul, durationMs) {
        const expiresAt = Date.now() + durationMs;
        set({ sellRechargeMul: mul, _sellRechargeExpiry: expiresAt });
        setTimeout(() => {
          set(s => s._sellRechargeExpiry <= Date.now() ? { sellRechargeMul: 1.0, _sellRechargeExpiry: 0 } : {});
        }, durationMs);
      },

      // ---- timed DPS multiplier ----
      applyItemDpsBoost(mul, durationMs) {
        const expiresAt = Date.now() + durationMs;
        set({ itemDpsMul: mul, _dpsMulExpiry: expiresAt });
        setTimeout(() => {
          set(s => s._dpsMulExpiry <= Date.now() ? { itemDpsMul: 1.0, _dpsMulExpiry: 0 } : {});
        }, durationMs);
      },

      // ---- timed additive stat boost (e.g. +2 luck for 10 min) ----
      applyTempStatBoost(stat, value, durationMs) {
        set(s => ({ stats: { ...s.stats, [stat]: (s.stats[stat] || 0) + value } }));
        setTimeout(() => {
          set(s => ({ stats: { ...s.stats, [stat]: Math.max(0, (s.stats[stat] || 0) - value) } }));
        }, durationMs);
      },

      // ---- reset ----
      resetAll() {
        set({
          coins: 300,
          diamonds: 0,
          totalExp: 0, expInLevel: 0, level: 1,
          stats: { luck: 0, cardLuck: 0, rate: 0, speed: 0, greed: 0, stealth: 0, dps: 0, clickPower: 0, influence: 0 },
          crewCounts: initialCrewCounts(),
          crewLevels: initialCrewLevels(),
          crewSkills: initialCrewSkills(),
          sellCharges:     SELL_MAX,
          maxSellCharges:  SELL_MAX,
          sellSlotsBought: 0,
          activeRat:       makeDefaultRat(),
          baseRats:        [],
          maxBaseSlots:    BASE_CAPACITY_START,
          baseSlotsBought: 0,
          prestigeLevel: 0, prestigeMultiplier: 1.0, accountLevel: 1,
          discoveredTraits: [],
          inventory: [],
          enemyHp: 0, enemyMaxHp: 0, enemyLevel: 1,
          pendingLevelUp: false, pendingCards: [], levelUpRerollsLeft: 0, storedRerolls: 0,
          keys: emptyRarityMap(),
          lootboxes: emptyRarityMap(),
          unlockedMilestones: {},
          skillCooldowns: {},
        });
        // Spawn a fresh enemy so the combat zone isn't stuck on "DEAD"
        get().spawnEnemy();
      },
    }),
    {
      name: 'scraprats.save.v4',
        partialize: state => ({
          coins:              state.coins,
          diamonds:           state.diamonds,
          totalExp:           state.totalExp,
          expInLevel:         state.expInLevel,
          level:              state.level,
          stats:              state.stats,
          crewCounts:         state.crewCounts,
          crewLevels:         state.crewLevels,
          crewSkills:         state.crewSkills,
          sellCharges:        state.sellCharges,
          maxSellCharges:     state.maxSellCharges,
          sellSlotsBought:    state.sellSlotsBought,
          activeRat:          state.activeRat,
          baseRats:           state.baseRats,
          maxBaseSlots:       state.maxBaseSlots,
          baseSlotsBought:    state.baseSlotsBought,
          prestigeLevel:      state.prestigeLevel,
          prestigeMultiplier: state.prestigeMultiplier,
          accountLevel:       state.accountLevel,
          discoveredTraits:   state.discoveredTraits,
          inventory:          state.inventory,
          storedRerolls:      state.storedRerolls,
          keys:               state.keys,
          lootboxes:          state.lootboxes,
          lastTickTime:       state.lastTickTime,
          enemyHp:            state.enemyHp,
          enemyMaxHp:         state.enemyMaxHp,
          enemyLevel:         state.enemyLevel,
          skillCooldowns:       state.skillCooldowns,
          unlockedMilestones:   state.unlockedMilestones,
          bounties:             state.bounties,
          lifetimeKills:        state.lifetimeKills,
          lifetimeRatsSold:     state.lifetimeRatsSold,
          lifetimeCoinsEarned:  state.lifetimeCoinsEarned,
          lifetimeDiamonds:     state.lifetimeDiamonds,
          lifetimeLootFound:    state.lifetimeLootFound,
          claimedAchievements:  state.claimedAchievements,
          crewLeaderId:         state.crewLeaderId,
          // auth — persisted so session survives page refresh
          userId:               state.userId,
          username:             state.username,
          isGuest:              state.isGuest,
          token:                state.token,
        }),
    }
  )
);
