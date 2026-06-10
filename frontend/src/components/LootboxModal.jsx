import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUiStore }   from '../stores/uiStore.js';
import { useGameStore } from '../stores/gameStore.js';
import { SLOT_DEFS }    from '../constants/traits.js';
import { getTraitSpriteUrl } from './RatSprite.jsx';
import { playSound, startWheelspin, stopWheelspin } from '../audio.js';

// ── Config ───────────────────────────────────────────────────────────────────
const TILE_PX      = 80;   // .lb-tile width (must match CSS)
const GAP_PX       = 4;    // .lb-strip gap  (must match CSS)
const TILE_W       = TILE_PX + GAP_PX;   // 84px per tile step
const STRIP_COUNT  = 40;
const WINNER_IDX   = 33;   // index of the winning item in the strip
const CONTAINER_W  = 480;  // visible strip width (matches CSS .lb-roll-container)
const ROLL_SECS    = 5;

// px to translateX so the winner tile is exactly centred
const SCROLL_TO = WINNER_IDX * TILE_W + TILE_PX / 2 - CONTAINER_W / 2;

// ── Reward logic by box rarity ────────────────────────────────────────────────
const BOX_WEIGHTS = {
  common:    { common: 68, uncommon: 26, rare: 5, epic: 1 },
  uncommon:  { common: 20, uncommon: 50, rare: 24, epic: 5, legendary: 1 },
  rare:      { uncommon: 10, rare: 53, epic: 30, legendary: 6, mythic: 1 },
  epic:      { rare: 10, epic: 53, legendary: 30, mythic: 7 },
  legendary: { epic: 8, legendary: 60, mythic: 32 },
  mythic:    { legendary: 12, mythic: 88 },
};

