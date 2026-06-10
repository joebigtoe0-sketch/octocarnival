import React, { useState, useCallback } from 'react';
import { useGameStore }  from '../stores/gameStore.js';
import { SLOT_DEFS, RARITIES, RARITY_COLORS } from '../constants/traits.js';
import { getTraitSpriteUrl } from './RatSprite.jsx';
import { ACHIEVEMENTS, ACHIEVEMENT_CATEGORIES } from '../constants/achievements.js';
import { playSound } from '../audio.js';

// ── shared helpers ────────────────────────────────────────────────────────────
function toCroppedUrl(url) {
  return url ? url.replace('/assets/sprites/', '/assets/sprites/cropped/') : url;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  COLLECTION TAB
// ═══════════════════════════════════════════════════════════════════════════════

function buildDiscoverables(slotIdx) {
  const def   = SLOT_DEFS[slotIdx];
  const items = [];
  for (const rarity of RARITIES) {
    const tier = def.tiers[rarity];
    if (!tier) continue;
    if (tier.variants) {
      tier.variants.forEach((name, vi) => {
        items.push({ slotIdx, slotName: def.slotName, rarity, name, variantSeed: vi, coinValue: tier.coinValue });
      });
    } else {
      items.push({ slotIdx, slotName: def.slotName, rarity, name: tier.name, variantSeed: 0, coinValue: tier.coinValue });
    }
  }
  return items;
}

function totalDiscoverables() {
  let n = 0;
  SLOT_DEFS.forEach((def) => {
    for (const rarity of RARITIES) {
      const tier = def.tiers[rarity];
      if (!tier) continue;
      n += tier.variants ? tier.variants.length : 1;
    }
  });
  return n;
}

function ItemCard({ item, found }) {
  const rawUrl     = getTraitSpriteUrl(item.slotName, item.rarity, item.variantSeed);
  const croppedUrl = toCroppedUrl(rawUrl);
  const [imgSrc, setImgSrc]     = useState(croppedUrl);
  const onError                 = useCallback(() => setImgSrc(rawUrl), [rawUrl]);
  const rc = RARITY_COLORS[item.rarity];

  return (
    <div
      className={`gcrd${found ? ' gcrd--found' : ' gcrd--hidden'}`}
      style={{ '--rc': rc }}
    >
      <div className="gcrd__img-wrap">
        {rawUrl ? (
          <img
            src={found ? imgSrc : rawUrl}
            alt={found ? item.name : '???'}
            onError={onError}
            draggable={false}
            className={`gcrd__img${found ? '' : ' gcrd__img--masked'}`}
          />
        ) : (
          <span className="gcrd__fallback">?</span>
        )}
      </div>
      <div className="gcrd__rarity" style={{ color: found ? rc : '#3a4030' }}>
        {item.rarity.toUpperCase()}
      </div>
      <div className="gcrd__name" style={{ color: found ? '#e6ffc2' : '#2a2f26' }}>
        {found ? item.name : '???'}
      </div>
      {found && (
        <div className="gcrd__value" style={{ color: rc }}>
          ◎ {item.coinValue.toLocaleString()}
        </div>
      )}
    </div>
  );
}

function CollectionTab({ discoveredTraits }) {
  const [activeSlot, setActiveSlot] = useState(0);

  const total      = totalDiscoverables();
  const discovered = discoveredTraits.length;
  const pct        = total > 0 ? Math.round((discovered / total) * 100) : 0;

  const slotDef   = SLOT_DEFS[activeSlot];
  const items     = buildDiscoverables(activeSlot);
  const foundKeys = new Set(discoveredTraits.filter(d => d.slotIdx === activeSlot).map(d => d.key));

  function slotCount(si) {
    const slotItems = buildDiscoverables(si);
    const slotFound = discoveredTraits.filter(d => d.slotIdx === si).length;
    return { found: slotFound, total: slotItems.length };
  }

  return (
    <div className="gallery-collection">
      <div className="gallery-coll-hd">
        <span className="gallery-coll-pct">{discovered} / {total} &nbsp;<span style={{ color:'#7e9460' }}>{pct}% complete</span></span>
      </div>
      <div style={{ display:'flex', gap:16, flex:1, overflow:'hidden' }}>
        {/* slot selector */}
        <div className="gallery-slots">
          {SLOT_DEFS.map((s, i) => {
            const { found, total: st } = slotCount(i);
            return (
              <button
                key={i}
                className={`gallery-slot-btn${activeSlot === i ? ' gallery-slot-btn--active' : ''}`}
                onClick={() => setActiveSlot(i)}
              >
                <span>{s.slotName}</span>
                <span className="gallery-slot-btn__count">{found}/{st}</span>
              </button>
            );
          })}
        </div>

        {/* item grid */}
        <div className="gallery-detail">
          <div className="gallery-detail__title">{slotDef.slotName}</div>
          <div className="gallery-grid">
            {items.map((item, idx) => {
              const key   = `${item.slotIdx}_${item.rarity}_${item.name}`;
              const found = foundKeys.has(key);
              return <ItemCard key={idx} item={item} found={found} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ACHIEVEMENTS TAB
// ═══════════════════════════════════════════════════════════════════════════════


function AchCard({ ach, unlocked, claimed, onClaim }) {
  return (
    <div className={`ach-card${unlocked && !claimed ? ' ach-card--ready' : ''}${claimed ? ' ach-card--claimed' : ''}${!unlocked ? ' ach-card--locked' : ''}`}>
      <div className="ach-card__icon">
        <img src={ach.icon} alt="" draggable={false} />
      </div>
      <div className="ach-card__body">
        <div className="ach-card__name">{ach.name}</div>
        <div className="ach-card__desc">{ach.desc}</div>
      </div>
      <div className="ach-card__right">
        <div className="ach-card__reward">
          <img src="/assets/icons/diamond.png" className="ach-diamond-ico" alt="diamond" draggable={false} />
          {ach.reward}
        </div>
        {claimed ? (
          <div className="ach-card__done">✓</div>
        ) : unlocked ? (
          <button className="ach-card__claim" onClick={() => onClaim(ach.id)}>
            CLAIM
          </button>
        ) : (
          <div className="ach-card__lock">🔒</div>
        )}
      </div>
    </div>
  );
}

function AchievementsTab({ gameState, claimAchievement }) {
  const [activeCategory, setActiveCategory] = useState('progress');
  const { claimedAchievements = [] } = gameState;
  const claimedSet = new Set(claimedAchievements);

  const allAchs = ACHIEVEMENTS;
  const totalClaimed  = claimedSet.size;
  const readyCount    = allAchs.filter(a => !claimedSet.has(a.id) && a.check(gameState)).length;

  const filtered = allAchs.filter(a => a.category === activeCategory);

  function handleClaim(id) {
    const reward = claimAchievement(id);
    if (reward > 0) playSound('gemCollect');
  }

  return (
    <div className="ach-tab">
      {/* summary bar */}
      <div className="ach-summary">
        <span>{totalClaimed} / {allAchs.length} claimed</span>
        {readyCount > 0 && (
          <span className="ach-summary__ready">{readyCount} ready to claim!</span>
        )}
      </div>

      {/* category pills */}
      <div className="ach-cats">
        {ACHIEVEMENT_CATEGORIES.map(cat => {
          const catAchs    = allAchs.filter(a => a.category === cat.id);
          const catReady   = catAchs.filter(a => !claimedSet.has(a.id) && a.check(gameState)).length;
          return (
            <button
              key={cat.id}
              className={`ach-cat-btn${activeCategory === cat.id ? ' ach-cat-btn--active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <img src={cat.icon} alt="" className="ach-cat-icon" draggable={false} />
              {cat.label}
              {catReady > 0 && <span className="ach-cat-badge">{catReady}</span>}
            </button>
          );
        })}
      </div>

      {/* achievement list */}
      <div className="ach-list">
        {filtered.map(ach => (
          <AchCard
            key={ach.id}
            ach={ach}
            unlocked={ach.check(gameState)}
            claimed={claimedSet.has(ach.id)}
            onClaim={handleClaim}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PANEL
// ═══════════════════════════════════════════════════════════════════════════════

export default function GalleryPanel({ onClose }) {
  const gameState = useGameStore();
  const { discoveredTraits, claimAchievement } = gameState;
  const [tab, setTab] = useState('collection');

  // badge: achievements ready to claim
  const claimedSet   = new Set(gameState.claimedAchievements || []);
  const achReadyCount = ACHIEVEMENTS.filter(a => !claimedSet.has(a.id) && a.check(gameState)).length;

  return (
    <div className="popup__scrim" onClick={onClose}>
      <div className="popup popup--gallery" onClick={e => e.stopPropagation()}>
        <div className="popup__hd">
          <div className="popup__title">GALLERY</div>
          <button className="popup__close" onClick={onClose}>✕</button>
        </div>

        {/* tab bar */}
        <div className="gallery-tabs">
          <button
            className={`gallery-tab${tab === 'collection' ? ' gallery-tab--active' : ''}`}
            onClick={() => setTab('collection')}
          >
            COLLECTION
          </button>
          <button
            className={`gallery-tab${tab === 'achievements' ? ' gallery-tab--active' : ''}`}
            onClick={() => setTab('achievements')}
          >
            ACHIEVEMENTS
            {achReadyCount > 0 && <span className="gallery-tab-badge">{achReadyCount}</span>}
          </button>
        </div>

        <div className="gallery-tab-body">
          {tab === 'collection'   && <CollectionTab   discoveredTraits={discoveredTraits} />}
          {tab === 'achievements' && <AchievementsTab gameState={gameState} claimAchievement={claimAchievement} />}
        </div>
      </div>
    </div>
  );
}
