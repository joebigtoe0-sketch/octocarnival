/* ===================== ScrapRats — Game (Direction A locked) ===================== */
const { useState, useEffect, useRef, useCallback } = React;

const STAGE_W      = 1672;
const STAGE_H      = 941;

const DIR          = 'A';
const ACCENT       = '#9bdc1f';      // toxic accent (last on the menu)
const GRIME_OPAC   = 0.46;           // ~50% darkness
const PARADE_COUNT = 7;
const PARADE_SPEED = 16;             // seconds to cross
const SELL_MAX     = 5;
const RECHARGE_SEC = 15;             // per sell charge

const DIVER_DEFS = [
  { id: 'pup',       name: 'Sewer Pup',  baseCost: 25,  mul: 1.18, rate: 1  },
  { id: 'mudlark',   name: 'Mudlark',    baseCost: 160, mul: 1.20, rate: 8  },
  { id: 'deepdiver', name: 'Deep Diver', baseCost: 900, mul: 1.22, rate: 45 },
];

const STARTER_STASH = [
  { rarity: 'uncommon', n: 1 },
  { rarity: 'common',   n: 3 },
  { rarity: 'rare',     n: 1 },
];

const expNeed = (lvl) => Math.floor(80 * Math.pow(1.28, lvl - 1));
const diverCost = (def, count) => Math.floor(def.baseCost * Math.pow(def.mul, count));

const SAVE_KEY = 'scraprats.save.v1';
function loadSave(){
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || null; } catch (e) { return null; }
}

