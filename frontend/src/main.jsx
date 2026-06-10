import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './styles.css';
import Game from './components/Game.jsx';
import { useGameStore } from './stores/gameStore.js';
import { setAuthToken } from './api/client.js';

// On app boot, reattach the JWT from the persisted store so API calls work
// across page refreshes in production (cross-domain Railway setup).
const { token } = useGameStore.getState();
if (token) setAuthToken(token);

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Game />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
