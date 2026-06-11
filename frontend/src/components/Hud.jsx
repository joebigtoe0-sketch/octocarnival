import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CREW_DEFS, crewCost, totalCrewDps, clickDamageBase } from '../constants/crew.js';
import { RARITY_COLORS } from '../constants/traits.js';
import { ACHIEVEMENTS } from '../constants/achievements.js';
import { useGameStore, RECHARGE_SEC } from '../stores/gameStore.js';
import RatSprite from './RatSprite.jsx';
import { playSound } from '../audio.js';

/**
 * Portal tooltip — renders at viewport level (position:fixed) so it always
 * escapes overflow:auto/hidden containers like .roster__list.
 * Positioned at mouse coordinates, so it works regardless of CSS layout.
 */
function CrewTip({ text, x, y }) {
  if (!text) return null;
  return createPortal(
    <div className="crew-tooltip" style={{ top: y, left: x }}>
      {text.split('\n').map((l, i) => <span key={i}>{l}</span>)}
    </div>,
    document.body
  );
}

function useTip() {
  const [tip, setTip] = useState({ text: null, x: 0, y: 0 });
  // show(text, mouseEvent) — call from onMouseEnter
  const show = useCallback((text, e) => {
    setTip({ text, x: e.clientX, y: e.clientY - 8 });
  }, []);
  const hide = useCallback(() => setTip(t => ({ ...t, text: null })), []);
  const node = <CrewTip text={tip.text} x={tip.x} y={tip.y} />;
  return { show, hide, node };
}

function fmtN(n) { return window.fmtNum ? window.fmtNum(n) : String(Math.floor(n)); }

/** Renders a game icon — image path ('/assets/...') or emoji/text fallback */
function GameIcon({ src, alt = '', cls = '' }) {
  if (src && src.startsWith('/')) return <img src={src} alt={alt} className={cls} />;
  return <span className={cls}>{src}</span>;
}

function CoinIcon({ cls = '' }) {
  return <img src="/assets/icons/coins.png" alt="coins" className={cls} />;
}

function Rivets() {
  return <><i className="rivet-b" /><i className="rivet-c" /></>;
}

function usePop(dep) {
  const [cls, setCls] = React.useState('');
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) { first.current = false; return; }
    setCls('pop');
    const t = setTimeout(() => setCls(''), 300);
    return () => clearTimeout(t);
  }, [dep]);
  return cls;
}

function CoinPlate({ coins }) {
  const pop = usePop(Math.floor(coins));
  return (
    <div className="plate coinplate">
      <Rivets />
      <CoinIcon cls="ico" />
      <span className={`val statnum ${pop}`}>{fmtN(coins)}</span>
    </div>
  );
}

function DiamondPlate({ diamonds }) {
  const pop = usePop(Math.floor(diamonds));
  return (
    <div className="plate coinplate coinplate--diamond">
      <Rivets />
      <img src="/assets/icons/diamond.png" alt="diamonds" className="ico diamond-ico" />
      <span className={`val statnum ${pop}`}>{fmtN(diamonds)}</span>
    </div>
  );
}

function NavBtn({ label, variant, notif, onClick }) {
  return (
    <button
      className={`plate navbtn${variant ? ` navbtn--${variant}` : ''}`}
      onClick={onClick}
      style={{ position: 'relative' }}
    >
      <Rivets />{label}
      {notif && <span className="navnotif" />}
    </button>
  );
}

function ExpPlate({ level, exp, expToNext }) {
  const pct = Math.max(0, Math.min(100, (exp / expToNext) * 100));
  return (
    <div className="plate expplate">
      <Rivets />
      <div className="row">
        <span className="lv">LVL {level}</span>
        <span className="xp statnum">{fmtN(exp)} / {fmtN(expToNext)} XP</span>
      </div>
      <div className="bar"><div className="bar__fill" style={{ width: pct + '%' }} /></div>
    </div>
  );
}

// Cooldown countdown hook — re-renders every second while any cooldown is active
function useCooldownTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const h = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(h);
  }, []);
}

