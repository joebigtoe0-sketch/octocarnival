-- Persist mint images/metadata in Postgres (Railway disk is ephemeral)

CREATE TABLE IF NOT EXISTS mint_asset_blobs (
  trait_fingerprint TEXT PRIMARY KEY,
  metadata_json   JSONB NOT NULL,
  image_png       BYTEA NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE minted_combinations
  ADD COLUMN IF NOT EXISTS traits_json JSONB;
