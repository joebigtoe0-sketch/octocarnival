import React, { useState, useCallback } from 'react';

function fmt(n) {
  if (window.fmtNum) return window.fmtNum(n);
  n = Math.floor(n);
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return '' + n;
}

function getDamageStage(hp, maxHp) {
  if (!maxHp || hp <= 0) return 3;
  const pct = hp / maxHp;
  if (pct > 0.75) return 0;
  if (pct > 0.50) return 1;
  if (pct > 0.25) return 2;
  return 3;
}

export default function CombatZone({
  enemyHp,
  enemyMaxHp,
  enemyLevel,
  onClickEnemy,
  floats = [],
  drops = [],
}) {
  const hpPct   = enemyMaxHp > 0 ? Math.max(0, enemyHp / enemyMaxHp) : 0;
  const stage   = getDamageStage(enemyHp, enemyMaxHp);
  const isDead  = enemyHp <= 0;

  const [hitFlash, setHitFlash] = useState(false);

  const handleClick = useCallback(e => {
    if (isDead) return;
    const el   = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const scaleX = rect.width  / el.offsetWidth;
    const scaleY = rect.height / el.offsetHeight;
    const x = (e.clientX - rect.left) / scaleX;
    const y = (e.clientY - rect.top)  / scaleY;
    onClickEnemy(x, y);
    // Briefly flash to enemy2.png on each click
    setHitFlash(true);
    setTimeout(() => setHitFlash(false), 140);
  }, [isDead, onClickEnemy]);

  // HP bar colour: toxic green → sickly yellow → orange → dark red
  const hpColor = hpPct > 0.6
    ? 'linear-gradient(180deg,#6edc3a,#3a8a18)'
    : hpPct > 0.35
    ? 'linear-gradient(180deg,#d4b430,#8a6e10)'
    : hpPct > 0.15
    ? 'linear-gradient(180deg,#d46820,#7a3008)'
    : 'linear-gradient(180deg,#cc2828,#6e0c0c)';
  const hpGlow = hpPct > 0.6 ? 'rgba(80,200,40,.5)' : hpPct > 0.35 ? 'rgba(200,160,20,.5)' : hpPct > 0.15 ? 'rgba(200,90,20,.5)' : 'rgba(200,30,30,.6)';

  return (
    <div className="combat-zone" onClick={handleClick}>
      {/* enemy */}
      <div className={`enemy enemy--stage-${stage}${isDead ? ' enemy--dead' : ''}`}>
        <div className={`enemy__sprite${isDead || hitFlash ? ' enemy__sprite--hurt' : ''}`} />
        <div className="enemy__level">LVL {enemyLevel}</div>
      </div>

      {/* HP bar */}
      <div className="enemy__hp-track">
        <div className="enemy__hp-inner">
          <div
            className="enemy__hp-bar"
            style={{ width: `${hpPct * 100}%`, background: hpColor, boxShadow: `0 0 10px ${hpGlow}, inset 0 1px 0 rgba(255,255,255,.2)` }}
          />
          <span className="enemy__hp-label">
            {isDead ? '— DEAD —' : `${fmt(Math.ceil(enemyHp))} / ${fmt(enemyMaxHp)}`}
          </span>
        </div>
      </div>

      {/* floating damage numbers */}
      {floats.map(f => (
        <span
          key={f.id}
          className={`combat-float combat-float--${f.type || 'dmg'}`}
          style={{ left: f.x, top: f.y }}
        >
          {f.text}
        </span>
      ))}

      {/* lootbox drop indicators */}
      {drops.map(d => (
        <div key={d.id} className={`lootbox-drop lootbox-drop--${d.rarity}`}>
          {d.rarity.toUpperCase()} BOX!
        </div>
      ))}

      {!enemyMaxHp && (
        <div className="combat-zone__hint">
          Click to start fighting!
        </div>
      )}
    </div>
  );
}
