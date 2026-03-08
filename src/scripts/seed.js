// Seed script — inserts a demo challenge + 2 submissions into bounty.db
import { createChallenge, getChallenge, createSubmission, getChallenges } from '../lib/db.js';

const CHALLENGE_ID = 'challenge_seed_001';

// Skip if already seeded
if (getChallenge(CHALLENGE_ID)) {
  console.log('Seed data already present. Skipping.');
  process.exit(0);
}

const challenge = createChallenge({
  id: CHALLENGE_ID,
  title: 'Optimize XRPL DEX matching for sub-100ms settlement',
  description: `The XRPL DEX currently processes offer matching in ~250ms under peak load.
Your challenge: design and implement a batched offer-matching algorithm that achieves
consistent sub-100ms settlement times while maintaining fairness and price-priority ordering.

The solution should handle at least 500 offers/second without degrading latency and
must be compatible with the existing XRPL ledger consensus mechanism.`,
  issuer: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  bountyAmount: 250, // XRP (not drops — createEscrow converts internally)
  recipient: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
  status: 'open',
  cid: 'QmXapiEQ8sWEPkdbW6kVGmj5j1SXqtBFhbX9pK1MvKz8xN',
  escrowSequence: 4821039,
  escrowTxHash: 'A7F3D9E2B15C4089F627A1E0C3D8B594F261E7A83D0F45C9B218E6A0D37C5F12',
  successCriteria: 'Benchmark results showing p99 latency < 100ms at 500 offers/second, with a working reference implementation and test suite.',
  category: 'Performance',
  difficulty: 'Hard',
  deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
});

console.log('Created challenge:', challenge.id, '-', challenge.title);

const sub1 = {
  id: 'submission_seed_001',
  challengeId: CHALLENGE_ID,
  solver: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
  solverName: 'Nakamoto_Dev',
  description: `Built a priority-queue based matching engine using a red-black tree for O(log n) offer insertion and O(1) best-offer lookup.

Approach: Implemented a two-sided order book with price-time priority. Batches offers in 10ms windows then runs matching in a single pass. Benchmarked at 87ms p99 at 600 offers/sec on commodity hardware.`,
  submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'submitted',
  cid: 'QmY9sLp4KX8vCnW3MR6kQj0e7HbTd2FuEqZ1oP5NmAc9vL',
};

const sub2 = {
  id: 'submission_seed_002',
  challengeId: CHALLENGE_ID,
  solver: 'rEhLpNV85Te2dQhjD6j5eFYJSbQjCmcheZ',
  solverName: 'xrpl_builder',
  description: `Redesigned the matching loop to use lock-free concurrent queues and SIMD-accelerated price comparison.

Approach: Leverages CPU vector instructions to compare 8 offer prices simultaneously. Achieved 72ms p99 at 750 offers/sec. Includes full test harness and load-testing scripts.`,
  submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  status: 'submitted',
  cid: 'QmZk3nX7Wp2mBcY8Rd1qL0fTe5Gu6HvJn4oS9KcAm7xQp',
};

createSubmission(sub1);
console.log('Created submission:', sub1.id, '-', sub1.solverName);

createSubmission(sub2);
console.log('Created submission:', sub2.id, '-', sub2.solverName);

console.log('\nSeed complete. Challenge ID:', CHALLENGE_ID);
console.log('Visit http://localhost:5173/challenges to see the seeded challenge.');
