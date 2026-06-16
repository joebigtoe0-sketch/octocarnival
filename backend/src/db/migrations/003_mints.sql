-- NFT mint registry: global uniqueness per trait combination

CREATE TABLE IF NOT EXISTS minted_combinations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trait_fingerprint TEXT NOT NULL UNIQUE,
  mint_address      TEXT NOT NULL,
  metadata_uri      TEXT NOT NULL,
  image_uri         TEXT,
  minter_wallet     TEXT NOT NULL,
  rat_id            TEXT,
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  burn_tx           TEXT,
  mint_tx           TEXT,
  minted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mint_reservations (
  reservation_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trait_fingerprint TEXT NOT NULL,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rat_id            TEXT NOT NULL,
  rat_name          TEXT,
  traits_json       JSONB NOT NULL,
  asset_pubkey      TEXT,
  asset_secret      TEXT,
  metadata_uri      TEXT,
  image_uri         TEXT,
  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mint_reservations_fingerprint ON mint_reservations(trait_fingerprint);
CREATE INDEX IF NOT EXISTS idx_mint_reservations_expires ON mint_reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_minted_combinations_wallet ON minted_combinations(minter_wallet);
