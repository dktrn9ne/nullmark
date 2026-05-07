// NULLMARK — Solana Devnet Chain Integration
// Uses SPL Memo Program — no custom contract needed

const NullmarkChain = (() => {
  const DEVNET_RPC  = 'https://api.devnet.solana.com';
  const MEMO_PROG   = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

  let connection, keypair;

  // ── base58 encoder (no deps needed) ──
  const BASE58_ALPHA = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  function toBase58(bytes) {
    let n = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join(''));
    let result = '';
    while (n > 0n) { result = BASE58_ALPHA[Number(n % 58n)] + result; n /= 58n; }
    for (const b of bytes) { if (b === 0) result = '1' + result; else break; }
    return result;
  }

  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
  }

  async function init() {
    connection = new solanaWeb3.Connection(DEVNET_RPC, 'confirmed');

    // Persist keypair so receipts accumulate
    const stored = localStorage.getItem('nm_kp');
    if (stored) {
      keypair = solanaWeb3.Keypair.fromSecretKey(new Uint8Array(JSON.parse(stored)));
    } else {
      keypair = solanaWeb3.Keypair.generate();
      localStorage.setItem('nm_kp', JSON.stringify(Array.from(keypair.secretKey)));
      await airdrop();
    }

    // Update every wallet display element
    const addr  = keypair.publicKey.toString();
    const short = addr.slice(0,4) + '...' + addr.slice(-4);
    document.querySelectorAll('.wallet-addr').forEach(el => el.textContent = short);

    // Check balance, top up if low
    try {
      const lamports = await connection.getBalance(keypair.publicKey);
      if (lamports < 500_000_000) await airdrop(); // < 0.5 SOL
    } catch(e) {}

    console.log(`[NULLMARK] Wallet: ${addr}`);
    return addr;
  }

  async function airdrop() {
    try {
      const sig = await connection.requestAirdrop(keypair.publicKey, 2_000_000_000);
      await connection.confirmTransaction(sig, 'confirmed');
      console.log('[NULLMARK] Airdrop confirmed — 2 SOL');
    } catch(e) {
      console.warn('[NULLMARK] Airdrop rate-limited. Run: solana airdrop 2 ' + keypair?.publicKey?.toString() + ' --url devnet');
    }
  }

  async function hashToChain({ creditor, bureau, disputeType, letterText }) {
    if (!keypair) throw new Error('Wallet not initialized');

    const hash = await sha256(letterText);
    const memo  = JSON.stringify({
      app: 'NULLMARK', v: '1.0',
      type: 'DISPUTE_PROOF',
      creditor, bureau, disputeType,
      sha256: hash,
      ts: new Date().toISOString()
    });

    const memoPubkey = new solanaWeb3.PublicKey(MEMO_PROG);
    const tx = new solanaWeb3.Transaction().add(
      new solanaWeb3.TransactionInstruction({
        keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: false }],
        programId: memoPubkey,
        data: Buffer.from(memo, 'utf-8')
      })
    );

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    tx.recentBlockhash   = blockhash;
    tx.lastValidBlockHeight = lastValidBlockHeight;
    tx.feePayer          = keypair.publicKey;
    tx.sign(keypair);

    const sig = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false, preflightCommitment: 'confirmed'
    });
    await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');

    // Persist to proof receipts list in localStorage
    const receipts = JSON.parse(localStorage.getItem('nm_receipts') || '[]');
    receipts.unshift({ sig, hash, creditor, bureau, disputeType, ts: new Date().toISOString() });
    localStorage.setItem('nm_receipts', JSON.stringify(receipts.slice(0, 20)));

    return {
      signature:   sig,
      hashHex:     hash,
      explorerUrl: `https://explorer.solana.com/tx/${sig}?cluster=devnet`
    };
  }

  function getReceipts() {
    return JSON.parse(localStorage.getItem('nm_receipts') || '[]');
  }

  return { init, airdrop, hashToChain, getReceipts };
})();

window.addEventListener('DOMContentLoaded', () => NullmarkChain.init());
