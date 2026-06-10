const express = require('express');
const auth    = require('../middleware/auth');
const { base: rl, clickLimit } = require('../middleware/rateLimit');
const { query }             = require('../db');
const { getNpcStream }      = require('../services/npcGenerator');
const { applyExp, upgradeStat, prestige, syncClientState, loadClientState } = require('../services/gameLogic');

const router = express.Router();
router.use(auth);

// GET /game/state — fetch full player state
router.get('/state', async (req, res) => {
  try {
    const uid = req.user.sub;
    const [stateR, statsR, crewR, ratsR] = await Promise.all([
      query('SELECT * FROM player_state WHERE user_id=$1', [uid]),
      query('SELECT * FROM player_stats WHERE user_id=$1', [uid]),
      query('SELECT * FROM crew WHERE user_id=$1', [uid]),
      query(`SELECT r.*, json_agg(rt.*) AS traits
             FROM rats r
             LEFT JOIN rat_traits rt ON rt.rat_id = r.id
             WHERE r.user_id=$1 GROUP BY r.id`, [uid]),
    ]);
    res.json({
      state:  stateR.rows[0],
      stats:  statsR.rows[0],
      crew:   crewR.rows,
      rats:   ratsR.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /game/npc-stream — batch of NPC configs for this player
router.get('/npc-stream', rl, async (req, res) => {
  try {
    const uid    = req.user.sub;
    const { rows: [stats]  } = await query('SELECT * FROM player_stats WHERE user_id=$1', [uid]);
    const { rows: [state]  } = await query('SELECT prestige_level FROM player_state WHERE user_id=$1', [uid]);
    const npcs = await getNpcStream(uid, stats || {}, state?.prestige_level || 0);
    res.json(npcs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /game/upgrade-stat
router.post('/upgrade-stat', rl, async (req, res) => {
  try {
    const { stat } = req.body;
    const result   = await upgradeStat(req.user.sub, stat);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /game/scavenge (validated pool click)
router.post('/scavenge', clickLimit, async (req, res) => {
  try {
    const uid = req.user.sub;
    const { rows: [state] } = await query('SELECT level FROM player_state WHERE user_id=$1', [uid]);
    const { rows: [crewR] } = await query("SELECT level FROM crew WHERE user_id=$1 AND crew_type='scrapper'", [uid]);
    const level       = Number(state?.level || 1);
    const scrapperLv  = Number(crewR?.level || 0);
    const expGain     = 2 + level + scrapperLv;
    const coinGain    = 2 + Math.floor(level / 3);
    await applyExp(uid, expGain);
    await query('UPDATE player_state SET coins=coins+$1 WHERE user_id=$2', [coinGain, uid]);
    res.json({ expGain, coinGain });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /game/prestige
router.post('/prestige', rl, async (req, res) => {
  try {
    const result = await prestige(req.user.sub);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /game/save — persist full client state blob to DB
router.post('/save', rl, async (req, res) => {
  try {
    await syncClientState(req.user.sub, req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /game/blob — load the saved client state blob (null for new accounts)
router.get('/blob', rl, async (req, res) => {
  try {
    const blob = await loadClientState(req.user.sub);
    res.json({ blob });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
