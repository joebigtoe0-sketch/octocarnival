-- ScrapRats — Initial Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---- Users ----
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT UNIQUE,
  password_hash   TEXT,
  google_id       TEXT UNIQUE,
  wallet_address  TEXT UNIQUE,
  username        TEXT NOT NULL DEFAULT 'Rat_' || substr(md5(random()::text), 1, 6),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- Player state ----
CREATE TABLE IF NOT EXISTS player_state (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  account_level     INTEGER NOT NULL DEFAULT 1,
  total_exp_ever    BIGINT  NOT NULL DEFAULT 0,
  current_exp       BIGINT  NOT NULL DEFAULT 0,
  level             INTEGER NOT NULL DEFAULT 1,
  coins             BIGINT  NOT NULL DEFAULT 50,
  prestige_level    INTEGER NOT NULL DEFAULT 0,
  prestige_multiplier NUMERIC(6,3) NOT NULL DEFAULT 1.0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- Player stats ----
CREATE TABLE IF NOT EXISTS player_stats (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  luck     INTEGER NOT NULL DEFAULT 0,
  rate     INTEGER NOT NULL DEFAULT 0,
  speed    INTEGER NOT NULL DEFAULT 0,
  greed    INTEGER NOT NULL DEFAULT 0,
  stealth  INTEGER NOT NULL DEFAULT 0,
  hoard    INTEGER NOT NULL DEFAULT 0
);

-- ---- Crew ----
CREATE TABLE IF NOT EXISTS crew (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  crew_type        TEXT NOT NULL,
  count            INTEGER NOT NULL DEFAULT 0,
  level            INTEGER NOT NULL DEFAULT 0,
  skills_unlocked  JSONB NOT NULL DEFAULT '[]',
  UNIQUE (user_id, crew_type)
);

-- ---- Trait definitions (seeded) ----
CREATE TABLE IF NOT EXISTS trait_definitions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot                  INTEGER NOT NULL,      -- 1–15
  slot_name             TEXT NOT NULL,
  rarity                TEXT NOT NULL,         -- default|common|uncommon|rare|epic|legendary|mythic
  name                  TEXT NOT NULL,
  coin_value            INTEGER NOT NULL DEFAULT 0,
  sprite_url            TEXT,
  is_prestige_only      BOOLEAN NOT NULL DEFAULT FALSE,
  min_prestige_required INTEGER NOT NULL DEFAULT 0,
  UNIQUE (slot, rarity)
);

-- ---- Rats ----
CREATE TABLE IF NOT EXISTS rats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT FALSE,
  in_base     BOOLEAN NOT NULL DEFAULT FALSE,
  sell_value  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- Rat traits (equipped) ----
CREATE TABLE IF NOT EXISTS rat_traits (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rat_id     UUID NOT NULL REFERENCES rats(id) ON DELETE CASCADE,
  slot       INTEGER NOT NULL,   -- 1–15
  trait_id   UUID NOT NULL REFERENCES trait_definitions(id),
  rarity     TEXT NOT NULL,
  UNIQUE (rat_id, slot)
);

-- ---- Shop purchases ----
CREATE TABLE IF NOT EXISTS shop_purchases (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_key     TEXT NOT NULL,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quantity     INTEGER NOT NULL DEFAULT 1,
  currency     TEXT NOT NULL,   -- coins|token
  amount_paid  INTEGER NOT NULL
);

-- ---- Achievements ----
CREATE TABLE IF NOT EXISTS achievements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, achievement_key)
);

-- ---- Chat messages ----
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  username   TEXT NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- Drop announcements ----
CREATE TABLE IF NOT EXISTS drop_announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username   TEXT NOT NULL,
  trait_id   UUID NOT NULL REFERENCES trait_definitions(id),
  rarity     TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rats_user       ON rats(user_id);
CREATE INDEX IF NOT EXISTS idx_rat_traits_rat  ON rat_traits(rat_id);
CREATE INDEX IF NOT EXISTS idx_crew_user       ON crew(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_created    ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drops_created   ON drop_announcements(created_at DESC);
