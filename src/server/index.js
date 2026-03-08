import http from 'http';
import { createEscrow, finishEscrow, cancelEscrow, getEscrows, getBalance, createTestWallet, getWalletFromSeed } from '../lib/xrpl.js';
import { uploadJSON, uploadBuffer, getFilesByChallenge, getGatewayUrl } from '../lib/pinata.js';

const CHALLENGES = new Map();
const SUBMISSIONS = new Map();
const WALLETS = new Map();

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

  res.setHeader('Content-Type', 'application/json');
  headers['Content-Type'] = 'application/json';
  res.writeHead(200, headers);

  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  const send = (data, status = 200) => {
    res.writeHead(status, headers);
    res.end(JSON.stringify(data));
  };

  const sendError = (error) => {
    console.error(error);
    send({ error: error.message }, 500);
  };

  try {
    if (method === 'POST' && path === '/api/wallet/create') {
      const wallet = await createTestWallet();
      WALLETS.set(wallet.wallet.address, wallet.wallet);
      send({ address: wallet.wallet.address, seed: wallet.wallet.seed, balance: wallet.balance });
      return;
    }

    if (method === 'POST' && path === '/api/wallet/from-seed') {
      const { seed } = await parseBody(req);
      const wallet = await getWalletFromSeed(seed);
      WALLETS.set(wallet.address, wallet);
      send({ address: wallet.address, seed: wallet.seed });
      return;
    }

    if (method === 'GET' && path.startsWith('/api/wallet/')) {
      const address = path.split('/')[3];
      const balance = await getBalance(address);
      send({ address, balance });
      return;
    }

    if (method === 'POST' && path === '/api/escrow/create') {
      const { senderSeed, recipient, amount, finishAfter, cancelAfter } = await parseBody(req);
      const senderWallet = await getWalletFromSeed(senderSeed);
      const result = await createEscrow({ senderWallet, amount, recipient, finishAfter, cancelAfter });
      send(result);
      return;
    }

    if (method === 'POST' && path === '/api/escrow/finish') {
      const { senderSeed, recipientSeed, escrowSequence, ownerAddress } = await parseBody(req);
      const senderWallet = await getWalletFromSeed(senderSeed);
      const recipientWallet = await getWalletFromSeed(recipientSeed);
      const result = await finishEscrow({ senderWallet, recipientWallet, escrowSequence, ownerAddress });
      send(result);
      return;
    }

    if (method === 'GET' && path.startsWith('/api/escrow/')) {
      const address = path.split('/')[3];
      const escrows = await getEscrows(address);
      send({ escrows });
      return;
    }

    if (method === 'POST' && path === '/api/challenge/create') {
      const { title, description, issuerSeed, bountyAmount, recipient } = await parseBody(req);
      const issuerWallet = await getWalletFromSeed(issuerSeed);
      const challengeData = { title, description, issuer: issuerWallet.address, bountyAmount, recipient, createdAt: new Date().toISOString(), status: 'active' };
      const result = await uploadJSON(challengeData, { type: 'challenge' });
      challengeData.cid = result.cid;
      const escrowResult = await createEscrow({ senderWallet: issuerWallet, amount: bountyAmount, recipient: recipient || issuerWallet.address });
      challengeData.escrowSequence = escrowResult.escrowSequence;
      challengeData.escrowTxHash = escrowResult.txHash;
      const challengeId = `challenge_${Date.now()}`;
      challengeData.id = challengeId;
      CHALLENGES.set(challengeId, challengeData);
      send({ challenge: challengeData, escrow: escrowResult, gatewayUrl: getGatewayUrl(challengeData.cid) });
      return;
    }

    if (method === 'GET' && path === '/api/challenges') {
      send({ challenges: Array.from(CHALLENGES.values()) });
      return;
    }

    if (method === 'GET' && path.startsWith('/api/challenge/')) {
      const id = path.split('/')[3];
      const challenge = CHALLENGES.get(id);
      if (!challenge) return send({ error: 'Challenge not found' }, 404);
      send({ challenge });
      return;
    }

    if (method === 'POST' && path === '/api/submission/create') {
      const { challengeId, solverSeed, solverName, description } = await parseBody(req);
      const challenge = CHALLENGES.get(challengeId);
      if (!challenge) return send({ error: 'Challenge not found' }, 404);
      let solverWallet = null;
      if (solverSeed) solverWallet = await getWalletFromSeed(solverSeed);
      const submissionData = { challengeId, solver: solverWallet?.address || solverName, solverName, description, submittedAt: new Date().toISOString(), status: 'submitted' };
      const result = await uploadJSON(submissionData, { type: 'submission', challengeId, solver: submissionData.solver });
      submissionData.cid = result.cid;
      const submissionId = `submission_${Date.now()}`;
      SUBMISSIONS.set(submissionId, submissionData);
      send({ submission: submissionData, gatewayUrl: getGatewayUrl(result.cid) });
      return;
    }

    if (method === 'GET' && path.includes('/submissions')) {
      const id = path.split('/')[2];
      const submissions = Array.from(SUBMISSIONS.values()).filter(s => s.challengeId === id);
      send({ submissions });
      return;
    }

    if (method === 'POST' && path === '/api/payout') {
      const { challengeId, winnerAddress, issuerSeed } = await parseBody(req);
      const challenge = CHALLENGES.get(challengeId);
      if (!challenge) return send({ error: 'Challenge not found' }, 404);
      const issuerWallet = await getWalletFromSeed(issuerSeed);
      const result = await finishEscrow({ senderWallet: issuerWallet, recipientWallet: { address: winnerAddress }, escrowSequence: challenge.escrowSequence });
      challenge.status = 'completed';
      challenge.winner = winnerAddress;
      challenge.payoutTxHash = result.txHash;
      send({ success: true, txHash: result.txHash });
      return;
    }

    send({ error: 'Not found' }, 404);
  } catch (error) {
    sendError(error);
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(handleRequest);
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`BountyCapsule API running on port ${PORT}`));
