import React, { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { mintApi } from '../api/client.js';
import { NETWORK, TOKEN_SYMBOL } from '../constants/solana.js';
import { signAndSend } from '../utils/solanaTx.js';
import RatSprite from './RatSprite.jsx';

const BURN_AMOUNT = 10_000;

function explorerTxUrl(sig) {
  const cluster = NETWORK === 'mainnet-beta' ? '' : `?cluster=${NETWORK}`;
  return `https://solana.fm/tx/${sig}${cluster}`;
}

function explorerAssetUrl(addr) {
  const cluster = NETWORK === 'mainnet-beta' ? '' : `?cluster=${NETWORK}`;
  return `https://solana.fm/address/${addr}${cluster}`;
}

export default function MintModal({ rat, onClose, onMinted }) {
  const { connection } = useConnection();
  const wallet         = useWallet();

  const [step, setStep]           = useState('preview'); // preview | signing | success | error
  const [message, setMessage]     = useState('');
  const [fingerprint, setFp]      = useState(null);
  const [available, setAvailable] = useState(true);
  const [scrapBalance, setScrap]  = useState(null);
  const [balanceError, setBalanceError] = useState(null);
  const [reservationId, setResId] = useState(null);
  const [mintResult, setResult]   = useState(null);

  const activeSlots = rat.traits.filter(Boolean);
  const ratSeed     = rat.id ? rat.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;

  const checkAvailability = useCallback(async () => {
    try {
      const res = await mintApi.check(rat.traits);
      setFp(res.fingerprint);
      setAvailable(res.available);
      if (!res.available && res.mintAddress) {
        setMessage('This exact trait combo was already minted.');
      } else if (res.reserved) {
        setMessage('Someone is minting this combo — try again in a few minutes.');
      }
    } catch (e) {
      setMessage(e.message);
    }
  }, [rat.traits]);

  const checkScrapBalance = useCallback(async () => {
    if (!wallet.publicKey) {
      setScrap(null);
      setBalanceError(null);
      return;
    }
    setBalanceError(null);
    try {
      const { balance } = await mintApi.balance(wallet.publicKey.toBase58());
      setScrap(balance);
    } catch (e) {
      setScrap(null);
      setBalanceError(e.message || 'Could not load token balance');
    }
  }, [wallet.publicKey, connection]);

  useEffect(() => { checkAvailability(); }, [checkAvailability]);
  useEffect(() => { checkScrapBalance(); }, [checkScrapBalance]);

  const canMint = wallet.connected
    && wallet.publicKey
    && activeSlots.length > 0
    && !rat.minted
    && available
    && !balanceError
    && scrapBalance !== null
    && scrapBalance >= BURN_AMOUNT;

  const startMint = async () => {
    if (!wallet.publicKey) return;
    setStep('signing');
    setMessage('Reserving trait combo…');

    try {
      const reserve = await mintApi.reserve({
        traits:  rat.traits,
        ratId:   rat.id,
        ratName: rat.name,
      });
      setResId(reserve.reservationId);
      setFp(reserve.fingerprint);

      const buildFresh = (completedBurnSignature) => mintApi.build({
        reservationId: reserve.reservationId,
        walletAddress: wallet.publicKey.toBase58(),
        completedBurnSignature,
      });

      const pendingBurnKey = `scraprats-burn-${reserve.fingerprint}`;
      const pendingBurn    = sessionStorage.getItem(pendingBurnKey);

      let burnSig = pendingBurn;

      if (!burnSig) {
        setMessage(`Sign burn in wallet — ${BURN_AMOUNT.toLocaleString()} ${TOKEN_SYMBOL}…`);
        const builtBurn = await buildFresh();
        burnSig = await signAndSend(
          connection, wallet, builtBurn.burnTransaction,
          builtBurn.burnLastValidHeight,
          sig => sessionStorage.setItem(pendingBurnKey, sig),
        );
        sessionStorage.setItem(pendingBurnKey, burnSig);
      } else {
        setMessage('Resuming — burn already completed, minting NFT…');
      }

      setMessage('Sign mint in wallet…');
      const builtMint = await buildFresh(burnSig);
      const mintSig = await signAndSend(
        connection, wallet, builtMint.mintTransaction,
        builtMint.mintLastValidHeight,
      );

      sessionStorage.removeItem(pendingBurnKey);

      setMessage('Confirming on server…');
      const confirmed = await mintApi.confirm({
        reservationId:   reserve.reservationId,
        burnSignature: burnSig,
        mintSignature: mintSig,
        walletAddress: wallet.publicKey.toBase58(),
      });

      setResult(confirmed);
      onMinted({
        mintAddress:      confirmed.mintAddress,
        traitFingerprint: confirmed.fingerprint,
        mintedAt:         confirmed.mintedAt,
      });
      setStep('success');
    } catch (e) {
      setMessage(e.message || 'Mint failed');
      setStep('error');
    }
  };

  return (
    <div className="popup__scrim" onClick={onClose}>
      <div className="base-rat-detail plate mint-modal" onClick={e => e.stopPropagation()}>
        <div className="base-rat-detail__hd">
          <span className="base-rat-detail__name">MINT NFT — {rat.name}</span>
          <button className="popup__close" onClick={onClose}>✕</button>
        </div>

        <div className="mint-modal__body">
          <div className="mint-modal__preview">
            <div className="base-rat-detail__sprite mint-modal__sprite">
              <RatSprite activeSlots={activeSlots} height={160} seed={ratSeed} />
            </div>

            <div className="mint-modal__info">
              <p className="mint-modal__cost">
                Cost: <strong>{BURN_AMOUNT.toLocaleString()} {TOKEN_SYMBOL}</strong> burned + SOL gas
              </p>
              {wallet.connected && scrapBalance !== null && (
                <p className="mint-modal__balance" style={{ color: scrapBalance >= BURN_AMOUNT ? 'var(--toxic)' : '#e05050' }}>
                  Your balance: {scrapBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} {TOKEN_SYMBOL}
                </p>
              )}
              {wallet.connected && balanceError && (
                <p className="mint-modal__balance" style={{ color: '#e05050' }}>{balanceError}</p>
              )}
              {wallet.connected && scrapBalance === null && !balanceError && (
                <p className="mint-modal__hint">Loading balance…</p>
              )}
              {!wallet.connected && (
                <p className="mint-modal__hint">Connect wallet in Settings first.</p>
              )}
              {fingerprint && (
                <p className="mint-modal__fp" title={fingerprint}>
                  Fingerprint: {fingerprint.slice(0, 12)}…
                </p>
              )}
              {message && step !== 'success' && (
                <p className={`mint-modal__msg${step === 'error' ? ' mint-modal__msg--error' : ''}`}>{message}</p>
              )}
            </div>
          </div>

          {step === 'success' && mintResult && (
            <div className="mint-modal__success">
              <p className="mint-modal__success-title">✓ MINTED!</p>
              <p className="mint-modal__mint-addr">{mintResult.mintAddress}</p>
              <a
                href={explorerAssetUrl(mintResult.mintAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="hirebtn mint-modal__explorer-btn"
              >
                VIEW ON EXPLORER
              </a>
            </div>
          )}

          <div className="mint-modal__actions">
            {step === 'preview' && (
              <>
                <button className="hirebtn mint-modal__btn" disabled={!canMint} onClick={startMint}>
                  {rat.minted ? 'ALREADY MINTED' : !available ? 'COMBO TAKEN' : 'CONFIRM & MINT'}
                </button>
                <button className="hirebtn mint-modal__btn mint-modal__btn--ghost" onClick={onClose}>CANCEL</button>
              </>
            )}
            {step === 'signing' && (
              <p className="mint-modal__signing">Sign in your wallet…</p>
            )}
            {(step === 'success' || step === 'error') && (
              <button className="hirebtn mint-modal__btn" onClick={onClose}>CLOSE</button>
            )}
          </div>

          <p className="mint-modal__disclaimer">
            Burns 10,000 {TOKEN_SYMBOL} permanently. Rat stays in your base but cannot be sold, equipped, or swapped.
          </p>
        </div>
      </div>
    </div>
  );
}

export { explorerTxUrl, explorerAssetUrl, BURN_AMOUNT };
