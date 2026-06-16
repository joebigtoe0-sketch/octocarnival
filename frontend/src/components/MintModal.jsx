import React, { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction, PublicKey } from '@solana/web3.js';
import { mintApi } from '../api/client.js';
import { CONTRACT_ADDRESS } from './LandingPage.jsx';
import { NETWORK } from './SolanaWalletProvider.jsx';
import RatSprite from './RatSprite.jsx';

const BURN_AMOUNT = 10_000;
const SCRAP_MINT  = import.meta.env.VITE_SCRAP_MINT_ADDRESS || CONTRACT_ADDRESS;

function explorerTxUrl(sig) {
  const cluster = NETWORK === 'mainnet-beta' ? '' : `?cluster=${NETWORK}`;
  return `https://solana.fm/tx/${sig}${cluster}`;
}

function explorerAssetUrl(addr) {
  const cluster = NETWORK === 'mainnet-beta' ? '' : `?cluster=${NETWORK}`;
  return `https://solana.fm/address/${addr}${cluster}`;
}

async function signAndSend(connection, wallet, base64Tx, blockhash, lastValidBlockHeight) {
  const raw = Uint8Array.from(atob(base64Tx), c => c.charCodeAt(0));
  const tx  = VersionedTransaction.deserialize(raw);

  const signed = await wallet.signTransaction(tx);
  const sig    = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
  return sig;
}

export default function MintModal({ rat, onClose, onMinted }) {
  const { connection } = useConnection();
  const wallet         = useWallet();

  const [step, setStep]           = useState('preview'); // preview | signing | success | error
  const [message, setMessage]     = useState('');
  const [fingerprint, setFp]      = useState(null);
  const [available, setAvailable] = useState(true);
  const [scrapBalance, setScrap]  = useState(null);
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
    if (!wallet.publicKey) { setScrap(null); return; }
    try {
      const mint = new PublicKey(SCRAP_MINT);
      const { value } = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, { mint });
      if (!value.length) { setScrap(0); return; }
      setScrap(value[0].account.data.parsed.info.tokenAmount.uiAmount ?? 0);
    } catch {
      setScrap(0);
    }
  }, [wallet.publicKey, connection]);

  useEffect(() => { checkAvailability(); }, [checkAvailability]);
  useEffect(() => { checkScrapBalance(); }, [checkScrapBalance]);

  const canMint = wallet.connected
    && wallet.publicKey
    && activeSlots.length > 0
    && !rat.minted
    && available
    && (scrapBalance === null || scrapBalance >= BURN_AMOUNT);

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

      setMessage('Building transactions…');
      const built = await mintApi.build({
        reservationId: reserve.reservationId,
        walletAddress: wallet.publicKey.toBase58(),
      });

      setMessage(`Burning ${BURN_AMOUNT.toLocaleString()} $SCRAP…`);
      const burnSig = await signAndSend(
        connection, wallet, built.burnTransaction,
        built.burnBlockhash, built.burnLastValidHeight
      );

      setMessage('Minting NFT…');
      const mintSig = await signAndSend(
        connection, wallet, built.mintTransaction,
        built.mintBlockhash, built.mintLastValidHeight
      );

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

        <div className="base-rat-detail__body">
          <div className="base-rat-detail__sprite">
            <RatSprite activeSlots={activeSlots} height={140} seed={ratSeed} />
          </div>

          <div className="mint-modal__info">
            <p className="mint-modal__cost">
              Cost: <strong>{BURN_AMOUNT.toLocaleString()} $SCRAP</strong> burned + SOL gas
            </p>
            {wallet.connected && scrapBalance !== null && (
              <p className="mint-modal__balance" style={{ color: scrapBalance >= BURN_AMOUNT ? 'var(--toxic)' : '#e05050' }}>
                Your balance: {scrapBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} $SCRAP
              </p>
            )}
            {!wallet.connected && (
              <p style={{ color: '#e0a050', fontSize: 12 }}>Connect wallet in Settings first.</p>
            )}
            {fingerprint && (
              <p className="mint-modal__fp" title={fingerprint}>
                Fingerprint: {fingerprint.slice(0, 12)}…
              </p>
            )}
            {message && step !== 'success' && (
              <p className="mint-modal__msg" style={{ color: step === 'error' ? '#e05050' : '#9ab080' }}>{message}</p>
            )}
          </div>

          {step === 'success' && mintResult && (
            <div className="mint-modal__success">
              <p style={{ color: 'var(--toxic)', fontFamily: 'var(--fnt-pixel)' }}>✓ MINTED!</p>
              <p style={{ fontSize: 11, wordBreak: 'break-all' }}>{mintResult.mintAddress}</p>
              <a
                href={explorerAssetUrl(mintResult.mintAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="hirebtn"
                style={{ display: 'inline-block', marginTop: 8, fontSize: 11 }}
              >
                VIEW ON EXPLORER
              </a>
            </div>
          )}

          <div className="mint-modal__actions">
            {step === 'preview' && (
              <>
                <button className="hirebtn" disabled={!canMint} onClick={startMint}>
                  {rat.minted ? 'ALREADY MINTED' : !available ? 'COMBO TAKEN' : 'CONFIRM & MINT'}
                </button>
                <button className="hirebtn" style={{ opacity: 0.7 }} onClick={onClose}>CANCEL</button>
              </>
            )}
            {step === 'signing' && (
              <p style={{ fontFamily: 'var(--fnt-pixel)', fontSize: 11, color: 'var(--gold)' }}>Sign in your wallet…</p>
            )}
            {(step === 'success' || step === 'error') && (
              <button className="hirebtn" onClick={onClose}>CLOSE</button>
            )}
          </div>

          <p className="mint-modal__disclaimer" style={{ fontSize: 10, color: '#5a6450', marginTop: 12 }}>
            Burns 10,000 $SCRAP permanently. Rat stays in your base but cannot be sold, equipped, or swapped.
          </p>
        </div>
      </div>
    </div>
  );
}

export { explorerTxUrl, explorerAssetUrl, BURN_AMOUNT };
