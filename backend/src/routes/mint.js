require('dotenv').config();
const express = require('express');
const path    = require('path');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../db');
const auth = require('../middleware/auth');
const { base: rl } = require('../middleware/rateLimit');
const { traitFingerprint } = require('../utils/traitFingerprint');
const { prepareMintMetadata, MINTS_DIR } = require('../services/ratMetadata');
const {
  buildBurnTransaction,
  buildMintTransaction,
  verifyBurnTransaction,
  verifyMintTransaction,
} = require('../services/metaplexMint');
const { fetchTokenBalance, DEFAULT_MINT } = require('../utils/tokenBalance');

const router = express.Router();

const RESERVATION_TTL_MS = 5 * 60 * 1000;

function baseUrl(req) {
  if (process.env.PUBLIC_BACKEND_URL) return process.env.PUBLIC_BACKEND_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host  = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}`;
}

async function purgeExpiredReservations() {
  await query('DELETE FROM mint_reservations WHERE expires_at < NOW()');
}

// Serve mint metadata + images
router.get('/assets/:fingerprint/:file', (req, res) => {
  const { fingerprint, file } = req.params;
  if (!/^[a-f0-9]{64}$/.test(fingerprint)) return res.status(400).json({ error: 'Invalid fingerprint' });
  if (!['metadata.json', 'image.png'].includes(file)) return res.status(404).json({ error: 'Not found' });

  const filePath = path.join(MINTS_DIR, fingerprint, file);
  res.sendFile(filePath, err => {
    if (err) res.status(404).json({ error: 'Asset not found' });
  });
});

router.get('/balance/:wallet', rl, async (req, res) => {
  try {
    const { wallet } = req.params;
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet)) {
      return res.status(400).json({ error: 'Invalid wallet address' });
    }
    const mint = process.env.SCRAP_MINT_ADDRESS || DEFAULT_MINT;
    const balance = await fetchTokenBalance(wallet, mint);
    res.json({ balance, mint });
  } catch (e) {
    console.error('[mint/balance]', e.message);
    res.status(500).json({ error: 'Could not fetch token balance' });
  }
});

router.post('/check', rl, async (req, res) => {
  try {
    const { traits } = req.body;
    if (!Array.isArray(traits) || traits.filter(Boolean).length === 0) {
      return res.status(400).json({ error: 'Rat must have at least one trait' });
    }

    const fingerprint = traitFingerprint(traits);
    await purgeExpiredReservations();

    const { rows: [minted] } = await query(
      'SELECT mint_address, metadata_uri, minted_at FROM minted_combinations WHERE trait_fingerprint=$1',
      [fingerprint]
    );

    if (minted) {
      return res.json({
        available:         false,
        fingerprint,
        mintAddress:       minted.mint_address,
        metadataUri:       minted.metadata_uri,
        mintedAt:          minted.minted_at,
      });
    }

    const { rows: [held] } = await query(
      `SELECT reservation_id, expires_at FROM mint_reservations
       WHERE trait_fingerprint=$1 AND expires_at > NOW() LIMIT 1`,
      [fingerprint]
    );

    res.json({
      available:    !held,
      fingerprint,
      reserved:     !!held,
      reservationId: held?.reservation_id,
      expiresAt:    held?.expires_at,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reserve', auth, rl, async (req, res) => {
  try {
    const { traits, ratId, ratName } = req.body;
    const userId = req.user.sub;

    if (!ratId || !Array.isArray(traits) || traits.filter(Boolean).length === 0) {
      return res.status(400).json({ error: 'ratId and traits required' });
    }

    const fingerprint = traitFingerprint(traits);
    await purgeExpiredReservations();

    const { rows: [existing] } = await query(
      'SELECT mint_address FROM minted_combinations WHERE trait_fingerprint=$1',
      [fingerprint]
    );
    if (existing) {
      return res.status(409).json({ error: 'This trait combination is already minted', mintAddress: existing.mint_address });
    }

    const { rows: [activeHold] } = await query(
      `SELECT reservation_id, user_id FROM mint_reservations
       WHERE trait_fingerprint=$1 AND expires_at > NOW() LIMIT 1`,
      [fingerprint]
    );
    if (activeHold && activeHold.user_id !== userId) {
      return res.status(409).json({ error: 'This combo is reserved by another player — try again shortly' });
    }

    const expiresAt = new Date(Date.now() + RESERVATION_TTL_MS);
    const rat = { id: ratId, name: ratName || 'ScrapRat', traits };
    const { metadataUri, imageUri } = await prepareMintMetadata(rat, fingerprint, baseUrl(req));

    let reservationId;
    if (activeHold) {
      reservationId = activeHold.reservation_id;
      await query(
        `UPDATE mint_reservations
         SET rat_id=$1, rat_name=$2, traits_json=$3, metadata_uri=$4, image_uri=$5, expires_at=$6
         WHERE reservation_id=$7`,
        [ratId, ratName, JSON.stringify(traits), metadataUri, imageUri, expiresAt, reservationId]
      );
    } else {
      reservationId = uuidv4();
      await query(
        `INSERT INTO mint_reservations
         (reservation_id, trait_fingerprint, user_id, rat_id, rat_name, traits_json, metadata_uri, image_uri, expires_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [reservationId, fingerprint, userId, ratId, ratName, JSON.stringify(traits), metadataUri, imageUri, expiresAt]
      );
    }

    res.json({
      reservationId,
      fingerprint,
      metadataUri,
      imageUri,
      expiresAt,
      burnAmount: Number(process.env.MINT_BURN_AMOUNT || 10000),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/build', auth, rl, async (req, res) => {
  try {
    const { reservationId, walletAddress, completedBurnSignature } = req.body;
    const userId = req.user.sub;

    if (!reservationId || !walletAddress) {
      return res.status(400).json({ error: 'reservationId and walletAddress required' });
    }

    const { rows: [reservation] } = await query(
      `SELECT * FROM mint_reservations WHERE reservation_id=$1 AND user_id=$2`,
      [reservationId, userId]
    );
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    if (new Date(reservation.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Reservation expired — start again' });
    }

    const displayName = `ScrapRat — ${reservation.rat_name || 'Unnamed'}`;
    const mintName    = displayName.slice(0, 32);

    let burn = null;
    if (completedBurnSignature) {
      await verifyBurnTransaction(completedBurnSignature, walletAddress);
    } else {
      burn = await buildBurnTransaction(walletAddress);
    }

    const mint = await buildMintTransaction({
      walletAddress,
      metadataUri:    reservation.metadata_uri,
      name:           mintName,
      assetSecretKey: reservation.asset_secret,
    });

    if (!reservation.asset_pubkey) {
      await query(
        'UPDATE mint_reservations SET asset_pubkey=$1, asset_secret=$2 WHERE reservation_id=$3',
        [mint.assetAddress, mint.assetSecret, reservationId]
      );
    }

    res.json({
      skipBurn:             !!completedBurnSignature,
      burnTransaction:      burn?.transaction ?? null,
      mintTransaction:      mint.transaction,
      assetAddress:         mint.assetAddress,
      burnBlockhash:        burn?.blockhash ?? null,
      burnLastValidHeight:  burn?.lastValidBlockHeight ?? null,
      mintBlockhash:        mint.blockhash,
      mintLastValidHeight:  mint.lastValidBlockHeight,
      burnAmount:           Number(process.env.MINT_BURN_AMOUNT || 10000),
      metadataUri:          reservation.metadata_uri,
      fingerprint:          reservation.trait_fingerprint,
    });
  } catch (err) {
    console.error('[mint/build]', err);
    res.status(500).json({ error: err.message || err.name || 'Mint build failed' });
  }
});

router.post('/confirm', auth, rl, async (req, res) => {
  try {
    const { reservationId, burnSignature, mintSignature, walletAddress } = req.body;
    const userId = req.user.sub;

    if (!reservationId || !burnSignature || !mintSignature || !walletAddress) {
      return res.status(400).json({ error: 'reservationId, burnSignature, mintSignature, walletAddress required' });
    }

    const { rows: [reservation] } = await query(
      `SELECT * FROM mint_reservations WHERE reservation_id=$1 AND user_id=$2`,
      [reservationId, userId]
    );
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    if (!reservation.asset_pubkey) return res.status(400).json({ error: 'Build step required before confirm' });

    await verifyBurnTransaction(burnSignature, walletAddress);
    await verifyMintTransaction(mintSignature, reservation.asset_pubkey);

    const { rows: [dup] } = await query(
      'SELECT mint_address FROM minted_combinations WHERE trait_fingerprint=$1',
      [reservation.trait_fingerprint]
    );
    if (dup) {
      return res.status(409).json({ error: 'Already minted', mintAddress: dup.mint_address });
    }

    const ins = await query(
      `INSERT INTO minted_combinations
       (trait_fingerprint, mint_address, metadata_uri, image_uri, minter_wallet, rat_id, user_id, burn_tx, mint_tx)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        reservation.trait_fingerprint,
        reservation.asset_pubkey,
        reservation.metadata_uri,
        reservation.image_uri,
        walletAddress,
        reservation.rat_id,
        userId,
        burnSignature,
        mintSignature,
      ]
    );

    await query('DELETE FROM mint_reservations WHERE reservation_id=$1', [reservationId]);
    await query(
      'UPDATE users SET wallet_address=$1 WHERE id=$2 AND (wallet_address IS NULL OR wallet_address=$1)',
      [walletAddress, userId]
    );

    const record = ins.rows[0];
    res.json({
      mintAddress:  record.mint_address,
      metadataUri:  record.metadata_uri,
      imageUri:     record.image_uri,
      fingerprint:  record.trait_fingerprint,
      mintedAt:     record.minted_at,
      burnTx:       record.burn_tx,
      mintTx:       record.mint_tx,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
