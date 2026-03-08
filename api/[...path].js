import { createEscrow, finishEscrow, getBalance, createTestWallet, getWalletFromSeed, disconnectClient } from '../src/lib/xrpl.js';
import { uploadJSON, getGatewayUrl } from '../src/lib/pinata.js';

// ── In-memory store (Vercel serverless — SQLite not available) ───────────────
const CHALLENGES = new Map();
const SUBMISSIONS = new Map();

function seedIfEmpty() {
  if (CHALLENGES.size > 0) return;
  const now = Date.now();

  // ── Challenge 1 — Performance ──────────────────────────────────────────────
  CHALLENGES.set('challenge_seed_001', {
    id: 'challenge_seed_001',
    title: 'Optimize XRPL DEX matching for sub-100ms settlement',
    description: `The XRPL DEX currently processes offer matching in ~250ms under peak load.\nYour challenge: design and implement a batched offer-matching algorithm that achieves consistent sub-100ms settlement times while maintaining fairness and price-priority ordering.\n\nThe solution should handle at least 500 offers/second without degrading latency and must be compatible with the existing XRPL ledger consensus mechanism.`,
    issuer: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    bountyAmount: '250',
    recipient: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
    createdAt: new Date(now - 3 * 86400000).toISOString(),
    status: 'open',
    cid: 'QmXapiEQ8sWEPkdbW6kVGmj5j1SXqtBFhbX9pK1MvKz8xN',
    escrowSequence: 4821039,
    escrowTxHash: 'A7F3D9E2B15C4089F627A1E0C3D8B594F261E7A83D0F45C9B218E6A0D37C5F12',
    successCriteria: 'Benchmark results showing p99 latency < 100ms at 500 offers/second.',
    category: 'performance',
    difficulty: 'hard',
    deadline: new Date(now + 14 * 86400000).toISOString(),
  });

  SUBMISSIONS.set('submission_seed_001', {
    id: 'submission_seed_001',
    challengeId: 'challenge_seed_001',
    solver: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
    solverName: 'Nakamoto_Dev',
    description: 'Built a priority-queue based matching engine using a red-black tree for O(log n) offer insertion.\n\nApproach: Implemented a two-sided order book with price-time priority. Benchmarked at 87ms p99 at 600 offers/sec.',
    submittedAt: new Date(now - 86400000).toISOString(),
    status: 'submitted',
    cid: 'QmY9sLp4KX8vCnW3MR6kQj0e7HbTd2FuEqZ1oP5NmAc9vL',
  });
  SUBMISSIONS.set('submission_seed_002', {
    id: 'submission_seed_002',
    challengeId: 'challenge_seed_001',
    solver: 'rEhLpNV85Te2dQhjD6j5eFYJSbQjCmcheZ',
    solverName: 'xrpl_builder',
    description: 'Redesigned the matching loop with lock-free concurrent queues and SIMD-accelerated price comparison.\n\nApproach: Vector instructions compare 8 offer prices simultaneously. Achieved 72ms p99 at 750 offers/sec.',
    submittedAt: new Date(now - 43200000).toISOString(),
    status: 'submitted',
    cid: 'QmZk3nX7Wp2mBcY8Rd1qL0fTe5Gu6HvJn4oS9KcAm7xQp',
  });

  // ── Challenge 2 — Engineering ──────────────────────────────────────────────
  CHALLENGES.set('challenge_seed_002', {
    id: 'challenge_seed_002',
    title: 'Build a Merkle proof verifier in Go with ≥ 100k ops/sec',
    description: `Implement a production-grade Merkle tree in Go with SHA-256 hashing.\n\nRequirements:\n• Leaf insertion and deletion\n• O(log n) proof generation via sibling paths\n• Proof verification against a known root\n• Benchmark suite on 1M leaves showing ≥ 100k insertions/sec\n• 100% test coverage including race detector (go test -race)`,
    issuer: 'rN7n3473SaZBCG4dFL83w7PB4zKKRSCaYG',
    bountyAmount: '150',
    recipient: 'rN7n3473SaZBCG4dFL83w7PB4zKKRSCaYG',
    createdAt: new Date(now - 6 * 86400000).toISOString(),
    status: 'open',
    cid: 'QmR4kL9pXw2mBcY8Rd1qL0fTe5Gu6HvJn4oS9KcAm7xQv',
    escrowSequence: 4799201,
    escrowTxHash: 'B3E8C4A1D27F5096E518B2F1D4A7C483G372D8B94E1F56DA329F7B1E48C6A23',
    successCriteria: 'Passing go test -race with 100% coverage. Benchmark output showing ≥ 100k ops/sec on 1M leaves.',
    category: 'engineering',
    difficulty: 'medium',
    deadline: new Date(now + 10 * 86400000).toISOString(),
  });

  SUBMISSIONS.set('submission_seed_003', {
    id: 'submission_seed_003',
    challengeId: 'challenge_seed_002',
    solver: 'rGpQzXkA9mL3hNVW8yT5bE4jR2cD7sFq1K',
    solverName: 'merkle_dev',
    description: 'Built a complete Merkle tree in Go using SHA-256 for both leaf and internal node hashing.\n\nApproach: Bottom-up tree construction from sorted leaf hashes. Sibling-path proofs are O(log n). Benchmarked at 412k insertions/sec on 1M leaves. Full test coverage with race detector.',
    submittedAt: new Date(now - 2 * 86400000).toISOString(),
    status: 'submitted',
    cid: 'QmT5nK8qWp3mAcZ9Se2rM1gUf6Hv7IwKo5pR0NbBm8yRn',
  });

  // ── Challenge 3 — Design ───────────────────────────────────────────────────
  CHALLENGES.set('challenge_seed_003', {
    id: 'challenge_seed_003',
    title: 'Design a dark-mode dashboard UI for on-chain analytics',
    description: `We need a polished Figma design for a real-time XRPL on-chain analytics dashboard.\n\nScope:\n• 5 screens: overview, transactions, accounts, DEX activity, settings\n• Dark theme with neon accent system (inspired by trading terminals)\n• Data visualization components: candlestick chart, heatmap, sparklines\n• Mobile-responsive layouts\n• Complete design system: typography, color tokens, component library`,
    issuer: 'rKpMzYbN6eG4vJWX9yU7cD2hS3fL8aQtR5',
    bountyAmount: '500',
    recipient: 'rKpMzYbN6eG4vJWX9yU7cD2hS3fL8aQtR5',
    createdAt: new Date(now - 1 * 86400000).toISOString(),
    status: 'open',
    cid: 'QmU6oL9rXq4nBdA0Tf3sN2hVg7Iw8JxLp6qS1OcCn9zRo',
    escrowSequence: 4834512,
    escrowTxHash: 'C4F9D5B2E38G6107F629C3G2E5B8D695H483F9C05F2G67EB43AG8C2F59D7B34',
    successCriteria: 'Delivered Figma link with all 5 screens, component library, and a short Loom walkthrough.',
    category: 'design',
    difficulty: 'medium',
    deadline: new Date(now + 21 * 86400000).toISOString(),
  });

  // ── Challenge 4 — Data Science ─────────────────────────────────────────────
  CHALLENGES.set('challenge_seed_004', {
    id: 'challenge_seed_004',
    title: 'Train a wash-trade detection model on XRPL DEX data',
    description: `XRPL DEX trading data is public. Build a machine-learning model that classifies offers as genuine or wash-trade with ≥ 90% F1 on a held-out test set.\n\nData: We provide a 6-month CSV of anonymized DEX trades (account hashes, amounts, timestamps).\n\nDeliverables:\n• Jupyter notebook with EDA, feature engineering, model training\n• Exported model (ONNX or pickle)\n• Evaluation report with precision, recall, F1, confusion matrix\n• Brief writeup of approach and limitations`,
    issuer: 'rJhNqWbL5dF3mKVP7yT9cE2gS4fA8rBtX6',
    bountyAmount: '750',
    recipient: 'rJhNqWbL5dF3mKVP7yT9cE2gS4fA8rBtX6',
    createdAt: new Date(now - 5 * 86400000).toISOString(),
    status: 'open',
    cid: 'QmV7pM0sYr5oChB1Ug4tO3iWh8Jx9KyMq7rT2PdDo0aSp',
    escrowSequence: 4810887,
    escrowTxHash: 'D5G0E6C3F49H7218G730D4H3F6C9E806I594G0D16G3H78FC54BH9D3G60E8C45',
    successCriteria: '≥ 90% F1 score on the held-out test set, plus a reproducible notebook.',
    category: 'data science',
    difficulty: 'hard',
    deadline: new Date(now + 28 * 86400000).toISOString(),
  });

  SUBMISSIONS.set('submission_seed_004', {
    id: 'submission_seed_004',
    challengeId: 'challenge_seed_004',
    solver: 'rHmQzAkP9nE5vLWX2yU8cB3gT4fS7dRoJ1',
    solverName: 'chain_analyst',
    description: 'Used XGBoost on 47 hand-crafted features: inter-trade timing, round-trip detection, account clustering.\n\nF1: 0.923 on test set. False positive rate < 4%. Notebook included.',
    submittedAt: new Date(now - 36000000).toISOString(),
    status: 'submitted',
    cid: 'QmW8qN1tZs6pDiC2Vh5uP4jXi9Ky0LzNr8sU3QeEp1bTq',
  });
  SUBMISSIONS.set('submission_seed_005', {
    id: 'submission_seed_005',
    challengeId: 'challenge_seed_004',
    solver: 'rLnRwBbQ8oF6vMYT3yP7dA4hU5eK9cSgJ2',
    solverName: 'ml_bounty_hunter',
    description: 'Graph neural network on account interaction graph. Used PyTorch Geometric, trained on 3-month window.\n\nF1: 0.941. Novel approach using bipartite matching to detect coordinated wash cycles.',
    submittedAt: new Date(now - 7200000).toISOString(),
    status: 'submitted',
    cid: 'QmX9rO2uAt7qEjD3Wi6vQ5kYj0Lz1MaNs9tV4RfFq2cUr',
  });

  // ── Challenge 5 — Completed example ───────────────────────────────────────
  CHALLENGES.set('challenge_seed_005', {
    id: 'challenge_seed_005',
    title: 'Write a TypeScript SDK wrapper for XRPL escrow operations',
    description: `Build a type-safe TypeScript SDK that wraps XRPL EscrowCreate, EscrowFinish, and EscrowCancel with a clean promise-based API.\n\nMust include: full JSDoc, Jest test suite, npm-publishable package.json, and a README with usage examples.`,
    issuer: 'rPnSwCcQ7pG7wNYU4zQ8eB5hV6fL0dTkX3',
    bountyAmount: '100',
    recipient: 'rPnSwCcQ7pG7wNYU4zQ8eB5hV6fL0dTkX3',
    createdAt: new Date(now - 12 * 86400000).toISOString(),
    status: 'completed',
    cid: 'QmY0sP3vBu8rFkE4Xj7wR6lZk1Ma2NbOs0uW5SgGr3dVs',
    escrowSequence: 4779334,
    escrowTxHash: 'E6H1F7D4G50I8329H841E5I4G7D0F917J605H1E27H4I89GD65CI0E4H71F9D56',
    successCriteria: 'Passing Jest suite, full TypeScript types, npm publish-ready.',
    category: 'engineering',
    difficulty: 'easy',
    deadline: new Date(now - 2 * 86400000).toISOString(),
    winner: 'rQoTxDdR8qH8xOZV5aR9fC6iW7gM1eTlY4',
    payoutTxHash: 'F7I2G8E5H61J9430I952F6J5H8E1G028K716I2F38I5J90HE76DJ1F5I82G0E67',
  });

  SUBMISSIONS.set('submission_seed_006', {
    id: 'submission_seed_006',
    challengeId: 'challenge_seed_005',
    solver: 'rQoTxDdR8qH8xOZV5aR9fC6iW7gM1eTlY4',
    solverName: 'ts_craftsman',
    description: 'Delivered xrpl-escrow-sdk v1.0.0. Full TypeScript generics for all transaction types. 98% test coverage.\n\nPublished as @xrpl-community/escrow-sdk on npm.',
    submittedAt: new Date(now - 4 * 86400000).toISOString(),
    status: 'submitted',
    cid: 'QmZ1tQ4wCv9sGlF5Yk8xS7mAl2Nb3OcPt1vX6ThHs4eWt',
  });
}

