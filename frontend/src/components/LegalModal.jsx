import React from 'react';

const PRIVACY = (
  <>
    <h3>1. What We Collect</h3>
    <p>
      If you create an account we store your email address, a hashed version of your password
      (we never see or store the plain text), your chosen username, and your game progress
      (levels, coins, crew, items and similar game data). If you sign in with Google we receive
      your email address and name from Google — we never see your Google password.
    </p>
    <h3>2. What We Don't Collect</h3>
    <p>
      We don't collect payment information, precise location data, or contacts. We don't sell
      your data to anyone. Ever. We're rats, not snitches.
    </p>
    <h3>3. Cookies & Local Storage</h3>
    <p>
      We use a login cookie to keep you signed in and your browser's local storage to save game
      progress when you play as a guest. No third-party advertising or tracking cookies.
    </p>
    <h3>4. How Your Data Is Used</h3>
    <p>
      Your data is used solely to run the game: saving your progress to the cloud, restoring it
      across devices, and keeping your account secure.
    </p>
    <h3>5. Data Deletion</h3>
    <p>
      Want your account and data gone? Contact us on Discord and we'll wipe it — account,
      save data, everything down the drain.
    </p>
    <h3>6. Changes</h3>
    <p>
      If this policy changes we'll update this page. Continued use of the game after changes
      means you accept the updated policy.
    </p>
  </>
);

const TERMS = (
  <>
    <h3>1. The Game</h3>
    <p>
      ScrapRats is a free-to-play browser game provided "as is". We work hard to keep the sewer
      running, but we can't guarantee uninterrupted uptime, bug-free pipes, or that your
      favourite rat won't get rebalanced.
    </p>
    <h3>2. Your Account</h3>
    <p>
      You're responsible for keeping your login credentials safe. Don't share accounts, don't
      use bots, scripts or exploits, and don't try to break the game economy. Cheaters get
      flushed (accounts may be reset or banned).
    </p>
    <h3>3. Game Progress & Virtual Items</h3>
    <p>
      Coins, diamonds, crew, loot and all other in-game items have no real-world monetary value
      and exist only within the game. We may rebalance, change or reset game content as the game
      evolves — especially during alpha/beta phases.
    </p>
    <h3>4. The Token</h3>
    <p>
      Any token associated with ScrapRats is not required to play. Nothing on this site is
      financial advice. Always do your own research — rats get rugged too.
    </p>
    <h3>5. Acceptable Use</h3>
    <p>
      Be decent. No harassment, hate speech or illegal activity in any community space connected
      to the game.
    </p>
    <h3>6. Liability</h3>
    <p>
      To the maximum extent permitted by law, ScrapRats and its creators are not liable for any
      damages arising from your use of the game or website.
    </p>
    <h3>7. Changes</h3>
    <p>
      We may update these terms as the game grows. Continued play after changes means you accept
      the updated terms.
    </p>
  </>
);

/**
 * Full-screen legal document overlay.
 * @param {'privacy'|'terms'|null} doc — which document to show
 */
export default function LegalModal({ doc, onClose }) {
  if (!doc) return null;
  const isPrivacy = doc === 'privacy';

  return (
    <div className="legal-overlay" onClick={onClose}>
      <div className="lp-panel legal-modal" onClick={e => e.stopPropagation()}>
        <button className="legal-modal__close" onClick={onClose}>✕</button>
        <h2 className="legal-modal__title">
          {isPrivacy ? 'PRIVACY POLICY' : 'TERMS OF SERVICE'}
        </h2>
        <p className="legal-modal__updated">Last updated: June 2026</p>
        <div className="legal-modal__body">
          {isPrivacy ? PRIVACY : TERMS}
        </div>
        <button className="legal-modal__back" onClick={onClose}>BACK TO THE SEWER</button>
      </div>
    </div>
  );
}
