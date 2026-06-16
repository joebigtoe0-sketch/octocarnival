import { VersionedTransaction } from '@solana/web3.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Confirm a transaction using HTTP polling only (no WebSocket).
 * Needed because our RPC proxy is HTTP POST — wallet adapter WS would fail.
 */
export async function pollTransactionConfirmation(connection, signature, lastValidBlockHeight) {
  const deadline = Date.now() + 90_000;

  while (Date.now() < deadline) {
    const { value } = await connection.getSignatureStatuses([signature]);
    const status = value[0];

    if (status) {
      if (status.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
      }
      if (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized') {
        return;
      }
    }

    const blockHeight = await connection.getBlockHeight('confirmed');
    if (blockHeight > lastValidBlockHeight) {
      if (status && !status.err &&
          (status.confirmationStatus === 'confirmed' || status.confirmationStatus === 'finalized')) {
        return;
      }
      throw new Error(
        `Transaction expired (block height exceeded). Check explorer for ${signature}`
      );
    }

    await sleep(1500);
  }

  throw new Error(`Transaction confirmation timed out. Check explorer for ${signature}`);
}

export async function signAndSend(connection, wallet, base64Tx, lastValidBlockHeight, onSent) {
  const raw = Uint8Array.from(atob(base64Tx), c => c.charCodeAt(0));
  const tx  = VersionedTransaction.deserialize(raw);

  const signed = await wallet.signTransaction(tx);
  const sig    = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
    maxRetries:    3,
  });

  onSent?.(sig);
  await pollTransactionConfirmation(connection, sig, lastValidBlockHeight);
  return sig;
}
