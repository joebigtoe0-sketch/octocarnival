# ScrapRat — Game Design Document
**Version:** 0.4 (Near-complete — V1 scope locked)
**Status:** 🟢 Core systems locked | 🟡 Item list & balancing TBD

---

## Changelog
- **v0.4** — Full crew roster locked. 15 trait slots defined. Skill milestone system added. Prestige rules confirmed. Shop currency split confirmed. Rarity tiers locked. Item stat bonuses deferred post-V1.
- **v0.3** — Dual loop confirmed, Dive Crew added, layout documented.
- **v0.2** — Dual currency (EXP + Coins) established.
- **v0.1** — Initial draft.

---

## 1. Concept Overview

**ScrapRat** is a browser-based idle/clicker game set in a grimy sewer world. Players run a goblin-rat scavenger operation — robbing passing NPCs for loot, building a crew to automate income, and collecting outfitted rats to sell or keep. Two interlocking loops run simultaneously and both are required to progress.

**Genre:** Idle / Clicker / Loot Collector
**Platform:** Browser-first (app port planned post-launch)
**Tone:** Chaotic, greedy, sewer gothic, pixel art

---

## 2. The Two Loops ✅ LOCKED

### Loop 1 — EXP → Stats → Better NPC Line
- Click the **Sludge Pool** to earn EXP (base: 1 EXP per click)
- Crew members boost clicks and add passive EXP/sec
- Spend EXP on stat upgrades (Luck, Rate, Speed, etc.)
- Better stats → better/more items on NPCs → more coins

### Loop 2 — Coins → Crew → More EXP
- Rob NPCs → collect trait items → sell rats for coins
- Spend coins on crew members and shop items
- Crew members boost EXP/click and generate passive EXP/sec
- More EXP → faster stat upgrades → better drops → more coins

**Neither loop works without the other. Both must grow together.**

### Active vs Idle
- **Active:** Both loops running. Clicking pile + robbing NPCs + spending coins.
- **Idle:** Only passive EXP trickles in from crew. No robbing, no coin income, no crew upgrades.
- No offline cap — passive rates are tuned so even weeks of idle doesn't break progression (active play is always ~10-20× more productive because the full coin loop is running).

---

## 3. The Main Screen

**Top half — NPC Stream**
- NPCs skate continuously left to right
- Every NPC has all 15 traits visible (defaults are worthless)
- When a "loot NPC" spawns, exactly ONE trait slot contains a non-default rarity item (glows to indicate rarity)
- Player clicks NPC to rob that item
- Occasionally a mystery box rolls through — click to crack open
- Missed NPCs/boxes disappear off screen permanently

**Bottom half — Sludge Pool**
- Spam-click the sludge to earn EXP
- Passive crew members are visually present in the pool
- Floating bonus objects occasionally appear (extra EXP on click)

---

## 4. Trait System ✅ LOCKED

Each goblin-rat (NPC and player) has **15 trait slots**. All slots always have a value — defaults are plain/invisible, loot items are visually distinct.

| # | Slot | Examples |
|---|---|---|
| 1 | Hair / Hat | Mohawk, top hat, crown |
| 2 | Eyes | Sunglasses, monocle, glowing eyes |
| 3 | Mouth | Smirk, snarl, gold teeth |
| 4 | Ears | Earrings, ear gauge, nothing |
| 5 | Nose | Ring, wart, clown nose |
| 6 | Body item | Shirts, coats, armour |
| 7 | Leg item | Pants, shorts, skirts |
| 8 | Back item | Cape, wings, backpack |
| 9 | Feet item | Boots, sneakers, flippers |
| 10 | Skateboard | Plank, gold board, rocket board |
| 11 | Handheld item | Sword, sack, boombox |
| 12 | Mouthheld item | Cigarette, toothpick, flower |
| 13 | Skin colour | Various tones + special (green, gold) |
| 14 | Neck item | Chain, collar, tie |
| 15 | Wrist item | Watch, bracelet, shackle |

### Rarity Tiers ✅ LOCKED
| Tier | Colour | Glow |
|---|---|---|
| Common | Grey | Faint |
| Uncommon | Green | Soft |
| Rare | Blue | Medium |
| Epic | Purple | Strong |
| Legendary | Gold | Bright |
| Mythic | Animated/special | Intense |

### Coin Values (TBD in balancing — rough targets)
| Tier | Coin value per trait |
|---|---|
| Common | ~50 |
| Uncommon | ~200 |
| Rare | ~800 |
| Epic | ~3,000 |
| Legendary | ~12,000 |
| Mythic | ~50,000 |

### Item Stat Bonuses
- **V1:** Purely cosmetic. Coin value only.
- **Post-V1:** Individual items may carry small stat bonuses when equipped. Sets of matching items give bonus effects.

---

## 5. Your Goblin-Rat

- Player has one **active rat** being dressed
- Up to **10 rats** stored in the **Base** (with full outfits intact)
- A rat's sell value = sum of all equipped trait coin values
- **Sell cooldown:** 5 charges, each recharges after 1 minute
- Swapping traits between stored rats costs a small coin fee

### Rat Identity
- Each rat gets a procedurally generated name
- Account level + prestige badge displayed on profile

---

## 6. Crew System ✅ LOCKED

### The Scrapper (Active — click power)
- The only crew member that boosts EXP per click
- Level up to increase click power
- Milestone levels (10, 25, 50, 100, 200...) unlock passive skills
- Has 1 activatable skill

