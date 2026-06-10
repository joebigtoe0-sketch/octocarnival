const express = require('express');
const auth    = require('../middleware/auth');
const { base: rl } = require('../middleware/rateLimit');
const { query } = require('../db');

const router = express.Router();
router.use(auth);

const CREW_DEFS = [
  { id: 'scrapper',      type: 'active',  baseCost: 50,    costMul: 1.5  },
  { id: 'gutter_pup',   type: 'passive', baseCost: 25,    costMul: 1.18 },
  { id: 'mudlark',      type: 'passive', baseCost: 160,   costMul: 1.20 },
  { id: 'pipe_rat',     type: 'passive', baseCost: 900,   costMul: 1.22 },
  { id: 'sludge_baron', type: 'passive', baseCost: 5000,  costMul: 1.24 },
  { id: 'plague_knight',type: 'passive', baseCost: 25000, costMul: 1.26 },
];
const CREW_MAP = Object.fromEntries(CREW_DEFS.map(c => [c.id, c]));

function crewCost(def, countOrLevel) {
  return Math.floor(def.baseCost * Math.pow(def.costMul, countOrLevel));
}

// POST /crew/buy — buy one passive crew unit
router.post('/buy', rl, async (req, res) => {
  try {
    const uid = req.user.sub;
    const { crewId } = req.body;
    const def = CREW_MAP[crewId];
    if (!def || def.type !== 'passive') return res.status(400).json({ error: 'Invalid crew type' });

    let { rows: [crew] } = await query(
      `SELECT * FROM crew WHERE user_id=$1 AND crew_type=$2`, [uid, crewId]
    );
    const count = crew ? Number(crew.count) : 0;
    const cost  = crewCost(def, count);

    const { rows: [state] } = await query('SELECT coins FROM player_state WHERE user_id=$1', [uid]);
    if (!state || Number(state.coins) < cost) return res.status(400).json({ error: 'Not enough coins' });

    await query('UPDATE player_state SET coins=coins-$1 WHERE user_id=$2', [cost, uid]);
    await query(
      `INSERT INTO crew (user_id, crew_type, count) VALUES ($1,$2,1)
       ON CONFLICT (user_id, crew_type) DO UPDATE SET count=crew.count+1`,
      [uid, crewId]
    );
    res.json({ ok: true, count: count + 1, cost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /crew/level — level up scrapper
router.post('/level', rl, async (req, res) => {
  try {
    const uid    = req.user.sub;
    const { crewId } = req.body;
    const def = CREW_MAP[crewId];
    if (!def || def.type !== 'active') return res.status(400).json({ error: 'Only active crew can be leveled' });

    let { rows: [crew] } = await query(
      `SELECT * FROM crew WHERE user_id=$1 AND crew_type=$2`, [uid, crewId]
    );
    const currentLevel = crew ? Number(crew.level) : 0;
    const cost         = crewCost(def, currentLevel);

    const { rows: [state] } = await query('SELECT coins FROM player_state WHERE user_id=$1', [uid]);
    if (!state || Number(state.coins) < cost) return res.status(400).json({ error: 'Not enough coins' });

    const newLevel = currentLevel + 1;
    const skills   = crew?.skills_unlocked || [];
    if ([10, 25, 50].includes(newLevel)) skills.push(newLevel);

    await query('UPDATE player_state SET coins=coins-$1 WHERE user_id=$2', [cost, uid]);
    await query(
      `INSERT INTO crew (user_id, crew_type, level, skills_unlocked) VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, crew_type) DO UPDATE SET level=$3, skills_unlocked=$4`,
      [uid, crewId, newLevel, JSON.stringify(skills)]
    );
    res.json({ ok: true, level: newLevel, skills });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
