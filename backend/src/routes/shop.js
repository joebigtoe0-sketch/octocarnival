const express = require('express');
const auth    = require('../middleware/auth');
const { base: rl } = require('../middleware/rateLimit');
const { query, getRedis } = require('../db');

const router = express.Router();
router.use(auth);

// Daily items seeded per day (simple rotation)
function getDailyItems() {
  const day = new Date().toISOString().slice(0, 10);
  // Deterministic daily seed — real implementation would use a DB-seeded pool
  return [
    { key: 'daily_luck',  name: 'Sewer Luck Charm', desc: '+2 Luck for 10 min', price: 150, currency: 'coins' },
    { key: 'daily_rush',  name: 'Scrap Rush',        desc: '2× pool EXP for 5 min', price: 200, currency: 'coins' },
  ];
}

// GET /shop/daily
router.get('/daily', rl, async (req, res) => {
  try {
    const redis = getRedis();
    const key   = 'shop:daily';
    const cached = await redis.get(key).catch(() => null);
    if (cached) return res.json(JSON.parse(cached));
    const items = getDailyItems();
    await redis.setex(key, 86400, JSON.stringify(items)).catch(() => {});
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /shop/buy
router.post('/buy', rl, async (req, res) => {
  try {
    const uid = req.user.sub;
    const { itemKey, quantity = 1 } = req.body;

    // Item catalogue (minimal — expand later)
    const ITEMS = {
      daily_luck:  { price: 150, currency: 'coins' },
      daily_rush:  { price: 200, currency: 'coins' },
      dice_common: { price: 50,  currency: 'coins' },
      dice_uncommon: { price: 180, currency: 'coins' },
      dice_rare:   { price: 600, currency: 'coins' },
      dice_epic:   { price: 2500,currency: 'coins' },
    };
    const item = ITEMS[itemKey];
    if (!item) return res.status(404).json({ error: 'Unknown item' });

    const total = item.price * quantity;
    if (item.currency === 'coins') {
      const { rows: [state] } = await query('SELECT coins FROM player_state WHERE user_id=$1', [uid]);
      if (!state || Number(state.coins) < total) return res.status(400).json({ error: 'Not enough coins' });
      await query('UPDATE player_state SET coins=coins-$1 WHERE user_id=$2', [total, uid]);
    }
    // Token purchases TBD (crypto integration phase)

    await query(
      `INSERT INTO shop_purchases (user_id, item_key, quantity, currency, amount_paid) VALUES ($1,$2,$3,$4,$5)`,
      [uid, itemKey, quantity, item.currency, total]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
