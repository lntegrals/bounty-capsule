import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, AlertTriangle, Loader2, CheckCircle2, ExternalLink } from 'lucide-react'
import StatusChip from '../components/ui/StatusChip'
import SubmissionCard from '../components/ui/SubmissionCard'
import ShinyButton from '../components/ui/ShinyButton'
import OnChainProof from '../components/ui/OnChainProof'

const API = '/api'

export default function ReviewPage({ wallet }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [selected, setSelected] = useState(null)
  const [confirmModal, setConfirmModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/challenge/${id}`).then((r) => r.json()),
      fetch(`${API}/${id}/submissions`).then((r) => r.json()),
    ]).then(([c, s]) => {
      setChallenge(c.challenge)
      setSubmissions(s.submissions || [])
    }).catch(console.error)
  }, [id])

  const handlePayout = async () => {
    if (!selected || !wallet) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: id,
          winnerAddress: selected.solver,
          issuerSeed: wallet.seed,
        }),
      })
      const data = await res.json()
      setSuccess(data)
      setConfirmModal(false)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  if (!challenge) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
          <CheckCircle2 size={56} className="text-cyber-green mx-auto mb-5" />
        </motion.div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Bounty Released</h2>
        <p className="text-text-muted mb-6">
          <span className="text-cyber-cyan font-semibold">{challenge.bountyAmount} XRP</span> sent to{' '}
          <span className="font-mono text-xs">{selected?.solver}</span>
        </p>
        {success.txHash && (
          <div className="mb-6 text-left">
            <OnChainProof challenge={{ ...challenge, payoutTxHash: success.txHash }} />
          </div>
        )}
        <Link
          to="/challenges"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan font-semibold text-sm hover:bg-cyber-cyan/20 transition-colors"
        >
          Back to challenges
        </Link>
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-8">
      {/* Left */}
      <div>
        <Link to={`/challenges/${id}`} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6">
          <ChevronLeft size={15} /> Back to challenge
        </Link>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-text-primary mb-1">{challenge.title}</h1>
            <p className="text-sm text-text-muted">{submissions.length} submission{submissions.length !== 1 ? 's' : ''} to review</p>
          </div>
          <StatusChip status="reviewing" />
        </div>

        {submissions.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-text-muted">No submissions to review yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <SubmissionCard
                key={sub.id}
                submission={sub}
                selected={selected?.id === sub.id}
                onSelect={() => setSelected(sub)}
                showSelect
              />
            ))}
          </div>
        )}
      </div>

      {/* Right sticky rail */}
      <div>
        <div className="sticky top-24 card p-5 space-y-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-text-faint mb-1">Reviewing for</p>
            <p className="text-3xl font-extrabold text-text-primary">
              {challenge.bountyAmount} <span className="text-base font-semibold text-text-muted">XRP</span>
            </p>
          </div>

          <div className="p-4 bg-bg rounded-xl border border-border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Total submissions</span>
              <span className="text-text-primary font-medium">{submissions.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Selected</span>
              <span className={`font-medium ${selected ? 'text-cyber-cyan' : 'text-text-faint'}`}>{selected ? '1' : '0'}</span>
            </div>
            {selected && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-text-muted">Winner</p>
                <p className="text-sm font-semibold text-text-primary">{selected.solverName || 'Anonymous'}</p>
              </div>
            )}
          </div>

          <ShinyButton
            onClick={() => setConfirmModal(true)}
            disabled={!selected}
            variant="primary"
            className="w-full justify-center"
          >
            Release Bounty
          </ShinyButton>

          <div className="flex items-start gap-2 p-3 bg-amber-400/5 border border-amber-400/20 rounded-lg">
            <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-400">This action is irreversible once confirmed.</p>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
              onClick={() => setConfirmModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-text-primary mb-1">Confirm Payout</h3>
              <p className="text-sm text-text-muted mb-5">
                Release{' '}
                <span className="text-cyber-cyan font-bold">{challenge.bountyAmount} XRP</span>
                {' '}to:
              </p>

              <div className="p-4 bg-bg border border-border rounded-xl mb-5">
                <p className="text-sm font-bold text-text-primary mb-1">{selected?.solverName || 'Anonymous'}</p>
                <p className="text-xs font-mono text-text-muted break-all">{selected?.solver}</p>
              </div>

              <div className="flex items-center gap-2 mb-5 p-3 bg-amber-400/5 border border-amber-400/20 rounded-lg">
                <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-400">This is irreversible. Escrow will be finalized on XRPL.</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <ShinyButton onClick={handlePayout} disabled={loading} className="flex-1 justify-center">
                  {loading
                    ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Releasing…</span>
                    : 'Release Escrow'
                  }
                </ShinyButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
