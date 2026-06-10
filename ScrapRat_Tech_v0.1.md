# ScrapRat — Technical Document
**Version:** 0.1
**Status:** 🟡 Architecture defined — stack decisions pending finalisation

---

## 1. Platform & Targets

- **V1:** Browser-based web app (desktop + mobile browser)
- **Post-V1:** Native mobile app (React Native recommended given web stack)
- **Design constraint:** All architecture decisions should make the app port non-painful

---

## 2. Recommended Tech Stack

### Frontend
| Layer | Choice | Reason |
|---|---|---|
| Framework | **React** | Component model suits game UI panels; large ecosystem; React Native path for app |
| Styling | **Tailwind CSS** | Fast iteration, utility-first, works well with pixel art game UIs |
| State management | **Zustand** | Lightweight, simple for game state (EXP, coins, crew, rats) |
| Animation | **Framer Motion** | NPC stream, trait reveals, prestige animations |
| Canvas/Game loop | **PixiJS** | Hardware-accelerated 2D rendering for NPC stream and sludge pool |

### Backend
| Layer | Choice | Reason |
|---|---|---|
| Runtime | **Node.js** | JS everywhere, fast iteration |
| Framework | **Express** or **Fastify** | Simple REST API for game actions |
| Realtime | **Socket.io** | Live chat, drop announcements, activity feed, Sewer Surge events |
| Auth | **Supabase Auth** | Google + Email + Wallet out of the box, free tier generous |

### Database
| Layer | Choice | Reason |
|---|---|---|
| Primary DB | **PostgreSQL** (via Supabase) | Relational, reliable, great for structured game data |
| Caching | **Redis** | Session state, leaderboards, active Sewer Surge state, rate limiting |

### Infrastructure
| Layer | Choice | Reason |
|---|---|---|
| Hosting (frontend) | **Vercel** | Zero-config deploys, edge CDN, free tier |
| Hosting (backend) | **Railway** or **Render** | Simple Node.js hosting, affordable |
| Database | **Supabase** | Managed Postgres + Auth + Realtime in one |
| File storage | **Supabase Storage** | Rat images, trait sprites |

---

## 3. Database Schema (Core Tables)

### users
```
id              uuid PK
email           text
google_id       text
wallet_address  text
username        text
created_at      timestamp
last_seen       timestamp
```

### player_state
```
id              uuid PK
user_id         uuid FK → users
account_level   integer
total_exp_ever  bigint
current_exp     bigint
coins           bigint
prestige_level  integer
prestige_count  integer
created_at      timestamp
updated_at      timestamp
```

### player_stats
```
id              uuid PK
user_id         uuid FK → users
luck            integer default 0
rate            integer default 0
speed           integer default 0
greed           integer default 0
stealth         integer default 0
hoard           integer default 0
```

### crew
```
id              uuid PK
user_id         uuid FK → users
crew_type       text  (scrapper | gutter_pup | mudlark | pipe_rat | sludge_baron | plague_knight)
level           integer
quantity        integer
skills_unlocked jsonb  (array of unlocked milestone skills)
```

### rats (active + base)
```
id              uuid PK
user_id         uuid FK → users
name            text
is_active       boolean
in_base         boolean
created_at      timestamp
sell_value      integer  (computed on save)
```

### rat_traits
```
id              uuid PK
rat_id          uuid FK → rats
slot            integer  (1-15)
trait_id        uuid FK → trait_definitions
rarity          text
```

### trait_definitions
```
id              uuid PK
slot            integer
name            text
rarity          text
coin_value      integer
sprite_url      text
description     text
is_prestige_only boolean
min_prestige_required integer
```

### shop_purchases
```
id              uuid PK
user_id         uuid FK → users
item_key        text
purchased_at    timestamp
quantity        integer
currency        text  (coins | token)
amount_paid     integer
```

### achievements
```
id              uuid PK
user_id         uuid FK → users
achievement_key text
unlocked_at     timestamp
```

### chat_messages
```
id              uuid PK
user_id         uuid FK → users
username        text
message         text
created_at      timestamp
```

### drop_announcements
```
id              uuid PK
user_id         uuid FK → users
username        text
trait_id        uuid FK → trait_definitions
rarity          text
created_at      timestamp
```

---

## 4. Key API Endpoints

### Auth
- `POST /auth/google` — Google OAuth
- `POST /auth/email` — Email sign up / login
- `POST /auth/wallet` — Wallet connect verify
- `POST /auth/guest-merge` — Merge guest localStorage state into new account

### Game State
- `GET /game/state` — Load full player state on login
- `POST /game/save` — Save current EXP, coins, stats (called periodically + on close)
- `POST /game/click` — Server-side EXP tick validation (anti-cheat)

### Crew
- `POST /crew/buy` — Purchase crew member
- `POST /crew/level` — Level up crew member
- `POST /crew/activate-skill` — Trigger active skill

### Rats & Traits
- `POST /rats/rob` — Claim trait from NPC
- `POST /rats/sell` — Sell active rat (enforces cooldown server-side)
- `POST /rats/send-to-base` — Move rat to base
- `POST /rats/swap-trait` — Swap trait between two base rats

### Shop
- `GET /shop/daily` — Get today's daily items
- `POST /shop/buy` — Purchase shop item

### Community
- Socket: `chat:message` — Send/receive chat
- Socket: `drop:announce` — Broadcast rare drop to all clients
- Socket: `surge:activate` — Sewer Surge event broadcast
- Socket: `surge:state` — Current surge active/inactive

---

## 5. Anti-Cheat Considerations

- EXP gains validated server-side (click rate capped, impossible values rejected)
- Sell cooldown enforced server-side (never trust client timer)
- Trait rarity rolls happen server-side only
- Rate limiting on all game action endpoints (Redis)
- Guest localStorage state sanitised before merge

---

## 6. Real-time Architecture

**Socket.io rooms:**
- `global` — all connected players (drop announcements, Sewer Surge)
- `user:{id}` — private room per player (personal notifications)

**Events:**
- `drop:legendary` → broadcast to global room
- `surge:start` / `surge:end` → broadcast to global room
- `chat:message` → broadcast to global room
- `achievement:unlocked` → send to user room

---

## 7. Saving Strategy

- **Active players:** Auto-save every 30 seconds via `POST /game/save`
- **On tab close:** `beforeunload` event triggers final save
- **Guest players:** Save to localStorage every 10 seconds
- **On sign-in:** Merge localStorage → database, clear localStorage

---

## 8. Performance Considerations

- NPC stream rendered in **PixiJS** (WebGL) — not DOM elements
- Sludge pool click handling in canvas, not HTML
- Chat capped at last 100 messages in memory
- Activity feed capped at last 50 events
- Trait sprites loaded as sprite sheets, not individual images
- Redis caches: active Sewer Surge state, daily shop items, recent drop announcements

---

## 9. Crypto / Token Integration (V1 Scope)

- Wallet connect via **WalletConnect v2** + **ethers.js**
- Token displayed in UI as simple coin icon (no crypto jargon)
- Coins → Token swap: fixed rate, processed via smart contract call
- Premium shop items: price in Token, payment triggers contract interaction
- **NFT minting: post-V1** — architecture should leave a clean hook for it

---

## 10. Post-V1 Tech Additions

- NFT minting (smart contract + IPFS metadata storage)
- Push notifications (PWA → app)
- Leaderboards (Redis sorted sets)
- Analytics (PostHog or Mixpanel)
- A/B testing on balance values

---

*ScrapRat Tech v0.1 — Architecture defined. Stack subject to revision before build starts.*
