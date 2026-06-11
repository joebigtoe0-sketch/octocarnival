import React, { useEffect, useState } from 'react';
import RatSprite from './RatSprite.jsx';
import { rollDistinctShowcaseTrait, RARITY_COLORS } from '../constants/traits.js';

const SHUFFLE_MS = 950;
const RAT_HEIGHT   = 330;

function seedTraits(count = 5) {
  const traits = Array(16).fill(null);
  for (let i = 0; i < count; i++) {
    const t = rollDistinctShowcaseTrait(traits.filter(Boolean), 50);
    if (t) traits[t.slotIdx] = t;
  }
  return traits;
}

export default function AboutShuffleRat() {
  const [traits, setTraits] = useState(() => seedTraits());
  const [flash, setFlash]   = useState(() => {
    const t = traits.find(Boolean);
    return t ?? rollDistinctShowcaseTrait([], 50);
  });
  const [seed, setSeed] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTraits(prev => {
        const t = rollDistinctShowcaseTrait(prev.filter(Boolean), 50);
        if (!t) return prev;
        const next = [...prev];
        next[t.slotIdx] = t;
        setFlash(t);
        setSeed(s => s + 1);
        setTick(n => n + 1);
        return next;
      });
    }, SHUFFLE_MS);
    return () => clearInterval(id);
  }, []);

  const activeSlots = traits
    .filter(Boolean)
    .map(t => ({ slotName: t.slotName, rarity: t.rarity, variantSeed: t.variantSeed }));

  return (
    <div className="lp-shuffle-rat">
      <div className="lp-shuffle-rat__platform" />
      {flash && (
        <div
          key={tick}
          className="lp-shuffle-rat__badge"
          style={{ '--rarity-color': RARITY_COLORS[flash.rarity] }}
        >
          <span className="lp-shuffle-rat__badge-rarity">{flash.rarity.toUpperCase()}</span>
          <span className="lp-shuffle-rat__badge-name">{flash.name}</span>
          <span className="lp-shuffle-rat__badge-slot">{flash.slotName}</span>
        </div>
      )}
      <RatSprite
        activeSlots={activeSlots}
        height={RAT_HEIGHT}
        seed={seed}
        className="lp-shuffle-rat__sprite"
      />
    </div>
  );
}