export function rollLootboxReward(boxRarity) {
  const weights = BOX_WEIGHTS[boxRarity] || BOX_WEIGHTS.common;
  const entries = Object.entries(weights);
  const total   = entries.reduce((s, [, w]) => s + w, 0);
  let rand = Math.random() * total;
  let chosenRarity = entries[0][0];
  for (const [r, w] of entries) { rand -= w; if (rand <= 0) { chosenRarity = r; break; } }

  const slotIdx     = Math.floor(Math.random() * SLOT_DEFS.length);
  const def         = SLOT_DEFS[slotIdx];
  const tier        = def.tiers[chosenRarity];
  const variantSeed = Math.floor(Math.random() * 9973);
  const name        = tier.variants
    ? tier.variants[variantSeed % tier.variants.length]
    : tier.name;
  return {
    slotIdx, lootSlot: slotIdx + 1, slotName: def.slotName,
    name, rarity: chosenRarity, coinValue: tier.coinValue,
    variantSeed,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const RARITY_BG = {
  common:    'rgba(74,88,54,.55)',
  uncommon:  'rgba(58,140,66,.4)',
  rare:      'rgba(45,116,212,.45)',
  epic:      'rgba(138,61,200,.5)',
  legendary: 'rgba(246,197,68,.35)',
  mythic:    'rgba(224,64,96,.5)',
};
const RARITY_BORDER = {
  common:    '#4a5836',
  uncommon:  '#3a8c42',
  rare:      '#2d74d4',
  epic:      '#8a3dc8',
  legendary: '#f6c544',
  mythic:    '#e04060',
};
// Fallback emoji for slots that don't have sprite art yet
const SLOT_ICONS = {
  'Hair / Hat': '🎩', 'Eyes': '👁️', 'Mouth': '👄', 'Ears': '👂',
  'Nose': '👃', 'Body Item': '👕', 'Leg Item': '👖', 'Back Item': '🎒',
  'Feet Item': '👟', 'Skateboard': '🛹', 'Handheld Item': '⚔️',
  'Mouthheld Item': '🚬', 'Skin Colour': '🎨', 'Neck Item': '📿',
  'Wrist Item': '⌚', 'Tail': '🐀',
};

function toCroppedUrl(url) {
  if (!url) return url;
  // e.g. /assets/sprites/Skin1.1.png  →  /assets/sprites/cropped/Skin1.1.png
  return url.replace('/assets/sprites/', '/assets/sprites/cropped/');
}

function TraitImage({ slotName, rarity, variantSeed = 0, size = 56 }) {
  const rawUrl     = getTraitSpriteUrl(slotName, rarity, variantSeed);
  const croppedUrl = toCroppedUrl(rawUrl);
  const [src, setSrc] = React.useState(croppedUrl);

  // If the cropped version fails to load, fall back to the original
  const onError = React.useCallback(() => setSrc(rawUrl), [rawUrl]);

  React.useEffect(() => { setSrc(croppedUrl); }, [croppedUrl]);

  if (rawUrl) {
    return (
      <img
        src={src}
        alt={slotName}
        onError={onError}
        style={{ width: size, height: size, imageRendering: 'pixelated', objectFit: 'contain' }}
        draggable={false}
      />
    );
  }
  return <span style={{ fontSize: size * 0.6 }}>{SLOT_ICONS[slotName] || '❔'}</span>;
}
const RARITY_NAMES = {
  common:'COMMON', uncommon:'UNCOMMON', rare:'RARE',
  epic:'EPIC', legendary:'LEGENDARY', mythic:'MYTHIC',
};
function fmt(n) { return window.fmtNum ? window.fmtNum(n) : String(Math.floor(n)); }

// ── Sub-components ────────────────────────────────────────────────────────────
function StripTile({ item, isWinner }) {
  return (
    <div
      className={`lb-tile lb-tile--${item.rarity}${isWinner ? ' lb-tile--winner' : ''}`}
      style={{ background: RARITY_BG[item.rarity], borderColor: RARITY_BORDER[item.rarity] }}
    >
      <span className="lb-tile__icon">
        <TraitImage slotName={item.slotName} rarity={item.rarity} variantSeed={item.variantSeed} size={40} />
      </span>
      <span className="lb-tile__name">{item.name}</span>
      <span className="lb-tile__rarity">{RARITY_NAMES[item.rarity]}</span>
    </div>
  );
}

// ── Phase: Confirm ────────────────────────────────────────────────────────────
function ConfirmPhase({ rarity, onYes, onNo }) {
  const R = rarity.toUpperCase();
  return (
    <div className="lb-modal">
      <div className="lb-modal__icon">
        <img src={`/assets/icons/chest_${rarity}.png`} alt={`${rarity} lootbox`} style={{ width: 72, height: 72, objectFit: 'contain', imageRendering: 'pixelated' }} />
      </div>
      <h2 className="lb-modal__title">Open Lootbox?</h2>
      <p className="lb-modal__body">
        Use <span style={{ color: RARITY_BORDER[rarity] }}>1× {R} KEY</span> to open{' '}
        <span style={{ color: RARITY_BORDER[rarity] }}>1× {R} LOOTBOX</span>?
      </p>
      <div className="lb-modal__actions">
        <button className="lb-btn lb-btn--yes" onClick={() => { playSound('uiClick'); onYes(); }}>OPEN IT</button>
        <button className="lb-btn lb-btn--no"  onClick={() => { playSound('uiClick'); onNo();  }}>CANCEL</button>
      </div>
    </div>
  );
}

// ── Phase: Rolling ────────────────────────────────────────────────────────────
function RollingPhase({ rarity, reward, onReveal }) {
  const stripRef  = useRef(null);
  const [strip]   = useState(() => {
    const items = Array.from({ length: STRIP_COUNT }, () => rollLootboxReward(rarity));
    items[WINNER_IDX] = reward;
    return items;
  });
  const [revealed, setRevealed] = useState(false);

  const doReveal = useCallback(() => {
    if (revealed) return;
    setRevealed(true);
    stopWheelspin();
    setTimeout(() => { playSound('lootboxLoot'); onReveal(); }, 900);
  }, [revealed, onReveal]);

  // kick off the CSS transition after first paint
  useEffect(() => {
    startWheelspin();
    const id1 = requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!stripRef.current) return;
      stripRef.current.style.transition = `transform ${ROLL_SECS}s cubic-bezier(0.05, 0.85, 0.1, 1)`;
      stripRef.current.style.transform  = `translateX(-${SCROLL_TO}px)`;
    }));
    const id2 = setTimeout(doReveal, (ROLL_SECS + 0.05) * 1000);
    return () => { cancelAnimationFrame(id1); clearTimeout(id2); stopWheelspin(); };
  }, []);

  const skip = () => {
    if (!stripRef.current || revealed) return;
    stripRef.current.style.transition = 'none';
    stripRef.current.style.transform  = `translateX(-${SCROLL_TO}px)`;
    doReveal();
  };

  return (
    <div className="lb-roll-wrap">
      <div className="lb-roll-container">
        {/* centre pointer */}
        <div className="lb-pointer lb-pointer--top" />
        <div className="lb-pointer lb-pointer--bot" />
        {/* strip */}
        <div className="lb-strip-clip">
          <div className="lb-strip" ref={stripRef}>
            {strip.map((item, i) => (
              <StripTile key={i} item={item} isWinner={i === WINNER_IDX && revealed} />
            ))}
          </div>
        </div>
      </div>
      {!revealed && (
        <button className="lb-skip-btn" onClick={() => { playSound('uiClick'); skip(); }}>SKIP ▶▶</button>
      )}
    </div>
  );
}

