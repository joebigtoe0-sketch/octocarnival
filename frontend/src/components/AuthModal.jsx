import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import bs58 from 'bs58';
import { useUiStore }  from '../stores/uiStore.js';
import { useGameStore } from '../stores/gameStore.js';
import { authApi, gameApi, setAuthToken } from '../api/client.js';

/* ──────────────────────────────────────────────
   Full-screen auth modal: Login / Register
   Also handles the "save progress" guest prompt.
────────────────────────────────────────────── */
export default function AuthModal() {
  const authOpen    = useUiStore(s => s.authOpen);
  const authTab     = useUiStore(s => s.authTab);
  const guestPrompt = useUiStore(s => s.guestPrompt);
  const closeAuth   = useUiStore(s => s.closeAuth);
  const setAuthTab  = useUiStore(s => s.setAuthTab);
  const hidePrompt  = useUiStore(s => s.hideGuestPrompt);
  const openAuth    = useUiStore(s => s.openAuth);

  const setUser    = useGameStore(s => s.setUser);
  const isGuest    = useGameStore(s => s.isGuest);
  const saveToServer = useGameStore(s => s.saveToServer);

  const wallet = useWallet();
  const { publicKey, signMessage, connected } = wallet;

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);

  // reset form when modal opens / tab changes
  useEffect(() => {
    setEmail(''); setPassword(''); setUsername('');
    setError(''); setDone(false);
  }, [authOpen, authTab]);

  // Shared post-auth flow: set user, merge or load cloud save, close modal
  async function handleAuthSuccess(res, displayName) {
    const uid      = res.userId || res.id;
    const uname    = res.username || displayName || uid;
    const token    = res.token;
    // Attach token synchronously so the blob load below goes out authenticated
    setAuthToken(token);
    setUser(uid, uname, token);

    try {
      // Try to load an existing cloud save
      const { blob } = await gameApi.loadBlob();
      if (blob && Object.keys(blob).length > 0) {
        // Cloud save exists — restore it (overrides local state)
        useGameStore.setState({ ...blob, userId: uid, username: uname, isGuest: false, token });
      } else {
        // No cloud save yet — push the current local progress to the server
        const localState = useGameStore.getState();
        await authApi.guestMerge(localState);
      }
    } catch {
      // Best-effort: if save/load fails, game still works locally
    }

    setDone(true);
    setTimeout(() => { closeAuth(); hidePrompt(); }, 1200);
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    const isRegister = authTab === 'register';
    if (isRegister && !username.trim()) {
      setError('Username required for email registration');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.email(email, password, isRegister, isRegister ? username : undefined);
      await handleAuthSuccess(res, username || email.split('@')[0]);
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function walletAuth() {
    if (!publicKey) {
      setError('Connect your wallet first');
      return;
    }
    if (!signMessage) {
      setError('This wallet does not support message signing');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const walletAddress = publicKey.toBase58();
      const { message, challengeToken } = await authApi.walletChallenge(walletAddress);
      const sig = await signMessage(new TextEncoder().encode(message));
      const res = await authApi.walletLogin({
        walletAddress,
        signature:     bs58.encode(sig),
        challengeToken,
        username:      authTab === 'register' ? username : undefined,
        register:      authTab === 'register',
      });
      await handleAuthSuccess(res, username || res.username || walletAddress.slice(0, 4));
    } catch (err) {
      setError(err.message || 'Wallet sign-in failed');
    } finally {
      setLoading(false);
    }
  }

  // ── Guest prompt (shown below the game, not full-screen modal) ──
  if (guestPrompt && !authOpen) {
    return (
      <div className="guest-prompt" onClick={e => e.stopPropagation()}>
        <div className="guest-prompt__inner">
          <button className="guest-prompt__close" onClick={hidePrompt}>✕</button>
          {guestPrompt === '3min' ? (
            <>
              <p className="guest-prompt__title">⚠️ Your progress isn't saved!</p>
              <p className="guest-prompt__body">Create a free account to keep your rats safe.</p>
            </>
          ) : (
            <>
              <p className="guest-prompt__title">🐀 Don't lose your progress!</p>
              <p className="guest-prompt__body">You've been playing for 30 minutes as a guest.</p>
            </>
          )}
          <div className="guest-prompt__actions">
            <button className="guest-prompt__cta" onClick={() => { hidePrompt(); openAuth('register'); }}>
              Create Account
            </button>
            <button className="guest-prompt__login" onClick={() => { hidePrompt(); openAuth('login'); }}>
              Log in
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!authOpen) return null;

  return (
    <div className="auth-overlay" onClick={closeAuth}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-modal__close" onClick={closeAuth}>✕</button>

        {done ? (
          <div className="auth-done">
            <div className="auth-done__icon">✓</div>
            <p>Logged in!</p>
          </div>
        ) : (
          <>
            <h2 className="auth-modal__title">
              {authTab === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>

            <div className="auth-tabs">
              <button
                className={`auth-tab ${authTab === 'login' ? 'auth-tab--active' : ''}`}
                onClick={() => setAuthTab('login')}
              >Login</button>
              <button
                className={`auth-tab ${authTab === 'register' ? 'auth-tab--active' : ''}`}
                onClick={() => setAuthTab('register')}
              >Register</button>
            </div>

            <form className="auth-form" onSubmit={submit}>
              {authTab === 'register' && (
                <div className="auth-field">
                  <label>Username <span style={{ opacity: 0.6 }}>(optional for wallet)</span></label>
                  <input
                    type="text"
                    placeholder="RatLord420"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    maxLength={24}
                  />
                </div>
              )}
              <div className="auth-field">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="rat@sewer.net"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="auth-field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && <p className="auth-error">{error}</p>}

              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? 'Loading…' : authTab === 'login' ? 'Login' : 'Register'}
              </button>
            </form>

            {/* Solana wallet auth */}
            <div className="auth-wallet-wrap">
              <div className="auth-divider"><span>or</span></div>
              {!connected ? (
                <div className="auth-wallet-connect">
                  <p className="auth-wallet-hint">
                    {authTab === 'login' ? 'Sign in' : 'Register'} with your Solana wallet
                  </p>
                  <WalletMultiButton className="auth-wallet-btn" />
                </div>
              ) : (
                <>
                  <p className="auth-wallet-hint">
                    Connected: {publicKey.toBase58().slice(0, 4)}…{publicKey.toBase58().slice(-4)}
                  </p>
                  <button
                    className="auth-submit auth-submit--wallet"
                    type="button"
                    disabled={loading}
                    onClick={walletAuth}
                  >
                    {loading
                      ? 'Confirm in wallet…'
                      : authTab === 'login'
                        ? 'Sign in with wallet'
                        : 'Register with wallet'}
                  </button>
                </>
              )}
            </div>

            {/* Google OAuth */}
            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <div className="auth-google-wrap">
                <div className="auth-divider"><span>or</span></div>
                <GoogleLogin
                  onSuccess={async cred => {
                    setError(''); setLoading(true);
                    try {
                      const res = await authApi.google(cred.credential);
                      await handleAuthSuccess(res, null);
                    } catch (err) {
                      setError(err.message || 'Google sign-in failed');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onError={() => setError('Google sign-in failed')}
                  theme="filled_black"
                  shape="rectangular"
                  text={authTab === 'login' ? 'signin_with' : 'signup_with'}
                  width="100%"
                />
              </div>
            )}

            {isGuest && (
              <p className="auth-guest-note">
                Playing as guest — your progress is saved locally.
                {authTab === 'register'
                  ? ' Registering will sync it to the cloud.'
                  : ' Log in to restore a previous account.'}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
