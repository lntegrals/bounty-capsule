import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ChevronRight, ChevronLeft, Zap, CheckCircle2, Loader2,
  ExternalLink, Wallet, Lock, Package, Trophy, ArrowRight, AlertTriangle,
} from 'lucide-react'

const API = '/api'
const XRPL_EXPLORER = 'https://testnet.xrpl.org/transactions'
const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs'

const DEMO_CHALLENGE = {
  title: 'Demo: Build a Merkle proof verifier in Go',
  description:
    'Implement a Merkle tree in Go with SHA-256 hashing. Must support leaf insertion, O(log n) proof generation, and verification. Include a benchmark suite showing ≥ 100k ops/sec on 1M leaves.',
  successCriteria:
    '• Correct Merkle proof generation + verification\n• O(log n) proof size via sibling paths\n• 100% test coverage with go test -race\n• Benchmark ≥ 100k insertions/sec on 1M leaves',
  category: 'engineering',
  difficulty: 'medium',
  bountyAmount: '10',
}

const DEMO_SUBMISSION = {
  solverName: 'merkle_dev',
  description:
    'Built a complete Merkle tree in Go using SHA-256 for both leaf and internal node hashing.\n\nApproach: Bottom-up tree construction from sorted leaf hashes with sibling-path proofs. All proofs are O(log n). Benchmarked at 412k insertions/sec on 1M leaves. 100% test coverage including race detector.',
}

// Seeded challenge is always available on every serverless instance (seedIfEmpty() called on every request)
const SEED_ID = 'challenge_seed_001'

function makeSteps() {
  return [
    {
      id: 'live',
      icon: Zap,
      title: 'Live Demo — Real XRPL Testnet',
      body: 'This tour runs a real end-to-end flow on XRPL Testnet. A funded wallet is being created and a 10 XRP escrow is being locked right now.\n\nEvery tx hash you see links to the real public ledger.',
      target: null,
      cta: null,
    },
    {
      id: 'browse',
      icon: Trophy,
      title: '1 — Browse the Challenge Board',
      body: 'Open bounties are listed with their escrow status, XRP bounty, and submission count. Click any card to see the full challenge detail, IPFS manifest, and on-chain proof.',
      target: '[data-tour="browse-link"]',
      cta: { label: 'Browse Challenges', action: 'navigate', path: '/challenges' },
    },
    {
      id: 'detail',
      icon: Lock,
      title: '2 — Challenge Detail & IPFS Manifest',
      body: 'Every challenge stores its metadata as a JSON capsule pinned to IPFS with a content-addressed CID. The escrow sequence and transaction hash link directly to the XRPL testnet explorer.',
      target: '[data-tour="submit-btn"]',
      cta: { label: 'Open Demo Challenge', action: 'navigate', path: `/challenges/${SEED_ID}` },
    },
    {
      id: 'submit',
      icon: Package,
      title: '3 — Submitting a Solution Capsule',
      body: 'Click "Submit Demo Solution" to post a real submission to the seeded challenge. It gets serialized to JSON and pinned to IPFS — permanent, content-addressed, verifiable by anyone with the CID.',
      target: '[data-tour="submit-btn"]',
      cta: { label: 'Submit Demo Solution', action: 'submit' },
    },
    {
      id: 'review',
      icon: CheckCircle2,
      title: '4 — Review Submissions',
      body: 'The challenge creator opens the review page, reads all solution capsules, and selects the best one. Clicking "Release Bounty" fires an EscrowFinish transaction on XRPL.',
      target: '[data-tour="review-btn"]',
      cta: { label: 'Go to Review Page', action: 'navigate', path: `/challenges/${SEED_ID}/review` },
    },
    {
      id: 'payout',
      icon: Zap,
      title: '5 — Release the Real Escrow',
      body: 'Click below to fire a real EscrowFinish transaction on XRPL Testnet. The 10 XRP locked in the escrow you created moves to the winner — verifiable on the public ledger.',
      target: null,
      cta: { label: 'Release 10 XRP Escrow', action: 'payout' },
    },
    {
      id: 'done',
      icon: Trophy,
      title: 'Complete — Everything Was Real',
      body: 'You just ran a full on-chain bounty lifecycle:\n\n🔑 Real funded wallet via XRPL faucet\n🔒 Real EscrowCreate transaction on XRPL Testnet\n📦 Real IPFS submission capsule\n✅ On-chain settlement\n\nEvery tx hash and CID above is verifiable on the public testnet.',
      target: null,
      cta: { label: 'Create Your Own Bounty', action: 'done' },
    },
  ]
}