// ── Phase: Reveal overlay — floats above the whole lb-overlay ────────────────
function RevealOverlay({ reward, rarity, onClaim, onDiscard }) {
  return (
    <div className="lb-reveal" onClick={e => e.stopPropagation()}>
      <div
        className="lb-reveal__card"
        style={{ borderColor: RARITY_BORDER[reward.rarity], boxShadow: `0 0 60px ${RARITY_BORDER[reward.rarity]}99` }}
      >
        <p className="lb-reveal__from">From {rarity.toUpperCase()} LOOTBOX</p>
        <div className="lb-reveal__rarity" style={{ color: RARITY_BORDER[reward.rarity] }}>
          ★ {RARITY_NAMES[reward.rarity]} ★
        </div>
        <div className="lb-reveal__icon">
          <TraitImage slotName={reward.slotName} rarity={reward.rarity} variantSeed={reward.variantSeed} size={72} />
        </div>
        <div className="lb-reveal__name">{reward.name}</div>
        <div className="lb-reveal__slot">{reward.slotName}</div>
        <div className="lb-reveal__value">⬡ {fmt(reward.coinValue)} coins</div>
        <button className="lb-btn lb-btn--loot" onClick={() => { playSound('uiClick'); onClaim(); }}>LOOT IT</button>
        <button className="lb-discard" onClick={() => { playSound('uiClick'); onDiscard(); }}>discard loot</button>
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function LootboxModal({ onClaimTrait }) {
  const lootbox    = useUiStore(s => s.lootbox);
  const closeFlow  = useUiStore(s => s.closeLootboxFlow);
  const startRoll  = useUiStore(s => s.startLootboxRoll);
  const revealBox  = useUiStore(s => s.revealLootbox);
  const consume    = useGameStore(s => s.consumeLootbox);

  if (!lootbox) return null;
  const { phase, rarity, reward } = lootbox;

  const handleYes = () => {
    consume(rarity);
    const item = rollLootboxReward(rarity);
    startRoll(item);
  };

  return (
    <div className="lb-overlay" onClick={phase === 'confirm' ? closeFlow : undefined}>
      {/* Rolling container — hidden behind reveal overlay once done */}
      <div className="lb-root" onClick={e => e.stopPropagation()}>
        <div className="lb-header">
          <span className="lb-header__title" style={{ color: RARITY_BORDER[rarity] }}>
            {rarity.toUpperCase()} LOOTBOX
          </span>
          {phase === 'confirm' && (
            <button className="lb-x" onClick={() => { playSound('uiClick'); closeFlow(); }}>✕</button>
          )}
        </div>

        {phase === 'confirm' && (
          <ConfirmPhase rarity={rarity} onYes={handleYes} onNo={closeFlow} />
        )}

        {(phase === 'rolling' || phase === 'reveal') && reward && (
          <RollingPhase rarity={rarity} reward={reward} onReveal={revealBox} />
        )}
      </div>

      {/* Reveal floats over the ENTIRE overlay, not just lb-root */}
      {phase === 'reveal' && reward && (
        <RevealOverlay
          reward={reward}
          rarity={rarity}
          onClaim={() => { onClaimTrait(reward); closeFlow(); }}
          onDiscard={closeFlow}
        />
      )}
    </div>
  );
}
