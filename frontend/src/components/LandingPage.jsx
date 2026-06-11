import React from 'react';

// ── Update these when you have real addresses / links ──────────────────────────
export const SOCIAL_LINKS = {
  discord: 'https://discord.gg/scraprats',
  twitter: 'https://x.com/scraprats',
  pump:    'https://pump.fun/coin/YOUR_CONTRACT_ADDRESS',
};
export const CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS_HERE';

// ── Data ──────────────────────────────────────────────────────────────────────
const SEWER_CARDS = [
  {
    icon: '🐀',
    title: 'How to Play',
    body: 'Smash enemies with your Scrapper, collect loot from boxes, hire and level up your crew, equip your rat with gear, and climb the ranks. Idle when you\'re away — your crew keeps fighting.',
  },
  {
    icon: '🗺️',
    title: 'Navigating the UI',
    body: 'Top-left: coins, diamonds, shop & bounties. Top-right: stats, gallery, base & settings. Bottom: your crew roster. Click the enemy to deal damage. Open lootboxes from your inventory.',
  },
  {
    icon: '🐛',
    title: 'Report a Bug',
    body: 'Found something broken? Drop it in our Discord #bug-reports channel. Include your level, what happened and any console errors. We fix fast.',
    link: SOCIAL_LINKS.discord,
    linkLabel: 'Open Discord →',
  },
  {
    icon: '💡',
    title: 'Ideas & Suggestions',
    body: 'Got a feature idea or balance suggestion? We read everything in #suggestions on Discord. The best ideas make it into the game.',
    link: SOCIAL_LINKS.discord,
    linkLabel: 'Share Your Idea →',
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

// ── Components ────────────────────────────────────────────────────────────────
function SocialIcon({ href, src, alt }) {
  return (
    <a className="lp-social-icon" href={href} target="_blank" rel="noopener noreferrer" title={alt}>
      <img src={src} alt={alt} />
    </a>
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

// ── Main export ───────────────────────────────────────────────────────────────
export default function LandingPage() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="lp-root">

      {/* ── § ABOUT ─────────────────────────────────────────────────────────── */}
      <section className="lp-section lp-about" id="about">
        <div className="lp-container">
          <div className="lp-about__grid">
            <div className="lp-about__text">
              <div className="lp-eyebrow">// ABOUT THE GAME</div>
              <h2 className="lp-h2">Welcome to the Sewer.</h2>
              <p className="lp-body">
                ScrapRats is a free-to-play browser idle/clicker game set deep in the grungy
                underworld. Hire a crew of misfits, gear up your rat with loot, and grind your
                way up from bottom-feeding scavenger to feared Sewer King.
              </p>
              <p className="lp-body">
                No downloads. No installs. Just you, your rats, and an infinite pile of enemies
                that need to die. Built on the Solana blockchain — own your loot for real.
              </p>
              <div className="lp-about__stats">
                <div className="lp-stat-pill"><span className="lp-stat-pill__num">6</span><span className="lp-stat-pill__label">Crew Members</span></div>
                <div className="lp-stat-pill"><span className="lp-stat-pill__num">100+</span><span className="lp-stat-pill__label">Loot Variants</span></div>
                <div className="lp-stat-pill"><span className="lp-stat-pill__num">∞</span><span className="lp-stat-pill__label">Grinding</span></div>
              </div>
            </div>

            <div className="lp-about__right">
              <div className="lp-contract-card">
                <div className="lp-contract-card__label">SOLANA CONTRACT ADDRESS</div>
                <div className="lp-contract-card__chain">Pump.fun · Solana</div>
                <div className="lp-contract-card__address" title={CONTRACT_ADDRESS}>
                  {CONTRACT_ADDRESS}
                </div>
                <a
                  className="lp-contract-card__btn"
                  href={SOCIAL_LINKS.pump}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src="/assets/icons/pumpicon.png" alt="pump.fun" style={{ width: 16, height: 16, imageRendering: 'pixelated', marginRight: 7 }} />
                  View on Pump.fun
                </a>
              </div>

              <div className="lp-about__socials">
                <SocialIcon href={SOCIAL_LINKS.discord} src="/assets/icons/discordicon.png" alt="Discord" />
                <SocialIcon href={SOCIAL_LINKS.twitter} src="/assets/icons/Xicon.png"       alt="X / Twitter" />
                <SocialIcon href={SOCIAL_LINKS.pump}    src="/assets/icons/pumpicon.png"    alt="Pump.fun" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── § NAVIGATING THE SEWERS ─────────────────────────────────────────── */}
      <section className="lp-section lp-sewers" id="guide">
        <div className="lp-container">
          <div className="lp-eyebrow">// NAVIGATING THE SEWERS</div>
          <h2 className="lp-h2">Everything You Need to Know</h2>
          <div className="lp-cards-grid">
            {SEWER_CARDS.map((card, i) => (
              <div key={i} className="lp-card">
                <div className="lp-card__icon">{card.icon}</div>
                <div className="lp-card__title">{card.title}</div>
                <p className="lp-card__body">{card.body}</p>
                {card.link && (
                  <a className="lp-card__link" href={card.link} target="_blank" rel="noopener noreferrer">
                    {card.linkLabel}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── § LATEST UPDATES ────────────────────────────────────────────────── */}
      <section className="lp-section lp-updates" id="updates">
        <div className="lp-container">
          <div className="lp-eyebrow">// LATEST UPDATES</div>
          <h2 className="lp-h2">What's New in the Sewer</h2>
          <div className="lp-updates__list">
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

          <div className="lp-back-wrap">
            <button className="lp-back-btn" onClick={scrollToTop}>
              ↑ BACK TO THE SEWER
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer__inner">
          <div className="lp-footer__brand">
            <span className="lp-footer__logo">SCRAPRATS</span>
            <span className="lp-footer__tagline">Idle in the Sewer. Grind in the Dark.</span>
          </div>

          <div className="lp-footer__socials">
            <SocialIcon href={SOCIAL_LINKS.discord} src="/assets/icons/discordicon.png" alt="Discord" />
            <SocialIcon href={SOCIAL_LINKS.twitter} src="/assets/icons/Xicon.png"       alt="X / Twitter" />
            <SocialIcon href={SOCIAL_LINKS.pump}    src="/assets/icons/pumpicon.png"    alt="Pump.fun" />
          </div>

          <div className="lp-footer__links">
            <a href="#" className="lp-footer__link">Privacy Policy</a>
            <span className="lp-footer__sep">·</span>
            <a href="#" className="lp-footer__link">Terms of Service</a>
          </div>

          <div className="lp-footer__copy">
            © {new Date().getFullYear()} ScrapRats. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}