**Scrapper milestone skills:**
- Lv.10 — Passive: +X% base click EXP
- Lv.25 — Passive: small chance to double EXP on click
- Lv.50 — Passive: +X% EXP when clicking during active NPC spawn
- Active skill: **Frenzy** — 2× EXP per click for 15 seconds (2 min cooldown)

### Passive Crew (5 tiers — EXP/sec only)
All passive crew members give EXP/sec. They do NOT boost click power. Each has 3 milestone passive skills + 1 activatable skill.

| Tier | Name | Flavour | Base EXP/sec |
|---|---|---|---|
| 1 | Gutter Pup | Tiny scrappy pup sniffing through trash | Low |
| 2 | Mudlark | Sewage diver fishing out junk | Medium |
| 3 | Pipe Rat | Tunnel runner, fast and wiry | Good |
| 4 | Sludge Baron | Fat lazy manager who somehow works | High |
| 5 | Plague Knight | Endgame — diseased, ancient, powerful | Very high |

**Each passive crew member milestone skills (pattern):**
- Lv.10 — Passive: +X% own EXP/sec
- Lv.25 — Passive: boosts another crew member or global effect
- Lv.50 — Passive: unique effect (e.g. Mudlark Lv.50 = occasionally surfaces a free item)
- Active skill: unique per crew (e.g. Plague Knight active = infects NPC stream, next 10 NPCs all have Rare+ items)

> ❓ Exact EXP/sec values and cost curves — TBD in balancing phase

---

## 7. Stats System ✅ LOCKED

Spent with EXP. Visible level numbers (Luck Lv.7 etc).

| Stat | Effect |
|---|---|
| **Luck** | Higher rarity items on NPCs |
| **Rate** | More NPCs carry a loot item (vs. walking empty) |
| **Speed** | NPCs move slower = wider click window |
| **Greed** | Increased coin value when selling rats |
| **Stealth** | Reduced sell cooldown time |
| **Hoard** | Increased base storage capacity |

Stats reset on Prestige. Account level does not reset.

---

## 8. Prestige System ✅ LOCKED

**When triggered:** Player chooses to prestige at any time (recommended when progression slows).

**Resets:**
- All stat levels (Luck, Rate, Speed, Greed, Stealth, Hoard back to 0)
- Entire crew roster (Scrapper + all passive crew lost)

**Keeps:**
- Coin balance
- All rats in Base (with their full outfits)
- Account level (keeps climbing forever)
- All achievements earned
- Prestige level counter (+1)

**Prestige rewards:**
- Permanent EXP multiplier (+10% per prestige level, stacks)
- Unlocks Prestige-exclusive item pool (special traits unavailable before first prestige)
- Prestige 3+ unlocks Mythic tier items in drops
- Cosmetic prestige badge on profile

**Feel:** You rebuild your crew fast (coins still there), stats climb quicker than first run (EXP multiplier), but NPC drops are immediately better because Luck resets to 0 and you feel the climb again. Clean, satisfying, not punishing.

---

## 9. Shop ✅ LOCKED (structure — item list TBD)

**Coins** buy consumables and tools.
**Token** (crypto) buys premium items.

| Category | Currency | Examples |
|---|---|---|
| Daily | Coins | Rotating offers, refreshable |
| Dice | Coins | Guarantee min rarity on next NPC |
| Bells | Coins | Notify when specific rarity spawns |
| Boosts | Coins | Temp EXP or coin multipliers |
| Tools | Coins | Permanent QoL (sell charge upgrades etc) |
| Premium | Token | Sewer Surge, premium crates |

> 🔜 Full item list with prices — next session

---

## 10. Community ✅ LOCKED

- **Live chat** — sidebar, all online players
- **Drop announcements** — server broadcasts Epic+ pulls globally
- **Activity feed** — scrolling log: big drops, prestige events, achievements
- **Sewer Surge** — any player pays Token to activate 5× drop rate for ALL online players for X minutes. Activating player credited publicly.

---

## 11. Currency & Economy ✅ LOCKED

| Currency | Earned by | Spent on |
|---|---|---|
| EXP | Clicking, passive crew, achievements | Stat upgrades |
| Coins | Selling rats, idle scavenging | Crew, shop consumables |
| Token | Purchase / swap Coins → Token | Premium shop, Sewer Surge |

---

## 12. Progression Pillars

1. **Stat progression** — EXP → stats → better drops
2. **Crew progression** — coins → crew levels → milestone skills unlocked
3. **Collection** — fill the trait codex, build cool rats
4. **Account level** — never resets, gates cosmetic milestones
5. **Prestige** — reset loop with compounding permanent bonuses

---

## 13. Post-V1 Roadmap

- Item stat bonuses when equipped
- Set bonuses (full matching outfit = special effect)
- NFT minting of rats
- Wallet connect + Token swap in-game
- Mobile app
- "Help others" idle mechanic
- Additional prestige tiers and Mythic item pool expansion

---

## 14. Open Questions

| # | Question | Priority |
|---|---|---|
| 1 | Full shop item list with coin prices | 🔴 High |
| 2 | Exact EXP/sec values per crew tier | 🔴 High (balancing) |
| 3 | Crew cost curve (first purchase + scaling) | 🔴 High (balancing) |
| 4 | Stat upgrade EXP cost curve | 🔴 High (balancing) |
| 5 | Scrapper milestone skill exact values | 🟡 Medium |
| 6 | Passive crew active skill designs | 🟡 Medium |
| 7 | Token name / symbol | 🟡 Medium |
| 8 | Coins → Token conversion rate | 🟡 Medium |
| 9 | Sewer Surge duration and cooldown | 🟡 Medium |

---

*ScrapRat GDD v0.4 — V1 scope locked. Next: shop item list + balancing skeleton.*
