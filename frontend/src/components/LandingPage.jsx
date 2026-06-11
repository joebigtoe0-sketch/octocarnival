import React, { useEffect, useRef, useState } from 'react';
import LegalModal from './LegalModal.jsx';

// ── Official links ──────────────────────────────────────────────────────────
export const SOCIAL_LINKS = {
  discord: 'https://discord.gg/h6Qdw3aNWK',
  twitter: 'https://x.com/scrapratsfun',
  pump:    'https://pump.fun/coin/YOUR_CONTRACT_ADDRESS',
};
export const CONTRACT_ADDRESS = 'PASTE-YOUR-PUMPFUN-CA-HERE-xxxxxxxxxxxxxxxxxxpump';

// ── Data ──────────────────────────────────────────────────────────────────────
const SEWER_CARDS = [
  {
    icon: '/assets/icons/questionmark.png',
    title: 'HOW TO PLAY',
    body: 'Smash enemies with your Scrapper, collect loot from boxes, hire and level up your crew, equip your rat with gear, and climb the ranks. Idle when you\'re away — your crew keeps fighting.',
  },
  {
    icon: '/assets/icons/compass.png',
    title: 'NAVIGATING THE UI',
    body: 'Top-left: coins, diamonds, shop & bounties. Top-right: stats, gallery, base & settings. Bottom: your crew roster. Click the enemy to deal damage. Open lootboxes from your inventory.',
  },
  {
    icon: '/assets/icons/worm.png',
    title: 'REPORT A LEAK',
    body: 'Found a bug? Something crawling in the pipes that shouldn\'t be? Drop it in our Discord #bug-reports channel — we\'ll send a rat with a wrench.',
    link: SOCIAL_LINKS.discord,
    linkLabel: 'FILE A REPORT',
  },
  {
    icon: '/assets/icons/scroll.png',
    title: 'DROP AN IDEA',
    body: 'Got a feature in mind — new gear, new crew, dumber hats? Pitch it in #suggestions. The best ideas get fished out of the water and shipped.',
    link: SOCIAL_LINKS.discord,
    linkLabel: 'PITCH IT',
  },
];

const UPDATES = [
  {
    date: 'Jun 2026',
    tag: 'NEW',
    title: 'Login & Registration',
    body: 'Cloud save is live. Create an account to keep your progress across devices.',
  },
  {
    date: 'Jun 2026',
    tag: 'BALANCE',
    title: 'Smoother Progression',
    body: 'Enemy HP and crew costs rebalanced at level 30+. Reaching level 100 in a session is now a real goal.',
  },
  {
    date: 'Jun 2026',
    tag: 'QoL',
    title: 'AFK Card Auto-Apply',
    body: 'Level-up stat cards are now auto-applied while you\'re offline. Come back to boosted stats and an AFK summary toast.',
  },
  {
    date: 'Jun 2026',
    tag: 'QoL',
    title: 'Quick Sell Loot',
    body: 'You can now quick-sell lootbox rewards for 50% of their coin value right from the reveal screen.',
  },
  {
    date: 'Jun 2026',
    tag: 'PERF',
    title: 'Loading Screen & Optimisations',
    body: 'Assets now preload before the game starts. Gzip compression and smart caching for faster loads on every visit.',
  },
];

// ── Scroll-reveal hook ────────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
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

/** The 4 corner rivets used by in-game plates/modals. */
function Rivets() {
  return (
    <>
      <span className="lp-rivet lp-rivet--tl" />
      <span className="lp-rivet lp-rivet--tr" />
      <span className="lp-rivet lp-rivet--bl" />
      <span className="lp-rivet lp-rivet--br" />
    </>
  );
}

function TagBadge({ tag }) {
  const cls = {
    NEW:     'lp-tag--new',
    BALANCE: 'lp-tag--balance',
    QoL:     'lp-tag--qol',
    PERF:    'lp-tag--perf',
    FIX:     'lp-tag--fix',
  }[tag] || '';
  return <span className={`lp-tag ${cls}`}>{tag}</span>;
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

function SocialIcon({ href, src, alt }) {
  return (
    <a className="lp-socialrow__icon" href={href} target="_blank" rel="noopener noreferrer" title={alt}>
      <img src={src} alt={alt} />
    </a>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const [legalDoc, setLegalDoc] = useState(null); // null | 'privacy' | 'terms'

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

          <div className="lp-panel lp-contract">
            <Rivets />
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
            <SocialIcon href={SOCIAL_LINKS.discord} src="/assets/icons/discordicon.png" alt="Discord" />
            <SocialIcon href={SOCIAL_LINKS.twitter} src="/assets/icons/Xicon.png"       alt="X / Twitter" />
            <SocialIcon href={SOCIAL_LINKS.pump}    src="/assets/icons/pumpicon.png"    alt="Pump.fun" />
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
        <Reveal>
          <p className="lp-kicker">NAVIGATING THE SEWERS</p>
          <h2 className="lp-headline">FIND YOUR WAY AROUND.</h2>
          <div className="lp-cards">
            {SEWER_CARDS.map((card, i) => (
              <div key={i} className="lp-panel lp-scard">
                <Rivets />
                <div className="lp-scard__icon"><img src={card.icon} alt="" /></div>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
                {card.link && (
                  <a href={card.link} target="_blank" rel="noopener noreferrer">{card.linkLabel}</a>
                )}
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
        <Reveal>
          <div className="lp-updates-center">
            <p className="lp-kicker lp-kicker--center">LATEST UPDATES</p>
            <h2 className="lp-headline">NEWS FROM BELOW.</h2>

            <div className="lp-panel lp-updates__panel">
              <Rivets />
              {UPDATES.map((u, i) => (
                <div key={i} className="lp-update-row">
                  <div className="lp-update-row__meta">
                    <TagBadge tag={u.tag} />
                    <span className="lp-update-row__date">{u.date}</span>
                  </div>
                  <div className="lp-update-row__content">
                    <div className="lp-update-row__title">{u.title}</div>
                    <div className="lp-update-row__body">{u.body}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lp-backtogame">
              <button className="lp-backbtn" onClick={scrollToTop}>BACK TO THE GAME <b>▲</b></button>
            </div>
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
            <a href="#privacy" onClick={e => { e.preventDefault(); setLegalDoc('privacy'); }}>Privacy Policy</a>
            <a href="#terms"   onClick={e => { e.preventDefault(); setLegalDoc('terms');   }}>Terms of Service</a>
          </div>
        </div>
        <div className="lp-footer__copy">
          <span>© {new Date().getFullYear()} ScrapRats. All rights reserved.</span>
        </div>
      </footer>

      <LegalModal doc={legalDoc} onClose={() => setLegalDoc(null)} />

    </div>
  );
}
