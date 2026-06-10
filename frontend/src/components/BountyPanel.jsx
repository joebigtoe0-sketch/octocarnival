import React, { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore.js';
import { RARITY_COLORS }  from '../constants/traits.js';
import { getTraitSpriteUrl } from './RatSprite.jsx';
import { playSound } from '../audio.js';

// ── helpers ───────────────────────────────────────────────────────────────────
function toCroppedUrl(url) {
  return url ? url.replace('/assets/sprites/', '/assets/sprites/cropped/') : url;
}

function useCountdown(resetAt) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    function tick() {
      const ms = (resetAt || 0) - Date.now();
      if (ms <= 0) { setLabel('Resetting…'); return; }
      const h  = Math.floor(ms / 3_600_000);
      const m  = Math.floor((ms % 3_600_000) / 60_000);
      const s  = Math.floor((ms % 60_000) / 1_000);
      setLabel(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    }
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [resetAt]);
  return label;
}

// ── Tier colours ──────────────────────────────────────────────────────────────
const TIER_STYLE = {
  common: { accent: '#9aa68b', glow: 'rgba(154,166,139,.35)', label: 'COMMON' },
  rare:   { accent: '#3d9bff', glow: 'rgba(61,155,255,.35)',  label: 'RARE'   },
  elite:  { accent: '#f6c544', glow: 'rgba(246,197,68,.45)',  label: 'ELITE'  },
};

// ── Trait chip ────────────────────────────────────────────────────────────────
function TraitChip({ req, isHeld }) {
  const rawUrl     = getTraitSpriteUrl(req.slotName, req.rarity, req.variantSeed);
  const croppedUrl = toCroppedUrl(rawUrl);
  const [src, setSrc] = useState(croppedUrl);
  const onErr = useCallback(() => setSrc(rawUrl), [rawUrl]);
  useEffect(() => setSrc(croppedUrl), [croppedUrl]);

  const rc = RARITY_COLORS[req.rarity];
  return (
    <div
      className={`bounty-chip${isHeld ? ' bounty-chip--held' : ''}`}
      style={{ '--rc': rc }}
      title={`${req.name} (${req.rarity})`}
    >
      <div className="bounty-chip__img">
        {rawUrl
          ? <img src={src} onError={onErr} alt={req.name} draggable={false} />
          : <span>?</span>}
        {isHeld && <div className="bounty-chip__check">✓</div>}
      </div>
      <div className="bounty-chip__rarity" style={{ color: rc }}>{req.rarity.toUpperCase()}</div>
      <div className="bounty-chip__name">{req.name}</div>
    </div>
  );
}

// ── Single bounty card ────────────────────────────────────────────────────────
function BountyCard({ bounty, heldTraits }) {
  const { claimBounty } = useGameStore();
  const ts = TIER_STYLE[bounty.id] || TIER_STYLE.common;

  const heldCount = bounty.traits.filter(req => {
    const held = heldTraits[req.slotIdx];
    return held && held.name === req.name && held.rarity === req.rarity;
  }).length;
  const total = bounty.traits.length;

  function handleClaim() {
    const reward = claimBounty(bounty.id);
    if (reward > 0) playSound('coinCollect');
  }

  let statusLabel = `${heldCount} / ${total} items`;
  if (bounty.claimed)    statusLabel = 'CLAIMED';
  else if (bounty.completed) statusLabel = 'READY TO CLAIM!';

  return (
    <div
      className={`bounty-card bounty-card--${bounty.id}${bounty.completed && !bounty.claimed ? ' bounty-card--ready' : ''}${bounty.claimed ? ' bounty-card--claimed' : ''}`}
      style={{ '--ac': ts.accent, '--gl': ts.glow }}
    >
      {/* Header */}
      <div className="bounty-card__hd">
        <div className="bounty-card__tier">{ts.label}</div>
        <div className="bounty-card__title">{bounty.label}</div>
        <div className={`bounty-card__status${bounty.completed && !bounty.claimed ? ' bounty-card__status--ready' : ''}`}>
          {statusLabel}
        </div>
      </div>

      {/* Trait chips */}
      <div className="bounty-card__traits">
        {bounty.traits.map((req, i) => {
          const held = heldTraits[req.slotIdx];
          const isHeld = !!(held && held.name === req.name && held.rarity === req.rarity);
          return <TraitChip key={i} req={req} isHeld={isHeld} />;
        })}
      </div>

      {/* Reward + claim */}
      <div className="bounty-card__footer">
        <div className="bounty-card__reward">
          <span className="bounty-card__reward-label">REWARD</span>
          <span className="bounty-card__reward-val">
            ◎ {(bounty.traits.reduce((s, t) => s + t.coinValue, 0) * 5).toLocaleString()}
          </span>
        </div>
        {bounty.completed && !bounty.claimed && (
          <button className="bounty-card__claim" onClick={handleClaim}>
            CLAIM
          </button>
        )}
        {bounty.claimed && (
          <div className="bounty-card__claimed-badge">✓ COLLECTED</div>
        )}
      </div>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export default function BountyPanel({ onClose }) {
  const { bounties, ensureBounties, activeRat } = useGameStore();
  const countdown = useCountdown(bounties?.resetAt);

  // Ensure bounties are generated / refreshed when panel opens
  useEffect(() => { ensureBounties(); }, []);

  if (!bounties) return null;

  // Build a slotIdx → trait map for the currently held rat
  const heldTraits = {};
  (activeRat?.traits || []).forEach((t, i) => { if (t) heldTraits[i] = t; });

  const completedCount = bounties.list.filter(b => b.completed && !b.claimed).length;

  return (
    <div className="popup__scrim" onClick={onClose}>
      <div className="popup popup--bounty" onClick={e => e.stopPropagation()}>
        <div className="popup__hd">
          <div className="popup__title">
            BOUNTIES
            {completedCount > 0 && (
              <span className="badge badge--alert">{completedCount} READY</span>
            )}
          </div>
          <button className="popup__close" onClick={onClose}>✕</button>
        </div>

        <div className="bounty-reset-bar">
          <span className="bounty-reset-label">Next reset in</span>
          <span className="bounty-reset-timer">{countdown}</span>
        </div>

        <div className="bounty-list">
          {bounties.list.map(b => (
            <BountyCard key={b.id} bounty={b} heldTraits={heldTraits} />
          ))}
        </div>

        <div className="bounty-hint">
          Equip ALL required items on your rat and sell it to complete a bounty.
          Rewards are <strong>5× the total trait value</strong>.
        </div>
      </div>
    </div>
  );
}
