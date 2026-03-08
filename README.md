# BountyCapsule

On-chain bounty market using XRPL Escrow and Pinata IPFS storage.

## Features

- **Create Bounties**: Upload problem files to IPFS and lock crypto rewards on XRPL
- **Submit Solutions**: Anyone can submit solution capsules to IPFS
- **Transparent Payouts**: Bounty issuers release escrow to winners on-chain

## Quick Start

### Prerequisites

- Node.js 18+
- Pinata account (https://app.pinata.cloud)

### Setup

1. Install dependencies:
```bash
cd bounty-capsule
npm install
cd src/client && npm install && cd ../..
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your Pinata JWT
```

3. Start the server:
```bash
npm run server
```

4. Start the client (in another terminal):
```bash
npm run client
```

5. Open http://localhost:5173

## Usage Flow

1. **Create Wallet**: Click "Create Test Wallet" to get XRPL Devnet credentials
2. **Create Bounty**: Fill in title, description, and bounty amount
3. **Share**: Others can browse and submit solutions
4. **Payout**: Issuer selects a winner and releases the escrow

## Tech Stack

- **Backend**: Express.js, xrpl.js, @pinata/sdk
- **Frontend**: React, Vite
- **Blockchain**: XRP Ledger (Devnet)
- **Storage**: Pinata IPFS

## API Endpoints

- `POST /api/wallet/create` - Create test wallet
- `POST /api/wallet/from-seed` - Load wallet from seed
- `POST /api/escrow/create` - Lock funds in escrow
- `POST /api/escrow/finish` - Release escrow funds
- `POST /api/challenge/create` - Create new bounty
- `GET /api/challenges` - List all bounties
- `POST /api/submission/create` - Submit solution
- `POST /api/payout` - Release bounty to winner
