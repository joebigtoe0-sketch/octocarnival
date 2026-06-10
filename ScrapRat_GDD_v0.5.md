# ScrapRat — Game Design Document
**Version:** 0.5
**Status:** 🟢 Core systems locked | 🟡 Lootbox contents, shop item list, balancing TBD

---

## Changelog
- **v0.5** — Major rework. EXP stat spending replaced with level-up card system. Passive crew EXP/s replaced with crew DPS against sewer enemies. Key + lootbox system added. Enemy combat mechanics defined.
- **v0.4** — Crew roster locked, 15 trait slots defined, prestige confirmed.
- **v0.3** — Dual loop confirmed, Dive Crew added, layout documented.
- **v0.2** — Dual currency (EXP + Coins) established.
- **v0.1** — Initial draft.

---

## 1. Concept Overview

**ScrapRat** is a browser-based idle/clicker game set in a grimy sewer world. Players build a crew of goblin-rat scavengers who battle endless sewer enemies for EXP, rob passing NPCs for loot, collect keys and lootboxes, and level up through a randomised card upgrade system. Two interlocking loops run simultaneously and both are required to progress.

**Genre:** Idle / Clicker / Loot Collector / Roguelite progression
**Platform:** Browser-first (app port planned post-launch)
**Tone:** Chaotic, greedy, sewer gothic, pixel art

---

## 2. The Two Loops ✅ LOCKED

### Loop 1 — Combat → EXP → Level Up → Stat Cards
- Crew battles sewer enemies in the combat zone (bottom half of screen)
- Player clicks enemy to deal direct damage
- Enemies die → drop EXP → fill EXP bar → level up
- On level up: choose 1 of 3 random upgrade cards
- Better stats → better NPC line drops → more coins

### Loop 2 — NPC Line → Traits → Sell Rats → Coins → Crew Upgrades
- Rob passing NPCs for trait items
- Equip traits onto your rat, sell rat for coins
- Spend coins on crew upgrades (higher DPS → faster kills → faster EXP)
- Also spend coins on shop items and rerolling level-up cards

**Neither loop works without the other. Both must grow together.**

---

## 3. The Main Screen

**Top half — NPC Stream**
- NPCs skate continuously left to right
- Each NPC has all 15 traits (defaults worthless, loot items glow)
- Click NPC to rob their non-default trait item
- Occasionally a **Key Carrier NPC** appears — rob them to collect a key
- Missed NPCs disappear permanently

**Bottom half — Combat Zone (Sewer)**
- One sewer enemy on screen at a time with a visible HP bar
- Enemy has multiple HP stages (visual changes as HP drops)
- Crew members deal continuous DPS to the enemy
- Player clicks enemy to deal direct bonus damage
- Enemy dies → respawns instantly → endless stream
- Enemies occasionally drop **lootboxes** on death (rarity varies)

---

## 4. Enemy Combat System ✅ LOCKED

### Enemies
Sewer enemies — rats, cockroaches, rival goblins. One on screen at a time.

**HP stages:** Enemy visually changes as HP depletes (e.g. cracks appear, it staggers). Creates drama and makes the HP bar feel meaningful rather than just a number.

**Scaling:** Each account level increases enemy HP, requiring more DPS to kill. This is the natural progression gate — as you level up you need stronger crew to maintain kill speed.

### Player Click
- Each click deals direct damage to the current enemy
- Click damage scales with the **Scrapper** crew member's level
- No cooldown on clicking — spam away

### Crew DPS
- Each passive crew member deals continuous DPS automatically
- Crew DPS is the primary damage source during idle
- Levelling up crew = more DPS = faster kills = faster EXP = faster levelling

### EXP & Levelling
- Each enemy kill gives a fixed EXP amount (scales with enemy level)
- EXP fills a bar — when full, **level up triggers**
- Account level never resets (even on prestige)
- EXP required per level scales up each time (standard idle curve)

### Lootbox Drops
- Enemies have a chance to drop a lootbox on death
- Lootboxes come in the same 6 rarity tiers as traits (Common → Mythic)
- Higher rarity boxes drop less frequently
- Boxes go into unlimited inventory
- **Contents: TBD** (opening mechanic designed post-V1)

---

## 5. Level-Up Card System ✅ LOCKED

When the player levels up, the game **pauses** and presents **3 random upgrade cards**. Player picks 1. Game resumes.

