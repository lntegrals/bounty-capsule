import 'dotenv/config';
import http from 'http';
import { createEscrow, finishEscrow, cancelEscrow, getEscrows, getBalance, createTestWallet, getWalletFromSeed } from '../lib/xrpl.js';
import { uploadJSON, uploadBuffer, getGatewayUrl, testPinataAuth } from '../lib/pinata.js';
import { getChallenges, getChallenge, createChallenge, updateChallenge, getSubmissions, createSubmission } from '../lib/db.js';

// ── Input validation helpers ─────────────────────────────────────────────────

const XRPL_ADDRESS_RE = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
const SEED_RE = /^s[1-9A-HJ-NP-Za-km-z]{24,}$/;

function validateString(val, name, { required = false, max = 0 } = {}) {
  if (required && (!val || !String(val).trim())) return `${name} is required`;
  if (val && max && String(val).length > max) return `${name} must be ${max} chars or fewer`;
  return null;
}

function validateBounty(val) {
  const n = parseFloat(val);
  if (!val || isNaN(n) || n <= 0) return 'bountyAmount must be a positive number';
  if (n > 1_000_000) return 'bountyAmount exceeds 1,000,000 XRP limit';
  return null;
}

function validateChallenge({ title, description, successCriteria, bountyAmount, issuerSeed }) {
  return [
    validateString(title, 'title', { required: true, max: 200 }),
    validateString(description, 'description', { required: true, max: 5000 }),
    validateString(successCriteria, 'successCriteria', { max: 2000 }),
    validateBounty(bountyAmount),
    !issuerSeed ? 'issuerSeed is required' : null,
  ].filter(Boolean);
}

function validateSubmission({ challengeId, description }) {
  return [
    validateString(challengeId, 'challengeId', { required: true }),
    validateString(description, 'description', { required: true, max: 5000 }),
  ].filter(Boolean);
}

// ── Server ──────────────────────────────────────────────────────────────────

