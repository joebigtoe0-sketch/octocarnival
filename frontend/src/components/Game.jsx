import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../stores/gameStore.js';
import { useUiStore }   from '../stores/uiStore.js';
import { totalCrewDps, clickDamageBase, scrapperClickBonus } from '../constants/crew.js';
import { computeLeaderBoosts } from '../constants/leaderTraits.js';
import Scene            from './Scene.jsx';
import Hud              from './Hud.jsx';
import LevelUpCards     from './LevelUpCards.jsx';
import StatsPanel       from './StatsPanel.jsx';
import BasePanel        from './BasePanel.jsx';
import ShopPanel        from './ShopPanel.jsx';
import GalleryPanel     from './GalleryPanel.jsx';
import BountyPanel      from './BountyPanel.jsx';
import AuthModal        from './AuthModal.jsx';
import { SOCIAL_LINKS } from './LandingPage.jsx';
import LootboxModal     from './LootboxModal.jsx';
import RotatePrompt     from './RotatePrompt.jsx';
import { startMusic, playSound, skipTrack, getAudioSettings, subscribeAudio,
         setMusicVolume, setSfxVolume, setMusicMuted, setSfxMuted } from '../audio.js';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

const STAGE_W      = 2000;
const STAGE_H      = 1000;
const STAGE_CORE_W = STAGE_W;  // core now fills the full stage — no bleed
const STAGE_CORE_H = STAGE_H;
const BLEED_X      = (STAGE_W - STAGE_CORE_W) / 2; // 0
const BLEED_Y      = (STAGE_H - STAGE_CORE_H) / 2; // 0
const DIR          = 'A';
const GRIME_OPAC   = 0.46;
const PARADE_COUNT = 7;

function fmtNum(n) {
  n = Math.floor(n);
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return '' + n;
}

window.fmtNum = fmtNum;

const STAT_LABELS = {
  luck: 'Luck', cardLuck: 'Card Luck', rate: 'Rate', speed: 'Speed',
  greed: 'Greed', stealth: 'Stealth', dps: 'Crew DPS',
  clickPower: 'Click Power', influence: 'Influence',
  wild_crew: 'All Crew Lvl', wild_reroll: 'Reroll', wild_lootbox: 'Rare Lootbox', wild_exp: 'EXP',
};

function showOfflineToast(result) {
  if (!result || result.levelsGained === 0) return;
  const { levelsGained, kills, appliedCards = [], elapsedSec } = result;
  const hrs  = Math.floor(elapsedSec / 3600);
  const mins = Math.floor((elapsedSec % 3600) / 60);
  const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;

  // Build a short stat-gain summary from applied cards
  const gained = {};
  for (const card of appliedCards) {
    const label = STAT_LABELS[card.stat] || card.stat;
    gained[label] = (gained[label] || 0) + (card.value || 1);
  }
  const statLines = Object.entries(gained).map(([k, v]) => `+${v} ${k}`).join(' · ');

  useUiStore.getState().addToast({
    rarity: levelsGained >= 5 ? 'epic' : 'rare',
    name: `AFK ${timeStr}: +${levelsGained} levels, ${kills} kills`,
    slotName: statLines || 'Cards auto-applied',
  });
}

