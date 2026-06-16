const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const nacl    = require('tweetnacl');
const bs58    = require('../utils/bs58compat');
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

function buildWalletAuthMessage(walletAddress, nonce) {
  return [
    'ScrapRats wants you to sign in with your Solana wallet.',
    '',
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    '',
    'This request will not trigger a blockchain transaction or cost any SOL.',
  ].join('\n');
}

function verifyWalletSignature(message, signatureBase58, walletAddress) {
  try {
    const sig = bs58.decode(signatureBase58);
    const pub = bs58.decode(walletAddress);
    if (pub.length !== 32 || sig.length !== 64) return false;
    const msg = new TextEncoder().encode(message);
    return nacl.sign.detached.verify(msg, sig, pub);
  } catch {
    return false;
  }
}

function parseWalletAddress(address) {
  if (!address || typeof address !== 'string') return null;
  try {
    const bytes = bs58.decode(address.trim());
    if (bytes.length !== 32) return null;
    return bs58.encode(bytes);
  } catch {
    return null;
  }
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

// Solana wallet — step 1: issue sign-in challenge
router.post('/wallet/challenge', rl, async (req, res) => {
  try {
    const walletAddress = parseWalletAddress(req.body.walletAddress);
    if (!walletAddress) return res.status(400).json({ error: 'Invalid wallet address' });

    const nonce = crypto.randomBytes(16).toString('hex');
    const message = buildWalletAuthMessage(walletAddress, nonce);
    const challengeToken = jwt.sign(
      { purpose: 'wallet-auth', wallet: walletAddress, nonce },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.json({ message, challengeToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Solana wallet — step 2: verify signature, login or register
router.post('/wallet/login', rl, async (req, res) => {
  try {
    const { signature, challengeToken, username, register } = req.body;
    const walletAddress = parseWalletAddress(req.body.walletAddress);
    if (!walletAddress || !signature || !challengeToken) {
      return res.status(400).json({ error: 'walletAddress, signature, and challengeToken required' });
    }

    let payload;
    try {
      payload = jwt.verify(challengeToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Challenge expired — try again' });
    }
    if (payload.purpose !== 'wallet-auth' || payload.wallet !== walletAddress) {
      return res.status(401).json({ error: 'Invalid challenge' });
    }

    const message = buildWalletAuthMessage(walletAddress, payload.nonce);
    if (!verifyWalletSignature(message, signature, walletAddress)) {
      return res.status(401).json({ error: 'Invalid wallet signature' });
    }

    let { rows: [user] } = await query('SELECT * FROM users WHERE wallet_address=$1', [walletAddress]);

    if (!user) {
      if (register === false) {
        return res.status(404).json({ error: 'No account for this wallet — register first' });
      }
      const displayName = username?.trim().slice(0, 24)
        || `Rat_${walletAddress.slice(0, 4)}`;
      const ins = await query(
        `INSERT INTO users (wallet_address, username) VALUES ($1, $2) RETURNING *`,
        [walletAddress, displayName]
      );
      user = ins.rows[0];
      await ensurePlayerState(user.id);
    } else if (username?.trim()) {
      const trimmed = username.trim().slice(0, 24);
      const upd = await query(
        'UPDATE users SET username=$1 WHERE id=$2 RETURNING *',
        [trimmed, user.id]
      );
      user = upd.rows[0];
    }

    const authToken = makeToken(user.id);
    setCookie(res, authToken);
    res.json({ token: authToken, userId: user.id, username: user.username, walletAddress });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Wallet already linked to an account' });
    }
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
      'SELECT id, email, username, wallet_address, created_at FROM users WHERE id=$1', [req.user.sub]
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