// Active skill button — rendered separately to the LEFT of passive milestones
function ActiveSkillBtn({ def, level, coins, skillCooldowns, activeBoosts, onActivateSkill, unlockedMilestones, onUnlockMilestone, onShowTip, onHideTip }) {
  useCooldownTick();
  const milestones = def.milestones || [];
  const mi = milestones.findIndex(m => m.type === 'active');
  const m  = milestones[mi];
  if (!m) return <div className="crewrow__active-placeholder" />;

  const key        = `${def.id}_${mi}`;
  const levelMet   = level >= m.level;
  const paid       = !!unlockedMilestones?.[key];
  const canPay     = levelMet && !paid && coins >= m.cost;
  const cantAfford = levelMet && !paid && coins < m.cost;
  const fmt        = n => window.fmtNum ? window.fmtNum(n) : n;

  if (!paid) {
    const tip = levelMet
      ? `${m.name} — ${m.desc}\n${fmt(m.cost)} coins to unlock`
      : `Lv.${m.level}: ${m.name}\n${m.desc}`;
    return (
      <div
        className="tip-wrap"
        onMouseEnter={e => onShowTip?.(tip, e)}
        onMouseLeave={onHideTip}
      >
        <button
          className={`crewrow__active crew-skill-btn crew-skill-btn--locked${canPay ? ' crew-skill-btn--buyable' : ''}`}
          disabled={!canPay}
          onClick={canPay ? () => { playSound('coins'); onUnlockMilestone(def.id, mi); } : undefined}
        >
          <span className="crew-skill-btn__icon">
            <GameIcon src={m.icon} alt={m.name} cls={`crew-skill-btn__img${!levelMet ? ' crew-skill-btn__img--locked' : ''}`} />
          </span>
          {levelMet  && <span className="crew-skill-btn__cd">{cantAfford ? '$$' : 'BUY'}</span>}
          {!levelMet && <span className="crew-milestone__lv crew-milestone__lv--white">{m.level}</span>}
        </button>
      </div>
    );
  }

  // Unlocked — show the activatable button
  const now        = Date.now();
  const lastUsed   = skillCooldowns?.[def.id] || 0;
  const cdMs       = m.cooldown * 1000;
  const elapsed    = now - lastUsed;
  const onCooldown = elapsed < cdMs;
  const cdSec      = Math.ceil((cdMs - elapsed) / 1000);
  const isBoostActive = activeBoosts?.[def.id]?.expiresAt > now;
  const pct        = onCooldown ? ((cdMs - elapsed) / cdMs) * 100 : 0;
  const tip = onCooldown
    ? `${m.name} — ${cdSec}s\n${m.desc}`
    : isBoostActive
      ? `${m.name} — ACTIVE\n${m.desc}`
      : `${m.name}\n${m.desc}\nCD: ${m.cooldown}s`;

  return (
    <div
      className="tip-wrap"
      onMouseEnter={e => onShowTip?.(tip, e)}
      onMouseLeave={onHideTip}
    >
      <button
        className={`crewrow__active crew-skill-btn${isBoostActive ? ' crew-skill-btn--active' : ''}${onCooldown && !isBoostActive ? ' crew-skill-btn--cooldown' : ''}`}
        disabled={onCooldown}
        onClick={!onCooldown ? () => onActivateSkill(def.id) : undefined}
        style={onCooldown ? { '--cd-pct': `${pct}%` } : undefined}
      >
        <span className="crew-skill-btn__icon">
          <GameIcon src={m.icon} alt={m.name} cls="crew-skill-btn__img" />
        </span>
        {onCooldown && !isBoostActive && <span className="crew-skill-btn__cd">{cdSec}s</span>}
        {isBoostActive && <span className="crew-skill-btn__active-pulse" />}
      </button>
    </div>
  );
}

