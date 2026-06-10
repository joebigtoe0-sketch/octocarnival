const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { query }  = require('../db');
const auth       = require('../middleware/auth');
const { base: rl } = require('../middleware/rateLimit');
const { syncClientState } = require('../services/gameLogic');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function makeToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

function setCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax', // cross-domain on Railway
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

async function ensurePlayerState(userId) {
  await query(
    `INSERT INTO player_state (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
  await query(
    `INSERT INTO player_stats (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
}

// Google OAuth
router.post('/google', rl, async (req, res) => {
  try {
    const { token } = req.body;
    const ticket  = await googleClient.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { sub: googleId, email } = payload;

    const { name: googleName } = payload;
    let { rows: [user] } = await query('SELECT * FROM users WHERE google_id=$1', [googleId]);
    if (!user) {
      const fallbackName = googleName?.split(' ')[0] || email.split('@')[0];
      const ins = await query(
        `INSERT INTO users (google_id, email, username) VALUES ($1, $2, $3)
         ON CONFLICT (email) DO UPDATE SET google_id=$1 RETURNING *`,
        [googleId, email, fallbackName]
      );
      user = ins.rows[0];
    }
    await ensurePlayerState(user.id);
    const authToken = makeToken(user.id);
    setCookie(res, authToken);
    res.json({ token: authToken, userId: user.id, username: user.username });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Email auth (register / login)
router.post('/email', rl, async (req, res) => {
  try {
    const { email, password, register, username } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    let { rows: [user] } = await query('SELECT * FROM users WHERE email=$1', [email]);

    if (register) {
      if (user) return res.status(409).json({ error: 'Email already in use' });
      const hash = await bcrypt.hash(password, 10);
      const displayName = username?.trim().slice(0, 24) || email.split('@')[0];
      const ins = await query(
        `INSERT INTO users (email, password_hash, username) VALUES ($1,$2,$3) RETURNING *`,
        [email, hash, displayName]
      );
      user = ins.rows[0];
      await ensurePlayerState(user.id);
    } else {
      if (!user) return res.status(404).json({ error: 'User not found' });
      const ok = await bcrypt.compare(password, user.password_hash || '');
      if (!ok) return res.status(401).json({ error: 'Wrong password' });
    }

    const authToken = makeToken(user.id);
    setCookie(res, authToken);
    res.json({ token: authToken, userId: user.id, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Guest merge
router.post('/guest-merge', auth, async (req, res) => {
  try {
    const { saveData } = req.body;
    if (saveData) await syncClientState(req.user.sub, saveData);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const { rows: [user] } = await query(
      'SELECT id, email, username, created_at FROM users WHERE id=$1', [req.user.sub]
    );
    res.json(user || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

module.exports = router;
