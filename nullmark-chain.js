const NullmarkChain = (() => {
  const DEVNET_RPC = 'https://api.devnet.solana.com';
  const MEMO_PROGRAM = new solanaWeb3.PublicKey(
    'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
  );

  let connection, keypair;

  async function init() {
    connection = new solanaWeb3.Connection(DEVNET_RPC, 'confirmed');

    // Persist keypair across sessions so receipts stack up
    const stored = localStorage.getItem('nm_keypair');
    if (stored) {
      keypair = solanaWeb3.Keypair.fromSecretKey(
        new Uint8Array(JSON.parse(stored))
      );
    } else {
      keypair = solanaWeb3.Keypair.generate();
      localStorage.setItem('nm_keypair',
        JSON.stringify(Array.from(keypair.secretKey))
      );
      await airdrop(); // fund it on first run
    }

    // Update wallet display in sidebar
    const addr = keypair.publicKey.toString();
    const shortened = addr.slice(0, 4) + '...' + addr.slice(-4);
    document.querySelectorAll('.wallet-address, [data-wallet]')
      .forEach(el => el.textContent = shortened);

    return addr;
  }

  async function airdrop() {
    try {
      const sig = await connection.requestAirdrop(keypair.publicKey, 2e9); // 2 SOL
      await connection.confirmTransaction(sig, 'confirmed');
      console.log('Airdrop confirmed');
    } catch (e) {
      console.warn('Airdrop rate limited — use CLI: solana airdrop 2 <addr> --url devnet');
    }
  }

  async function hashToChain({ creditor, bureau, letterText, disputeType }) {
    // SHA-256 the full letter
    const encoded = new TextEncoder().encode(letterText);
    const hashBuf = await crypto.subtle.digest('SHA-256', encoded);
    const hashHex = Array.from(new Uint8Array(hashBuf))
      .map(b => b.toString(16).padStart(2, '0')).join('');

    // Memo payload — this is what gets written on-chain
    const memo = JSON.stringify({
      app: 'NULLMARK',
      v: '1.0',
      type: 'DISPUTE_PROOF_RECEIPT',
      creditor,
      bureau,
      disputeType,
      sha256: hashHex,
      ts: new Date().toISOString()
    });

    const tx = new solanaWeb3.Transaction().add(
      new solanaWeb3.TransactionInstruction({
        keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: false }],
        programId: MEMO_PROGRAM,
        data: Buffer.from(memo, 'utf-8')
      })
    );

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.lastValidBlockHeight = lastValidBlockHeight;
    tx.feePayer = keypair.publicKey;
    tx.sign(keypair);

    const raw = tx.serialize();
    const signature = await connection.sendRawTransaction(raw, {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    });

    await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      'confirmed'
    );

    return {
      signature,
      hashHex,
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`
    };
  }

  return { init, hashToChain, airdrop };
})();

// Auto-init on load
window.addEventListener('DOMContentLoaded', () => NullmarkChain.init());