// Passive milestone badges only (active skill is rendered via ActiveSkillBtn)
function MilestoneSlots({ def, level, coins, unlockedMilestones, onUnlockMilestone, onShowTip, onHideTip }) {
  const milestones = def.milestones || [];
  const fmt = n => window.fmtNum ? window.fmtNum(n) : n;

  return (
    <div className="crew-milestones">
      {milestones.map((m, i) => {
        if (m.type === 'active') return null; // handled by ActiveSkillBtn

        const key        = `${def.id}_${i}`;
        const levelMet   = level >= m.level;
        const paid       = !!unlockedMilestones?.[key];
        const canPay     = levelMet && !paid && coins >= m.cost;
        const cantAfford = levelMet && !paid && coins < m.cost;

        if (!paid) {
          const tip = levelMet
            ? `${m.desc}\n${fmt(m.cost)} coins to unlock`
            : `Reach Lv.${m.level}\n${m.desc}`;
          return (
            <div
              key={i}
              className="tip-wrap"
              onMouseEnter={e => onShowTip?.(tip, e)}
              onMouseLeave={onHideTip}
            >
              <button
                className={`crew-milestone${canPay ? ' crew-milestone--buyable' : ''}${cantAfford ? ' crew-milestone--locked' : ''}`}
                disabled={!canPay}
                onClick={canPay ? () => { playSound('coins'); onUnlockMilestone(def.id, i); } : undefined}
              >
                <GameIcon src={m.icon} alt={m.desc} cls={`crew-milestone__icon${!levelMet ? ' crew-milestone__icon--locked' : ''}`} />
                {!levelMet && <span className="crew-milestone__lv crew-milestone__lv--white">{m.level}</span>}
              </button>
            </div>
          );
        }
        return (
          <div
            key={i}
            className="crew-milestone crew-milestone--unlocked"
            onMouseEnter={e => onShowTip?.(m.desc, e)}
            onMouseLeave={onHideTip}
          >
            <GameIcon src={m.icon} alt={m.desc} cls="crew-milestone__icon" />
          </div>
        );
      })}
    </div>
  );
}

