import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
    body: 'Every action requires an XRPL wallet. Click below to open the wallet modal and create a free testnet wallet with test XRP auto-funded.\n\nSave your seed phrase — it\'s the only way to recover your wallet.',
    target: '[data-tour="wallet-btn"]',
    cta: { label: 'Open Wallet Setup', action: 'openWallet' },
  },
  {
    id: 'browse',
    title: '2 of 5 — Browse Open Bounties',
    body: 'The challenge board shows all open bounties. Each card shows the bounty amount in XRP, escrow status, and how many solution capsules have been submitted.\n\nA seeded demo challenge with real submissions is already loaded.',
    target: '[data-tour="browse-link"]',
    cta: { label: 'Browse Challenges', action: 'navigate', path: '/challenges' },
  },
  {
    id: 'create',
    title: '3 of 5 — Create a Bounty',
    body: 'Post a challenge by defining the problem, success criteria, and bounty amount. Publishing locks the XRP in an XRPL conditional escrow — funds can only leave when you release them to a winner.\n\nClick below to open the form with demo data pre-filled.',
    target: '[data-tour="create-link"]',
    cta: { label: 'Create with Demo Data', action: 'navigate-autofill', path: '/challenges/new' },
  },
  {
    id: 'submit',
    title: '4 of 5 — Submit a Solution',
    body: 'Solvers open any challenge and click "Submit Solution". Their solution is packed into a capsule and pinned to IPFS — creating a permanent, content-addressed record with a verifiable CID.\n\nOpen the seeded challenge below to see the Submit button in context.',
    target: '[data-tour="submit-btn"]',
    cta: { label: 'Open Demo Challenge', action: 'navigate', path: '/challenges/challenge_seed_001' },
  },
  {
    id: 'review',
    title: '5 of 5 — Select a Winner & Pay Out',
    body: 'As the challenge creator you open the Review page, read all submission capsules, and select the winner. Clicking "Release Bounty" fires an EscrowFinish transaction on XRPL — funds arrive in the winner\'s wallet instantly, on-chain.',
    target: '[data-tour="review-btn"]',
    cta: { label: 'See the Review Page', action: 'navigate', path: '/challenges/challenge_seed_001/review' },
  },
  {
    id: 'done',
    title: "That's BountyCapsule!",
    body: 'Full lifecycle:\n\n🔑 Wallet → ✏️ Create bounty → 🚀 Submit capsule → ⚖️ Select winner → 💸 On-chain payout\n\nNo intermediary. No custody. Just XRPL escrow + IPFS storage.',
    target: null,
    cta: { label: 'Create Your First Bounty', action: 'navigate', path: '/challenges/new' },
  },
]

export default function DemoTour({ onOpenWalletModal, onClose }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [spotlightRect, setSpotlightRect] = useState(null)
  const panelRef = useRef(null)

  const current = STEPS[step]

  // Find and spotlight the target element
  useEffect(() => {
    if (!current.target) {
      setSpotlightRect(null)
      return
    }

    const el = document.querySelector(current.target)
    if (!el) {
      setSpotlightRect(null)
      return
    }

    const update = () => {
      const rect = el.getBoundingClientRect()
      setSpotlightRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height })
    }

    update()
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    window.addEventListener('resize', update)
    window.addEventListener('scroll', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update)
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

  const progress = ((step) / (STEPS.length - 1)) * 100

  // Panel placement: near spotlight if it exists, otherwise bottom-center
  const PANEL_W = 360
  const panelStyle = (() => {
    if (!spotlightRect) return { bottom: '24px', left: '50%', transform: 'translateX(-50%)' }
    const viewW = window.innerWidth
    const viewH = window.innerHeight
    const isTopHalf = spotlightRect.top < viewH / 2
    // Align left with spotlight, but don't overflow right edge
    const rawLeft = spotlightRect.left
    const safeLeft = Math.min(Math.max(16, rawLeft), viewW - PANEL_W - 16)
    if (isTopHalf) {
      return { top: `${spotlightRect.top + spotlightRect.height + 16}px`, left: `${safeLeft}px`, transform: 'none' }
    } else {
      return { bottom: `${viewH - spotlightRect.top + 16}px`, left: `${safeLeft}px`, transform: 'none' }
    }
  })()

  return (
    <>
      {/* SVG Spotlight Overlay */}
      <AnimatePresence>
        {spotlightRect && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: 998 }}
          >
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
              <defs>
                <mask id="tour-mask">
                  <rect width="100%" height="100%" fill="white" />
                  <rect
                    x={spotlightRect.left - 8}
                    y={spotlightRect.top - 8}
                    width={spotlightRect.width + 16}
                    height={spotlightRect.height + 16}
                    rx="10"
                    fill="black"
                  />
                </mask>
              </defs>
              <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#tour-mask)" />
              {/* Glow ring */}
              <rect
                x={spotlightRect.left - 4}
                y={spotlightRect.top - 4}
                width={spotlightRect.width + 8}
                height={spotlightRect.height + 8}
                rx="12"
                fill="none"
                stroke="rgba(0, 240, 255, 0.9)"
                strokeWidth="2"
              >
                <animate attributeName="stroke-opacity" values="1;0.4;1" dur="1.8s" repeatCount="indefinite" />
              </rect>
            </svg>
          </motion.div>
        )}
        {/* Dark backdrop when no spotlight (welcome / done screens) */}
        {!spotlightRect && step !== 0 && (
          <motion.div
            key="plain-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-none"
            style={{ zIndex: 998 }}
          />
        )}
      </AnimatePresence>

      {/* Tour Panel */}
      <motion.div
        ref={panelRef}
        key={`panel-${step}`}
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        className="fixed w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
        style={{ zIndex: 999, ...panelStyle, maxWidth: '360px' }}
      >
        {/* Progress bar */}
        <div className="h-0.5 bg-border">
          <motion.div
            className="h-full bg-cyber-cyan"
            initial={{ width: 0 }}
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

          <h3 className="text-base font-bold text-text-primary mb-2 leading-snug">{current.title}</h3>
          <p className="text-sm text-text-muted leading-relaxed whitespace-pre-line mb-4">{current.body}</p>

          {/* CTA */}
          {current.cta && (
            <button
              onClick={handleCTA}
              className="w-full flex items-center justify-center gap-2 py-2.5 mb-3 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-sm font-semibold hover:bg-cyber-cyan/20 transition-colors"
            >
              {current.id === 'done' ? <CheckCircle2 size={14} /> : <ArrowRight size={14} />}
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
              <ChevronLeft size={14} /> Prev
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
              {step === STEPS.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}
