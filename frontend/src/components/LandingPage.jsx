import React, { useEffect, useRef, useState } from 'react';

// ── Update these when you have real addresses / links ──────────────────────────
export const SOCIAL_LINKS = {
  discord: 'https://discord.gg/scraprats',
  twitter: 'https://x.com/scraprats',
  pump:    'https://pump.fun/coin/YOUR_CONTRACT_ADDRESS',
};
export const CONTRACT_ADDRESS = 'PASTE-YOUR-PUMPFUN-CA-HERE-xxxxxxxxxxxxxxxxxxpump';

// ── Data ──────────────────────────────────────────────────────────────────────
const SEWER_CARDS = [
  {
    glyph: '►',
    title: 'HOW TO PLAY',
    body: 'Click the enemy to deal damage. Hire crew to grind DPS while you idle. Loot boxes, gear up your rat, level your stats and climb from gutter trash to Sewer King.',
    link: '#game',
    linkLabel: 'READ THE MANUAL',
    sameTab: true,
  },
  {
    glyph: '⚠',
    title: 'REPORT A LEAK',
    body: 'Found a bug? Something crawling in the pipes that shouldn\'t be? Tell us where it leaks in our Discord and we\'ll send a rat with a wrench.',
    link: SOCIAL_LINKS.discord,
    linkLabel: 'FILE A REPORT',
  },
  {
    glyph: '✦',
    title: 'DROP AN IDEA',
    body: 'Got a feature in mind — new gear, new crew, dumber hats? Pitch it in #suggestions. The best ideas get fished out of the water and shipped.',
    link: SOCIAL_LINKS.discord,
    linkLabel: 'PITCH IT',
  },
];

const UPDATES = [
  {
    ver: 'v0.4', date: 'JUNE 2026', current: true,
    title: 'THE SURFACE BREACH',
    body: 'ScrapRats claws its way onto the web. Cloud saves with login & registration, Google sign-in, and this very site you\'re sinking through.',
  },
  {
    ver: 'v0.3', date: 'JUNE 2026',
    title: 'SMOOTHER GRINDING',
    body: 'Enemy HP and crew costs rebalanced past level 30. AFK level-ups now auto-apply stat cards while you\'re away. Quick-sell loot for 50% value.',
  },
  {
    ver: 'v0.2', date: 'EARLIER',
    title: 'CORE LOOP LOCKED',
    body: 'Crew milestones, leader traits, lootbox wheel, bounties, achievements and the gallery. The sewer economy takes shape.',
  },
  {
    ver: 'v0.1', date: 'THE BEGINNING',
    title: 'FIRST DESCENT',
    body: 'A rat, a sewer, and a bad idea. Initial concept draft — chaotic, greedy, sewer gothic.',
  },
];

// ── Scroll-reveal hook ────────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Already in view on mount → show immediately
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) {
      setShown(true);
      return;
    }
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { setShown(true); obs.disconnect(); } }),
      { rootMargin: '0px 0px -12% 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, shown];
}

function Reveal({ children }) {
  const [ref, shown] = useReveal();
  return <div ref={ref} className={`lp-reveal${shown ? '' : ' lp-reveal--pre'}`}>{children}</div>;
}

// ── Bits ──────────────────────────────────────────────────────────────────────
function DripLine({ drips }) {
  return (
    <div className="lp-dripline" aria-hidden="true">
      {drips.map((d, i) => (
        <span key={i} style={{ left: d.left, animationDelay: d.delay }} />
      ))}
    </div>
  );
}

