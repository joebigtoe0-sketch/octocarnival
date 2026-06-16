import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore.js';
import { RARITY_COLORS, calcSellValue } from '../constants/traits.js';
import { SLOT_DEFS } from '../constants/traits.js';
import RatSprite from './RatSprite.jsx';
import MintModal, { explorerAssetUrl } from './MintModal.jsx';
import { TOKEN_SYMBOL } from '../constants/solana.js';
import { LEADER_SLOT_STAT, LEADER_RARITY_VALUE, STAT_LABELS } from '../constants/leaderTraits.js';

function InlineName({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const inputRef = useRef(null);

  const start = () => { setDraft(value); setEditing(true); };
  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim().slice(0, 24);
    if (trimmed && trimmed !== value) onSave(trimmed);
  };
  const onKey = e => {
    if (e.key === 'Enter')  { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { setEditing(false); }
  };
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="inline-name-input"
        value={draft}
        maxLength={24}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKey}
        autoComplete="off"
        spellCheck={false}
      />
    );
  }
  return (
    <div className="inline-name" onClick={start} title="Click to rename">
      {value}<span className="inline-name__pencil">✎</span>
    </div>
  );
}

function fmtN(n) { return window.fmtNum ? window.fmtNum(n) : String(Math.floor(n)); }

function CoinSvg() {
  return (
    <img src="/assets/icons/coins.png" alt="coins" style={{ width: 13, height: 13, verticalAlign: 'middle', imageRendering: 'pixelated' }} />
  );
}

/** Compute per-stat boost summary for a rat's traits (used in detail modal) */
function computeRatBoosts(traits = []) {
  const boosts = {};
  for (const t of traits) {
    if (!t) continue;
    const stat  = LEADER_SLOT_STAT[t.slotName];
    const value = LEADER_RARITY_VALUE[t.rarity] ?? 0;
    if (stat && value > 0) boosts[stat] = (boosts[stat] || 0) + value;
  }
  return boosts;
}

