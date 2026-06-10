import React, { useState, useEffect, useRef, useCallback } from 'react';
import { rollLootTrait, RARITY_COLORS, RARITY_GLOW } from '../constants/traits.js';
import CombatZone from './CombatZone.jsx';
import RatSprite  from './RatSprite.jsx';
import { playSound } from '../audio.js';

const KEY_RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
const KEY_CARRIER_CHANCE = 0.05; // 5% of NPCs are key carriers

let _npcCounter = 0;

function rollKeyRarity() {
  const weights = [50, 28, 14, 5, 2, 1];
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return KEY_RARITIES[i];
  }
  return 'common';
}

function makeNpc(luck = 0, rate = 0, accountLevel = 1, delay = 0) {
  const uid       = ++_npcCounter;
  const isKeyCar  = Math.random() < KEY_CARRIER_CHANCE;
  const loot      = isKeyCar ? null : rollLootTrait(luck, rate, accountLevel);
  const keyRarity = isKeyCar ? rollKeyRarity() : null;
  return {
    uid,
    flip:      false,
    bobOffset: String(-(((uid - 1) % 7) * 0.13).toFixed(2)),
    loot,
    keyRarity,
    isKeyCarrier: isKeyCar,
    robbed: false,
    delay,
  };
}

export default function Scene({
  paradeCount,
  stats,
  accountLevel,
  onRobNpc,
  onRobKey,
  onNpcWithLoot,
  // combat props
  enemyHp,
  enemyMaxHp,
  enemyLevel,
  onClickEnemy,
  floats,
  drops,
  prestigeLevel,
  paused = false,
}) {
  const luck       = stats?.luck   || 0;
  const rate       = stats?.rate   || 0;
  const speedStat  = stats?.speed  || 0;
  const paradeSpeed = Math.max(8, 16 - speedStat * 0.5);

  const [npcs, setNpcs] = useState([]);
  const spawnRef  = useRef(null);
  const pausedRef = useRef(paused);
  const prevPausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);

  // Helper: rebuild a clean evenly-spaced NPC batch
  const resetParade = useCallback(() => {
    setNpcs(
      Array.from({ length: paradeCount }, (_, i) => {
        const delay = -(paradeSpeed / paradeCount) * i;
        return makeNpc(luck, rate, accountLevel, delay);
      })
    );
  }, [paradeCount, paradeSpeed, luck, rate, accountLevel]);

  // Initial spawn + continuous trickle
  useEffect(() => {
    clearInterval(spawnRef.current);
    resetParade();
    const intervalMs = (paradeSpeed / paradeCount) * 1000;
    spawnRef.current = setInterval(() => {
      if (pausedRef.current || document.visibilityState === 'hidden') return;
      const npc = makeNpc(luck, rate, accountLevel, 0);
      if (npc.loot && onNpcWithLoot) onNpcWithLoot(npc.loot.rarity);
      setNpcs(prev => [...prev, npc]);
    }, intervalMs);
    return () => clearInterval(spawnRef.current);
  }, [paradeCount, paradeSpeed, luck, rate, accountLevel, resetParade]);

  // Track pause transitions (no resetParade on unpause — CSS animationPlayState
  // resumes from the frozen position, preserving any loot-carrying NPCs)
  useEffect(() => {
    prevPausedRef.current = paused;
  }, [paused]);

  // When switching back to this tab → reset parade to avoid browser animation drift
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') resetParade();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [resetParade]);

  const removeNpc = useCallback(uid => {
    setNpcs(prev => prev.filter(n => n.uid !== uid));
  }, []);

  const handleRobNpc = useCallback(npc => {
    if (npc.robbed) return;
    playSound('npcClick');
    setNpcs(prev => prev.map(n => n.uid === npc.uid ? { ...n, robbed: true } : n));
    if (npc.isKeyCarrier) {
      onRobKey(npc.keyRarity);
    } else if (npc.loot) {
      const approxX = 400 + Math.random() * 800;
      const approxY = 120 + Math.random() * 80;
      onRobNpc(npc.loot, approxX, approxY);
    }
  }, [onRobNpc, onRobKey]);

  return (
    <>
      {/* NPC parade */}
      <div className="parade">
        {npcs.map(npc => (
          <NpcRat
            key={npc.uid}
            npc={npc}
            paradeSpeed={paradeSpeed}
            onEnd={() => removeNpc(npc.uid)}
            onRob={() => handleRobNpc(npc)}
            paused={paused}
          />
        ))}
      </div>

      {/* Combat zone (replaces sludge pool) */}
      <CombatZone
        enemyHp={enemyHp}
        enemyMaxHp={enemyMaxHp}
        enemyLevel={enemyLevel}
        onClickEnemy={onClickEnemy}
        floats={floats}
        drops={drops}
      />
    </>
  );
}

function NpcRat({ npc, paradeSpeed, onEnd, onRob, paused }) {
  const { flip, bobOffset, loot, robbed, isKeyCarrier, keyRarity } = npc;
  const canRob      = !robbed && (!!loot || isKeyCarrier);
  const rarityColor = canRob && loot ? RARITY_COLORS[loot.rarity] : isKeyCarrier ? '#f6c544' : null;
  const glowColor   = canRob && loot ? RARITY_GLOW[loot.rarity]   : isKeyCarrier ? 'rgba(246,197,68,.55)' : null;

  return (
    <div
      className={`rat${canRob ? ' rat--loot' : ''}${robbed ? ' rat--robbed' : ''}${isKeyCarrier && !robbed ? ' rat--key-carrier' : ''}`}
      style={{
        animationName:           'skate',
        animationDuration:        paradeSpeed + 's',
        animationDelay:           npc.delay + 's',
        animationTimingFunction: 'linear',
        animationIterationCount:  1,
        animationFillMode:       'forwards',
        animationPlayState:      paused ? 'paused' : 'running',
        cursor: canRob ? 'pointer' : 'default',
        '--npc-glow': glowColor || 'transparent',
      }}
      onAnimationEnd={paused ? undefined : onEnd}
      onPointerDown={canRob && !paused ? e => { e.stopPropagation(); onRob(); } : undefined}
    >
      <div className="rat__bob" style={{ animationDelay: bobOffset + 's', animationPlayState: paused ? 'paused' : 'running' }}>
        <div className="rat__shadow" />
        <RatSprite
          activeSlots={loot ? [{ slotName: loot.slotName, rarity: loot.rarity, variantSeed: loot.variantSeed }] : []}
          flip={flip}
          seed={npc.uid}
        />

        {/* Normal loot badge */}
        {canRob && loot && (
          <div className="npc-loot-badge" style={{ '--rarity-color': rarityColor }}>
            <span className="npc-loot-badge__rarity">{loot.rarity.toUpperCase()}</span>
            <span className="npc-loot-badge__name">{loot.name}</span>
            <span className="npc-loot-badge__slot">{loot.slotName}</span>
          </div>
        )}

        {/* Key carrier badge */}
        {isKeyCarrier && !robbed && (
          <div className="npc-loot-badge npc-key-carrier">
            <span className="npc-loot-badge__rarity">KEY CARRIER</span>
            <span className="npc-loot-badge__name">{keyRarity?.toUpperCase()} KEY</span>
            <span className="npc-loot-badge__slot">🗝</span>
          </div>
        )}
      </div>
    </div>
  );
}
