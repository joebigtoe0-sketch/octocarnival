# ScrapRat — Game Design Document
**Version:** 0.6
**Status:** 🟢 Core systems locked | 🟢 Balance values locked | 🟡 Shop item list, lootbox contents TBD

---

## Changelog
- **v0.6** — Full balance pass. Level curve locked (500+ in 24h). Rarity level gates added. Drop rate system reworked with luck multiplier model. New stat: Card Luck. Card values and draw weights locked. Trait slots updated to 16 (Tail added).
- **v0.5** — Combat system, level-up cards, keys and lootboxes added.
- **v0.4** — Crew roster locked, trait slots defined, prestige confirmed.
- **v0.3** — Dual loop confirmed, layout documented.
- **v0.2** — Dual currency established.
- **v0.1** — Initial draft.

---

## 1. Concept Overview

**ScrapRat** is a browser-based idle/clicker game set in a grimy sewer world. Players build a crew of goblin-rat scavengers who battle endless sewer enemies for EXP, rob passing NPCs for loot, collect keys and lootboxes, and level up through a randomised card upgrade system.

**Genre:** Idle / Clicker / Loot Collector / Roguelite progression
**Platform:** Browser-first (app port planned post-launch)
**Tone:** Chaotic, greedy, sewer gothic, pixel art

---

## 2. The Two Loops ✅ LOCKED

### Loop 1 — Combat → EXP → Level Up → Stat Cards
- Crew battles sewer enemies in the combat zone (bottom half of screen)
- Player clicks enemy to deal direct damage
- Enemies die → EXP fills bar → level up triggers
- On level up: choose 1 of 3 random upgrade cards
- Better stats → better NPC line drops → more coins

### Loop 2 — NPC Line → Traits → Sell Rats → Coins → Crew Upgrades
- Rob passing NPCs for trait items
- Equip traits onto rat, sell rat for coins
- Spend coins on crew upgrades → higher DPS → faster kills → faster EXP
- Spend coins on shop items and card rerolls

**Neither loop works without the other.**

---

## 3. Level Progression ✅ LOCKED

### Target Milestones
| Playtime | Expected Level |
|---|---|
| 30 minutes | ~25 |
| 1 hour | ~50 |
| 2 hours | ~100 |
| 8 hours | ~250 |
| 24 hours | ~500 |

### Curve Parameters
- **Kills per level:** 7 (flat — never increases)
- **Kill time target:** ~10 seconds (maintained by crew DPS scaling)
- **Time per level:** ~70 seconds average active play
- **EXP base (level 1):** 50
- **EXP growth:** ×1.12 per level
- **Account level never resets** — even on prestige

### Phase Definitions
| Phase | Levels | Approx time |
|---|---|---|
| Early game | 1 – 150 | First ~3 hours |
| Mid game | 150 – 500 | Hours 3–24 |
| Late game | 500+ | Beyond 24h |

---

## 4. Enemy Combat System ✅ LOCKED

### Enemy HP Scaling
- **Formula:** `HP(level) = floor(1500 × 1.22^(level-1))`
- One enemy on screen at a time with visible HP bar and visual damage stages
- Enemy respawns instantly on death

### Player Click
- Base click damage: 25
- Scales with Scrapper crew member level: `clickDmg = 25 + (scrapper_level × 20)`
- Modified by Click Power stat: `clickDmg × (1 + clickPower/100)`

### Crew DPS
- Each passive crew member deals automatic DPS
- Levelling up crew increases DPS by 20% per level
- DPS stat card applies a global multiplier to all crew

### Lootbox Drops (per kill)
| Rarity | Drop chance |
|---|---|
| Common | 15% |
| Uncommon | 8% |
| Rare | 3% |
| Epic | 1% |
| Legendary | 0.25% |
| Mythic | 0.05% |

---

## 5. Rarity Level Gates ✅ LOCKED

Higher rarity items are **completely unavailable** until the player reaches the required account level. No amount of Luck can bypass these gates.

| Rarity | Unlocks at level | Approx playtime |
|---|---|---|
| Common | 1 (always available) | Instant |
| Uncommon | 1 (always available) | Instant |
| Rare | 1 (always available) | Instant |
| Epic | Level 20 | ~25 minutes |
| Legendary | Level 40 | ~50 minutes |
| Mythic | Level 80 | ~1.5 hours |

**Why gates matter:** Prevents lucky early players from pulling a Legendary item and turbo-skipping 50 levels of crew upgrades via a single sell. Everyone experiences the early game as designed.

---

## 6. NPC Drop Rate System ✅ LOCKED

### Base Drop Rates
Each NPC that spawns has an independent roll per rarity slot. Base rates represent the chance any given NPC carries that rarity item (before Luck).

| Rarity | Base rate | 1 per N NPCs |
|---|---|---|
| Common | 18% | ~6 NPCs |
| Uncommon | 7% | ~14 NPCs |
| Rare | 2% | ~50 NPCs |
| Epic | 0.40% | ~250 NPCs |
| Legendary | 0.05% | ~2,000 NPCs |
| Mythic | 0.005% | ~20,000 NPCs |