function RatCard({ rat, sellCharges, greed, isLeader, isGuest, onEquip, onSell, onRename, onAssignLeader, onMinted, onOpenAuth }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [mintOpen,   setMintOpen]   = useState(false);
  const value      = calcSellValue(rat.traits, greed);
  const isMinted   = !!rat.minted;
  const canSell    = !isMinted && sellCharges >= 1 && value > 0;
  const activeSlots = rat.traits.filter(Boolean);
  const ratSeed    = rat.id ? rat.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
  const boosts     = computeRatBoosts(activeSlots);
  const boostEntries = Object.entries(boosts);

  return (
    <>
      <div className={`base-rat-card plate${isLeader ? ' base-rat-card--leader' : ''}${isMinted ? ' base-rat-card--minted' : ''}`}>
        {/* Crown badge for current crew leader */}
        {isLeader && <div className="base-rat-card__crown" title="Crew Leader"><img src="/assets/icons/crownicon.png" alt="Leader" style={{width:'20px',height:'20px',imageRendering:'pixelated'}} /></div>}
        {isMinted && <div className="base-rat-card__minted-badge" title="Minted as NFT">MINTED</div>}

        {/* Name row */}
        <div className="base-rat-card__name-row">
          <InlineName value={rat.name} onSave={onRename} />
        </div>

        {/* Full-width portrait */}
        <div className="base-rat-card__portrait" onClick={() => setDetailOpen(true)} title="Click to view traits">
          <div className="base-rat-card__sprite-wrap">
            <RatSprite activeSlots={activeSlots} height={150} seed={ratSeed} />
          </div>
          <div className="base-rat-card__value-overlay">
            <CoinSvg /> {fmtN(value)}
          </div>
        </div>

        {/* Action buttons */}
        <div className="base-rat-card__actions">
          <button className="hirebtn" disabled={isMinted} title={isMinted ? 'Minted rats cannot be equipped' : undefined} onClick={onEquip}>EQUIP</button>
          <button
            className="hirebtn hirebtn--sell"
            disabled={!canSell}
            title={isMinted ? 'Minted rats cannot be sold' : !canSell && sellCharges < 1 ? 'No sell charges' : !canSell && value === 0 ? 'Rat has no traits' : undefined}
            onClick={onSell}
          >SELL</button>
        </div>
      </div>

      {/* Detail modal */}
      {detailOpen && (
        <div className="popup__scrim" onClick={() => setDetailOpen(false)}>
          <div className="base-rat-detail plate" onClick={e => e.stopPropagation()}>
            <div className="base-rat-detail__hd">
              <span className="base-rat-detail__name">
                {rat.name}
              </span>
              <button className="popup__close" onClick={() => setDetailOpen(false)}>✕</button>
            </div>
            <div className="base-rat-detail__body">
              <div className="base-rat-detail__sprite">
                <RatSprite activeSlots={activeSlots} height={160} seed={ratSeed} />
              </div>
              <div className="base-rat-detail__traits">
                <div className="base-rat-detail__traits-hd">
                  TRAITS ({activeSlots.length} / 16) — <span style={{ color: 'var(--gold)' }}><CoinSvg />{fmtN(value)}</span>
                </div>
                {activeSlots.length === 0
                  ? <div className="base-rat-detail__empty">No traits equipped</div>
                  : (
                    <div className="base-rat-detail__traits-grid">
                      {activeSlots.map((t, i) => (
                        <div key={i} className="base-rat-detail__trait-row" style={{ borderLeft: `3px solid ${RARITY_COLORS[t.rarity]}` }}>
                          <span className="base-rat-detail__trait-rarity" style={{ color: RARITY_COLORS[t.rarity] }}>{t.rarity.toUpperCase()}</span>
                          <span className="base-rat-detail__trait-name">{t.name}</span>
                          <span className="base-rat-detail__trait-slot">{t.slotName || SLOT_DEFS[t.slotIdx]?.slotName || ''}</span>
                        </div>
                      ))}
                    </div>
                  )
                }

                {/* Stat boost preview */}
                <div className="base-rat-detail__traits-hd" style={{ marginTop: 14 }}>
                  LEADER STAT BOOSTS
                </div>
                {boostEntries.length === 0
                  ? <div className="base-rat-detail__empty">No boosts (equip traits first)</div>
                  : (
                    <div className="leader-boosts">
                      {boostEntries.map(([stat, val]) => (
                        <div key={stat} className="leader-boost-row">
                          <span className="leader-boost-label">{STAT_LABELS[stat] || stat}</span>
                          <span className="leader-boost-val">+{val}</span>
                        </div>
                      ))}
                    </div>
                  )
                }

                {/* Mint NFT — above leader assign so it's visible without scrolling */}
                <div className="base-rat-detail__mint-row">
                  {isMinted ? (
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ color: 'var(--gold)', fontFamily: 'var(--fnt-pixel)', fontSize: 11 }}>✦ MINTED NFT</span>
                      {rat.mintAddress && (
                        <a
                          href={explorerAssetUrl(rat.mintAddress)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ display: 'block', fontSize: 10, marginTop: 6, color: 'var(--toxic)' }}
                        >
                          View on explorer ↗
                        </a>
                      )}
                    </div>
                  ) : isGuest ? (
                    <button
                      className="hirebtn minibtn--gold"
                      onClick={() => { setDetailOpen(false); onOpenAuth?.('register'); }}
                      style={{ width: '100%' }}
                    >
                      LOG IN TO MINT NFT
                    </button>
                  ) : (
                    <button
                      className="hirebtn minibtn--gold"
                      disabled={activeSlots.length === 0}
                      title={activeSlots.length === 0 ? 'Equip traits first' : undefined}
                      onClick={() => { setDetailOpen(false); setMintOpen(true); }}
                      style={{ width: '100%' }}
                    >
                      MINT NFT — 10,000 {TOKEN_SYMBOL}
                    </button>
                  )}
                </div>

                {/* Assign / Unassign button */}
                <button
                  className={`hirebtn leader-assign-btn${isLeader ? ' leader-assign-btn--unassign' : ''}`}
                  onClick={() => onAssignLeader(rat.id)}
                  style={{ marginTop: 14, width: '100%' }}
                >
                  {isLeader ? '✕ UNASSIGN LEADER' : 'ASSIGN AS CREW LEADER'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mintOpen && (
        <MintModal
          rat={rat}
          onClose={() => setMintOpen(false)}
          onMinted={data => { onMinted(rat.id, data); setMintOpen(false); }}
        />
      )}
    </>
  );
}

