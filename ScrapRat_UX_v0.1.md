# ScrapRat — UX Document
**Version:** 0.1
**Status:** 🟡 V1 scope defined — screen flows TBD in detail

---

## 1. Core UX Principles

- **Zero friction to start** — no sign-in wall, no tutorial gate. You land and play.
- **Always something to do** — two things happening on screen at all times (NPC stream + sludge pool)
- **Progress feels visible** — numbers, levels, and crew counts always on screen
- **Mobile-first thinking** — built for browser, designed so app port is painless later

---

## 2. Authentication Flow

### Guest → Signed In Journey
1. Player lands on site → immediately starts playing (no gate)
2. After **~3 minutes** of play → soft modal appears:
   > *"Don't lose your progress! Sign in to save your rats, crew and coins."*
   > [Sign in with Google] [Sign in with Email] [Connect Wallet] [Maybe later]
3. On **close/tab change** → prompt appears if not signed in:
   > *"Save your progress before you go?"*
4. **Settings menu** always has sign-in option visible
5. **Persistent CTA button** in top UI bar (small, non-intrusive): "Sign in to save" — disappears once signed in

### Sign-in Methods (V1)
- Google OAuth
- Email + password (with email verification)
- Wallet connect (MetaMask, WalletConnect)

### Guest State
- Game is fully playable as guest
- Progress saved to localStorage as fallback
- On sign-in: guest progress merges into new account
- Warning shown if guest tries to clear browser data

---

## 3. Screen Map

### 3.1 Main Game Screen (primary)
The only screen players spend 90% of time on.

**Layout zones:**
```
┌─────────────────────────────────────────┐
│ TOP BAR: Coins | EXP/Level | Shop | Settings │
│─────────────────────────────────────────│
│                                         │
│   NPC STREAM (left → right)             │
│   [npcs skating, loot items glowing]    │
│                                         │
│─────────────────────────────────────────│
│  YOUR RAT    │  SLUDGE POOL (clickable) │  DIVE CREW
│  portrait    │  [tap to scavenge]       │  panel
│  name/level  │                          │  (right)
│  gear count  │                          │
│  [Send Base] │                          │
│  [Sell ◎380] │                          │
└─────────────────────────────────────────┘
```

**Persistent UI elements:**
- Coin counter (top left)
- Account level + EXP bar (top left)
- Shop button (top)
- Sign in CTA (top right, guests only)
- Settings icon (top right)
- Community feed/chat toggle (right edge)
- Items panel toggle (left edge)

### 3.2 Base Screen
- Grid of up to 10 saved rats
- Each rat shows full outfit + name + sell value
- Actions: Equip (make active), Sell, Rename, View traits
- Trait swap between rats (costs coins)

### 3.3 Shop Screen
- Tab navigation: Daily / Dice / Bells / Boosts / Tools / Premium
- Items shown as cards with icon, name, description, price
- Daily tab shows countdown timer to refresh
- Premium tab clearly marked with Token icon
- Purchased permanent items shown as "Owned"

### 3.4 Stats / Upgrade Screen
- Shows all 6 stats with current level
- EXP cost to next level shown
- Progress bar per stat
- Accessible via dedicated button or clicking stat in HUD

### 3.5 Crew Screen
- Scrapper at top (special — active clicker)
- Passive crew tiers below in order
- Each crew card shows: portrait, name, level, EXP/sec or click bonus, cost to next level
- Milestone skill tree visible per crew member (locked/unlocked states)
- Active skill button per crew (greyed if on cooldown)

### 3.6 Gallery / Codex
- All 15 trait slots across all 6 rarities
- Discovered traits shown in full colour
- Undiscovered shown as silhouette with "???"
- Completion percentage per slot and overall

### 3.7 Community Panel (slide-in from right)
- Live chat (top)
- Activity feed (middle) — recent drops, prestiges, achievements
- Drop announcements displayed as toasts globally

### 3.8 Settings
- Sign in / account management
- Sound on/off
- Notification preferences (which rarity bells are active)
- Reset guest progress option
- About / links

---

## 4. Key UX Moments

### First 30 seconds
- NPC stream immediately active, rats rolling by
- Sludge pool prompt: "TAP TO SCAVENGE"
- First NPC with a loot item appears within 10 seconds
- Click it → item equips → rat changes appearance → satisfying sound + animation
- No tutorial text — discovery through play

### First purchase
- After first sell: shop CTA pulses gently
- First shop item (Gutter Pup) is cheap and immediately impactful
- Buying it triggers: crew panel animates in, passive EXP counter appears

### Sign-in prompt (3 min mark)
- Appears as bottom sheet on mobile, modal on desktop
- Non-blocking — can dismiss easily
- Returns focus to game immediately after dismiss

### Prestige moment
- Special screen — not just a button
- Shows what you'll lose vs keep clearly
- Confirmation required
- Prestige animation plays (screen cracks, rebuilds, badge appears)

### Drop announcements
- Toast notification slides in from top
- Gold/animated for Legendary+
- Clickable — shows the item that dropped
- Auto-dismiss after 4 seconds

---

## 5. Mobile Considerations (Browser)

- All tap targets minimum 44×44px
- Sludge pool takes up significant screen real estate on mobile (easy to tap)
- NPC stream scrolls at a speed readable on small screens
- Bottom sheet pattern for modals on mobile
- Crew and stats panels slide up from bottom on mobile
- No hover-dependent interactions

---

## 6. Onboarding (No Tutorial — Discovery Model)

ScrapRat uses environmental onboarding only:
- Visual affordances (glowing NPCs, pulsing sludge pool prompt)
- First loot NPC appears quickly so the core action is discovered fast
- Tooltips on first visit to each screen (dismissible, never blocking)
- "What's this?" icon on any confusing UI element

> ❓ Consider: short 3-step intro overlay on very first load? (Skip always available)

---

*ScrapRat UX v0.1 — Core flows defined. Detailed wireframes to follow.*