function DepthTag({ depth, label }) {
  return <div className="lp-depthtag">DEPTH <b>−{depth}M</b> · {label}</div>;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };
  return (
    <button className="lp-copybtn" type="button" onClick={copy}>
      {copied ? 'COPIED!' : 'COPY'}
    </button>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="lp-site">

      {/* brick divider between game and website */}
      <img className="lp-brickdivider" src="/assets/brickdivider.png" alt="" aria-hidden="true" />

      {/* ── § ABOUT ─────────────────────────────────────────────────────────── */}
      <section className="lp-sec lp-sec--about" id="about">
        <DripLine drips={[
          { left: '12%', delay: '0s'   },
          { left: '31%', delay: '1.3s' },
          { left: '57%', delay: '.6s'  },
          { left: '83%', delay: '2.1s' },
        ]} />
        <DepthTag depth={18} label="UPPER TUNNELS" />
        <Reveal>
          <p className="lp-kicker">ABOUT THE SEWER</p>
          <h2 className="lp-headline">BORN IN THE GUTTER.<br />RICH IN THE SLUDGE.</h2>
          <p className="lp-lead">
            <b>ScrapRats</b> is a browser idle-clicker where your rat smashes through an endless
            parade of sewer enemies, hires a crew of misfits to grind while you're gone, and
            hoards loot like its life depends on it. It does.
          </p>
          <p className="lp-lead">
            No downloads. No wallet needed to play. Just a rat, a sewer, and questionable ambition.
          </p>

          <div className="lp-contract">
            <div className="lp-contract__lbl">$SCRAP · PUMP.FUN CONTRACT ADDRESS (SOLANA)</div>
            <div className="lp-contract__row">
              <code className="lp-contract__addr">{CONTRACT_ADDRESS}</code>
              <CopyButton text={CONTRACT_ADDRESS} />
            </div>
            <p className="lp-contract__note">
              Always verify the address against our official socials before you ape. Rats get rugged too.
            </p>
          </div>

          <div className="lp-socialrow">
            <a className="lp-socialrow__icon" href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer" title="Discord">
              <img src="/assets/icons/discordicon.png" alt="Discord" />
            </a>
            <a className="lp-socialrow__icon" href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" title="X / Twitter">
              <img src="/assets/icons/Xicon.png" alt="X" />
            </a>
            <a className="lp-socialrow__icon" href={SOCIAL_LINKS.pump} target="_blank" rel="noopener noreferrer" title="Pump.fun">
              <img src="/assets/icons/pumpicon.png" alt="Pump.fun" />
            </a>
          </div>
        </Reveal>
      </section>

      {/* ── § NAVIGATING THE SEWERS ─────────────────────────────────────────── */}
      <section className="lp-sec lp-sec--nav" id="sewers">
        <DripLine drips={[
          { left: '22%', delay: '.4s'  },
          { left: '48%', delay: '1.8s' },
          { left: '74%', delay: '.9s'  },
        ]} />
        <DepthTag depth={42} label="MAINTENANCE LEVEL" />
        <Reveal>
          <p className="lp-kicker">NAVIGATING THE SEWERS</p>
          <h2 className="lp-headline">FIND YOUR WAY AROUND.</h2>
          <div className="lp-cards">
            {SEWER_CARDS.map((c, i) => (
              <div key={i} className="lp-scard">
                <span className="lp-scard__glyph">{c.glyph}</span>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
                {c.sameTab
                  ? <a href={c.link} onClick={e => { e.preventDefault(); scrollToTop(); }}>{c.linkLabel}</a>
                  : <a href={c.link} target="_blank" rel="noopener noreferrer">{c.linkLabel}</a>}
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── § LATEST UPDATES ────────────────────────────────────────────────── */}
      <section className="lp-sec lp-sec--updates" id="updates">
        <DripLine drips={[
          { left: '16%', delay: '1.1s' },
          { left: '44%', delay: '.2s'  },
          { left: '69%', delay: '1.6s' },
          { left: '88%', delay: '.8s'  },
        ]} />
        <DepthTag depth={77} label="THE ARCHIVES" />
        <Reveal>
          <p className="lp-kicker">LATEST UPDATES</p>
          <h2 className="lp-headline">NEWS FROM BELOW.</h2>
          <div className="lp-updates">
            {UPDATES.map((u, i) => (
              <div key={i} className={`lp-update${u.current ? '' : ' lp-update--old'}`}>
                <span className="lp-update__ver">{u.ver}</span>
                <div className="lp-update__t">
                  <span className="lp-update__date">{u.date}</span>
                  <h4>{u.title}</h4>
                  <p>{u.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="lp-backtogame">
            <button className="lp-backbtn" onClick={scrollToTop}>BACK TO THE GAME <b>▲</b></button>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <img className="lp-footer__rat" src="/assets/scrapper.png" alt="" aria-hidden="true" />
        <div className="lp-footer__brand">SCRAPRATS</div>
        <div className="lp-footer__tag">Born in the gutter. Rich in the sludge.</div>
        <div className="lp-footer__rows">
          <div className="lp-footer__links">
            <a className="lp-flink" href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer">
              <img src="/assets/icons/Xicon.png" alt="" /> X / TWITTER
            </a>
            <a className="lp-flink" href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer">
              <img src="/assets/icons/discordicon.png" alt="" /> DISCORD
            </a>
            <a className="lp-flink" href={SOCIAL_LINKS.pump} target="_blank" rel="noopener noreferrer">
              <img src="/assets/icons/pumpicon.png" alt="" /> PUMP.FUN
            </a>
          </div>
          <div className="lp-footer__legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
        <div className="lp-footer__copy">
          <span>© {new Date().getFullYear()} ScrapRats. All rights reserved.</span>
          <span>DEPTH −99M · ROCK BOTTOM. No rats were harmed in the making of this sewer.</span>
        </div>
      </footer>

    </div>
  );
}
