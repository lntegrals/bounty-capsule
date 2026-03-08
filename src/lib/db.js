import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '../../bounty.db');

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS challenges (
    id TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    issuer TEXT,
    bounty_amount REAL,
    recipient TEXT,
    created_at TEXT,
    status TEXT DEFAULT 'open',
    cid TEXT,
    escrow_sequence INTEGER,
    escrow_tx_hash TEXT,
    winner TEXT,
    payout_tx_hash TEXT,
    success_criteria TEXT,
    category TEXT,
    difficulty TEXT,
    deadline TEXT
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    challenge_id TEXT,
    solver TEXT,
    solver_name TEXT,
    description TEXT,
    submitted_at TEXT,
    status TEXT DEFAULT 'submitted',
    cid TEXT
  );
`);

function rowToChallenge(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    issuer: row.issuer,
    bountyAmount: row.bounty_amount,
    recipient: row.recipient,
    createdAt: row.created_at,
    status: row.status,
    cid: row.cid,
    escrowSequence: row.escrow_sequence,
    escrowTxHash: row.escrow_tx_hash,
    winner: row.winner,
    payoutTxHash: row.payout_tx_hash,
    successCriteria: row.success_criteria,
    category: row.category,
    difficulty: row.difficulty,
    deadline: row.deadline,
  };
}

function rowToSubmission(row) {
  if (!row) return null;
  return {
    id: row.id,
    challengeId: row.challenge_id,
    solver: row.solver,
    solverName: row.solver_name,
    description: row.description,
    submittedAt: row.submitted_at,
    status: row.status,
    cid: row.cid,
  };
}

export function getChallenges() {
  return db.prepare(`
    SELECT c.*, COUNT(s.id) AS submission_count
    FROM challenges c
    LEFT JOIN submissions s ON s.challenge_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `).all().map((row) => ({ ...rowToChallenge(row), submissionCount: row.submission_count || 0 }));
}

export function getChallenge(id) {
  return rowToChallenge(db.prepare('SELECT * FROM challenges WHERE id = ?').get(id));
}

export function createChallenge(data) {
  db.prepare(`
    INSERT INTO challenges (id, title, description, issuer, bounty_amount, recipient, created_at, status, cid, escrow_sequence, escrow_tx_hash, success_criteria, category, difficulty, deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.id, data.title, data.description, data.issuer, data.bountyAmount,
    data.recipient, data.createdAt, data.status || 'open', data.cid,
    data.escrowSequence, data.escrowTxHash, data.successCriteria,
    data.category, data.difficulty, data.deadline
  );
  return getChallenge(data.id);
}

export function updateChallenge(id, patch) {
  const allowed = {
    status: 'status', winner: 'winner', payout_tx_hash: 'payoutTxHash',
    escrow_sequence: 'escrowSequence', escrow_tx_hash: 'escrowTxHash', cid: 'cid',
  };
  const sets = [];
  const vals = [];
  for (const [col, jsKey] of Object.entries(allowed)) {
    // support both snake_case and camelCase input
    const val = patch[col] !== undefined ? patch[col] : patch[jsKey];
    if (val !== undefined) {
      sets.push(`${col} = ?`);
      vals.push(val);
    }
  }
  if (sets.length === 0) return getChallenge(id);
  vals.push(id);
  db.prepare(`UPDATE challenges SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  return getChallenge(id);
}

export function getSubmissions(challengeId) {
  return db.prepare('SELECT * FROM submissions WHERE challenge_id = ? ORDER BY submitted_at DESC').all(challengeId).map(rowToSubmission);
}

export function createSubmission(data) {
  db.prepare(`
    INSERT INTO submissions (id, challenge_id, solver, solver_name, description, submitted_at, status, cid)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(data.id, data.challengeId, data.solver, data.solverName, data.description, data.submittedAt, data.status || 'submitted', data.cid);
  return db.prepare('SELECT * FROM submissions WHERE id = ?').get(data.id);
}

export default db;