// ---- Swapper ---------------------------------------------------------------
function RatSelector({ label, selectedId, allRats, onSelect }) {
  return (
    <div className="swapper-picker">
      <div className="swapper-picker__label">{label}</div>
      <div className="swapper-picker__portrait">
        {selectedId ? (() => {
          const rat = allRats.find(r => r.id === selectedId);
          return rat ? (
            <>
              <div className="swapper-picker__sprite-wrap">
                <RatSprite
                  activeSlots={rat.traits.filter(Boolean)}
                  height={64}
                  seed={rat.id ? rat.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0}
                />
              </div>
              <div className="swapper-picker__name">{rat.name}</div>
            </>
          ) : <span className="swapper-picker__placeholder">SELECT RAT</span>;
        })() : <span className="swapper-picker__placeholder">SELECT RAT</span>}
      </div>
      <select
        className="swapper-select"
        value={selectedId || ''}
        onChange={e => onSelect(e.target.value || null)}
      >
        <option value="">Choose a rat…</option>
        {allRats.map(r => (
          <option key={r.id} value={r.id} disabled={r.minted}>
            {r.name} ({r.traits.filter(Boolean).length} traits){r.minted ? ' [MINTED]' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

function Swapper({ allRats, sellCharges, hasToken, onSwap, onClose }) {
  const [rat1Id,    setRat1Id]    = useState(null);
  const [rat2Id,    setRat2Id]    = useState(null);
  const [slotIdx,   setSlotIdx]   = useState(0);
  const [lastResult, setLastResult] = useState(null);

  const rat1 = allRats.find(r => r.id === rat1Id);
  const rat2 = allRats.find(r => r.id === rat2Id);
  const slot1Trait = rat1?.traits[slotIdx] ?? null;
  const slot2Trait = rat2?.traits[slotIdx] ?? null;
  const canSwap = rat1Id && rat2Id && rat1Id !== rat2Id && hasToken && !rat1?.minted && !rat2?.minted;

  const doSwap = () => {
    const result = onSwap(rat1Id, rat2Id, slotIdx);
    setLastResult(result);
    if (result?.ok) {
      setTimeout(() => setLastResult(null), 2000);
    }
  };

  return (
    <div className="swapper">
      <div className="swapper__header">
        <span className="swapper__title">SWAPPER</span>
        <button className="popup__close" onClick={onClose} style={{ width: 36, height: 36, fontSize: 14 }}>✕</button>
      </div>
      <p className="swapper__sub">Pick two rats and swap one trait slot between them.</p>

      <div className="swapper__rats">
        <RatSelector label="RAT 1" selectedId={rat1Id} allRats={allRats} onSelect={setRat1Id} />

        <div className="swapper__center">
          <div className="swapper__arrows">⇆</div>
          <div className="swapper__slot-picker">
            <div className="swapper__slot-label">SLOT TO SWAP</div>
            <select
              className="swapper-select"
              value={slotIdx}
              onChange={e => setSlotIdx(Number(e.target.value))}
            >
              {SLOT_DEFS.map((s, i) => (
                <option key={i} value={i}>{i + 1}. {s.slotName}</option>
              ))}
            </select>
          </div>
          <div className="swapper__preview">
            <div className="swapper__preview-item" style={{ color: slot1Trait ? RARITY_COLORS[slot1Trait.rarity] : '#5a6450' }}>
              {slot1Trait ? slot1Trait.name : '—'}
            </div>
            <div className="swapper__preview-vs">↕</div>
            <div className="swapper__preview-item" style={{ color: slot2Trait ? RARITY_COLORS[slot2Trait.rarity] : '#5a6450' }}>
              {slot2Trait ? slot2Trait.name : '—'}
            </div>
          </div>
        </div>

        <RatSelector label="RAT 2" selectedId={rat2Id} allRats={allRats} onSelect={setRat2Id} />
      </div>

      <div className="swapper__footer">
        <div className="swapper__cost">
          {hasToken
            ? <span style={{ color: 'var(--toxic)' }}>◈ 1 Swap Token ready</span>
            : <span style={{ color: '#e05050' }}>Need 1 Swap Token (buy in SHOP → Tools)</span>}
        </div>
        {lastResult?.ok && (
          <span style={{ color: 'var(--toxic)', fontFamily: 'var(--fnt-pixel)', fontSize: 11 }}>✓ Swapped!</span>
        )}
        {lastResult?.error && (
          <span style={{ color: '#e05050', fontFamily: 'var(--fnt-pixel)', fontSize: 11 }}>{lastResult.error}</span>
        )}
        <button className="hirebtn" disabled={!canSwap} onClick={doSwap} style={{ minWidth: 120 }}>
          SWAP PARTS
        </button>
      </div>
    </div>
  );
}

// ---- Main panel ------------------------------------------------------------
export default function BasePanel({ onClose, onOpenAuth }) {
  const store   = useGameStore();
  const { activeRat, baseRats, stats, sellCharges, maxSellCharges, maxBaseSlots,
          crewLeaderId, assignCrewLeader, markRatMinted, isGuest } = store;
  const maxBase = maxBaseSlots || 3;
  const [swapperOpen, setSwapperOpen] = useState(false);
  const hasToken = store.inventory.some(i => i.key === 'swap_token' && i.quantity > 0);

  // All rats eligible for swapping (active + base)
  const allRats = [activeRat, ...baseRats];

  return (
    <div className="popup__scrim" onClick={onClose}>
      <div className="popup" onClick={e => e.stopPropagation()} style={{ maxWidth: 900 }}>
        <div className="popup__hd">
          <div className="popup__title">
            {swapperOpen ? 'BASE — SWAPPER' : 'BASE'}
            {!swapperOpen && <span className="badge">{baseRats.length} / {maxBase}</span>}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {!swapperOpen && (
              <span className="base-mint-hint">
                {isGuest ? 'Log in to mint rats as NFTs' : 'Open a rat → MINT NFT'}
              </span>
            )}
            {!swapperOpen && (
              <button
                className="hirebtn"
                style={{ fontSize: 12, padding: '8px 14px', position: 'relative' }}
                onClick={() => setSwapperOpen(true)}
              >
                <img src="/assets/icons/swaptoken.png" alt="" style={{ width: 14, height: 14, verticalAlign: 'middle', marginRight: 5 }} />SWAP TRAITS
                {hasToken && <span style={{ position: 'absolute', top: -5, right: -5, width: 10, height: 10, borderRadius: '50%', background: 'var(--toxic)', border: '2px solid #171d10' }} />}
              </button>
            )}
            {swapperOpen && (
              <button className="hirebtn" style={{ fontSize: 12, padding: '8px 14px' }} onClick={() => setSwapperOpen(false)}>
                ← BACK TO BASE
              </button>
            )}
            <button className="popup__close" onClick={onClose}>✕</button>
          </div>
        </div>

        {swapperOpen ? (
          <Swapper
            allRats={allRats}
            sellCharges={sellCharges}
            hasToken={hasToken}
            onSwap={(r1, r2, slot) => store.swapTrait(r1, r2, slot)}
            onClose={() => setSwapperOpen(false)}
          />
        ) : (
          <>
            {/* Sell charges status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontFamily: 'var(--fnt-pixel)', fontSize: 11 }}>
              <span style={{ color: '#7e9460' }}>SELL CHARGES:</span>
              {Array.from({ length: maxSellCharges || 3 }, (_, i) => {
                const f = Math.max(0, Math.min(1, sellCharges - i));
                return (
                  <div key={i} style={{ width: 28, height: 10, background: '#10160b', border: '2px solid #4a5836', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${f*100}%`, height: '100%', background: 'var(--toxic)', transition: 'width .25s' }} />
                  </div>
                );
              })}
              <span style={{ color: sellCharges >= 1 ? 'var(--toxic)' : '#e05050' }}>
                {sellCharges < 1 ? '— no charges' : `${Math.floor(sellCharges)} available`}
              </span>
            </div>

            <div className="popup__body" style={{ display: 'block', overflowY: 'auto' }}>
              <div className="base-grid">
                {baseRats.map(rat => (
                  <RatCard
                    key={rat.id}
                    rat={rat}
                    sellCharges={sellCharges}
                    greed={stats.greed}
                    isLeader={crewLeaderId === rat.id}
                    isGuest={isGuest}
                    onEquip={() => { store.activateBaseRat(rat.id); onClose(); }}
                    onSell={() => store.sellBaseRat(rat.id)}
                    onRename={name => store.renameBaseRat(rat.id, name)}
                    onAssignLeader={assignCrewLeader}
                    onMinted={markRatMinted}
                    onOpenAuth={onOpenAuth}
                  />
                ))}
                {Array.from({ length: Math.max(0, maxBase - baseRats.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="base-rat-card base-rat-card--empty plate">
                    <div style={{ textAlign: 'center', opacity: 0.3, paddingTop: 20 }}>
                      <div style={{ fontSize: 32 }}>+</div>
                      <div style={{ fontSize: 11, fontFamily: 'var(--fnt-pixel)', marginTop: 6 }}>EMPTY SLOT</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