### Luck Multiplier
Luck stat acts as a direct multiplier on all base rates:
```
effectiveRate = min(baseRate × (1 + luck/100), 95%)
```

Examples at various Luck values:
| Luck % | Mythic effective rate | Mythic: 1 per N NPCs |
|---|---|---|
| 0% | 0.005% | 20,000 |
| 100% | 0.010% | 10,000 |
| 250% | 0.018% | ~5,600 |
| 500% | 0.030% | ~3,300 |
| 1000% | 0.055% | ~1,800 |

**Luck is powerful but never trivialises Mythic drops.** Even at 1000% luck, Mythic items are still rare events.

### Rate Gates
Level gates are checked AFTER the luck roll. If a player is under the gate level, the item simply doesn't appear regardless of luck.

---

## 7. Level-Up Card System ✅ LOCKED

On level up the game pauses and presents **3 random upgrade cards**. Player picks 1.

### Card Draw Weights (base, no Card Luck stat)
| Rarity | Draw chance |
|---|---|
| Common | 63% |
| Uncommon | 20% |
| Rare | 10% |
| Epic | 5% |
| Legendary | 2% |

### Card Values (Luck stat cards)
| Card rarity | Luck % granted |
|---|---|
| Common | +1% |
| Uncommon | +2% |
| Rare | +3% |
| Epic | +4% |
| Legendary | +5% |

### Projected Luck Accumulation
With base draw weights and all cards spent on Luck:
| Level | Approx total Luck % |
|---|---|
| 50 | ~70% |
| 150 | ~210% |
| 300 | ~420% |
| 500 | ~700% |

### Card Reroll
- 1 free reroll per level-up
- Additional rerolls cost coins
- Higher prestige level improves card draw weights toward higher rarities

### Full Card List
**Luck cards:**
- Common: +1% Luck
- Uncommon: +2% Luck
- Rare: +3% Luck
- Epic: +4% Luck
- Legendary: +5% Luck

**Card Luck cards (new stat — see §8):**
- Common: +1 Card Luck
- Uncommon: +2 Card Luck
- Rare: +4 Card Luck
- Epic: +7 Card Luck
- Legendary: +12 Card Luck

**Rate cards:**
- Common: +1% Rate
- Rare: +5% Rate
- Legendary: +15% Rate

**DPS cards:**
- Common: +2% all crew DPS
- Uncommon: +5% all crew DPS
- Rare: +8% all crew DPS
- Epic: +20% all crew DPS
- Legendary: +35% all crew DPS

**Click Power cards:**
- Common: +5% click damage
- Uncommon: +10% click damage
- Rare: +15% click damage
- Legendary: +40% click damage

**Greed cards:**
- Common: +2% sell value
- Rare: +8% sell value
- Legendary: +25% sell value

**Speed cards:**
- Common: +1 Speed
- Uncommon: +2 Speed
- Rare: +4 Speed
- Epic: +8 Speed

**Stealth cards:**
- Common: +1 Stealth
- Rare: +3 Stealth
- Legendary: +8 Stealth

**Wild cards:**
- Rare: Next lootbox drop is guaranteed Rare+
- Epic: Double EXP from next 50 enemy kills
- Legendary: All current crew levels +1
- Mythic: Permanent +1 reroll on all future level-ups

---

## 8. Stats System ✅ LOCKED

All stats improve exclusively through level-up card selections. Stats reset on prestige.

| Stat | Effect | Cards available |
|---|---|---|
| **Luck** | Multiplies NPC drop rates: `rate × (1 + luck/100)` | All rarities |
| **Card Luck** | Shifts card draw weights toward higher rarities. Each point moves weight from Common toward Legendary by ~0.3% | All rarities |
| **Rate** | % of NPCs that carry any loot item at all | Common, Rare, Legendary |
| **Speed** | NPCs move slower — wider click window | Common, Uncommon, Rare, Epic |
| **Greed** | Sell value multiplier: `value × (1 + greed×0.05)` | Common, Rare, Legendary |
| **Stealth** | Reduces sell charge recharge time | Common, Rare, Legendary |
| **DPS** | Global crew DPS multiplier: `dps × (1 + stat/100)` | All rarities |
| **Click Power** | Click damage multiplier: `clickDmg × (1 + stat/100)` | Common, Uncommon, Rare, Legendary |

### Card Luck — How It Works
Card Luck is a new stat that improves the quality of cards you see at level-up. Each point of Card Luck shifts the draw weight distribution:
- Common weight decreases
- Legendary weight increases proportionally
- Effect per point: ~0.3% shift toward Legendary

At Card Luck 0: 63% Common / 2% Legendary
At Card Luck 50: ~48% Common / ~6.5% Legendary
At Card Luck 100: ~33% Common / ~12% Legendary

This creates a meaningful long-term investment — players who prioritise Card Luck cards will see dramatically better card offers in late game and post-prestige runs.

---

## 9. Trait System ✅ LOCKED (16 slots)

Each goblin-rat has **16 trait slots**. All slots always have a default value. Loot items glow with rarity colour.

