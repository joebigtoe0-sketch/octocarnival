/* ===================== ScrapRats — HUD (Direction A · Plates) ===================== */

function fmtNum(n){
  n = Math.floor(n);
  if (n >= 1e9) return (n/1e9).toFixed(n%1e9 ? 1 : 0) + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(n%1e6 ? 1 : 0) + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(n%1e3 ? 1 : 0) + 'K';
  return '' + n;
}

const RARITY = { common:'#9aa68b', uncommon:'#7bdc1f', rare:'#3d9bff', epic:'#b06bff', legendary:'#f6c544' };

function CoinIcon({ cls }){
  return (
    <svg className={cls} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="14" fill="#f6c544" stroke="#8a5d10" strokeWidth="2"/>
      <circle cx="16" cy="16" r="9.5" fill="none" stroke="#c9881f" strokeWidth="2"/>
      <path d="M16 9l1.9 4.3 4.6.4-3.5 3 1.1 4.5-4.1-2.4-4.1 2.4 1.1-4.5-3.5-3 4.6-.4z" fill="#fff0b0"/>
    </svg>
  );
}

function GearIcon(){
  return <span className="gearglyph">⚙</span>;
}

function usePop(dep){
  const [cls, setCls] = React.useState('');
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current){ first.current = false; return; }
    setCls('pop');
    const t = setTimeout(() => setCls(''), 300);
    return () => clearTimeout(t);
  }, [dep]);
  return cls;
}

function Rivets(){ return <React.Fragment><i className="rivet-b"></i><i className="rivet-c"></i></React.Fragment>; }

function CoinPlate({ coins }){
  const pop = usePop(Math.floor(coins));
  return (
    <div className="plate coinplate">
      <Rivets/>
      <CoinIcon cls="ico"/>
      <span className={'val statnum ' + pop}>{fmtNum(coins)}</span>
    </div>
  );
}

function NavBtn({ label, variant, notif, onClick }){
  return (
    <button className={'plate navbtn' + (variant ? ' navbtn--' + variant : '')} onClick={onClick} style={{ position:'relative' }}>
      <Rivets/>{label}
      {notif && <span className="navnotif"></span>}
    </button>
  );
}

function ExpPlate({ level, exp, expToNext }){
  const pct = Math.max(0, Math.min(100, (exp/expToNext)*100));
  return (
    <div className="plate expplate">
      <Rivets/>
      <div className="row">
        <span className="lv">LVL {level}</span>
        <span className="xp statnum">{fmtNum(exp)} / {fmtNum(expToNext)} XP</span>
      </div>
      <div className="bar"><div className="bar__fill" style={{ width: pct + '%' }}></div></div>
    </div>
  );
}

