import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Zap, CheckCircle2, ArrowRight } from 'lucide-react'

const DEMO_AUTOFILL = {
  title: 'Build a real-time collaborative code editor',
  description:
    'We need a lightweight embeddable collaborative code editor with syntax highlighting, real-time multi-cursor support, and conflict-free sync. Must integrate with our existing WebSocket infrastructure and work without external SaaS dependencies.',
  successCriteria:
    '• Multi-user cursor support with distinct colors\n• CRDT-based conflict resolution\n• Syntax highlighting for JS and Python\n• Embeddable via iframe with no external deps',
  category: 'engineering',
  difficulty: 'hard',
  bountyAmount: '75',
  deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
}

const DEMO_CHALLENGE_ID = 'challenge_seed_001'

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to BountyCapsule',
    body: 'An on-chain bounty marketplace built on XRPL. Post challenges with XRP locked in escrow, collect verifiable solution capsules, pay the winner — trustlessly.\n\nThis walkthrough covers the full lifecycle in about 2 minutes.',
    target: null,
    cta: null,
  },
  {
    id: 'wallet',
    title: '1 of 5 — Connect a Wallet',
    body: 'Every action requires an XRPL wallet. Click "Open Wallet Setup" below, then choose "Create Testnet Wallet" — free test XRP is auto-funded.\n\nSave the seed phrase shown — it\'s the only way to restore your wallet.',
    target: '[data-tour="wallet-btn"]',
    cta: { label: 'Open Wallet Setup', action: 'openWallet' },
  },
  {
    id: 'browse',
    title: '2 of 5 — Browse Open Bounties',
    body: 'The challenge board lists all open bounties with their bounty amount, status, and submission count. A pre-seeded demo challenge is already live.\n\nClick "Browse Challenges" to explore it.',
    target: '[data-tour="browse-link"]',
    cta: { label: 'Browse Challenges', action: 'navigate', path: '/challenges' },
  },
  {
    id: 'create',
    title: '3 of 5 — Create a Bounty',
    body: 'Post a new challenge with a title, problem description, and bounty amount. Publishing locks the XRP in an XRPL conditional escrow — funds can only leave when you select a winner.\n\nClick below to open the form with demo data pre-filled.',
    target: '[data-tour="create-link"]',
    cta: { label: 'Create with Demo Data', action: 'navigate-autofill', path: '/challenges/new' },
  },
  {
    id: 'submit',
    title: '4 of 5 — Submit a Solution',
    body: 'Solvers open any open challenge and click "Submit Solution". Their solution gets pinned to IPFS as a verifiable capsule — a permanent, content-addressed record with a CID.\n\nOpen the seeded demo challenge to see the Submit button.',
    target: '[data-tour="submit-btn"]',
    cta: { label: 'Open Demo Challenge', action: 'navigate', path: `/challenges/${DEMO_CHALLENGE_ID}` },
  },
  {
    id: 'review',
    title: '5 of 5 — Select a Winner & Pay Out',
    body: 'As the challenge creator, click "Review Submissions" to read all capsules and select the best one. Clicking "Release Bounty" fires an EscrowFinish on XRPL — funds land in the winner\'s wallet instantly.\n\nClick the highlighted button to open the review page.',
    target: '[data-tour="review-btn"]',
    cta: { label: 'Open Review Page', action: 'navigate', path: `/challenges/${DEMO_CHALLENGE_ID}/review` },
  },
  {
    id: 'done',
    title: "That's BountyCapsule!",
    body: 'Full lifecycle:\n\n🔑 Wallet → ✏️ Create bounty → 🚀 Submit capsule → ⚖️ Select winner → 💸 On-chain payout\n\nNo intermediary. No custody. Just XRPL escrow + IPFS.',
    target: null,
    cta: { label: 'Create Your First Bounty', action: 'navigate', path: '/challenges/new' },
  },
]

export default function DemoTour({ onOpenWalletModal, onClose }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const current = STEPS[step]

  // Add/remove glow ring on target element with retry (page may not have rendered yet)
  useEffect(() => {
    if (!current.target) return

    let cancelled = false
    let cleanup = () => {}

    const tryAttach = (attempts = 0) => {
      if (cancelled) return
      const el = document.querySelector(current.target)
      if (el) {
        el.classList.add('tour-ring')
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        cleanup = () => el.classList.remove('tour-ring')
      } else if (attempts < 15) {
        // Retry up to 15 times (3 seconds) to handle post-navigation renders
        setTimeout(() => tryAttach(attempts + 1), 200)
      }
    }

    tryAttach()
    return () => {
      cancelled = true
      cleanup()
    }
  }, [step, current.target])

  const handleCTA = useCallback(() => {
    if (!current.cta) return
    const { action, path } = current.cta
    if (action === 'openWallet') {
      onOpenWalletModal?.()
    } else if (action === 'navigate') {
      navigate(path)
    } else if (action === 'navigate-autofill') {
      sessionStorage.setItem('demo_autofill', JSON.stringify(DEMO_AUTOFILL))
      navigate(path)
    }
  }, [current, navigate, onOpenWalletModal])

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else onClose?.()
  }

  const handlePrev = () => setStep((s) => Math.max(0, s - 1))

  const progress = (step / (STEPS.length - 1)) * 100

  return (
    <motion.div
      key={`panel-${step}`}
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      className="fixed bottom-6 right-6 w-80 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
      style={{ zIndex: 999 }}
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

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-cyber-cyan/15 border border-cyber-cyan/30 flex items-center justify-center flex-shrink-0">
              <Zap size={12} className="text-cyber-cyan" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyber-cyan">Demo Tour</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-faint hover:text-text-primary hover:bg-bg transition-colors flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        <h3 className="text-sm font-bold text-text-primary mb-2 leading-snug">{current.title}</h3>
        <p className="text-xs text-text-muted leading-relaxed whitespace-pre-line mb-4">{current.body}</p>

        {/* CTA */}
        {current.cta && (
          <button
            onClick={handleCTA}
            className="w-full flex items-center justify-center gap-2 py-2.5 mb-3 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-xs font-semibold hover:bg-cyber-cyan/20 transition-colors"
          >
            {current.id === 'done' ? <CheckCircle2 size={13} /> : <ArrowRight size={13} />}
            {current.cta.label}
          </button>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={step === 0}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={13} /> Prev
          </button>

          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`rounded-full transition-all ${
                  i === step ? 'w-4 h-1.5 bg-cyber-cyan' : 'w-1.5 h-1.5 bg-border hover:bg-text-faint'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 text-xs text-cyber-cyan hover:text-cyber-cyan/80 font-semibold transition-colors"
          >
            {step === STEPS.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