export default function Game() {
  const store = useGameStore();
  const ui    = useUiStore();

  // Merge base stats with the crew leader's trait bonuses — memoized so it
  // only recalculates when stats / baseRats / crewLeaderId actually change.
  const leaderBoosts = useMemo(
    () => computeLeaderBoosts(store.baseRats, store.crewLeaderId),
    [store.baseRats, store.crewLeaderId]
  );
  const effectiveStats = useMemo(
    () => Object.fromEntries(
      Object.keys(store.stats).map(k => [k, (store.stats[k] || 0) + (leaderBoosts[k] || 0)])
    ),
    [store.stats, leaderBoosts]
  );
  // Keep a ref so stable interval callbacks always see the latest value
  const effectiveStatsRef = useRef(effectiveStats);
  useEffect(() => { effectiveStatsRef.current = effectiveStats; }, [effectiveStats]);

  // ---- ephemeral visual state ----
  const [floats,       setFloats]       = useState([]);
  const [drops,        setDrops]        = useState([]);
  const [expParticles, setExpParticles] = useState([]);
  // activeBoosts: { crewId: { expiresAt, multiplier, allCrew } }
  const [activeBoosts, setActiveBoosts] = useState({});
  const idRef          = useRef(1);
  const nid            = () => idRef.current++;
  // Guard: prevents the 250ms tick from triggering the death sequence multiple
  // times during the 500ms window between kill and the next spawnEnemy() call.
  const enemyDeadRef    = useRef(false);
  // Refs so particle callbacks never go stale
  const particleExpRef  = useRef({});   // id → exp amount
  const collectedRef    = useRef(new Set());

  // Item boost refs (avoid stale closure in intervals)
  const clickBoostRef   = useRef(1.0);
  const boostTimersRef  = useRef({});
  // Active bell: null or rarity threshold ('uncommon'|'rare'|'epic')
  const activeBellRef   = useRef(null);

  // Reactive item-boost state — drives the ActiveBoostsPanel display
  const [itemBoosts, setItemBoosts] = useState({});

  // ── Diamond spawn state ────────────────────────────────────────────────────
  // A diamond is a collectible that randomly appears on screen.
  // Each minute: chance increases by 2% (2%, 4%, 6%…) until it spawns.
  // Only 1 diamond can exist at a time; after collection the timer resets.
  const [diamond, setDiamond] = useState(null); // null | { x, y, id, flying? }
  const diamondTickRef    = useRef({ minutes: 0, spawned: false });
  const diamondFlyingRef  = useRef(false); // guard against double-collect

  useEffect(() => {
    // Tick every 60 seconds; each tick raise chance by 5%
    const h = setInterval(() => {
      const d = diamondTickRef.current;
      if (d.spawned) return; // already on screen, wait for collection
      d.minutes += 1;
      const chance = d.minutes * 0.05; // 5% per minute
      if (Math.random() < chance) {
        d.spawned = true;
        // Spawn in the combat/scene area (avoid extreme edges)
        const x = 300 + Math.random() * 1200;
        const y = 200 + Math.random() * 450;
        setDiamond({ id: Date.now(), x, y });
      }
    }, 60 * 1000);
    return () => clearInterval(h);
  }, []);

  const collectDiamond = useCallback((x, y) => {
    if (diamondFlyingRef.current) return;
    diamondFlyingRef.current = true;

    store.addDiamonds(1);
    diamondTickRef.current = { minutes: 0, spawned: false };
    playSound('gemCollect');

    // +1 float near the diamond
    setFloats(prev => [...prev, {
      id: Date.now(),
      x: x ?? 1000,
      y: (y ?? 400) - 50,
      text: <><img src="/assets/icons/diamond.png" alt="diamond" style={{ width: 14, height: 14, verticalAlign: 'middle', marginRight: 3 }} />+1</>,
      type: 'crit',
    }]);

    // Fly toward the diamond HUD plate (top-right, ~x:1930 y:50 in stage coords)
    setDiamond(prev => prev ? { ...prev, flying: true } : null);
    setTimeout(() => {
      setDiamond(null);
      diamondFlyingRef.current = false;
    }, 700);
  }, [store]);

  /** Start (or refresh) a named boost, update display state, and clean up on expiry. */
  const startItemBoost = useCallback((key, name, icon, durationMs, onExpire) => {
    const expiresAt = Date.now() + durationMs;
    setItemBoosts(prev => ({ ...prev, [key]: { name, icon, expiresAt } }));
    clearTimeout(boostTimersRef.current[key]);
    boostTimersRef.current[key] = setTimeout(() => {
      setItemBoosts(prev => { const n = { ...prev }; delete n[key]; return n; });
      onExpire?.();
    }, durationMs);
  }, []);

  // ---- derived ----
  const sellValue   = store.getSellValue();
  const expToNext   = store.getExpToNext();
  const equipped    = store.activeRat.traits.filter(Boolean).length;
  const baseIsFull  = store.baseRats.length >= store.maxBaseSlots;
  const gamePaused  = store.pendingLevelUp || !!ui.lootbox;

  // ---- CSS accent ----
  useEffect(() => {
    document.documentElement.style.setProperty('--toxic', '#9bdc1f');
  }, []);

  // ---- start background music ----
  useEffect(() => { startMusic(); }, []);

  // ---- cloud save: every 60 seconds + on tab hide when logged in ----
  useEffect(() => {
    const interval = setInterval(() => { store.saveToServer(); }, 60_000);
    const onHide   = () => { if (document.visibilityState === 'hidden') store.saveToServer(); };
    document.addEventListener('visibilitychange', onHide);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onHide); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- level-up sound ----
  const prevPendingRef = useRef(store.pendingLevelUp);
  useEffect(() => {
    if (!prevPendingRef.current && store.pendingLevelUp) playSound('levelUp');
    prevPendingRef.current = store.pendingLevelUp;
  }, [store.pendingLevelUp]);

  // ---- on mount: catch up offline progress, then ensure an enemy exists ----
  useEffect(() => {
    const result = store.processOfflineProgress();
    if (store.enemyMaxHp === 0) store.spawnEnemy();
    showOfflineToast(result);
  }, []);

  // ---- catch up whenever the tab becomes visible again ----
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        const result = store.processOfflineProgress();
        showOfflineToast(result);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  // ---- guest save-progress prompts (3 min / 30 min) ----
  useEffect(() => {
    if (!store.isGuest) return;
    const t3  = setTimeout(() => { if (store.isGuest) ui.showGuestPrompt('3min');  }, 3  * 60 * 1000);
    const t30 = setTimeout(() => { if (store.isGuest) ui.showGuestPrompt('30min'); }, 30 * 60 * 1000);
    return () => { clearTimeout(t3); clearTimeout(t30); };
  }, [store.isGuest]);

  // ---- sell charge recharge (250ms tick) — stable, reads state directly ----
  useEffect(() => {
    const h = setInterval(() => useGameStore.getState().tickSellCharge(), 250);
    return () => clearInterval(h);
  }, []);

  // ---- crew DPS tick + enemy-death detection (250ms, single stable interval) ----
  // Uses getState() so it always reads the latest store values without creating
  // a new interval whenever crew counts or stats change (no stale closures).
  useEffect(() => {
    const h = setInterval(() => {
      const s  = useGameStore.getState();
      const ui = useUiStore.getState();
      const paused = s.pendingLevelUp || !!ui.lootbox;

      // ── enemy-death check (merged in to avoid a separate useEffect) ──
      // enemyDeadRef guards against the 250ms tick firing this 2-3 times during
      // the 500ms window between killEnemy() and the next spawnEnemy() call.
      if (s.enemyHp <= 0 && s.enemyMaxHp > 0 && !paused) {
        if (enemyDeadRef.current) return;
        enemyDeadRef.current = true;
        playSound('enemyPop');
        const result = s.killEnemy();
        if (result?.lootboxDropped) spawnDrop(result.lootboxDropped);
        if (result?.expAmount)      spawnExpParticles(result.expAmount);
        setTimeout(() => {
          enemyDeadRef.current = false;
          useGameStore.getState().spawnEnemy();
        }, 500);
        return;
      }

      if (paused || s.enemyHp <= 0) return;

      // ── DPS damage ──
      const now = Date.now();
      const skillBoosts = {};
      setActiveBoosts(prev => {
        const next = {};
        for (const [id, boost] of Object.entries(prev)) {
          if (boost.expiresAt > now) {
            next[id] = boost;
            if (boost.allCrew) skillBoosts['plague_knight_all'] = boost.multiplier;
            else               skillBoosts[id] = boost.multiplier;
          }
        }
        return next;
      });

      const eff      = effectiveStatsRef.current;
      const baseDps  = totalCrewDps(s.crewCounts, s.crewLevels, eff.dps * 0.25, skillBoosts, s.unlockedMilestones, s.prestigeLevel);
      const dpsPerTick = baseDps * (s.itemDpsMul || 1.0) / 4;
      if (dpsPerTick > 0) s.applyDamage(dpsPerTick);
    }, 250);
    return () => clearInterval(h);
  }, []); // [] — uses getState() for store; spawnDrop/spawnExpParticles captured by closure (declared later in component body — TDZ-safe via closure, not deps array)

  // ---- persist lastTickTime every 10s (offline progress tracking) ----
  // Previously called stampTick() every 250ms → 4 Zustand writes/sec → 4 re-renders/sec.
  // 10s is plenty accurate for offline catch-up.
  useEffect(() => {
    const h = setInterval(() => useGameStore.getState().stampTick(), 10_000);
    return () => clearInterval(h);
  }, []);

  // ---- visual spawners ----
  const spawnFloat = useCallback((x, y, text, type) => {
    const id = nid();
    setFloats(f => [...f, { id, x, y, text, type }]);
    setTimeout(() => setFloats(f => f.filter(o => o.id !== id)), 1000);
  }, []);

  const spawnDrop = useCallback(rarity => {
    const id = nid();
    setDrops(d => [...d, { id, rarity }]);
    setTimeout(() => setDrops(d => d.filter(o => o.id !== id)), 1400);
  }, []);

  // ---- EXP particle system ----
  // Uses refs so callbacks are always stable with [] deps
  const collectParticle = useCallback((particleId) => {
    if (collectedRef.current.has(particleId)) return;
    collectedRef.current.add(particleId);

    const exp = particleExpRef.current[particleId];
    if (exp !== undefined) {
      // Access current store state directly to avoid stale closure
      useGameStore.getState().collectExpParticle(exp);
      playSound('exp');
    }

    setExpParticles(prev => prev.map(p =>
      p.id === particleId ? { ...p, flying: true } : p
    ));
    setTimeout(() => {
      setExpParticles(prev => prev.filter(p => p.id !== particleId));
      delete particleExpRef.current[particleId];
      collectedRef.current.delete(particleId);
    }, 700);
  }, []);  // [] — safe because it uses refs + getState()

  const spawnExpParticles = useCallback((totalExp) => {
    const PER = Math.ceil(totalExp / 5);
    // Combat zone centre in stage__core coords (core is full 2000×1000, combat zone is bottom 340px)
    // CY ~750 places orbs in the middle of the combat zone (top = 660, bottom = 1000)
    const CX = 1000;
    const CY = 750;
    const newParticles = Array.from({ length: 5 }, (_, i) => {
      const id  = idRef.current++;
      const exp = i < 4 ? PER : Math.max(1, totalExp - PER * 4);
      particleExpRef.current[id] = exp;
      return {
        id,
        exp,
        x: CX + (Math.random() - 0.5) * 260,
        y: CY + (Math.random() - 0.5) * 100,
        flying: false,
        bobDelay: (Math.random() * 1.2).toFixed(2),
      };
    });
    setExpParticles(prev => [...prev, ...newParticles]);

    // Auto-collect any uncollected particles after 5 s
    const ids = newParticles.map(p => p.id);
    setTimeout(() => ids.forEach(id => collectParticle(id)), 5000);
  }, [collectParticle]);

  // ---- click enemy ----
  const onClickEnemy = useCallback((x, y) => {
    if (gamePaused) return;
    const scrapperLevel = store.crewLevels.scrapper || 0;
    const base    = clickDamageBase(scrapperLevel);
    // Apply Scrapper passive milestone bonuses (lv25 click%, lv50 crit, lv100 click%)
    const { dmgMult, critChance } = scrapperClickBonus(scrapperLevel, store.unlockedMilestones);
    const dmg     = Math.floor(base * dmgMult * (1 + effectiveStats.clickPower * 0.002)); // +0.2% per point
    const isCrit  = Math.random() < 0.05 + scrapperLevel * 0.002 + critChance;
    const finalDmg = (isCrit ? dmg * 3 : dmg) * clickBoostRef.current;
    store.applyDamage(finalDmg);
    playSound('impact');
    spawnFloat(x, y - 6, isCrit ? `${fmtNum(finalDmg)}!` : `-${fmtNum(finalDmg)}`, isCrit ? 'crit' : 'dmg');
  }, [store, spawnFloat]);

  // ---- activate crew skill ----
  const onActivateSkill = useCallback(crewId => {
    const result = store.activateSkill(crewId);
    if (!result) return;
    const expiresAt = Date.now() + result.duration * 1000;
    setActiveBoosts(prev => ({
      ...prev,
      [crewId]: { expiresAt, multiplier: result.multiplier },
    }));
    // Scrapper's Frenzy skill = click damage multiplier
    if (crewId === 'scrapper') {
      clickBoostRef.current = result.multiplier;
      setTimeout(() => { clickBoostRef.current = 1.0; }, result.duration * 1000);
    }
    spawnFloat(900, 200, `${crewId.toUpperCase()} SKILL!`, 'crit');
  }, [store, spawnFloat]);

  // ---- rob NPC ----
  const onRobNpc = useCallback((lootTrait, npcX, npcY) => {
    store.claimTrait(lootTrait, trait => {
      ui.addToast({ type: 'drop', rarity: trait.rarity, name: trait.name, slotName: trait.slotName });
    });
    spawnFloat(npcX, npcY - 20, lootTrait.name, 'drop');
  }, [store, ui, spawnFloat]);

  // ---- rob Key Carrier NPC ----
  const onRobKey = useCallback(rarity => {
    store.addKey(rarity);
    ui.addToast({ type: 'key', rarity, name: `${rarity} Key`, slotName: '🗝' });
    spawnFloat(600 + Math.random() * 400, 100 + Math.random() * 60, `🗝 ${rarity.toUpperCase()} KEY`, 'key');
  }, [store, ui, spawnFloat]);

  // ---- use inventory item ----
  const onUseItem = useCallback((key) => {
    const item = store.useInventoryItem(key);
    if (!item) return;
    const gs = useGameStore.getState();
    switch (key) {
      case 'boost_dps': {
        const dur = 10 * 60 * 1000;
        gs.applyItemDpsBoost(1.1, dur);
        startItemBoost(key, '+10% DPS', '/assets/icons/dpssurgeboost.png', dur, () => gs.applyItemDpsBoost(1.0, 0));
        spawnFloat(200, 130, '+10% DPS (10m)', 'crit');
        break;
      }
      case 'boost_coins': {
        const dur = 5 * 60 * 1000;
        gs.applySellRechargeBoost(2.0, dur);
        startItemBoost(key, '2× Sell Speed', '/assets/icons/coinstormboost.png', dur, () => gs.applySellRechargeBoost(1.0, 0));
        spawnFloat(200, 130, '2× SELL SPEED (5m)', 'crit');
        break;
      }
      case 'boost_click': {
        const dur = 10 * 60 * 1000;
        clickBoostRef.current = 2.0;
        startItemBoost(key, '2× Click', '/assets/icons/ironfistboost.png', dur, () => { clickBoostRef.current = 1.0; });
        spawnFloat(200, 130, '2× CLICK (10m)', 'crit');
        break;
      }
      case 'boost_luck': {
        const dur = 10 * 60 * 1000;
        gs.applyTempStatBoost('luck', 30, dur);
        startItemBoost(key, '+30% Luck', '/assets/icons/ratluckboost.png', dur);
        spawnFloat(200, 130, '+30% LUCK (10m)', 'crit');
        break;
      }
      case 'boost_speed': {
        const dur = 10 * 60 * 1000;
        gs.applyTempStatBoost('speed', 30, dur);
        startItemBoost(key, '+30% Speed', '/assets/icons/speedboost.png', dur);
        spawnFloat(200, 130, '+30% SPEED (10m)', 'crit');
        break;
      }
      case 'energy_drink':
        gs.addSellCharge();
        spawnFloat(200, 130, '+1 Sell Charge!', 'crit');
        break;
      case 'bell_uncommon': {
        const dur = 5 * 60 * 1000;
        activeBellRef.current = 'uncommon';
        startItemBoost(key, 'Bell: Uncommon+', '/assets/icons/bell.png', dur, () => { activeBellRef.current = null; });
        spawnFloat(200, 130, 'BELL: UNCOMMON+ (5m)', 'crit');
        break;
      }
      case 'bell_rare': {
        const dur = 5 * 60 * 1000;
        activeBellRef.current = 'rare';
        startItemBoost(key, 'Bell: Rare+', '/assets/icons/bell.png', dur, () => { activeBellRef.current = null; });
        spawnFloat(200, 130, 'BELL: RARE+ (5m)', 'crit');
        break;
      }
      case 'bell_epic': {
        const dur = 5 * 60 * 1000;
        activeBellRef.current = 'epic';
        startItemBoost(key, 'Bell: Epic+', '/assets/icons/bell.png', dur, () => { activeBellRef.current = null; });
        spawnFloat(200, 130, 'BELL: EPIC+ (5m)', 'crit');
        break;
      }
      default:
        spawnFloat(200, 130, 'Coming soon!', 'drop');
        break;
    }
  }, [store, spawnFloat, startItemBoost]);

  // ---- sell ----
  const onSell = useCallback(() => {
    store.sellRat(value => {
      spawnFloat(190, 40, `+${fmtNum(value)}`, 'coin');
    });
  }, [store, spawnFloat]);

  // ---- cover scale ----
  const [scale,   setScale]   = useState(1);
  const [layout,  setLayout]  = useState('wide');
  const [safeX,   setSafeX]   = useState(0);
  const [safeY,   setSafeY]   = useState(0);
  useEffect(() => {
    const fit = () => {
      const vv = window.visualViewport;
      const w  = vv ? vv.width  : window.innerWidth;
      const h  = vv ? vv.height : window.innerHeight;
      let s  = Math.max(w / STAGE_W, h / STAGE_H);
      const landscapeMobile = w > h && h < 520;
      if (landscapeMobile) s *= h < 430 ? 1.58 : 1.44; // short phones need bigger HUD
      else if (w < 768) s *= 1.14;
      // How many stage-px of the stage overflow the visible viewport on each axis
      const ovX = Math.max(0, STAGE_W - w / s) / 2;
      const ovY = Math.max(0, STAGE_H - h / s) / 2;
      // How much extra inset is needed inside stage__core so HUD stays on-screen
      setSafeX(Math.max(0, ovX - BLEED_X));
      setSafeY(Math.max(0, ovY - BLEED_Y));
      setScale(s);
      setLayout(landscapeMobile ? 'mobile-landscape' : (w < 768 ? 'compact' : 'wide'));
    };
    fit();
    // ResizeObserver fires on zoom/chrome-resize too, more reliable than 'resize' event
    const ro = new ResizeObserver(fit);
    ro.observe(document.documentElement);
    const vv = window.visualViewport;
    if (vv) { vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit); }
    return () => {
      ro.disconnect();
      if (vv) { vv.removeEventListener('resize', fit); vv.removeEventListener('scroll', fit); }
    };
  }, []);

  const shellW = STAGE_W * scale;
  const shellH = STAGE_H * scale;

  const popupMap = {
    SHOP:     <ShopPanel     onClose={() => { playSound('uiClick'); ui.closePopup(); }} />,
    BASE:     <BasePanel     onClose={() => { playSound('uiClick'); ui.closePopup(); }} />,
    GALLERY:  <GalleryPanel  onClose={() => { playSound('uiClick'); ui.closePopup(); }} />,
    STATS:    <StatsPanel    onClose={() => { playSound('uiClick'); ui.closePopup(); }} />,
    BOUNTIES: <BountyPanel onClose={() => { playSound('uiClick'); ui.closePopup(); }} />,
  };

  return (
    <div className="scaler">
      {/* Drop toasts — portalled to body so position:fixed is always viewport-relative */}
      {createPortal(
        <div className="toast-stack">
          {ui.toasts.map(t => (
            <div key={t.id} className={`toast toast--${t.rarity}`} onClick={() => ui.removeToast(t.id)}>
              <span className="toast__rarity">{t.rarity?.toUpperCase()}</span>
              <span className="toast__name">{t.name}</span>
              <span className="toast__slot">{t.slotName}</span>
            </div>
          ))}
        </div>,
        document.body
      )}

      <div className="stage-shell" style={{ width: shellW, height: shellH }}>
        <div
          className="stage"
          data-dir={DIR}
          data-layout={layout}
          style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})`, "--safe-x": `${safeX}px`, "--safe-y": `${safeY}px` }}
        >
          <img className="stage__bg" src="/assets/background.png" alt="" />
          <div className="stage__core">
            <Scene
              paradeCount={PARADE_COUNT}
              stats={effectiveStats}
              accountLevel={store.accountLevel}
              onRobNpc={onRobNpc}
              onRobKey={onRobKey}
              onNpcWithLoot={useCallback((rarity) => {
                const bell = activeBellRef.current;
                if (!bell) return;
                const ORDER = ['common','uncommon','rare','epic','legendary','mythic'];
                if (ORDER.indexOf(rarity) >= ORDER.indexOf(bell)) {
                  playSound('bell');
                  ui.addToast({ type: 'drop', rarity, name: `${rarity.toUpperCase()} NPC spotted!`, slotName: 'Bell' });
                }
              }, [ui])}
              enemyHp={store.enemyHp}
              enemyMaxHp={store.enemyMaxHp}
              enemyLevel={store.enemyLevel}
              onClickEnemy={onClickEnemy}
              floats={floats}
              drops={drops}
              prestigeLevel={store.prestigeLevel}
              paused={gamePaused}
            />
            <div className="stage__grime" style={{ opacity: GRIME_OPAC }} />

            {/* EXP orbs — positioned in stage__core coordinate space */}
            {expParticles.map(p => (
              <div
                key={p.id}
                className={`exp-particle${p.flying ? ' exp-particle--fly' : ''}`}
                style={{
                  left: p.x,
                  top:  p.y,
                  animationDelay: p.flying ? '0s' : `${p.bobDelay}s`,
                  '--fly-dx': `${Math.round(150 - p.x)}px`,
                  '--fly-dy': `${Math.round(100 - p.y)}px`,
                }}
                onPointerEnter={() => collectParticle(p.id)}
                onPointerDown={e  => { e.stopPropagation(); collectParticle(p.id); }}
              >
                <img src="/assets/icons/exp.png" className="exp-particle__img" alt="exp" />
              </div>
            ))}

            {/* Diamond collectible */}
            {diamond && (
              <div
                className={`diamond-pickup${diamond.flying ? ' diamond-pickup--fly' : ''}`}
                style={{
                  left: diamond.x,
                  top:  diamond.y,
                  '--fly-dx': `${Math.round(260 - diamond.x)}px`,
                  '--fly-dy': `${Math.round(45  - diamond.y)}px`,
                }}
                onPointerEnter={() => collectDiamond(diamond.x, diamond.y)}
                onPointerDown={e => { e.stopPropagation(); collectDiamond(diamond.x, diamond.y); }}
              >
                <img src="/assets/icons/diamond.png" className="diamond-pickup__gem" alt="diamond" />
              </div>
            )}

            <Hud
              fmtNum={fmtNum}
              coins={store.coins}
              diamonds={store.diamonds}
              exp={store.expInLevel}
              expToNext={expToNext}
              level={store.level}
              crewCounts={store.crewCounts}
              crewLevels={store.crewLevels}
              stats={effectiveStats}
              onHire={store.hireCrew}
              onLevelUpCrew={store.levelUpCrew}
              onActivateSkill={onActivateSkill}
              skillCooldowns={store.skillCooldowns}
              activeBoosts={activeBoosts}
              itemBoosts={itemBoosts}
              unlockedMilestones={store.unlockedMilestones}
              onUnlockMilestone={store.unlockMilestone}
              prestigeLevel={store.prestigeLevel}
              onOpenSettings={() => ui.setSettings(true)}
              onOpenPopup={ui.setPopup}
              ratName={store.activeRat.name}
              onRenameRat={store.renameActiveRat}
              equippedCount={equipped}
              sellValue={sellValue}
              sellCharges={store.sellCharges}
              maxSellCharges={store.maxSellCharges}
              onSell={onSell}
              onSendBase={() => {
                store.sendToBase();
              }}
              itemsOpen={ui.itemsOpen}
              onToggleItems={() => ui.setItems(!ui.itemsOpen)}
              traits={store.activeRat.traits}
              baseIsFull={baseIsFull}
              inventory={store.inventory}
              keys={store.keys}
              lootboxes={store.lootboxes}
              onUseItem={onUseItem}
              onOpenLootbox={rarity => ui.openLootboxFlow(rarity)}
              isGuest={store.isGuest}
              username={store.username}
              onOpenAuth={tab => ui.openAuth(tab)}
              baseRats={store.baseRats}
              crewLeaderId={store.crewLeaderId}
              onAssignLeader={store.assignCrewLeader}
            />

            {/* Level-up card modal — blocks all other interaction */}
            {store.pendingLevelUp && (
              <LevelUpCards level={store.level} />
            )}

            {ui.popup && !store.pendingLevelUp && (popupMap[ui.popup] || null)}

            {ui.settingsOpen && !store.pendingLevelUp && (
              <SettingsModal
                onClose={() => { playSound('uiClick'); ui.setSettings(false); }}
                onReset={store.resetAll}
                prestigeLevel={store.prestigeLevel}
                onPrestige={store.prestige}
                canPrestige={store.canPrestige()}
                currentLevel={store.level}
                isGuest={store.isGuest}
                username={store.username}
                onOpenAuth={tab => { ui.setSettings(false); ui.openAuth(tab); }}
                onLogout={() => { store.clearUser(); ui.setSettings(false); }}
              />
            )}

            {/* Auth modal (login / register) */}
            <AuthModal />

            {/* Lootbox opening flow */}
            <LootboxModal onClaimTrait={trait => store.claimTrait(trait, t => {
              ui.addToast({ type: 'drop', rarity: t.rarity, name: t.name, slotName: t.slotName });
            })} />
          </div>
        </div>
      </div>

      <RotatePrompt />
    </div>
  );
}

function PlaceholderPopup({ title, glyph, onClose }) {
  return (
    <div className="popup__scrim" onClick={onClose}>
      <div className="popup" onClick={e => e.stopPropagation()}>
        <div className="popup__hd">
          <div className="popup__title">{title}</div>
          <button className="popup__close" onClick={onClose}>✕</button>
        </div>
        <div className="popup__body">
          <div className="popup__empty">
            <div className="glyph">{glyph}</div>
            <div className="big">UNDER CONSTRUCTION</div>
            <div className="sub">Coming soon.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Small SVG icons for audio controls ── */
const IcoMusic = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>
);
const IcoSfx = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
  </svg>
);
const IcoMute = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
  </svg>
);
const IcoSkip = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 4 15 12 5 20 5 4"/><rect x="17" y="4" width="3" height="16" rx="1"/>
  </svg>
);

function SettingsModal({ onClose, onReset, prestigeLevel, onPrestige, canPrestige, currentLevel, isGuest, username, onOpenAuth, onLogout }) {
  const [confirmPrestige, setConfirmPrestige] = React.useState(false);
  const [confirmReset,    setConfirmReset]    = React.useState(false);
  const [audio, setAudio] = React.useState(getAudioSettings);
  const wallet = useWallet();
  React.useEffect(() => subscribeAudio(setAudio), []);

  return (
    <div className="modal__scrim" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>⚙ SETTINGS</h2>

        {/* ── Audio section ── */}
        <div className="modal__section-hd">AUDIO</div>
        <div className="modal__row">
          <span>Music</span>
          <div className="audio-ctrl">
            <button className="audio-skip-btn" onClick={skipTrack} title="Skip track">
              <IcoSkip />
            </button>
            <button
              className={`audio-mute-btn${audio.musicMuted ? ' audio-mute-btn--muted' : ''}`}
              onClick={() => setMusicMuted(!audio.musicMuted)}
              title={audio.musicMuted ? 'Unmute music' : 'Mute music'}
            >
              {audio.musicMuted ? <IcoMute /> : <IcoMusic />}
            </button>
            <input
              type="range" min="0" max="1" step="0.01"
              className="audio-slider"
              value={audio.musicVolume}
              disabled={audio.musicMuted}
              style={{ '--val': `${audio.musicVolume * 100}%` }}
              onChange={e => setMusicVolume(parseFloat(e.target.value))}
            />
            <span className="audio-pct">{Math.round(audio.musicVolume * 100)}%</span>
          </div>
        </div>
        <div className="modal__row">
          <span>Sound Effects</span>
          <div className="audio-ctrl">
            <button
              className={`audio-mute-btn${audio.sfxMuted ? ' audio-mute-btn--muted' : ''}`}
              onClick={() => setSfxMuted(!audio.sfxMuted)}
              title={audio.sfxMuted ? 'Unmute SFX' : 'Mute SFX'}
            >
              {audio.sfxMuted ? <IcoMute /> : <IcoSfx />}
            </button>
            <input
              type="range" min="0" max="1" step="0.01"
              className="audio-slider"
              value={audio.sfxVolume}
              disabled={audio.sfxMuted}
              style={{ '--val': `${audio.sfxVolume * 100}%` }}
              onChange={e => setSfxVolume(parseFloat(e.target.value))}
            />
            <span className="audio-pct">{Math.round(audio.sfxVolume * 100)}%</span>
          </div>
        </div>

        {/* ── Account section ── */}
        <div className="modal__section-hd">ACCOUNT</div>
        {isGuest ? (
          <>
            <div className="modal__row">
              <span style={{ color: '#7e9460' }}>Playing as guest — progress saved locally</span>
            </div>
            <div className="modal__row">
              <span>Create account to save to cloud</span>
              <button className="minibtn minibtn--gold" onClick={() => onOpenAuth('register')}>REGISTER</button>
            </div>
            <div className="modal__row">
              <span>Already have an account?</span>
              <button className="minibtn" onClick={() => onOpenAuth('login')}>LOGIN</button>
            </div>
          </>
        ) : (
          <div className="modal__row">
            <span>Logged in as <strong style={{ color: 'var(--gold)' }}>{username}</strong></span>
            <button className="minibtn" onClick={onLogout}>LOG OUT</button>
          </div>
        )}

        {/* ── Solana wallet ── */}
        <div className="modal__section-hd">SOLANA WALLET</div>
        <div className="modal__row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <span style={{ color: '#7e9460', fontSize: 12 }}>
            Connect Phantom to mint ScrapRat NFTs from your base (burns 10,000 $SCRAP).
          </span>
          <div className="wallet-btn-wrap">
            <WalletMultiButton />
          </div>
          {wallet.connected && wallet.publicKey && (
            <span style={{ fontSize: 10, color: '#5a6450', wordBreak: 'break-all' }}>
              {wallet.publicKey.toBase58()}
            </span>
          )}
        </div>

        {/* ── Prestige section ── */}
        <div className="modal__section-hd">PRESTIGE</div>
        <div className="modal__row">
          <span>Prestige level</span>
          <span style={{ color: 'var(--toxic)', fontFamily: 'var(--fnt-pixel)', fontSize: 13 }}>
            {prestigeLevel > 0 ? `✦ ${prestigeLevel}` : '—'}
          </span>
        </div>
        {prestigeLevel > 0 && (
          <div className="modal__row">
            <span style={{ color: '#7e9460' }}>DPS bonus</span>
            <span style={{ color: 'var(--gold)', fontFamily: 'var(--fnt-pixel)', fontSize: 12 }}>+{prestigeLevel * 20}%</span>
          </div>
        )}
        {!canPrestige ? (
          <div className="modal__row">
            <span style={{ color: '#5a6450' }}>Reach level 100 to prestige</span>
            <span style={{ color: '#7e9460', fontFamily: 'var(--fnt-pixel)', fontSize: 11 }}>Lv {currentLevel} / 100</span>
          </div>
        ) : !confirmPrestige ? (
          <div className="modal__row">
            <span>Wipes everything except diamonds. Keep 20% of stats. +20% DPS per prestige.</span>
            <button className="minibtn minibtn--gold" onClick={() => setConfirmPrestige(true)}>PRESTIGE</button>
          </div>
        ) : (
          <div className="modal__row" style={{ flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
            <span style={{ fontSize: 12, color: '#e05050' }}>
              ⚠ Full wipe! Keeps only diamonds and 20% of stats. Unlocks +{(prestigeLevel + 1) * 20}% DPS bonus. Confirm?
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="minibtn minibtn--gold" onClick={() => { onPrestige(); setConfirmPrestige(false); onClose(); }}>YES, PRESTIGE</button>
              <button className="minibtn" onClick={() => setConfirmPrestige(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── Socials ── */}
        <div className="modal__section-hd">SOCIALS</div>
        <div className="modal__row">
          <div className="settings-socials">
            <a className="settings-social-btn" href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer" title="Discord">
              <img src="/assets/icons/discordicon.png" alt="Discord" />
            </a>
            <a className="settings-social-btn" href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" title="X / Twitter">
              <img src="/assets/icons/Xicon.png" alt="X" />
            </a>
            <a className="settings-social-btn" href={SOCIAL_LINKS.pump} target="_blank" rel="noopener noreferrer" title="Pump.fun">
              <img src="/assets/icons/pumpicon.png" alt="Pump.fun" />
            </a>
          </div>
        </div>

        {/* ── Danger zone ── */}
        <div className="modal__section-hd">DANGER ZONE</div>
        {!confirmReset ? (
          <div className="modal__row">
            <span>Wipe all progress</span>
            <button className="minibtn" onClick={() => setConfirmReset(true)}>WIPE</button>
          </div>
        ) : (
          <div className="modal__row" style={{ flexDirection: 'column', gap: 8, alignItems: 'stretch' }}>
            <span style={{ fontSize: 12 }}>This wipes EVERYTHING including rats and coins. Are you sure?</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="minibtn" onClick={() => { onReset(); setConfirmReset(false); onClose(); }}>WIPE IT ALL</button>
              <button className="minibtn" onClick={() => setConfirmReset(false)}>Cancel</button>
            </div>
          </div>
        )}

        <button className="modal__close" onClick={onClose}>BACK TO THE SEWER</button>
      </div>
    </div>
  );
}
