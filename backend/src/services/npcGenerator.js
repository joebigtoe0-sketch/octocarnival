const { getRedis }      = require('../db');
const { generateNpcBatch } = require('./traitRoller');

const NPC_TTL = 20; // seconds — NPC is valid for 20s after being served

// Generate and cache a batch of NPCs for a player
async function getNpcStream(userId, stats, prestigeLevel) {
  const redis = getRedis();
  const key   = `npc:stream:${userId}`;

  // Check if player already has a cached batch
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const { luck = 0, rate = 0, speed = 0 } = stats;
  const npcs = await generateNpcBatch(7, luck, rate, speed, prestigeLevel);

  // Cache for 30 seconds
  await redis.setex(key, 30, JSON.stringify(npcs));

  // Set TTL keys for each loot NPC so rob endpoint can validate timing
  for (const npc of npcs) {
    if (npc.hasLoot) {
      await redis.setex(`npc:loot:${userId}:${npc.id}`, NPC_TTL + npc.position * 2, JSON.stringify(npc.loot));
    }
  }

  return npcs;
}

// Validate that an NPC's loot is still claimable (NPC is on-screen)
async function claimNpcLoot(userId, npcId) {
  const redis  = getRedis();
  const key    = `npc:loot:${userId}:${npcId}`;
  const cached = await redis.get(key);
  if (!cached) return null; // NPC passed, loot expired
  const loot = JSON.parse(cached);
  await redis.del(key);
  return loot;
}

module.exports = { getNpcStream, claimNpcLoot };
