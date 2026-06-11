import React, { useState, useEffect } from 'react';

// Images that are visible the moment the game appears — preload these so
// there's no pop-in after the loading bar hits 100%.
// Audio is intentionally excluded: the 14 WAV files are ~1.8 MB each (25 MB
// total), so pre-buffering them would make loading worse, not better.
// Convert them to MP3 (~50-100 KB each) to fix audio loading time.
const CRITICAL_IMAGES = [
  '/assets/background.png',
  '/assets/background2.png',
  '/assets/enemy1.png',
  '/assets/enemy2.png',
  '/assets/rat.png',
  '/assets/scrapper.png',
  '/assets/gutter-pup.png',
  '/assets/mudlark.png',
  '/assets/pipe-rat.png',
  '/assets/sludge-baron.png',
  '/assets/plague-knight.png',
  '/assets/icons/coins.png',
  '/assets/icons/diamond.png',
  '/assets/icons/exp.png',
  '/assets/icons/crownicon.png',
  '/assets/icons/lockicon.png',
  '/assets/scrapratslogo.png',
];

const TOTAL = CRITICAL_IMAGES.length;

const TIPS = [
  'Assign a Crew Leader to boost your stats.',
  'Higher rarity traits sell for more coins.',
  'Hire more crew to earn passive DPS.',
  'Unlock Scrapper milestones for click bonuses.',
  'Collect bounties for massive coin rewards.',
  'Prestige at level 100 to keep 20% of your stats.',
  'Diamonds are forever — they survive prestige.',
  'Open lootboxes with matching keys for rare traits.',
];

export default function LoadingScreen({ onReady }) {
  const [loaded,  setLoaded]  = useState(0);
  const [fading,  setFading]  = useState(false);
  const [tip]                 = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  useEffect(() => {
    let count = 0;
    const tick = () => {
      count++;
      setLoaded(count);
      if (count >= TOTAL) {
        // Small delay so the bar visibly hits 100% before fading
        setTimeout(() => {
          setFading(true);
          setTimeout(onReady, 500);
        }, 300);
      }
    };

    CRITICAL_IMAGES.forEach(src => {
      const img   = new Image();
      img.onload  = tick;
      img.onerror = tick; // count missing images so bar always completes
      img.src     = src;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = Math.min(100, Math.round((loaded / TOTAL) * 100));

  return (
    <div className={`loading-screen${fading ? ' loading-screen--fade' : ''}`}>
      <div className="loading-screen__inner">
        <img
          className="loading-screen__logo-img"
          src="/assets/scrapratslogo.png"
          alt="ScrapRats"
          draggable={false}
        />
        <div className="loading-screen__sub">Entering the sewer…</div>

        <div className="loading-screen__bar-wrap">
          <div className="loading-screen__bar" style={{ width: `${pct}%` }} />
        </div>
        <div className="loading-screen__pct">{pct}%</div>

        <div className="loading-screen__tip">
          <span className="loading-screen__tip-label">TIP </span>{tip}
        </div>
      </div>
    </div>
  );
}