### Card Mechanics
- **3 cards shown**, player picks 1
- Cards have **rarity tiers** (Common → Mythic) — higher rarity = stronger upgrade
- **Reroll once per level-up** — costs coins (reroll reveals 3 new random cards)
- **Prestige level affects card pool** — higher prestige = better rarity distribution in the random draw

### Card Rarity Distribution (base, no prestige)
| Rarity | Base chance |
|---|---|
| Common | 55% |
| Uncommon | 25% |
| Rare | 12% |
| Epic | 5% |
| Legendary | 2.5% |
| Mythic | 0.5% |

Prestige shifts this distribution toward higher rarities with each prestige level.

### Example Upgrade Cards

**Luck cards (affect NPC drop quality):**
- Common: +1% Luck
- Uncommon: +3% Luck
- Rare: +8% Luck
- Epic: +15% Luck + small Rate bonus
- Legendary: +25% Luck
- Mythic: +50% Luck

**Rate cards (% of NPCs that carry a loot item):**
- Common: +1% Rate
- Rare: +5% Rate
- Legendary: +15% Rate

**DPS cards (crew damage boost):**
- Common: +2% all crew DPS
- Rare: +8% all crew DPS
- Epic: +20% DPS + 10% click damage
- Mythic: +50% all crew DPS

**Click damage cards:**
- Common: +5% click damage
- Rare: +15% click damage
- Legendary: +40% click damage

**Greed cards (sell value):**
- Common: +2% coin value on sells
- Rare: +8% coin value on sells
- Legendary: +25% coin value on sells

**Wild cards (unique effects):**
- Rare: Next lootbox drop is guaranteed Rare+
- Epic: Double EXP from next 50 enemy kills
- Legendary: All current crew levels +1
- Mythic: Permanent +1 reroll available on all future level-ups

> ❓ **OPEN:** Full card list to be expanded — this is a starter set. Cards are a major content area.

---

## 6. Key & Lootbox System ✅ LOCKED (V1 scope)

### Keys
- Obtained by robbing **Key Carrier NPCs** in the NPC stream (rare spawn)
- Also purchasable from the **Shop** for coins
- Keys come in 6 rarity tiers matching lootbox rarities
- Unlimited key inventory
- **Purpose:** Open matching rarity lootboxes

### Lootboxes
- Dropped by enemies on death (chance-based, rarity varies)
- Unlimited lootbox inventory
- Must be opened with a matching rarity key
- **Contents:** TBD — opening mechanic and reward tables designed post-V1

### Rarity Matching
| Key rarity | Opens |
|---|---|
| Common Key | Common Lootbox |
| Uncommon Key | Uncommon Lootbox |
| Rare Key | Rare Lootbox |
| Epic Key | Epic Lootbox |
| Legendary Key | Legendary Lootbox |
| Mythic Key | Mythic Lootbox |

---

## 7. Trait System ✅ LOCKED

Each goblin-rat has **15 trait slots**. All slots always have a value — defaults are plain, loot items glow with rarity colour.

| # | Slot | Coin value formula |
|---|---|---|
| 1 | Hair / Hat | base - 7×step |
| 2-7 | ... | base - (7-n)×step |
| 8 | Back Item | base (anchor) |
| 9-15 | ... | base + (n-7)×step |

**Coin values:** `coinValue = base[rarity] + (slotIndex - 7) * step[rarity]`
**Base:** Common 50 | Uncommon 200 | Rare 800 | Epic 3,000 | Legendary 12,000 | Mythic 50,000
**Step:** Common 1 | Uncommon 2 | Rare 4 | Epic 20 | Legendary 100 | Mythic 500

Full trait names and values: see **ScrapRat_Traits_v0.2.md**

### Rarity Tiers
Common (grey) → Uncommon (green) → Rare (blue) → Epic (purple) → Legendary (gold) → Mythic (animated)

---

## 8. Your Goblin-Rat ✅ LOCKED

- One **active rat** being dressed via robbed traits
- Up to **10 rats** in the **Base** (full outfits preserved)
- Rat sell value = sum of all equipped trait coin values
- **Sell cooldown:** 5 charges, 1 min recharge each
- Trait swap between base rats costs coins

---

## 9. Crew System ✅ LOCKED