// ── Active-boosts sidebar ──────────────────────────────────────────────────────
function ActiveBoostsPanel({ itemBoosts = {}, crewBoosts = {} }) {
  const [, setTick] = useState(0);
  const [tip, setTip] = useState({ text: null, x: 0, y: 0 });

  useEffect(() => {
    const h = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(h);
  }, []);

  const now = Date.now();
  const rows = [];

  Object.entries(itemBoosts).forEach(([key, b]) => {
    const ms = b.expiresAt - now;
    if (ms > 0) rows.push({ id: key, icon: b.icon, name: b.name, ms });
  });

  Object.entries(crewBoosts).forEach(([crewId, b]) => {
    const ms = b.expiresAt - now;
    if (ms > 0) {
      const def   = CREW_DEFS.find(d => d.id === crewId);
      const skill = def?.milestones?.find(m => m.type === 'active');
      if (def && skill) rows.push({ id: crewId, icon: skill.icon, name: skill.name || def.name, desc: skill.desc, ms });
    }
  });

  if (rows.length === 0) return null;

  const fmtMs = ms => {
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
  };

  return (
    <>
      {/* Tooltip portal */}
      {tip.text && createPortal(
        <div className="crew-tooltip" style={{ top: tip.y, left: tip.x }}>{tip.text.split('\n').map((l, i) => <span key={i}>{l}</span>)}</div>,
        document.body
      )}
      <div className="plate active-boosts-panel">
        <Rivets />
        <div className="active-boosts__hd">ACTIVE</div>
        <div className="active-boosts__grid">
          {rows.map(r => (
            <div
              key={r.id}
              className="active-boost-tile"
              onMouseEnter={e => setTip({ text: `${r.name} (${fmtMs(r.ms)})${r.desc ? '\n' + r.desc : ''}`, x: e.clientX, y: e.clientY - 8 })}
              onMouseLeave={() => setTip({ text: null, x: 0, y: 0 })}
            >
              <GameIcon src={r.icon} alt={r.name} cls="active-boost-tile__icon" />
              <span className="active-boost-tile__time">{fmtMs(r.ms)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function CrewRoster({ crewCounts, crewLevels, coins, stats, onHire, onLevelUpCrew, onActivateSkill, skillCooldowns, activeBoosts, unlockedMilestones, onUnlockMilestone, prestigeLevel, baseRats, crewLeaderId, onAssignLeader }) {
  const totalDps = totalCrewDps(crewCounts, crewLevels, (stats?.dps || 0) * 0.25, {}, unlockedMilestones, prestigeLevel);
  const { show: showTip, hide: hideTip, node: tipNode } = useTip();

  const leaderRat = crewLeaderId ? (baseRats || []).find(r => r.id === crewLeaderId) : null;
  const leaderSeed = leaderRat?.id
    ? leaderRat.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    : 0;

  return (
    <div className="plate roster">
      {tipNode}
      <Rivets />
      <div className="roster__hd">
        <span>CREW</span>
        <span className="roster__rate">+{fmtN(totalDps)} DPS</span>
      </div>
      <div className="roster__list">
      {/* Crew leader row — shown at the top, always visible */}
      {leaderRat ? (
        <div className="crewrow crewrow--leader">
          {/* col 1 — portrait with RatSprite */}
          <div className="crewrow__portrait crewrow__portrait--leader">
            <RatSprite
              activeSlots={leaderRat.traits.filter(Boolean)}
              height={44}
              seed={leaderSeed}
            />
          </div>
          {/* col 2 — spacer to match active-skill column */}
          <div className="crewrow__active-placeholder" />
          {/* col 3 — name + sub */}
          <div className="crewrow__mid">
            <div className="crewrow__info">
              <div className="crewrow__name" style={{ color: 'var(--gold)' }}>
                {leaderRat.name}
              </div>
              <div className="crewrow__sub" style={{ color: '#c8a830' }}>CREW LEADER</div>
            </div>
          </div>
          {/* col 4 — unassign button */}
          <button
            className="crewrow__lvlbtn"
            style={{ fontSize: 9, padding: '4px 8px', alignSelf: 'center' }}
            onClick={() => onAssignLeader && onAssignLeader(leaderRat.id)}
            title="Remove crew leader"
          >
            UNASSIGN
          </button>
        </div>
      ) : (
        <div className="crewrow crewrow--leader-empty">
          <div className="crewrow__leader-empty-text">
            <span className="crewrow__leader-empty-title">No crew leader assigned</span>
            <span className="crewrow__leader-empty-sub">Assign one in your Base</span>
          </div>
        </div>
      )}
      {CREW_DEFS.map(def => {
        const isActive  = def.type === 'active';
        const count     = crewCounts[def.id] || 0;
        const crewLv    = crewLevels[def.id] || 0;
        // For active crew milestones track their level; for passive crew track count
        const milestoneLevel = isActive ? crewLv : count;
        const rawCost   = crewCost(def, isActive ? crewLv : count);
        const influence = stats?.influence || 0;
        const discount  = Math.min(influence * 0.0025, 0.50); // 0.25% per point, matches gameStore
        const cost      = Math.max(1, Math.floor(rawCost * (1 - discount)));
        const canAfford = coins >= cost;
        // Actual DPS this crew type contributes right now (mirrors totalCrewDps formula)
        let unitDps = null;
        if (!isActive && count > 0) {
          const scaleMult  = 1 + 0.06 * count + 0.005 * count * count;
          let ownDpsBonus  = 0;
          def.milestones?.forEach((m, i) => {
            if (m.stat === 'ownDps' && count >= m.level && unlockedMilestones?.[`${def.id}_${i}`]) {
              ownDpsBonus += m.value;
            }
          });
          unitDps = def.dps * scaleMult * (1 + ownDpsBonus / 100) * count;
        }

        return (
          <div key={def.id} className="crewrow">
            {/* col 1, rows 1-2 — portrait */}
            <div className="crewrow__portrait">
              <img src={def.portrait || '/assets/rat.png'} alt={def.name} />
            </div>

            {/* col 2, rows 1-2 — active skill button */}
            <ActiveSkillBtn
              def={def}
              level={milestoneLevel}
              coins={coins}
              skillCooldowns={skillCooldowns}
              activeBoosts={activeBoosts}
              onActivateSkill={onActivateSkill}
              unlockedMilestones={unlockedMilestones}
              onUnlockMilestone={onUnlockMilestone}
              onShowTip={showTip}
              onHideTip={hideTip}
            />

            {/* col 3, row 1 — name + sub */}
            <div className="crewrow__mid">
              <div className="crewrow__info">
                <div className="crewrow__name">{def.name}</div>
                <div className="crewrow__sub">
                  {isActive
                    ? `Lv.${crewLv} · ×${1 + crewLv * 3} click dmg`
                    : count > 0
                      ? `×${count} · ${fmtN(unitDps)} DPS`
                      : def.flavour.slice(0, 30) + '…'}
                </div>
              </div>
            </div>

            {/* col 3, row 2 — passive milestone slots */}
            <MilestoneSlots
              def={def}
              level={milestoneLevel}
              coins={coins}
              unlockedMilestones={unlockedMilestones}
              onUnlockMilestone={onUnlockMilestone}
              onShowTip={showTip}
              onHideTip={hideTip}
            />

            {/* col 4, rows 1-2 — LVL UP button */}
            {(() => {
              // Build tooltip for LVL UP button
              let lvlTip = null;
              if (!isActive && count >= 0) {
                const nextCount = count + 1;
                const scaleNext = 1 + 0.06 * nextCount + 0.005 * nextCount * nextCount;
                let ownBonus = 0;
                def.milestones?.forEach((m, i) => {
                  if (m.stat === 'ownDps' && nextCount >= m.level && unlockedMilestones?.[`${def.id}_${i}`])
                    ownBonus += m.value;
                });
                const nextDps  = def.dps * scaleNext * (1 + ownBonus / 100) * nextCount;
                const deltaDps = Math.round(nextDps - (unitDps || 0));
                lvlTip = count === 0
                  ? `Hire first ${def.name}\n+${fmtN(def.dps)} DPS base`
                  : `Next hire → +${fmtN(deltaDps)} DPS\nTotal: ${fmtN(nextDps)} DPS`;
              } else if (isActive) {
                const nextLv  = crewLv + 1;
                const curDmg  = clickDamageBase(crewLv);
                const nextDmg = clickDamageBase(nextLv);
                lvlTip = crewLv === 0
                  ? `Hire ${def.name}\nUnlocks click boosting`
                  : `Lv.${nextLv}: +${fmtN(nextDmg - curDmg)} base click dmg\nTotal: ${fmtN(nextDmg)} per click`;
              }
              return (
                <div
                  className="tip-wrap"
                  onMouseEnter={lvlTip ? e => showTip(lvlTip, e) : undefined}
                  onMouseLeave={hideTip}
                >
                  <button
                    className={`crewrow__lvlbtn${canAfford ? ' crewrow__lvlbtn--can' : ''}`}
                    disabled={!canAfford}
                    onClick={() => {
                      if (isActive) { playSound('crewLevel'); onLevelUpCrew(def.id, influence); }
                      else { playSound('crewLevel'); onHire(def.id, influence); }
                    }}
                  >
                    <span className="crewrow__lvlbtn-label">
                      {isActive ? (crewLv === 0 ? 'HIRE' : 'LVL UP') : (count === 0 ? 'HIRE' : 'LVL UP')}
                    </span>
                    <span className="crewrow__lvlbtn-cost">
                      <CoinIcon cls="crewrow__coin-ico" />{fmtN(cost)}
                    </span>
                  </button>
                </div>
              );
            })()}
          </div>
        );
      })}
      </div>
    </div>
  );
}

/* ── Inline editable rat name ── */
function InlineName({ value, onSave, className }) {
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
        className={`inline-name-input${className ? ` ${className}` : ''}`}
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
    <div className={`inline-name${className ? ` ${className}` : ''}`} onClick={start} title="Click to rename">
      {value}
      <span className="inline-name__pencil">✎</span>
    </div>
  );
}

function YourRatPanel({ name, equippedCount, sellValue, sellCharges, maxSellCharges, onSell, onSendBase, traits, baseIsFull, onRename }) {
  const [shake, setShake] = useState(false);
  const [hoverSell, setHoverSell] = useState(false);
  const canSell = sellCharges >= 1 && sellValue > 0;

  // Live countdown to the next charge (panel re-renders 4×/s from the recharge tick)
  const stealth     = useGameStore(s => s.stats.stealth);
  const rechargeMul = useGameStore(s => s.sellRechargeMul);
  const noCharges   = sellCharges < 1;
  const speedBonus  = (1 + (stealth || 0) / 100) * (rechargeMul || 1);
  const secsToNext  = Math.max(1, Math.ceil(((1 - (sellCharges % 1)) * RECHARGE_SEC) / speedBonus));

  const handleSell = () => {
    if (canSell) { playSound('coins'); onSell(); }
    else { setShake(true); setTimeout(() => setShake(false), 320); }
  };

  return (
    <div className="yourrat plate">
      <Rivets />
      <div className="yourrat__layout">
        <div className="yourrat__portrait">
          <RatSprite
            activeSlots={(traits || []).filter(Boolean).map(t => ({ slotName: t.slotName, rarity: t.rarity, variantSeed: t.variantSeed }))}
            className="yourrat__sprite"
          />
          {traits && (
            <div className="yourrat__trait-dots">
              {traits.map((t, i) => t ? (
                <span
                  key={i}
                  className="trait-dot"
                  style={{ background: RARITY_COLORS[t.rarity] }}
                  title={`${t.slotName}: ${t.name}`}
                />
              ) : null)}
            </div>
          )}
        </div>
        <div className="yourrat__right">
          <div className="yourrat__hd"><span>YOUR RAT</span><span className="tag">ON DUTY</span></div>
          <InlineName value={name} onSave={onRename} className="yourrat__nm" />
          <div className="yourrat__gear">{equippedCount} / 16 traits</div>
          <button className="ratbtn" onClick={() => { if (!baseIsFull) playSound('sendBase'); onSendBase(); }} disabled={baseIsFull} title={baseIsFull ? 'Base is full' : undefined}>
            {baseIsFull ? 'BASE FULL' : 'SEND TO BASE'}
          </button>
          <div
            className="sellbtn-wrap"
            onMouseEnter={() => setHoverSell(true)}
            onMouseLeave={() => setHoverSell(false)}
          >
            <button className={`sellbtn${shake ? ' shake' : ''}`} onClick={handleSell} disabled={!canSell}>
              SELL <CoinIcon cls="ico" /> {fmtN(sellValue)}
            </button>
            {hoverSell && noCharges && (
              <div className="sellbtn-tip">
                No sell charges left!{'\n'}Next charge ready in {secsToNext}s
              </div>
            )}
          </div>
          <div className="charges">
            {Array.from({ length: maxSellCharges }, (_, i) => {
              const f = Math.max(0, Math.min(1, sellCharges - i));
              const charging = f > 0 && f < 1;
              return (
                <div key={i} className={`charge${charging ? ' charge--charging' : ''}`}>
                  <div className="charge__fill" style={{ width: `${f * 100}%` }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const RARITY_ORDER = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];

function ItemTile({ icon, label, qty, rarity, onUse, dim }) {
  const [tipPos, setTipPos] = React.useState(null);
  return (
    <div
      className={`inv-tile inv-tile--${rarity || 'none'}${onUse ? ' inv-tile--openable' : ''}${dim ? ' inv-tile--dim' : ''}`}
      onClick={onUse || undefined}
      style={{ cursor: onUse ? 'pointer' : 'default' }}
      onMouseEnter={e => setTipPos({ x: e.clientX, y: e.clientY - 8 })}
      onMouseLeave={() => setTipPos(null)}
    >
      <GameIcon src={icon} alt={label} cls="inv-tile__icon" />
      <span className="inv-tile__qty">×{qty}</span>
      {tipPos && label && createPortal(
        <div className="crew-tooltip" style={{ top: tipPos.y, left: tipPos.x }}>
          <span>{label}</span>
        </div>,
        document.body
      )}
    </div>
  );
}

function ItemsDrawer({ open, onToggle, inventory, keys, lootboxes, onUseItem, onOpenLootbox }) {
  const itemTotal = (inventory || []).reduce((s, i) => s + i.quantity, 0);
  const keyTotal  = Object.values(keys || {}).reduce((s, n) => s + n, 0);
  const boxTotal  = Object.values(lootboxes || {}).reduce((s, n) => s + n, 0);
  const total     = itemTotal + keyTotal + boxTotal;

  const hasAnything = total > 0;

  // clicking a key or box opens lootbox flow if matching partner exists
  const handleKeyClick  = r => { if (lootboxes[r] > 0) { playSound('uiClick'); onOpenLootbox(r); } };
  const handleBoxClick  = r => { if (keys[r] > 0)      { playSound('uiClick'); onOpenLootbox(r); } };

  // tooltip hint
  const keyTip  = r => lootboxes[r] > 0
    ? `${r.toUpperCase()} KEY ×${keys[r]}\nClick to open ${r} lootbox!`
    : `${r.toUpperCase()} KEY ×${keys[r]}\nNeed a ${r} lootbox`;
  const boxTip  = r => keys[r] > 0
    ? `${r.toUpperCase()} BOX ×${lootboxes[r]}\nClick to open with ${r} key!`
    : `${r.toUpperCase()} BOX ×${lootboxes[r]}\nNeed a ${r} key`;

  return (
    <div className={`itemsdrawer${open ? ' is-open' : ''}`}>
      <div className="itemsdrawer__panel">
        <div className="stash__hd">
          <span>ITEMS</span>
          <span className="cap">{total} total</span>
        </div>

        {!hasAnything ? (
          <div className="items-empty">
            <span>No items yet.</span>
            <span style={{ opacity: .6 }}>Buy from the SHOP!</span>
          </div>
        ) : (
          <>
            {keyTotal > 0 && (
              <div className="inv-section">
                <div className="inv-section__hd">KEYS</div>
                <div className="inv-grid">
                  {RARITY_ORDER.map(r => keys[r] > 0 && (
                    <ItemTile key={r} icon={`/assets/icons/key_${r}.png`} label={keyTip(r)} qty={keys[r]} rarity={r}
                      onUse={lootboxes[r] > 0 ? () => handleKeyClick(r) : undefined}
                      dim={!lootboxes[r]}
                    />
                  ))}
                </div>
              </div>
            )}

            {boxTotal > 0 && (
              <div className="inv-section">
                <div className="inv-section__hd">LOOTBOXES</div>
                <div className="inv-grid">
                  {RARITY_ORDER.map(r => lootboxes[r] > 0 && (
                    <ItemTile key={r} icon={`/assets/icons/chest_${r}.png`} label={boxTip(r)} qty={lootboxes[r]} rarity={r}
                      onUse={keys[r] > 0 ? () => handleBoxClick(r) : undefined}
                      dim={!keys[r]}
                    />
                  ))}
                </div>
              </div>
            )}

            {inventory && inventory.length > 0 && (
              <div className="inv-section">
                <div className="inv-section__hd">CONSUMABLES</div>
                <div className="inv-grid">
                  {inventory.map(item => (
                    <ItemTile
                      key={item.key}
                      icon={item.icon}
                      label={item.effect ? `${item.name} — ${item.effect}` : item.name}
                      qty={item.quantity}
                      rarity={item.rarity}
                      onUse={() => { playSound('uiClick'); onUseItem(item.key); }}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <button className="itemstab" onClick={() => { playSound('uiClick'); onToggle(); }}><b>ITEMS</b></button>
    </div>
  );
}

function GalleryNavBtn({ onOpenPopup }) {
  const state = useGameStore();
  const claimedSet = new Set(state.claimedAchievements || []);
  const readyCount = ACHIEVEMENTS.filter(a => !claimedSet.has(a.id) && a.check(state)).length;
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <NavBtn label="GALLERY" onClick={() => { playSound('uiClick'); onOpenPopup('GALLERY'); }} />
      {readyCount > 0 && (
        <span className="navbtn-badge">{readyCount}</span>
      )}
    </div>
  );
}

export default function Hud({
  fmtNum, coins, diamonds, exp, expToNext, level,
  crewCounts, crewLevels, stats, onHire, onLevelUpCrew, onActivateSkill, skillCooldowns, activeBoosts, itemBoosts,
  unlockedMilestones, onUnlockMilestone, prestigeLevel,
  onOpenSettings, onOpenPopup,
  ratName, equippedCount, sellValue, sellCharges, maxSellCharges, onSell, onSendBase,
  itemsOpen, onToggleItems, traits, baseIsFull,
  inventory, keys, lootboxes, onUseItem, onOpenLootbox,
  isGuest, username, onOpenAuth,
  onRenameRat,
  baseRats, crewLeaderId, onAssignLeader,
}) {
  return (
    <div className="hud">
      {/* Guest CTA — centered at very top of stage */}
      {isGuest && (
        <button className="hud-guest-cta" onClick={() => onOpenAuth('register')}>
          <span className="hud-guest-cta__dot" />
          SAVE PROGRESS — Create free account
        </button>
      )}

      <div className="hud__topleft">
        <div className="topbar">
          <CoinPlate coins={coins} />
          <DiamondPlate diamonds={diamonds || 0} />
          <NavBtn label="SHOP"     variant="shop"   onClick={() => { playSound('uiClick'); onOpenPopup('SHOP'); }} />
          <NavBtn label="BOUNTIES" variant="bounty" onClick={() => { playSound('uiClick'); onOpenPopup('BOUNTIES'); }} />
        </div>
        <ExpPlate level={level} exp={exp} expToNext={expToNext} />
      </div>

      <div className="hud__topright">
        <NavBtn label="STATS"   onClick={() => { playSound('uiClick'); onOpenPopup('STATS'); }} />
        <GalleryNavBtn onOpenPopup={onOpenPopup} />
        <NavBtn label="BASE"    onClick={() => { playSound('uiClick'); onOpenPopup('BASE'); }} />
        <div className="plate gearbtn" onClick={() => { playSound('uiClick'); onOpenSettings(); }} title="Settings">
          <Rivets /><div className="gear"><span className="gearglyph">⚙</span></div>
        </div>
      </div>

      <div className="hud__roster">
        <ActiveBoostsPanel itemBoosts={itemBoosts} crewBoosts={activeBoosts} />
        <CrewRoster
          crewCounts={crewCounts}
          crewLevels={crewLevels}
          coins={coins}
          stats={stats}
          onHire={onHire}
          onLevelUpCrew={onLevelUpCrew}
          onActivateSkill={onActivateSkill}
          skillCooldowns={skillCooldowns}
          activeBoosts={activeBoosts}
          unlockedMilestones={unlockedMilestones}
          onUnlockMilestone={onUnlockMilestone}
          prestigeLevel={prestigeLevel}
          baseRats={baseRats}
          crewLeaderId={crewLeaderId}
          onAssignLeader={onAssignLeader}
        />
      </div>

      <YourRatPanel
        name={ratName}
        equippedCount={equippedCount}
        sellValue={sellValue}
        sellCharges={sellCharges}
        maxSellCharges={maxSellCharges || 3}
        onSell={onSell}
        onSendBase={onSendBase}
        traits={traits}
        baseIsFull={baseIsFull}
        onRename={onRenameRat}
      />

      <ItemsDrawer
        open={itemsOpen}
        onToggle={onToggleItems}
        inventory={inventory}
        keys={keys}
        lootboxes={lootboxes}
        onUseItem={onUseItem}
        onOpenLootbox={onOpenLootbox}
      />

    </div>
  );
}
