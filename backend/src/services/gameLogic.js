const { query, getRedis } = require('../db');

function expNeed(level) {
  return Math.floor(80 * Math.pow(1.28, level - 1));
}

function statUpgradeCost(currentLevel) {
  return Math.floor(100 * Math.pow(1.5, currentLevel));
}

// Apply EXP gain, handle leveling up
async function applyExp(userId, amount) {
  const { rows: [state] } = await query(
    'SELECT current_exp, level, prestige_multiplier FROM player_state WHERE user_id=$1',
    [userId]
  );
  if (!state) throw new Error('Player state not found');

  const multiplied = Math.floor(amount * state.prestige_multiplier);
  let exp   = Number(state.current_exp) + multiplied;
  let level = Number(state.level);
  let need  = expNeed(level);
  while (exp >= need) { exp -= need; level++; need = expNeed(level); }

  await query(
    `UPDATE player_state
     SET current_exp=$1, level=$2, total_exp_ever=total_exp_ever+$3, updated_at=NOW()
     WHERE user_id=$4`,
    [exp, level, multiplied, userId]
  );
  return { exp, level };
}

// Upgrade a single stat
async function upgradeStat(userId, statName) {
  const ALLOWED = ['luck', 'rate', 'speed', 'greed', 'stealth', 'hoard'];
  if (!ALLOWED.includes(statName)) throw new Error('Invalid stat');

  const { rows: [stats]  } = await query('SELECT * FROM player_stats WHERE user_id=$1', [userId]);
  const { rows: [state]  } = await query('SELECT current_exp, level FROM player_state WHERE user_id=$1', [userId]);
  if (!stats || !state) throw new Error('Player not found');

  const currentLevel = stats[statName];
  const cost = statUpgradeCost(currentLevel);

  if (Number(state.current_exp) < cost) throw new Error('Not enough EXP');

  await query(`UPDATE player_stats SET ${statName}=${statName}+1 WHERE user_id=$1`, [userId]);
  await query(`UPDATE player_state SET current_exp=current_exp-$1 WHERE user_id=$2`, [cost, userId]);

  return { [statName]: currentLevel + 1 };
}

// Prestige a player
async function prestige(userId) {
  const { rows: [state] } = await query('SELECT * FROM player_state WHERE user_id=$1', [userId]);
  if (!state) throw new Error('Player not found');

  const newLevel      = Number(state.prestige_level) + 1;
  const multiplier    = 1 + newLevel * 0.1;

  await query(
    `UPDATE player_state
     SET current_exp=0, level=1, prestige_level=$1, prestige_multiplier=$2, updated_at=NOW()
     WHERE user_id=$3`,
    [newLevel, multiplier, userId]
  );
  await query(
    `UPDATE player_stats SET luck=0,rate=0,speed=0,greed=0,stealth=0,hoard=0 WHERE user_id=$1`,
    [userId]
  );
  await query(
    `UPDATE crew SET count=0, level=0, skills_unlocked='[]' WHERE user_id=$1`,
    [userId]
  );

  return { prestigeLevel: newLevel, prestigeMultiplier: multiplier };
}

// Save complete client game state as a JSON blob in the DB.
// This stores the entire Zustand partialize output so nothing is lost.
async function syncClientState(userId, blob) {
  await query(
    `UPDATE player_state SET save_blob=$1, updated_at=NOW() WHERE user_id=$2`,
    [JSON.stringify(blob), userId]
  );
}

// Load the saved JSON blob for a user. Returns null for new accounts.
async function loadClientState(userId) {
  const r = await query(`SELECT save_blob FROM player_state WHERE user_id=$1`, [userId]);
  return r.rows[0]?.save_blob ?? null;
}

module.exports = { applyExp, upgradeStat, prestige, syncClientState, loadClientState, expNeed, statUpgradeCost };