function Roster({ divers, coins, onHire, scrapPerSec }){
  return (
    <div className="plate roster">
      <Rivets/>
      <div className="roster__hd">
        <span>DIVE CREW</span>
        <span className="roster__rate">+{fmtNum(scrapPerSec)}/s</span>
      </div>
      {divers.map(d => {
        const afford = coins >= d.cost;
        return (
          <div key={d.id} className="diverrow">
            <span className="diverrow__ico"><img src="assets/rat.png" alt="" style={{ filter:'brightness(.85) saturate(.9)' }}/></span>
            <div className="diverrow__mid">
              <div className="diverrow__nm">{d.name}</div>
              <div className="diverrow__sub">+{d.rate}/s · scrap</div>
            </div>
            <span className="diverrow__cnt statnum">×{d.count}</span>
            <button className="hirebtn" disabled={!afford} onClick={() => onHire(d.id)}>
              <span className="cost"><CoinIcon cls=""/>{fmtNum(d.cost)}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

function YourRatPanel({ name, level, sellValue, sellCharges, onSell, onSendBase }){
  const [shake, setShake] = React.useState(false);
  const ready = sellCharges >= 1;
  const handleSell = () => {
    if (ready) { onSell(); }
    else { setShake(true); setTimeout(() => setShake(false), 320); }
  };
  return (
    <div className="yourrat plate">
      <Rivets/>
      <div className="yourrat__layout">
        <div className="yourrat__portrait"><img src="assets/rat.png" alt="your rat"/></div>
        <div className="yourrat__right">
          <div className="yourrat__hd"><span>YOUR RAT</span><span className="tag">ON DUTY</span></div>
          <div className="yourrat__nm">{name}</div>
          <div className="yourrat__lv">LVL {level} · SCAVENGER</div>
          <div className="yourrat__gear">0 / 6 gear equipped</div>
          <button className="ratbtn" onClick={onSendBase}>SEND TO BASE</button>
          <button className={'sellbtn' + (shake ? ' shake' : '')} onClick={handleSell} disabled={!ready}>
            SELL <CoinIcon cls="ico"/> {fmtNum(sellValue)}
          </button>
          <div className="charges">
            {[0,1,2,3,4].map(i => {
              const f = Math.max(0, Math.min(1, sellCharges - i));
              const charging = f > 0 && f < 1;
              return (
                <div key={i} className={'charge' + (charging ? ' charge--charging' : '')}>
                  <div className="charge__fill" style={{ width: (f*100) + '%' }}></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemsDrawer({ open, onToggle, stash }){
  const slots = [];
  for (let i = 0; i < 12; i++){
    const it = stash[i];
    if (it){
      slots.push(
        <div key={i} className="slot">
          <span className="slot__gem" style={{ background: RARITY[it.rarity], color: RARITY[it.rarity] }}></span>
          <span className="slot__cnt">×{it.n}</span>
        </div>
      );
    } else {
      slots.push(<div key={i} className="slot slot--empty"><span className="slot__lock">+</span></div>);
    }
  }
  const filled = stash.filter(Boolean).length;
  return (
    <div className={'itemsdrawer' + (open ? ' is-open' : '')}>
      <div className="itemsdrawer__panel">
        <div className="stash__hd"><span>STASH</span><span className="cap">{filled} / 12</span></div>
        <div className="stash__grid">{slots}</div>
      </div>
      <button className="itemstab" onClick={onToggle}><b>ITEMS</b></button>
    </div>
  );
}

function Popup({ title, badge, onClose }){
  const glyphs = { SHOP:'🛒', BOUNTIES:'📜', GALLERY:'🖼', BASE:'🏚' };
  return (
    <div className="popup__scrim" onClick={onClose}>
      <div className="popup" onClick={e => e.stopPropagation()}>
        <div className="popup__hd">
          <div className="popup__title">{title}{badge && <span className="badge">{badge}</span>}</div>
          <button className="popup__close" onClick={onClose}>✕</button>
        </div>
        <div className="popup__body">
          <div className="popup__empty">
            <div className="glyph">{glyphs[title] || '∅'}</div>
            <div className="big">UNDER CONSTRUCTION</div>
            <div className="sub">The {title.toLowerCase()} isn't wired up yet — coming soon.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hud(props){
  const { coins, exp, expToNext, level, scrapPerSec, divers, onHire, onOpenSettings,
          onOpenPopup, ratName, itemsOpen, onToggleItems, stash,
          sellValue, sellCharges, onSell, onSendBase } = props;
  return (
    <div className="hud">
      <div className="hud__topleft">
        <div className="topbar">
          <CoinPlate coins={coins}/>
          <NavBtn label="SHOP" variant="shop" onClick={() => onOpenPopup('SHOP')}/>
          <NavBtn label="BOUNTIES" variant="bounty" notif onClick={() => onOpenPopup('BOUNTIES')}/>
        </div>
        <ExpPlate level={level} exp={exp} expToNext={expToNext}/>
      </div>

      <div className="hud__topright">
        <NavBtn label="GALLERY" notif onClick={() => onOpenPopup('GALLERY')}/>
        <NavBtn label="BASE" onClick={() => onOpenPopup('BASE')}/>
        <div className="plate gearbtn" onClick={onOpenSettings} title="Settings">
          <Rivets/><div className="gear"><GearIcon/></div>
        </div>
      </div>

      <div className="hud__roster">
        <Roster divers={divers} coins={coins} onHire={onHire} scrapPerSec={scrapPerSec}/>
      </div>

      <YourRatPanel name={ratName} level={level} sellValue={sellValue} sellCharges={sellCharges} onSell={onSell} onSendBase={onSendBase}/>

      <ItemsDrawer open={itemsOpen} onToggle={onToggleItems} stash={stash}/>
    </div>
  );
}

function SettingsModal({ open, onClose, sound, setSound, showDivers, setShowDivers, onReset }){
  if (!open) return null;
  return (
    <div className="modal__scrim" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>⚙ SETTINGS</h2>
        <div className="modal__row">
          <span>Sound effects</span>
          <button className={'toggle' + (sound ? ' on' : '')} onClick={() => setSound(!sound)}><b></b></button>
        </div>
        <div className="modal__row">
          <span>Show divers in the water</span>
          <button className={'toggle' + (showDivers ? ' on' : '')} onClick={() => setShowDivers(!showDivers)}><b></b></button>
        </div>
        <div className="modal__row">
          <span>Reset progress</span>
          <button className="minibtn" onClick={onReset}>Wipe save</button>
        </div>
        <button className="modal__close" onClick={onClose}>BACK TO THE SEWER</button>
      </div>
    </div>
  );
}

Object.assign(window, { Hud, SettingsModal, Popup, fmtNum });
