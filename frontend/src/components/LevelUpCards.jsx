import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useGameStore } from '../stores/gameStore.js';
import { useUiStore }   from '../stores/uiStore.js';
import { CARD_RARITY_COLORS, CARD_RARITY_GLOW } from '../constants/cards.js';

const AUTO_PICK_SEC = 60;

const CONFETTI_COLORS = ['#b060ff','#f6c544','#4cde6a','#e04060','#4adaff','#ff8c42','#fff'];
const CONFETTI_COUNT  = 48;

function Confetti() {
  const pieces = useMemo(() => Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    color:  CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left:   `${Math.random() * 100}%`,
    delay:  `${(Math.random() * 1.4).toFixed(2)}s`,
    dur:    `${(1.8 + Math.random() * 1.6).toFixed(2)}s`,
    size:   `${5 + Math.round(Math.random() * 5)}px`,
    rot:    `${Math.round(Math.random() * 360)}deg`,
    shape:  i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'rect' : 'diamond',
  })), []);

  return (
    <div className="confetti-wrap" aria-hidden="true">
      {pieces.map(p => (
        <div
          key={p.id}
          className={`confetti-piece confetti-piece--${p.shape}`}
          style={{
            left: p.left,
            width: p.size,
            height: p.shape === 'rect' ? `calc(${p.size} * 0.55)` : p.size,
            background: p.color,
            animationDelay: p.delay,
            animationDuration: p.dur,
            '--rot': p.rot,
          }}
        />
      ))}
    </div>
  );
}

const STAT_LABELS = {
  luck:        'Luck',
  cardLuck:    'Card Luck',
  rate:        'Rate',
  speed:       'Speed',
  greed:       'Greed',
  stealth:     'Stealth',
  dps:         'Crew DPS',
  clickPower:  'Click Power',
  influence:   'Influence',
  wild_crew:   'Wild',
  wild_reroll: 'Wild',
  wild_exp:    'Wild',
  wild_lootbox:'Wild',
};

const STAT_ICONS = {
  luck:       '/assets/icons/stats/luck.png',
  cardLuck:   '/assets/icons/stats/cardluck.png',
  rate:       '/assets/icons/stats/rate.png',
  speed:      '/assets/icons/stats/speed.png',
  greed:      '/assets/icons/stats/greed.png',
  stealth:    '/assets/icons/stats/stelath.png',
  dps:        '/assets/icons/stats/crewdps.png',
  clickPower: '/assets/icons/stats/clickpower.png',
  influence:  '/assets/icons/stats/influence.png',
};

export default function LevelUpCards({ level }) {
  const pendingCards       = useGameStore(s => s.pendingCards);
  const levelUpRerollsLeft = useGameStore(s => s.levelUpRerollsLeft);
  const accountLevel       = useGameStore(s => s.accountLevel);
  const coins              = useGameStore(s => s.coins);
  const applyCard          = useGameStore(s => s.applyCard);
  const rerollCards        = useGameStore(s => s.rerollCards);
  const addToast           = useUiStore(s => s.addToast);

  const pickCard = (cardId) => {
    const card = applyCard(cardId);
    // Notify for cards that give tangible items (lootboxes, etc.)
    if (card?.stat === 'wild_lootbox') {
      addToast({ rarity: 'rare', name: '1× Rare Lootbox added to inventory', slotName: '📦' });
    }
  };

  const rerollCost = 50 * accountLevel;
  const canReroll  = levelUpRerollsLeft > 0 && coins >= rerollCost;

  // ---- 60-second auto-pick countdown ----
  const [countdown, setCountdown] = useState(AUTO_PICK_SEC);
  const timerRef = useRef(null);

  // Reset countdown whenever cards change (player rerolled)
  useEffect(() => {
    setCountdown(AUTO_PICK_SEC);
  }, [pendingCards]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Pick a random card
          if (pendingCards.length > 0) {
            const pick = pendingCards[Math.floor(Math.random() * pendingCards.length)];
            pickCard(pick.id);
          }
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  // Re-run whenever pendingCards reference changes (reroll) so the captured
  // pendingCards value inside the callback is fresh.
  }, [pendingCards, applyCard, addToast]);

  const urgency = countdown <= 10 ? ' levelup-countdown--urgent' : countdown <= 20 ? ' levelup-countdown--warning' : '';

  return (
    <div className="levelup-overlay">
      <Confetti />
      <div className="levelup-modal">
        <div className="levelup-modal__title">
          LEVEL UP!
        </div>
        <span className="levelup-modal__lvl">LVL {level}</span>
        <p className="levelup-modal__sub">Pick 1 card to keep</p>

        <div className="levelup-cards">
          {pendingCards.map(card => {
            const color = CARD_RARITY_COLORS[card.rarity] || '#aaa';
            const glow  = CARD_RARITY_GLOW[card.rarity]  || 'rgba(255,255,255,.2)';
            return (
              <button
                key={card.id}
                className={`card-tile card-tile--${card.rarity}`}
                style={{ '--card-color': color, '--card-glow': glow }}
                onClick={() => pickCard(card.id)}
              >
                <div className="card-tile__rarity">{card.rarity.toUpperCase()}</div>
                <div className="card-tile__stat">
                  {STAT_ICONS[card.stat] && <img src={STAT_ICONS[card.stat]} alt="" className="card-tile__stat-icon" />}
                  {STAT_LABELS[card.stat] || card.stat}
                </div>
                <div className="card-tile__name">{card.name}</div>
                <div className="card-tile__desc">{card.description}</div>
              </button>
            );
          })}
        </div>

        <div className="levelup-modal__footer">
          <div className={`levelup-countdown${urgency}`}>
            Auto-pick in <span className="levelup-countdown__num">{countdown}s</span>
          </div>
          <button
            className={`levelup-reroll-btn${canReroll ? '' : ' levelup-reroll-btn--disabled'}`}
            onClick={canReroll ? rerollCards : undefined}
            disabled={!canReroll}
          >
            {levelUpRerollsLeft > 0
              ? `Reroll (${levelUpRerollsLeft} left) · ${rerollCost} coins`
              : 'No rerolls left'}
          </button>
          <div className={`levelup-countdown${urgency}`} style={{ visibility: 'hidden' }}>
            placeholder
          </div>
        </div>
      </div>
    </div>
  );
}