### The Scrapper (Active — click damage)
- Levels up for increased click damage per hit
- Milestone levels (10, 25, 50, 100, 200) unlock passive skills
- Active skill: **Frenzy** — 3× click damage for 15 seconds (2 min cooldown)

### Passive Crew (5 tiers — DPS only)
All passive crew deal automatic DPS to the current enemy.

| Tier | Name | Flavour |
|---|---|---|
| 1 | Gutter Pup | Tiny scrappy pup, low DPS |
| 2 | Mudlark | Sewage diver, medium DPS |
| 3 | Pipe Rat | Tunnel runner, good DPS |
| 4 | Sludge Baron | Fat lazy manager who somehow hits hard |
| 5 | Plague Knight | Endgame — diseased, ancient, devastating |

Each has 3 milestone passive skills + 1 activatable skill.
Example active skills:
- Gutter Pup: **Pack Frenzy** — all Gutter Pups deal 5× DPS for 10 seconds
- Plague Knight: **Infection** — next 10 enemies take 50% extra damage from all sources

> ❓ **OPEN:** Full skill designs per crew member — TBD

---

## 10. Stats (via Level-Up Cards)

Stats are no longer spent manually with EXP. They improve exclusively through level-up card selections.

| Stat | Effect |
|---|---|
| **Luck** | Higher rarity traits on NPCs |
| **Rate** | More NPCs carry a loot item |
| **Speed** | NPCs move slower (wider click window) |
| **Greed** | Higher coin value when selling rats |
| **Stealth** | Reduced sell cooldown |
| **DPS** | Global crew damage multiplier |
| **Click Power** | Player click damage multiplier |

---

## 11. Prestige System ✅ LOCKED

**Resets:** All stat card upgrades, entire crew roster
**Keeps:** Coin balance, base rats + outfits, account level, achievements, prestige level
**Grants:** +1 Prestige Level, +10% permanent EXP multiplier, better card rarity pool, prestige-exclusive trait unlocks

---

## 12. Shop ✅ LOCKED (structure)

| Category | Currency | Examples |
|---|---|---|
| Daily | Coins | Rotating offers |
| Keys | Coins | Buy any rarity key |
| Dice | Coins | Guarantee min rarity on next NPC |
| Bells | Coins | Notify when specific rarity spawns |
| Boosts | Coins | Temp DPS or coin multipliers |
| Card Rerolls | Coins | Extra reroll tokens to save for later |
| Premium | Token | Sewer Surge, premium lootboxes |

> 🔜 Full item list with prices — TBD next session

---

## 13. Community ✅ LOCKED

- Live chat, drop announcements, activity feed
- **Sewer Surge** — Token purchase, 5× drop rate for all online players

---

## 14. Currency & Economy ✅ LOCKED

| Currency | Earned by | Spent on |
|---|---|---|
| EXP | Enemy kills, click damage | Fills level-up bar (auto) |
| Coins | Selling rats, idle scavenging | Crew upgrades, shop, card rerolls |
| Token | Purchase / swap | Premium shop, Sewer Surge |

---

## 15. Open Questions

| # | Question | Priority |
|---|---|---|
| 1 | Full level-up card list (all stats, all rarities) | 🔴 High |
| 2 | Lootbox contents and opening mechanic | 🔴 High (post-V1) |
| 3 | Enemy HP scaling curve per level | 🔴 High (balancing) |
| 4 | EXP per kill scaling curve | 🔴 High (balancing) |
| 5 | Crew DPS values and cost curve | 🔴 High (balancing) |
| 6 | Card reroll coin cost (flat or scaling?) | 🟡 Medium |
| 7 | Prestige card pool improvement rate | 🟡 Medium |
| 8 | Full crew skill designs | 🟡 Medium |
| 9 | Shop full item list with prices | 🔴 High |
| 10 | Key spawn rate in NPC stream | 🟡 Medium |
| 11 | Enemy lootbox drop rate per rarity | 🟡 Medium |
| 12 | Token name / symbol | 🟡 Medium |

---

## 16. Post-V1 Roadmap

- Lootbox opening mechanic + reward tables
- Item stat bonuses when equipped
- Set bonuses (matching outfit = special effect)
- NFT minting
- Mobile app
- "Help others" idle mechanic
- Additional prestige tiers

---

*ScrapRat GDD v0.5 — Major systems rework. Combat, level-up cards, keys and lootboxes all locked.*
