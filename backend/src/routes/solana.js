const express = require('express');
const { base: rl } = require('../middleware/rateLimit');

const router = express.Router();

/** Methods the wallet adapter + mint flow need — nothing else is forwarded. */
const ALLOWED_METHODS = new Set([
  'getAccountInfo',
  'getBalance',
  'getBlockHeight',
  'getEpochInfo',
  'getGenesisHash',
  'getHealth',
  'getLatestBlockhash',
  'getMinimumBalanceForRentExemption',
  'getMultipleAccounts',
  'getParsedAccountInfo',
  'getParsedTokenAccountsByOwner',
  'getProgramAccounts',
  'getSignatureStatuses',
  'getSlot',
  'getTokenAccountBalance',
  'getTransaction',
  'getVersion',
  'isBlockhashValid',
  'sendTransaction',
  'simulateTransaction',
  'getFeeForMessage',
]);

function allMethodsAllowed(body) {
  const batch = Array.isArray(body) ? body : [body];
  if (!batch.length || batch.some(r => !r || typeof r.method !== 'string')) return false;
  return batch.every(r => ALLOWED_METHODS.has(r.method));
}

router.post('/rpc', rl, async (req, res) => {
  const upstream = process.env.SOLANA_RPC_URL;
  if (!upstream) {
    return res.status(503).json({ jsonrpc: '2.0', error: { code: -32000, message: 'RPC not configured' }, id: req.body?.id ?? null });
  }

  if (!allMethodsAllowed(req.body)) {
    return res.status(403).json({ jsonrpc: '2.0', error: { code: -32000, message: 'RPC method not allowed' }, id: req.body?.id ?? null });
  }

  try {
    const upstreamRes = await fetch(upstream, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(req.body),
    });
    const data = await upstreamRes.json();
    res.status(upstreamRes.status).json(data);
  } catch (err) {
    console.error('[solana/rpc]', err.message);
    res.status(502).json({ jsonrpc: '2.0', error: { code: -32000, message: 'RPC upstream failed' }, id: req.body?.id ?? null });
  }
});

module.exports = router;
