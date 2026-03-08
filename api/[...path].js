import { createEscrow, finishEscrow, getBalance, createTestWallet, getWalletFromSeed } from '../src/lib/xrpl.js';
import { uploadJSON, getGatewayUrl } from '../src/lib/pinata.js';

// ── In-memory store (Vercel serverless — SQLite not available) ───────────────
const CHALLENGES = new Map();
const SUBMISSIONS = new Map();

function seedIfEmpty() {
  if (CHALLENGES.size > 0) return;
  const now = Date.now();

  // bountyAmount stored in XRP (not drops) for display
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
  }
}
