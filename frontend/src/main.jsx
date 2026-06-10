import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './styles.css';
import Game          from './components/Game.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import { useGameStore } from './stores/gameStore.js';
import { setAuthToken } from './api/client.js';

// Reattach JWT from persisted store on refresh (cross-domain Railway setup)
const { token } = useGameStore.getState();
if (token) setAuthToken(token);

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AppRoot() {
  const [ready, setReady] = useState(false);
  return ready
    ? <Game />
    : <LoadingScreen onReady={() => setReady(true)} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppRoot />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
