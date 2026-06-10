/* ===================== ScrapRats — Scene ===================== */
const { useRef } = React;

const RAT_SRC = 'assets/rat.png';

// fixed, hand-placed diver slots in the water (stage coords from bottom)
const DIVER_SLOTS = [
  { left: 470,  bottom: 150, h: 70,  delay: 0,    flip: false },
  { left: 760,  bottom: 92,  h: 80,  delay: 0.7,  flip: true  },
  { left: 1040, bottom: 168, h: 64,  delay: 1.3,  flip: false },
  { left: 1280, bottom: 110, h: 76,  delay: 0.4,  flip: true  },
  { left: 600,  bottom: 56,  h: 84,  delay: 1.0,  flip: false },
  { left: 1450, bottom: 196, h: 60,  delay: 1.7,  flip: true  },
  { left: 900,  bottom: 210, h: 58,  delay: 0.2,  flip: false },
  { left: 1180, bottom: 44,  h: 88,  delay: 1.5,  flip: true  },
];

function Scene({ paradeCount, paradeSpeed, divers, showDivers, level, ripples, drops, floats, onScavenge, poolRef }) {
  // parade rats — staggered so they're evenly spaced
  const rats = [];
  for (let i = 0; i < paradeCount; i++) {
    const dur = paradeSpeed;
    const delay = -(dur / paradeCount) * i;
    const flip = i % 3 === 1; // a little variety in facing
    rats.push(
      <div key={i} className="rat" style={{ animationDuration: dur + 's', animationDelay: delay + 's' }}>
        <div className="rat__bob" style={{ animationDelay: (-i * 0.13) + 's' }}>
          <div className="rat__shadow"></div>
          <img src={RAT_SRC} alt="rat" style={{ transform: flip ? 'scaleX(-1)' : 'none' }} />
        </div>
      </div>
    );
  }

  const handlePool = (e) => {
    e.preventDefault();
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const sx = el.offsetWidth / rect.width;
    const sy = el.offsetHeight / rect.height;
    onScavenge((e.clientX - rect.left) * sx, (e.clientY - rect.top) * sy);
  };

  return (
    <React.Fragment>
      <img className="stage__bg" src="assets/background.png" alt="" />

      {/* parade along the track */}
      <div className="parade">{rats}</div>

      {/* divers bobbing in the toxic water */}
      {showDivers && (
        <div className="divers">
          {DIVER_SLOTS.slice(0, Math.min(divers, DIVER_SLOTS.length)).map((d, i) => (
            <div key={i} className="diver" style={{ left: d.left + 'px', bottom: d.bottom + 'px' }}>
              <div className="diver__sprite" style={{ animationDelay: -d.delay + 's', height: d.h * 0.62 + 'px' }}>
                <img src={RAT_SRC} alt="diver" style={{ height: d.h + 'px', transform: flipT(d.flip) }} />
              </div>
              <div className="diver__wake" style={{ animationDelay: -d.delay + 's', width: d.h * 0.9 + 'px' }}></div>
            </div>
          ))}
        </div>
      )}

      {/* clicker pool */}
      <div className="pool" ref={poolRef} onPointerDown={handlePool}>
        <div className="pool__hint">▼ TAP / CLICK THE SLUDGE TO SCAVENGE ▼</div>
        {ripples.map(r => (
          <div key={r.id} className="ripple"
            style={{ left: r.x + 'px', top: r.y + 'px', width: r.size + 'px', height: r.size + 'px' }}></div>
        ))}
        {drops.map(d => (
          <div key={d.id} className="splash" style={{ left: d.x + 'px', top: d.y + 'px' }}>
            {d.parts.map((p, i) => (
              <span key={i} className="drop" style={{ '--dx': p.dx + 'px', '--dy': p.dy + 'px', animationDelay: p.delay + 's' }}></span>
            ))}
          </div>
        ))}
        {floats.map(f => (
          <div key={f.id}
            className={'float float--' + f.kind + (f.big ? ' float--big' : '')}
            style={{ left: f.x + 'px', top: f.y + 'px' }}>{f.text}</div>
        ))}
      </div>
    </React.Fragment>
  );
}

function flipT(flip){ return flip ? 'scaleX(-1)' : 'none'; }

window.Scene = Scene;