async function handleRequest(req, res) {
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

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  const send = (data, status = 200) => {
    res.writeHead(status, { ...headers, 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  const sendError = (msg, status = 500) => {
    const message = msg instanceof Error ? msg.message : String(msg);
    if (status >= 500) console.error('[Server]', message);
    res.writeHead(status, { ...headers, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: message }));
  };

  try {
    // ── Wallet ───────────────────────────────────────────────────────────────

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
      if (!XRPL_ADDRESS_RE.test(address)) return sendError('Invalid XRPL address', 400);
      const balance = await getBalance(address);
      send({ address, balance });
      return;
    }

    // ── Escrow (low-level) ───────────────────────────────────────────────────

    if (method === 'POST' && path === '/api/escrow/create') {
      const { senderSeed, recipient, amount, finishAfter, cancelAfter } = await parseBody(req);
      if (!senderSeed) return sendError('senderSeed is required', 400);
      if (!recipient) return sendError('recipient is required', 400);
      const err = validateBounty(amount);
      if (err) return sendError(err, 400);
      const senderWallet = await getWalletFromSeed(senderSeed);
      const result = await createEscrow({ senderWallet, amount, recipient, finishAfter, cancelAfter });
      send(result);
      return;
    }

    if (method === 'POST' && path === '/api/escrow/finish') {
      const { senderSeed, escrowSequence, ownerAddress } = await parseBody(req);
      if (!senderSeed) return sendError('senderSeed is required', 400);
      if (!escrowSequence) return sendError('escrowSequence is required', 400);
      const senderWallet = await getWalletFromSeed(senderSeed);
      const result = await finishEscrow({ senderWallet, escrowSequence, ownerAddress });
      send(result);
      return;
    }

    if (method === 'GET' && path.startsWith('/api/escrow/')) {
      const address = path.split('/')[3];
      if (!XRPL_ADDRESS_RE.test(address)) return sendError('Invalid XRPL address', 400);
      const escrows = await getEscrows(address);
      send({ escrows });
      return;
    }

    // ── Challenges ───────────────────────────────────────────────────────────

    if (method === 'POST' && path === '/api/challenge/create') {
      const body = await parseBody(req);
      const { title, description, issuerSeed, bountyAmount, recipient,
              successCriteria, category, difficulty, deadline } = body;

      const errors = validateChallenge({ title, description, successCriteria, bountyAmount, issuerSeed });
      if (errors.length) return sendError(errors.join('; '), 400);
      if (recipient && !XRPL_ADDRESS_RE.test(recipient)) return sendError('recipient is not a valid XRPL address', 400);

      const issuerWallet = await getWalletFromSeed(issuerSeed);

      // Store XRP amount in DB; createEscrow converts to drops internally
      const challengeData = {
        title: title.trim(),
        description: description.trim(),
        issuer: issuerWallet.address,
        bountyAmount,
        recipient: recipient || issuerWallet.address,
        createdAt: new Date().toISOString(),
        status: 'open',
        successCriteria: successCriteria?.trim() || '',
        category: category?.trim() || '',
        difficulty: difficulty?.trim() || '',
        deadline: deadline || '',
      };

      // Upload metadata to IPFS (non-fatal if Pinata is not configured)
      let ipfsResult = { cid: null, gatewayUrl: null };
      try {
        ipfsResult = await uploadJSON(challengeData, { type: 'challenge' });
        challengeData.cid = ipfsResult.cid;
      } catch (e) {
        console.warn('[Server] IPFS upload skipped for challenge:', e.message);
      }

      // Lock bounty in escrow
      const escrowResult = await createEscrow({
        senderWallet: issuerWallet,
        amount: bountyAmount,
        recipient: recipient || issuerWallet.address,
      });
      challengeData.escrowSequence = escrowResult.escrowSequence;
      challengeData.escrowTxHash = escrowResult.txHash;
      challengeData.id = `challenge_${Date.now()}`;

      const saved = createChallenge(challengeData);
      send({ challenge: saved, escrow: escrowResult, gatewayUrl: ipfsResult.gatewayUrl });
      return;
    }

    if (method === 'GET' && path === '/api/challenges') {
      send({ challenges: getChallenges() });
      return;
    }

    if (method === 'GET' && path.startsWith('/api/challenge/')) {
      const id = path.split('/')[3];
      if (!id) return sendError('Challenge ID required', 400);
      const challenge = getChallenge(id);
      if (!challenge) return sendError('Challenge not found', 404);
      send({ challenge });
      return;
    }

    // ── Submissions ──────────────────────────────────────────────────────────

    if (method === 'POST' && path === '/api/submission/create') {
      const body = await parseBody(req);
      const { challengeId, solverSeed, solverName, description } = body;

      const errors = validateSubmission({ challengeId, description });
      if (errors.length) return sendError(errors.join('; '), 400);

      const challenge = getChallenge(challengeId);
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

      // Upload submission to IPFS (non-fatal if Pinata is not configured)
      let ipfsResult = { cid: null, gatewayUrl: null };
      try {
        ipfsResult = await uploadJSON(submissionData, {
          type: 'submission',
          challengeId,
          solver: submissionData.solver,
        });
      } catch (e) {
        console.warn('[Server] IPFS upload skipped for submission:', e.message);
      }
      submissionData.cid = ipfsResult.cid;
      submissionData.id = `submission_${Date.now()}`;

      createSubmission(submissionData);
      send({ submission: submissionData, gatewayUrl: ipfsResult.gatewayUrl });
      return;
    }

    if (method === 'GET' && path.includes('/submissions')) {
      const id = path.split('/')[2];
      if (!id) return sendError('Challenge ID required', 400);
      const submissions = getSubmissions(id);
      send({ submissions });
      return;
    }

    // ── Payout ───────────────────────────────────────────────────────────────

    if (method === 'POST' && path === '/api/payout') {
      const { challengeId, winnerAddress, issuerSeed } = await parseBody(req);
      if (!challengeId) return sendError('challengeId is required', 400);
      if (!issuerSeed) return sendError('issuerSeed is required', 400);
      if (!winnerAddress) return sendError('winnerAddress is required', 400);
      if (!XRPL_ADDRESS_RE.test(winnerAddress)) return sendError('winnerAddress is not a valid XRPL address', 400);

      const challenge = getChallenge(challengeId);
      if (!challenge) return sendError('Challenge not found', 404);
      if (!challenge.escrowSequence) return sendError('No escrow found for this challenge', 400);
      if (challenge.status === 'completed') return sendError('Bounty already released', 400);

      const issuerWallet = await getWalletFromSeed(issuerSeed);
      if (issuerWallet.address !== challenge.issuer) {
        return sendError('Only the challenge issuer can release the escrow', 403);
      }

      // EscrowFinish submitted by the issuer (Owner == issuer for unconditional escrows)
      const result = await finishEscrow({
        senderWallet: issuerWallet,
        escrowSequence: challenge.escrowSequence,
        ownerAddress: issuerWallet.address,
      });

      if (!result.success) return sendError('Escrow finish transaction failed on XRPL', 500);

      updateChallenge(challengeId, {
        status: 'completed',
        winner: winnerAddress,
        payoutTxHash: result.txHash,
      });

      send({ success: true, txHash: result.txHash });
      return;
    }

    sendError('Not found', 404);
  } catch (error) {
    sendError(error);
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON in request body'));
      }
    });
    req.on('error', reject);
  });
}

const PORT = process.env.PORT || 3002;
const server = http.createServer(handleRequest);
server.listen(PORT, async () => {
  console.log(`BountyCapsule API running on port ${PORT}`);
  await testPinataAuth();
});