// ── Validation ────────────────────────────────────────────────────────────────
const XRPL_ADDRESS_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;

function validateBounty(val) {
  const n = parseFloat(val);
  if (!val || isNaN(n) || n <= 0) return 'bountyAmount must be a positive number';
  if (n > 1_000_000) return 'bountyAmount exceeds 1,000,000 XRP limit';
  return null;
}

function validateChallenge({ title, description, bountyAmount, issuerSeed }) {
  return [
    !title?.trim() ? 'title is required' : title.length > 200 ? 'title must be 200 chars or fewer' : null,
    !description?.trim() ? 'description is required' : description.length > 5000 ? 'description must be 5000 chars or fewer' : null,
    validateBounty(bountyAmount),
    !issuerSeed ? 'issuerSeed is required' : null,
  ].filter(Boolean);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { reject(new Error('Invalid JSON in request body')); }
    });
    req.on('error', reject);
  });
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  seedIfEmpty();

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  const send = (data, status = 200) => {
    res.writeHead(status, { ...headers, 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  const sendError = (msg, status = 500) => {
    const message = msg instanceof Error ? msg.message : String(msg);
    if (status >= 500) console.error('[API]', message);
    res.writeHead(status, { ...headers, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: message }));
  };

  try {
    if (method === 'POST' && path === '/api/wallet/create') {
      const result = await createTestWallet();
      send({ address: result.wallet.address, seed: result.wallet.seed, balance: result.balance });
      return;
    }

    if (method === 'POST' && path === '/api/wallet/from-seed') {
      const { seed } = await parseBody(req);
      if (!seed) return sendError('seed is required', 400);
      const wallet = await getWalletFromSeed(seed);
      send({ address: wallet.address, seed: wallet.seed });
      return;
    }

    if (method === 'GET' && path.startsWith('/api/wallet/')) {
      const address = path.split('/')[3];
      const balance = await getBalance(address);
      send({ address, balance });
      return;
    }

    if (method === 'POST' && path === '/api/challenge/create') {
      const body = await parseBody(req);
      const { title, description, issuerSeed, bountyAmount, recipient,
              successCriteria, category, difficulty, deadline } = body;

      const errors = validateChallenge({ title, description, bountyAmount, issuerSeed });
      if (errors.length) return sendError(errors.join('; '), 400);
      if (recipient && !XRPL_ADDRESS_RE.test(recipient)) return sendError('recipient is not a valid XRPL address', 400);

      const issuerWallet = await getWalletFromSeed(issuerSeed);
      const challengeData = {
        title: title.trim(), description: description.trim(),
        issuer: issuerWallet.address,
        bountyAmount, recipient: recipient || issuerWallet.address,
        createdAt: new Date().toISOString(),
        status: 'open',
        successCriteria: successCriteria?.trim() || '',
        category: category?.trim() || '',
        difficulty: difficulty?.trim() || '',
        deadline: deadline || '',
      };

      // Upload to IPFS (non-fatal if Pinata not configured)
      let ipfsResult = { cid: null, gatewayUrl: null };
      try {
        ipfsResult = await uploadJSON(challengeData, { type: 'challenge' });
      } catch (e) { console.warn('[API] IPFS upload skipped:', e.message); }
      challengeData.cid = ipfsResult.cid;

      // createEscrow converts XRP → drops internally
      const escrowResult = await createEscrow({
        senderWallet: issuerWallet,
        amount: bountyAmount,
        recipient: recipient || issuerWallet.address,
      });
      challengeData.escrowSequence = escrowResult.escrowSequence;
      challengeData.escrowTxHash = escrowResult.txHash;
      challengeData.id = `challenge_${Date.now()}`;

      CHALLENGES.set(challengeData.id, challengeData);
      send({ challenge: challengeData, escrow: escrowResult, gatewayUrl: ipfsResult.gatewayUrl });
      return;
    }

    if (method === 'GET' && path === '/api/challenges') {
      const challenges = Array.from(CHALLENGES.values()).map((c) => ({
        ...c,
        submissionCount: Array.from(SUBMISSIONS.values()).filter((s) => s.challengeId === c.id).length,
      }));
      send({ challenges });
      return;
    }

    if (method === 'GET' && path.startsWith('/api/challenge/')) {
      const id = path.split('/')[3];
      const challenge = CHALLENGES.get(id);
      if (!challenge) return sendError('Challenge not found', 404);
      send({ challenge });
      return;
    }

    if (method === 'POST' && path === '/api/submission/create') {
      const body = await parseBody(req);
      const { challengeId, solverSeed, solverName, description } = body;
      if (!challengeId) return sendError('challengeId is required', 400);
      if (!description?.trim()) return sendError('description is required', 400);

      const challenge = CHALLENGES.get(challengeId);
      if (!challenge) return sendError('Challenge not found', 404);

      let solverWallet = null;
      if (solverSeed) solverWallet = await getWalletFromSeed(solverSeed);

      const submissionData = {
        challengeId,
        solver: solverWallet?.address || solverName || 'Anonymous',
        solverName: solverName?.trim() || 'Anonymous',
        description: description.trim(),
        submittedAt: new Date().toISOString(),
        status: 'submitted',
      };

      let ipfsResult = { cid: null, gatewayUrl: null };
      try {
        ipfsResult = await uploadJSON(submissionData, {
          type: 'submission', challengeId, solver: submissionData.solver,
        });
      } catch (e) { console.warn('[API] IPFS upload skipped:', e.message); }
      submissionData.cid = ipfsResult.cid;
      submissionData.id = `submission_${Date.now()}`;
      SUBMISSIONS.set(submissionData.id, submissionData);
      send({ submission: submissionData, gatewayUrl: ipfsResult.gatewayUrl });
      return;
    }

    if (method === 'GET' && path.includes('/submissions')) {
      const id = path.split('/')[2];
      const submissions = Array.from(SUBMISSIONS.values()).filter((s) => s.challengeId === id);
      send({ submissions });
      return;
    }

    if (method === 'POST' && path === '/api/payout') {
      const { challengeId, winnerAddress, issuerSeed } = await parseBody(req);
      if (!challengeId) return sendError('challengeId is required', 400);
      if (!issuerSeed) return sendError('issuerSeed is required', 400);
      if (!winnerAddress) return sendError('winnerAddress is required', 400);

      const challenge = CHALLENGES.get(challengeId);
      if (!challenge) return sendError('Challenge not found', 404);
      if (challenge.status === 'completed') return sendError('Bounty already released', 400);

      const issuerWallet = await getWalletFromSeed(issuerSeed);
      const result = await finishEscrow({
        senderWallet: issuerWallet,
        escrowSequence: challenge.escrowSequence,
        ownerAddress: issuerWallet.address,
      });

      challenge.status = 'completed';
      challenge.winner = winnerAddress;
      challenge.payoutTxHash = result.txHash;
      send({ success: true, txHash: result.txHash });
      return;
    }

    sendError('Not found', 404);
  } catch (error) {
    sendError(error);
  } finally {
    // Disconnect XRPL WebSocket after each serverless invocation to prevent stale connections
    try { disconnectClient(); } catch (_) {}
  }
}
