import React from 'react';
import { useGameStore } from '../stores/gameStore.js';

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

const STAT_INFO = {
  luck:       { label: 'Luck',        desc: 'Higher chance of rare NPC loot' },
  cardLuck:   { label: 'Card Luck',   desc: 'Better cards at level-up' },
  rate:       { label: 'Rate',        desc: 'More NPCs carry loot' },
  speed:      { label: 'Speed',       desc: 'NPCs move faster' },
  greed:      { label: 'Greed',       desc: 'Sell rats for more (+1% sell value per point)' },
  stealth:    { label: 'Stealth',     desc: 'Sell charges recharge faster (+1% speed per point)' },
  dps:        { label: 'Crew DPS',    desc: 'Crew deals more damage (+0.25% per point)' },
  clickPower: { label: 'Click Power', desc: 'Your clicks deal more damage (+0.2% per point)' },
  influence:  { label: 'Influence',   desc: 'Crew costs reduced (−0.25% per point, max −50%)' },
};

function fmtN(n) { return window.fmtNum ? window.fmtNum(n) : String(Math.floor(n)); }

export default function StatsPanel({ onClose }) {
  const stats = useGameStore(s => s.stats);

  return (
    <div className="popup__scrim" onClick={onClose}>
      <div className="popup" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
        <div className="popup__hd">
          <div className="popup__title">STATS</div>
          <button className="popup__close" onClick={onClose}>✕</button>
        </div>
        <div className="popup__body" style={{ display: 'block', padding: '20px 0' }}>
          <div style={{
            marginBottom: 16,
            fontFamily: 'var(--fnt-pixel)',
            fontSize: 11,
            color: 'var(--toxic)',
            textAlign: 'center',
            letterSpacing: '.05em',
          }}>
            ✦ Stats improve via level-up cards — keep fighting! ✦
          </div>
          <div className="stats-grid">
            {Object.entries(STAT_INFO).map(([key, info]) => {
              const value = stats[key] || 0;
              return (
                <div key={key} className="stat-card plate">
                  <div className="stat-card__header">
                    <img src={STAT_ICONS[key]} alt={info.label} className="stat-card__icon" />
                    <span className="stat-card__name">{info.label}</span>
                    <span className="stat-card__level" style={{
                      color: value > 0 ? 'var(--toxic)' : '#666',
                    }}>
                      +{value}
                    </span>
                  </div>
                  <div className="stat-card__desc">{info.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
