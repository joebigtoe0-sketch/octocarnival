import './polyfills.js';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './styles.css';
import Game          from './components/Game.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import LandingPage   from './components/LandingPage.jsx';
import { useGameStore } from './stores/gameStore.js';
import { setAuthToken } from './api/client.js';
import { installDevCheat } from './devCheat.js';
import SolanaWalletProvider from './components/SolanaWalletProvider.jsx';

// Reattach JWT from persisted store on refresh (cross-domain Railway setup)
const { token } = useGameStore.getState();
if (token) setAuthToken(token);
installDevCheat();

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AppRoot() {
  const [ready, setReady] = useState(false);

  // Nudge mobile browsers to tuck the URL bar (Safari/Chrome shrink chrome on scroll).
  useEffect(() => {
    if (!('ontouchstart' in window)) return;
    const tuck = () => {
      window.scrollTo(0, 1);
      requestAnimationFrame(() => window.scrollTo(0, 0));
    };
    tuck();
    window.addEventListener('orientationchange', tuck);
    return () => window.removeEventListener('orientationchange', tuck);
  }, []);

  if (!ready) return <LoadingScreen onReady={() => setReady(true)} />;
  return (
    <div className="sr-page">
      <section className="sr-game-section" id="game">
        <Game />
        <a
          className="lp-descend"
          href="#about"
          onClick={e => {
            e.preventDefault();
            document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          DESCEND DEEPER <b>▼</b>
        </a>
      </section>
      <LandingPage />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <SolanaWalletProvider>
        <AppRoot />
      </SolanaWalletProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
