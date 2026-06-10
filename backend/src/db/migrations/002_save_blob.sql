-- Add JSON blob column for full client-side game state persistence
ALTER TABLE player_state ADD COLUMN IF NOT EXISTS save_blob JSONB;