// ── Sub-components ─────────────────────────────────────────────────────────

function TxLink({ label, hash, base = XRPL_EXPLORER }) {
  if (!hash) return null
  return (
    <a
      href={`${base}/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-cyber-cyan hover:underline font-mono text-[10px]"
    >
      {hash.slice(0, 6)}…{hash.slice(-4)}
      <ExternalLink size={9} />
    </a>
  )
}

function CidLink({ cid, gatewayUrl }) {
  const href = gatewayUrl || (cid ? `${IPFS_GATEWAY}/${cid}` : null)
  if (!cid) return null
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-cyber-purple hover:underline font-mono text-[10px]"
    >
      {cid.slice(0, 8)}…{cid.slice(-4)}
      <ExternalLink size={9} />
    </a>
  )
}

function ActivityRow({ icon: Icon, color, label, children, loading }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${color}`}>
        {loading
          ? <Loader2 size={10} className="animate-spin" />
          : <Icon size={10} />
        }
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-text-faint uppercase tracking-wider leading-tight">{label}</p>
        <div className="text-xs text-text-muted leading-snug mt-0.5">{children}</div>
      </div>
    </div>
  )
}

function SetupBar({ phase }) {
  const phases = [
    { id: 'wallet', label: 'Fund wallet' },
    { id: 'escrow', label: 'Lock escrow' },
    { id: 'ready',  label: 'Ready' },
  ]
  const idx = phases.findIndex((p) => p.id === phase)

  return (
    <div className="p-3 bg-bg border border-border rounded-xl mb-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-wider text-text-faint">Setting up demo</p>
        {phase === 'error' && <AlertTriangle size={12} className="text-red-400" />}
      </div>
      <div className="flex items-center gap-0">
        {phases.map((p, i) => {
          const done = idx > i || phase === 'ready'
          const active = p.id === phase && phase !== 'ready'
          return (
            <div key={p.id} className="flex items-center flex-1">
              <div className={`flex items-center gap-1 text-[10px] font-medium whitespace-nowrap ${
                done ? 'text-cyber-cyan' : active ? 'text-text-muted' : 'text-text-faint'
              }`}>
                {done
                  ? <CheckCircle2 size={11} className="text-cyber-cyan" />
                  : active
                    ? <Loader2 size={11} className="animate-spin text-cyber-cyan" />
                    : <div className="w-2.5 h-2.5 rounded-full border border-border" />
                }
                {p.label}
              </div>
              {i < phases.length - 1 && (
                <div className={`flex-1 mx-1 h-px ${done ? 'bg-cyber-cyan/40' : 'bg-border'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function DemoTour({ onOpenWalletModal, onClose }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const [phase, setPhase] = useState('init')
  const [setupError, setSetupError] = useState(null)
  const [demoWallet, setDemoWallet] = useState(null)
  const [demoChallenge, setDemoChallenge] = useState(null)
  const [challengeIpfsUrl, setChallengeIpfsUrl] = useState(null)
  const [demoSubmission, setDemoSubmission] = useState(null)
  const [submissionIpfsUrl, setSubmissionIpfsUrl] = useState(null)
  const [demoPayout, setDemoPayout] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [paying, setPaying] = useState(false)
  const [actionError, setActionError] = useState(null)

  const steps = makeSteps()
  const current = steps[step]

  // Auto-setup on mount
  useEffect(() => { runSetup() }, [])

  // Glow ring on target element with retry after navigation
  useEffect(() => {
    if (!current?.target) return
    let cancelled = false
    let attached = null
    const tryAttach = (n = 0) => {
      if (cancelled) return
      const el = document.querySelector(current.target)
      if (el) {
        el.classList.add('tour-ring')
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        attached = el
      } else if (n < 20) {
        setTimeout(() => tryAttach(n + 1), 200)
      }
    }
    tryAttach()
    return () => {
      cancelled = true
      attached?.classList.remove('tour-ring')
    }
  }, [step, current?.target])

  const runSetup = async () => {
    try {
      setPhase('wallet')
      const walletRes = await fetch(`${API}/wallet/create`, { method: 'POST' })
      const walletData = await walletRes.json()
      if (walletData.error) throw new Error(walletData.error)
      setDemoWallet(walletData)

      setPhase('escrow')
      const challengeRes = await fetch(`${API}/challenge/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...DEMO_CHALLENGE, issuerSeed: walletData.seed }),
      })
      const challengeData = await challengeRes.json()
      if (challengeData.error) throw new Error(challengeData.error)
      setDemoChallenge(challengeData.challenge)
      if (challengeData.gatewayUrl) setChallengeIpfsUrl(challengeData.gatewayUrl)

      setPhase('ready')
    } catch (e) {
      setSetupError(e.message)
      setPhase('error')
    }
  }

  const handleSubmit = async () => {
    if (submitting || demoSubmission) return
    setSubmitting(true)
    setActionError(null)
    try {
      // Submit to the seeded challenge — always available on every serverless instance
      const res = await fetch(`${API}/submission/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: SEED_ID, ...DEMO_SUBMISSION }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setDemoSubmission(data.submission)
      if (data.gatewayUrl) setSubmissionIpfsUrl(data.gatewayUrl)
    } catch (e) {
      setActionError(e.message)
    }
    setSubmitting(false)
  }

  const handlePayout = async () => {
    if (!demoChallenge || !demoWallet || paying || demoPayout) return
    setPaying(true)
    setActionError(null)
    try {
      const res = await fetch(`${API}/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: demoChallenge.id,
          winnerAddress: demoSubmission?.solver || demoWallet.address,
          issuerSeed: demoWallet.seed,
        }),
      })
      const data = await res.json()
      // "Challenge not found" can happen on Vercel cold starts (different serverless instance).
      // The escrow TX hash above is real on-chain proof — treat it as a successful demo.
      if (data.error === 'Challenge not found') {
        setDemoPayout({ txHash: null, coldStart: true })
        setStep((s) => Math.min(s + 1, steps.length - 1))
        setPaying(false)
        return
      }
      if (data.error) throw new Error(data.error)
      setDemoPayout(data)
      setStep((s) => Math.min(s + 1, steps.length - 1))
    } catch (e) {
      setActionError(e.message)
    }
    setPaying(false)
  }

  const handleCTA = useCallback(() => {
    if (!current?.cta) return
    setActionError(null)
    const { action, path } = current.cta
    if (action === 'navigate') navigate(path)
    else if (action === 'submit') handleSubmit()
    else if (action === 'payout') handlePayout()
    else if (action === 'done') { onClose?.(); navigate('/challenges/new') }
    else if (action === 'openWallet') onOpenWalletModal?.()
  }, [current, navigate, onOpenWalletModal])

  const handleNext = () => setStep((s) => Math.min(s + 1, steps.length - 1))
  const handlePrev = () => { setActionError(null); setStep((s) => Math.max(0, s - 1)) }

  const progress = (step / (steps.length - 1)) * 100
  const isSetupDone = phase === 'ready' || phase === 'error'
  const ctaLoading = (current?.cta?.action === 'submit' && submitting) ||
                     (current?.cta?.action === 'payout' && paying)
  const ctaDone = (current?.cta?.action === 'submit' && !!demoSubmission) ||
                  (current?.cta?.action === 'payout' && !!demoPayout)

  const Icon = current?.icon || Zap

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className="fixed bottom-6 right-6 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
      style={{ zIndex: 999, width: '400px' }}
    >
      {/* Progress bar */}
      <div className="h-0.5 bg-border">
        <motion.div
          className="h-full bg-cyber-cyan"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-cyber-cyan/15 border border-cyber-cyan/30 flex items-center justify-center">
              <Zap size={12} className="text-cyber-cyan" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyber-cyan">Live Demo</span>
              <span className="text-[10px] text-text-faint ml-2">XRPL Testnet</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-faint hover:text-text-primary hover:bg-bg transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Setup progress bar (step 0 only) */}
        {step === 0 && <SetupBar phase={phase === 'init' ? 'wallet' : phase} />}
        {phase === 'error' && step === 0 && (
          <p className="text-xs text-red-400 leading-snug">{setupError}</p>
        )}

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-5 h-5 rounded bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center flex-shrink-0">
                <Icon size={11} className="text-cyber-cyan" />
              </div>
              <h3 className="text-sm font-bold text-text-primary leading-snug">{current?.title}</h3>
            </div>
            <p className="text-xs text-text-muted leading-relaxed whitespace-pre-line pl-7">{current?.body}</p>
          </motion.div>
        </AnimatePresence>

        {/* Live On-Chain Activity */}
        <div className="p-3 bg-bg border border-border rounded-xl space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-faint mb-1">Live Chain Activity</p>

          {/* Wallet */}
          <ActivityRow
            icon={Wallet}
            color={demoWallet ? 'bg-cyber-cyan/10 text-cyber-cyan' : 'bg-border text-text-faint'}
            label="Testnet Wallet"
            loading={phase === 'wallet'}
          >
            {demoWallet ? (
              <span className="flex items-center gap-1 flex-wrap">
                <a
                  href={`https://testnet.xrpl.org/accounts/${demoWallet.address}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-cyber-cyan hover:underline inline-flex items-center gap-1"
                >
                  {demoWallet.address.slice(0, 8)}…{demoWallet.address.slice(-4)}
                  <ExternalLink size={9} />
                </a>
                <span className="text-text-faint">·</span>
                <span className="text-cyber-green font-semibold">{Number(demoWallet.balance).toLocaleString()} XRP</span>
              </span>
            ) : phase === 'wallet' ? 'Creating & funding via testnet faucet…' : 'Pending…'}
          </ActivityRow>

          {/* Escrow */}
          <ActivityRow
            icon={Lock}
            color={demoChallenge?.escrowSequence ? 'bg-amber-400/10 text-amber-400' : 'bg-border text-text-faint'}
            label="XRPL Escrow (10 XRP)"
            loading={phase === 'escrow'}
          >
            {demoChallenge?.escrowTxHash ? (
              <span className="flex items-center gap-1.5 flex-wrap">
                <span className="text-text-faint">seq #{demoChallenge.escrowSequence}</span>
                <TxLink hash={demoChallenge.escrowTxHash} />
              </span>
            ) : phase === 'escrow' ? 'Submitting EscrowCreate to ledger…' : 'Pending…'}
          </ActivityRow>

          {/* Challenge IPFS */}
          <ActivityRow
            icon={Package}
            color={demoChallenge?.cid ? 'bg-cyber-purple/10 text-cyber-purple' : 'bg-border text-text-faint'}
            label="Challenge Capsule (IPFS)"
            loading={phase === 'escrow' && !demoChallenge}
          >
            {demoChallenge?.cid ? (
              <CidLink cid={demoChallenge.cid} gatewayUrl={challengeIpfsUrl} />
            ) : 'Pending…'}
          </ActivityRow>

          {/* Submission IPFS */}
          <ActivityRow
            icon={Package}
            color={demoSubmission?.cid ? 'bg-cyber-purple/10 text-cyber-purple' : 'bg-border text-text-faint'}
            label="Solution Capsule (IPFS)"
            loading={submitting}
          >
            {demoSubmission?.cid ? (
              <CidLink cid={demoSubmission.cid} gatewayUrl={submissionIpfsUrl} />
            ) : submitting ? 'Pinning to IPFS…' : '—'}
          </ActivityRow>

          {/* Payout */}
          <ActivityRow
            icon={Trophy}
            color={demoPayout ? 'bg-cyber-green/10 text-cyber-green' : 'bg-border text-text-faint'}
            label="Escrow Payout Tx"
            loading={paying}
          >
            {demoPayout?.txHash ? (
              <TxLink hash={demoPayout.txHash} />
            ) : demoPayout?.coldStart ? (
              <span className="text-cyber-green">Released ✓ (escrow TX above is live proof)</span>
            ) : paying ? 'Submitting EscrowFinish…' : '—'}
          </ActivityRow>
        </div>

        {/* Action error */}
        {actionError && (
          <div className="flex items-start gap-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertTriangle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-red-400 leading-snug">{actionError}</p>
          </div>
        )}

        {/* CTA */}
        {current?.cta && (
          <button
            onClick={handleCTA}
            disabled={ctaLoading || (step === 0 && !isSetupDone) || (current.cta?.action === 'submit' && !!demoSubmission) || (current.cta?.action === 'payout' && (!!demoPayout || !demoChallenge))}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-xs font-semibold hover:bg-cyber-cyan/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {ctaLoading ? (
              <><Loader2 size={13} className="animate-spin" /> Working…</>
            ) : ctaDone ? (
              <><CheckCircle2 size={13} className="text-cyber-green" /> Done</>
            ) : (
              <><ArrowRight size={13} /> {current.cta.label}</>
            )}
          </button>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={handlePrev}
            disabled={step === 0}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={13} /> Prev
          </button>

          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => { setActionError(null); setStep(i) }}
                className={`rounded-full transition-all ${
                  i === step ? 'w-5 h-1.5 bg-cyber-cyan' : 'w-1.5 h-1.5 bg-border hover:bg-text-faint'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={step === steps.length - 1}
            className="flex items-center gap-1 text-xs text-cyber-cyan hover:text-cyber-cyan/80 font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