| # | Slot |
|---|---|
| 1 | Hair / Hat |
| 2 | Eyes |
| 3 | Mouth |
| 4 | Ears |
| 5 | Nose |
| 6 | Body Item |
| 7 | Leg Item |
| 8 | Back Item (anchor) |
| 9 | Feet Item |
| 10 | Skateboard |
| 11 | Handheld Item |
| 12 | Mouthheld Item |
| 13 | Skin Colour |
| 14 | Neck Item |
| 15 | Wrist Item |
| 16 | Tail |

**Coin value formula:** `coinValue = base[rarity] + (slotIndex - 7) * step[rarity]`
**Base:** Common 50 | Uncommon 200 | Rare 800 | Epic 3,000 | Legendary 12,000 | Mythic 50,000
**Step:** Common 1 | Uncommon 2 | Rare 4 | Epic 20 | Legendary 100 | Mythic 500
**slotIndex:** 0–15 (slot 1 = 0, slot 8 = 7, slot 16 = 15)

Full names: see **ScrapRat_Traits_v0.2.md**

### Max Rat Sell Values
| All traits same rarity | Coins |
|---|---|
| All Mythic | 804,000 |
| All Legendary | 192,800 |
| All Epic | 48,160 |
| All Rare | 12,832 |
| All Uncommon | 3,216 |
| All Common | 808 |

---

## 10. Key & Lootbox System ✅ LOCKED

### Keys
- Obtained by robbing Key Carrier NPCs (rare spawn in NPC stream)
- Purchasable from shop for coins
- 6 rarity tiers (Common → Mythic)
- Unlimited inventory

### Lootboxes
- Drop from enemies on death (rates in §4)
- Require matching rarity key to open
- Unlimited inventory
- **Contents: TBD post-V1** — box-exclusive traits will exist that cannot be obtained from the NPC stream

---

## 11. Your Goblin-Rat ✅ LOCKED

- One active rat being dressed
- Up to 10 rats in Base (outfits preserved)
- Sell value = sum of equipped trait coin values
- **Sell cooldown:** 5 charges, 60s recharge each
- Stealth stat reduces recharge time

---

## 12. Crew System ✅ LOCKED

### The Scrapper (Active)
- Base click damage: 25
- +20 click damage per Scrapper level
- Milestone skills at levels 10, 25, 50, 100, 200
- Active skill: Frenzy — 3× click for 15s, 2min cooldown

### Passive Crew
| Tier | Name | Base DPS | Base cost |
|---|---|---|---|
| 1 | Gutter Pup | 8 | 150 coins |
| 2 | Mudlark | 60 | 900 coins |
| 3 | Pipe Rat | 400 | 5,000 coins |
| 4 | Sludge Baron | 2,800 | 25,000 coins |
| 5 | Plague Knight | 20,000 | 120,000 coins |

- Each crew level: +20% DPS
- Purchase cost scales: `floor(baseCost × 1.22^n)` for nth unit
- Each has 3 milestone passive skills + 1 activatable skill

---

## 13. Prestige System ✅ LOCKED

**Resets:** All stat card upgrades, entire crew roster
**Keeps:** Coin balance, base rats + outfits, account level, prestige level, achievements
**Grants:** +1 Prestige level, +10% permanent EXP multiplier, better card draw weights, prestige-exclusive trait pool access

---

## 14. Shop Structure ✅ LOCKED

| Category | Currency | Notes |
|---|---|---|
| Daily | Coins | Rotating, refreshable |
| Keys | Coins | All 6 rarities available |
| Dice | Coins | Guarantee min NPC rarity |
| Bells | Coins | Notify on rarity spawn |
| Boosts | Coins | Temp DPS / coin multipliers |
| Card Rerolls | Coins | Stockpile for later |
| Premium | Token | Sewer Surge, premium lootboxes |

Full item list with prices: TBD

---

## 15. Community ✅ LOCKED

- Live chat, drop announcements (Epic+), activity feed
- **Sewer Surge** — Token purchase, 5× drop rate for all online players, ~30min global cooldown

---

## 16. Currency & Economy ✅ LOCKED

| Currency | Earned by | Spent on |
|---|---|---|
| EXP | Enemy kills | Level-up bar (auto) |
| Coins | Selling rats, idle | Crew, shop, card rerolls |
| Token | Purchase / Coins swap | Premium shop, Sewer Surge |

---

## 17. Open Questions

| # | Question | Priority |
|---|---|---|
| 1 | Full shop item list with prices | 🔴 High |
| 2 | Lootbox contents and opening mechanic | 🔴 Post-V1 |
| 3 | Full crew skill designs (milestone + active) | 🟡 Medium |
| 4 | Card reroll coin cost | 🟡 Medium |
| 5 | Token name / symbol | 🟡 Medium |
| 6 | Key spawn rate in NPC stream | 🟡 Medium |

---

## 18. Post-V1 Roadmap

- Lootbox opening mechanic + box-exclusive trait pool
- Item stat bonuses when equipped
- Set bonuses
- NFT minting
- Mobile app
- "Help others" idle mechanic

---

*ScrapRat GDD v0.6 — Balance values locked. Level gates, drop rates, Card Luck stat, and card values all defined.*
