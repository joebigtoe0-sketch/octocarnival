const express = require('express');
const auth    = require('../middleware/auth');
const { base: rl } = require('../middleware/rateLimit');
const { query, getRedis } = require('../db');
const { claimNpcLoot }    = require('../services/npcGenerator');

const router = express.Router();
router.use(auth);

const SELL_COOLDOWN = 60; // seconds per charge

// POST /rats/rob — claim trait from NPC
router.post('/rob', rl, async (req, res) => {
  try {
    const uid   = req.user.sub;
    const { npcId } = req.body;

    const loot = await claimNpcLoot(uid, npcId);
    if (!loot) return res.status(410).json({ error: 'NPC has left the screen or already robbed' });

    // Find active rat
    const { rows: [rat] } = await query(
      `SELECT * FROM rats WHERE user_id=$1 AND is_active=TRUE LIMIT 1`,
      [uid]
    );
    if (!rat) return res.status(404).json({ error: 'No active rat' });

    // Find trait_def
    const { rows: [traitDef] } = await query(
      'SELECT * FROM trait_definitions WHERE slot=$1 AND rarity=$2',
      [loot.lootSlot, loot.rarity]
    );
    if (!traitDef) return res.status(500).json({ error: 'Trait definition not found' });

    // Upsert rat_trait in that slot
    await query(
      `INSERT INTO rat_traits (rat_id, slot, trait_id, rarity)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (rat_id, slot) DO UPDATE SET trait_id=$3, rarity=$4`,
      [rat.id, loot.lootSlot, traitDef.id, loot.rarity]
    );

    // Broadcast epic+ drops via socket
    if (['epic','legendary','mythic'].includes(loot.rarity)) {
      const { rows: [user] } = await query('SELECT username FROM users WHERE id=$1', [uid]);
      const redis = getRedis();
      await redis.publish('drop:announce', JSON.stringify({
        userId: uid, username: user?.username, rarity: loot.rarity,
        traitName: loot.name, slotName: loot.slotName,
      }));
    }

    res.json({ loot, traitDef });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /rats/sell — sell active rat (charges enforced via Redis)
router.post('/sell', rl, async (req, res) => {
  try {
    const uid   = req.user.sub;
    const redis = getRedis();
    const key   = `sell:charges:${uid}`;

    let charges = Number(await redis.get(key) || 5);
    if (charges < 1) return res.status(429).json({ error: 'No sell charges remaining' });

    const { rows: [rat] } = await query(
      `SELECT r.*, json_agg(rt.*) AS traits
       FROM rats r LEFT JOIN rat_traits rt ON rt.rat_id=r.id
       WHERE r.user_id=$1 AND r.is_active=TRUE GROUP BY r.id`,
      [uid]
    );
    if (!rat) return res.status(404).json({ error: 'No active rat' });

    // Calculate sell value
    let sellValue = 0;
    if (rat.traits && rat.traits[0]) {
      for (const t of rat.traits) {
        const { rows: [td] } = await query('SELECT coin_value FROM trait_definitions WHERE id=$1', [t.trait_id]);
        sellValue += Number(td?.coin_value || 0);
      }
    }
    sellValue = Math.max(20, sellValue);

    // Apply greed bonus
    const { rows: [stats] } = await query('SELECT greed FROM player_stats WHERE user_id=$1', [uid]);
    sellValue = Math.floor(sellValue * (1 + (stats?.greed || 0) * 0.05));

    // Remove rat traits + reset rat
    await query('DELETE FROM rat_traits WHERE rat_id=$1', [rat.id]);
    await query('UPDATE player_state SET coins=coins+$1 WHERE user_id=$2', [sellValue, uid]);

    // Decrement charge (stored as float to allow fractional)
    charges = Math.max(0, charges - 1);
    await redis.setex(key, 3600, charges.toString());

    res.json({ sellValue, newCharges: charges });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /rats/send-to-base
router.post('/send-to-base', rl, async (req, res) => {
  try {
    const uid = req.user.sub;
    const { rows: [stats] } = await query('SELECT hoard FROM player_stats WHERE user_id=$1', [uid]);
    const maxBase = 10 + (stats?.hoard || 0) * 2;
    const { rows: baseRats } = await query('SELECT id FROM rats WHERE user_id=$1 AND in_base=TRUE', [uid]);
    if (baseRats.length >= maxBase) return res.status(400).json({ error: 'Base is full' });

    const { rows: [rat] } = await query('SELECT id FROM rats WHERE user_id=$1 AND is_active=TRUE', [uid]);
    if (!rat) return res.status(404).json({ error: 'No active rat' });

    await query('UPDATE rats SET in_base=TRUE, is_active=FALSE WHERE id=$1', [rat.id]);
    // Create fresh active rat
    const ins = await query(
      `INSERT INTO rats (user_id, name, is_active, in_base) VALUES ($1,'GRIMLOOT',TRUE,FALSE) RETURNING *`,
      [uid]
    );
    res.json({ ok: true, newRatId: ins.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /rats/equip — make a base rat the active one
router.post('/equip', rl, async (req, res) => {
  try {
    const uid = req.user.sub;
    const { ratId } = req.body;
    // Swap active and base
    await query('UPDATE rats SET is_active=FALSE WHERE user_id=$1 AND is_active=TRUE', [uid]);
    await query('UPDATE rats SET is_active=TRUE, in_base=FALSE WHERE id=$1 AND user_id=$2', [ratId, uid]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /rats/sell-base
router.post('/sell-base', rl, async (req, res) => {
  try {
    const uid = req.user.sub;
    const { ratId } = req.body;
    // Get traits and calc value
    const { rows: traits } = await query(
      `SELECT rt.*, td.coin_value FROM rat_traits rt JOIN trait_definitions td ON td.id=rt.trait_id WHERE rt.rat_id=$1`,
      [ratId]
    );
    const { rows: [stats] } = await query('SELECT greed FROM player_stats WHERE user_id=$1', [uid]);
    let value = traits.reduce((s, t) => s + Number(t.coin_value), 0);
    value = Math.max(20, Math.floor(value * (1 + (stats?.greed || 0) * 0.05)));
    await query('DELETE FROM rats WHERE id=$1 AND user_id=$2', [ratId, uid]);
    await query('UPDATE player_state SET coins=coins+$1 WHERE user_id=$2', [value, uid]);
    res.json({ ok: true, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