function App(){
  const save = useRef(loadSave()).current;

  const [coins, setCoins]   = useState(save ? save.coins : 50);
  const [el, setEl]         = useState(save ? { exp: save.exp, level: save.level } : { exp: 0, level: 1 });
  const [counts, setCounts] = useState((save && save.counts) || { pup: 0, mudlark: 0, deepdiver: 0 });
  const [sellCharges, setSellCharges] = useState(SELL_MAX);

  const [sound, setSound]           = useState(true);
  const [showDivers, setShowDivers] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [popup, setPopup]           = useState(null);
  const [itemsOpen, setItemsOpen]   = useState(false);
  const [leveling, setLeveling]     = useState(false);

  const [ripples, setRipples] = useState([]);
  const [drops, setDrops]     = useState([]);
  const [floats, setFloats]   = useState([]);
  const poolRef = useRef(null);
  const idRef = useRef(1);
  const nid = () => idRef.current++;

  // ---- derived ----
  const expToNext   = expNeed(el.level);
  const scrapPerSec = DIVER_DEFS.reduce((s, d) => s + counts[d.id] * d.rate, 0);
  const totalDivers = counts.pup + counts.mudlark + counts.deepdiver;
  const diverList   = DIVER_DEFS.map(d => ({ id: d.id, name: d.name, rate: d.rate, count: counts[d.id], cost: diverCost(d, counts[d.id]) }));
  const sellValue   = 20 + el.level * 8;

  useEffect(() => { document.documentElement.style.setProperty('--toxic', ACCENT); }, []);

  // ---- persist ----
  useEffect(() => {
    const data = { coins, exp: el.exp, level: el.level, counts };
    const h = setTimeout(() => localStorage.setItem(SAVE_KEY, JSON.stringify(data)), 250);
    return () => clearTimeout(h);
  }, [coins, el, counts]);

  // ---- reward helpers ----
  const addExp = useCallback((amount) => {
    setEl(prev => {
      let exp = prev.exp + amount, level = prev.level, leveled = false;
      let need = expNeed(level);
      while (exp >= need) { exp -= need; level++; leveled = true; need = expNeed(level); }
      if (leveled) { setLeveling(true); setTimeout(() => setLeveling(false), 900); }
      return { exp, level };
    });
  }, []);

  const spawnFloat = (x, y, text, kind, big) => {
    const id = nid();
    setFloats(f => [...f, { id, x, y, text, kind, big }]);
    setTimeout(() => setFloats(f => f.filter(o => o.id !== id)), 1000);
  };
  const spawnRipple = (x, y, size) => {
    const id = nid();
    setRipples(r => [...r, { id, x, y, size }]);
    setTimeout(() => setRipples(r => r.filter(o => o.id !== id)), 700);
  };
  const spawnSplash = (x, y) => {
    const id = nid();
    const parts = [];
    const n = 6;
    for (let i = 0; i < n; i++){
      const a = (Math.PI * (0.15 + 0.7 * (i / (n - 1)))) * -1;
      const r = 28 + Math.random() * 26;
      parts.push({ dx: Math.cos(a) * r, dy: Math.sin(a) * r, delay: Math.random() * 0.05 });
    }
    setDrops(d => [...d, { id, x, y, parts }]);
    setTimeout(() => setDrops(d => d.filter(o => o.id !== id)), 650);
  };

  // ---- click to scavenge ----
  const onScavenge = (x, y) => {
    const lvl = el.level;
    const crit = Math.random() < 0.10;
    let expGain = 2 + lvl;
    let coinGain = 2 + Math.floor(lvl / 3);
    if (crit) { expGain *= 5; coinGain = Math.max(coinGain, 3) * 5; }
    setCoins(c => c + coinGain);
    addExp(expGain);
    spawnRipple(x, y, crit ? 130 : 78 + Math.random() * 26);
    spawnSplash(x, y);
    spawnFloat(x, y - 6, '+' + fmtNum(expGain) + ' XP', 'exp', crit);
    spawnFloat(x + 26, y - 18, '+' + fmtNum(coinGain), 'coin', crit);
    if (crit) spawnFloat(x, y - 44, 'JACKPOT!', 'coin', true);
  };

  // ---- hire ----
  const onHire = (id) => {
    const def = DIVER_DEFS.find(d => d.id === id);
    const cost = diverCost(def, counts[id]);
    if (coins < cost) return;
    setCoins(c => c - cost);
    setCounts(c => ({ ...c, [id]: c[id] + 1 }));
  };

  // ---- sell (consumes a charge) ----
  const onSell = () => {
    setSellCharges(c => Math.max(0, c - 1));
    setCoins(c => c + sellValue);
    addExp(Math.floor(sellValue / 3));
    spawnFloat(190, 40, '+' + fmtNum(sellValue), 'coin', true);
  };
  const onSendBase = () => setPopup('BASE');

  // ---- sell charge recharge ----
  useEffect(() => {
    const h = setInterval(() => {
      setSellCharges(c => Math.min(SELL_MAX, c + 0.25 / RECHARGE_SEC));
    }, 250);
    return () => clearInterval(h);
  }, []);

  // ---- passive scrap loop ----
  useEffect(() => {
    if (scrapPerSec <= 0) return;
    const h = setInterval(() => {
      setCoins(c => c + scrapPerSec);
      addExp(Math.max(1, Math.floor(scrapPerSec * 0.5)));
      if (Math.random() < 0.7){
        const x = 380 + Math.random() * 1000;
        const y = 120 + Math.random() * 150;
        spawnRipple(x, y, 40 + Math.random() * 20);
        spawnFloat(x, y, '+' + fmtNum(scrapPerSec), 'coin', false);
      }
    }, 1000);
    return () => clearInterval(h);
  }, [scrapPerSec, addExp]);

  // ---- fit fixed design canvas to viewport (contain, no layout overflow) ----
  const [scale, setScale] = useState(1);
  const [layout, setLayout] = useState('wide');
  useEffect(() => {
    const fit = () => {
      const vv = window.visualViewport;
      const w = vv ? vv.width : window.innerWidth;
      const h = vv ? vv.height : window.innerHeight;
      setScale(Math.min(w / STAGE_W, h / STAGE_H));
      const portrait = w < h;
      setLayout((portrait && w < 900) || w < 768 ? 'compact' : 'wide');
    };
    fit();
    window.addEventListener('resize', fit);
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', fit);
      vv.addEventListener('scroll', fit);
    }
    return () => {
      window.removeEventListener('resize', fit);
      if (vv) {
        vv.removeEventListener('resize', fit);
        vv.removeEventListener('scroll', fit);
      }
    };
  }, []);

  const onReset = () => {
    localStorage.removeItem(SAVE_KEY);
    setCoins(50); setEl({ exp: 0, level: 1 });
    setCounts({ pup: 0, mudlark: 0, deepdiver: 0 });
    setSellCharges(SELL_MAX);
    setSettingsOpen(false);
  };

  const shellW = STAGE_W * scale;
  const shellH = STAGE_H * scale;

  return (
    <div className="scaler">
      <div className="rotate-hint" aria-hidden="true">
        <span className="rotate-hint__icon">↻</span>
        <p>Rotate for the best view — you can still play in portrait</p>
      </div>
      <div className="stage-shell" style={{ width: shellW, height: shellH }}>
      <div className={'stage' + (leveling ? ' is-leveling' : '')}
           data-dir={DIR}
           data-layout={layout}
           style={{ width: STAGE_W, height: STAGE_H, transform: 'scale(' + scale + ')' }}>
        <Scene
          paradeCount={PARADE_COUNT}
          paradeSpeed={PARADE_SPEED}
          divers={totalDivers}
          showDivers={showDivers}
          level={el.level}
          ripples={ripples}
          drops={drops}
          floats={floats}
          onScavenge={onScavenge}
          poolRef={poolRef}
        />
        <div className="stage__grime" style={{ opacity: GRIME_OPAC }}></div>

        <Hud
          coins={coins}
          exp={el.exp}
          expToNext={expToNext}
          level={el.level}
          scrapPerSec={scrapPerSec}
          divers={diverList}
          onHire={onHire}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenPopup={setPopup}
          ratName="GRIMLOOT"
          itemsOpen={itemsOpen}
          onToggleItems={() => setItemsOpen(o => !o)}
          stash={STARTER_STASH}
          sellValue={sellValue}
          sellCharges={sellCharges}
          onSell={onSell}
          onSendBase={onSendBase}
        />

        {leveling && <div className="levelflash">LEVEL UP!</div>}

        {popup && <Popup title={popup} onClose={() => setPopup(null)} />}

        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          sound={sound} setSound={setSound}
          showDivers={showDivers} setShowDivers={setShowDivers}
          onReset={onReset}
        />
      </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
