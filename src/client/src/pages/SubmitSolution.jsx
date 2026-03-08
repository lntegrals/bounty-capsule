import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, CheckCircle2, Loader2, Package, ArrowRight } from 'lucide-react'
import CapsuleManifest from '../components/ui/CapsuleManifest'

const API = '/api'

const STEPS = ['Identity', 'Solution', 'Review & Submit']

export default function SubmitSolution({ wallet }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  const [solverName, setSolverName] = useState('')
  const [solverAddress, setSolverAddress] = useState(wallet?.address || '')
  const [description, setDescription] = useState('')
  const [approach, setApproach] = useState('')

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const body = {
        challengeId: id,
        solverName: solverName || 'Anonymous',
        description: `${description}\n\nApproach: ${approach}`.trim(),
        ...(wallet?.seed ? { solverSeed: wallet.seed } : {}),
      }
      const res = await fetch(`${API}/submission/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setSuccess(data)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          <CheckCircle2 size={56} className="text-cyber-green mx-auto mb-5" />
        </motion.div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Capsule Submitted</h2>
        <p className="text-text-muted mb-6">Your solution has been pinned to IPFS and recorded.</p>
        {success.submission?.cid && (
          <div className="mb-6 text-left">
            <CapsuleManifest cid={success.submission.cid} label="Your Solution Capsule" />
          </div>
        )}
        <Link
          to={`/challenges/${id}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan font-semibold text-sm hover:bg-cyber-cyan/20 transition-colors"
        >
          Back to Challenge
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      <Link
        to={`/challenges/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
      >
        <ChevronLeft size={15} /> Back to challenge
      </Link>

      <h1 className="text-2xl font-bold text-text-primary mb-2">Submit Solution</h1>
      <p className="text-sm text-text-muted mb-8">Your solution will be pinned to IPFS as a verifiable capsule.</p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < step ? 'bg-cyber-cyan text-bg' : i === step ? 'bg-cyber-cyan/20 border border-cyber-cyan text-cyber-cyan' : 'bg-surface border border-border text-text-faint'
            }`}>
              {i < step ? <CheckCircle2 size={12} /> : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-text-primary' : 'text-text-faint'}`}>{label}</span>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      <div className="card p-6">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <h2 className="text-base font-semibold text-text-primary">Step 1 — Identity</h2>
              <div>
                <label className="block text-xs uppercase tracking-wider text-text-faint mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={solverName}
                  onChange={e => setSolverName(e.target.value)}
                  placeholder="Your name or handle"
                  className="w-full px-3 py-2.5 rounded-lg bg-bg border border-border text-text-primary text-sm placeholder-text-faint focus:outline-none focus:border-cyber-cyan/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-text-faint mb-1.5">
                  XRPL Address <span className="text-text-faint normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={solverAddress}
                  onChange={e => setSolverAddress(e.target.value)}
                  placeholder="rXXX… (for payout)"
                  className="w-full px-3 py-2.5 rounded-lg bg-bg border border-border text-text-primary text-sm font-mono placeholder-text-faint focus:outline-none focus:border-cyber-cyan/50 transition-colors"
                />
                {wallet?.address && (
                  <p className="text-[10px] text-text-faint mt-1">Connected wallet detected — address pre-filled.</p>
                )}
              </div>
              <button
                onClick={() => setStep(1)}
                disabled={!solverName.trim()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-sm font-semibold hover:bg-cyber-cyan/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ArrowRight size={14} />
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <h2 className="text-base font-semibold text-text-primary">Step 2 — Solution</h2>
              <div>
                <label className="block text-xs uppercase tracking-wider text-text-faint mb-1.5">Solution Summary</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder="What did you build? How does it solve the problem?"
                  className="w-full px-3 py-2.5 rounded-lg bg-bg border border-border text-text-primary text-sm placeholder-text-faint focus:outline-none focus:border-cyber-cyan/50 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-text-faint mb-1.5">Technical Approach</label>
                <textarea
                  value={approach}
                  onChange={e => setApproach(e.target.value)}
                  rows={3}
                  placeholder="What method or technology did you use?"
                  className="w-full px-3 py-2.5 rounded-lg bg-bg border border-border text-text-primary text-sm placeholder-text-faint focus:outline-none focus:border-cyber-cyan/50 transition-colors resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!description.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-sm font-semibold hover:bg-cyber-cyan/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <h2 className="text-base font-semibold text-text-primary">Step 3 — Review & Submit</h2>

              <div className="p-4 bg-bg rounded-xl border border-border space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-faint">Solver</p>
                  <p className="text-sm font-semibold text-text-primary">{solverName}</p>
                  {solverAddress && <p className="text-xs font-mono text-text-muted mt-0.5">{solverAddress}</p>}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-faint">Solution Summary</p>
                  <p className="text-sm text-text-muted line-clamp-3">{description}</p>
                </div>
                {approach && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-text-faint">Approach</p>
                    <p className="text-sm text-text-muted line-clamp-2">{approach}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 p-3 bg-cyber-cyan/5 border border-cyber-cyan/20 rounded-lg">
                <Package size={13} className="text-cyber-cyan flex-shrink-0" />
                <p className="text-xs text-text-muted">Your capsule will be pinned to IPFS via Pinata for permanent storage.</p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-sm font-semibold hover:bg-cyber-cyan/20 transition-colors disabled:opacity-40"
                >
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : <><Package size={14} /> Submit Capsule</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
