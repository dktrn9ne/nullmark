# NULLMARK — Onchain Credit Intelligence

> AI-powered credit dispute app built natively for the Solana Seeker.

![Nullmark](https://nullmark-seven.vercel.app/)

## Overview

Nullmark is a mobile-first credit intelligence platform that combines AI-generated FCRA/Metro 2 dispute letters, real-time credit AI, and immutable onchain proof receipts written to Solana Devnet. Built as a native Android APK for the Solana Seeker phone.

Over 200 million Americans have errors on their credit reports. The dispute process is opaque, slow, and offers zero accountability. Nullmark changes that — every dispute letter is SHA-256 hashed and anchored to Solana as a permanent, tamperproof record no furnisher or bureau can deny.

---

## Features

- **Credit Dashboard** — Real-time score monitoring across Equifax, Experian, and TransUnion with variance detection
- **FCRA / Metro 2 Dispute Letters** — AI-generated, legally-compliant dispute letters targeting specific Metro 2 reporting violations
- **Anchor to Solana** — SHA-256 hash of every dispute letter written to Solana Devnet via SPL Memo Program as an immutable proof receipt
- **Proof Receipts** — On-chain history of all dispute actions, timestamped and tamperproof
- **Maya AI** — Real-time credit intelligence assistant powered by Anthropic Claude, answering questions about your credit profile, dispute strategy, and score optimization

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo |
| Build | EAS Build (Android APK) |
| Blockchain | Solana Devnet — SPL Memo Program |
| AI | Anthropic Claude API (claude-haiku-4-5) |
| Wallet (Roadmap) | Solana Mobile Wallet Adapter + Phantom |
| Hashing | Web Crypto API — SHA-256 |

---

## Solana Integration

Every dispute letter generated in Nullmark is:

1. SHA-256 hashed in the client
2. Packaged as a JSON memo payload containing the hash, creditor, bureau, dispute type, and timestamp
3. Written to **Solana Devnet** via the **SPL Memo Program** as an on-chain transaction
4. Stored as an immutable proof receipt viewable on Solana Explorer

Solana's speed (sub-2 second finality) and near-zero fees make this uniquely practical — anchoring a proof receipt costs fractions of a cent, making per-dispute on-chain verification economically viable at scale.

---

## Getting Started

### Prerequisites

- Node.js v18+
- Expo CLI
- EAS CLI
- Android device or emulator (Solana Seeker recommended)

### Install

```bash
git clone https://github.com/dktrn9ne/nullmark-mobile.git
cd nullmark-mobile
npm install
```

### Run locally

```bash
npx expo start
```

### Build APK

```bash
eas build --platform android --profile preview
```

---

## Environment Variables

Add your Anthropic API key to the headers in `App.tsx`:

```javascript
'x-api-key': 'sk-ant-YOUR-KEY-HERE'
```

> ⚠️ For production, move the API key to a secure backend proxy.

---

## Roadmap

- [ ] Mobile Wallet Adapter SDK — Phantom wallet signing on Seeker
- [ ] Soulbound NFT milestones for dispute achievements
- [ ] Nullmark Reputation Oracle — onchain credit signal for DeFi lending
- [ ] Dispute DAO — community-governed FCRA letter templates
- [ ] Solana dApp Store launch — reaching all 150k+ Seeker users
- [ ] Multi-user accounts with encrypted bureau data storage

---

## Demo

**Web App:** [nullmark-seven.vercel.app](https://nullmark-seven.vercel.app)

**Android APK:** Built with EAS — install directly on Solana Seeker https://drive.google.com/file/d/1_ZV19TMqxfj_z1AhreEryEa3AF7jFJ9u/view?usp=sharing

---

## Built By

**Maurice Thomas** (DKTR N9NE)
Founder, Toledo Holdings · M3 Solutions · Library Labs
Austin, TX

Built at the EasyA Hackathon — Consensus Miami 2026
Solana Mobile Track

---

## License

MIT
