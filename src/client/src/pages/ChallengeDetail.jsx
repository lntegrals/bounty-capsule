import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Lock, Files, Send, Clock, CheckCircle2, Eye } from 'lucide-react'
import StatusChip from '../components/ui/StatusChip'
import FileRow from '../components/ui/FileRow'
import SubmissionCard from '../components/ui/SubmissionCard'

const API = '/api'

export default function ChallengeDetail({ wallet }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [challenge, setChallenge] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    fetchChallenge()
    fetchSubmissions()
  }, [id])

  const fetchChallenge = async () => {
    try {
      const res = await fetch(`${API}/challenge/${id}`)
      const data = await res.json()
      setChallenge(data.challenge)
    } catch (e) { console.error(e) }
  }

  const fetchSubmissions = async () => {
    try {
      const res = await fetch(`${API}/${id}/submissions`)
      const data = await res.json()
      setSubmissions(data.submissions || [])
    } catch (e) { console.error(e) }
  }

  if (!challenge) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin" />
      </div>
    )
  }

  const isOwner = wallet?.address === challenge.issuer
  const files = challenge.files || []

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'files', label: `Files (${files.length})` },
    { id: 'submissions', label: `Submissions (${submissions.length})` },
    { id: 'activity', label: 'Activity' },
  ]

  const ACTIVITY = [
    { icon: CheckCircle2, label: 'Challenge created', detail: new Date(challenge.createdAt).toLocaleString(), done: true },
    { icon: Lock, label: 'Bounty locked', detail: 'Funds secured in XRPL escrow', done: !!challenge.escrowSequence },
    { icon: Send, label: 'Submissions received', detail: `${submissions.length} solution capsules`, done: submissions.length > 0 },
    { icon: CheckCircle2, label: 'Winner selected', detail: 'Awaiting selection', done: false },
  ]

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8">
      {/* Left */}
      <div>
        <Link
          to="/challenges"
          className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
        >
          <ChevronLeft size={15} /> Back to challenges
        </Link>

        <div className="card p-6 mb-6">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <h1 className="text-2xl font-bold text-text-primary leading-snug">{challenge.title}</h1>
            <StatusChip status={challenge.status} className="flex-shrink-0 mt-1" />
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-6 text-sm text-text-muted">
            {challenge.category && <span>Category: <span className="text-text-primary">{challenge.category}</span></span>}
            {challenge.difficulty && <span>Difficulty: <span className="text-text-primary">{challenge.difficulty}</span></span>}
            {challenge.deadline && <span>Deadline: <span className="text-text-primary">{new Date(challenge.deadline).toLocaleDateString()}</span></span>}
            <span>Created: <span className="text-text-primary">{new Date(challenge.createdAt).toLocaleDateString()}</span></span>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 border-b border-border mb-6 -mx-6 px-6 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  tab === t.id
                    ? 'border-cyber-cyan text-cyber-cyan'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="p-4 bg-bg rounded-xl border border-border">
                <p className="text-xs uppercase tracking-wider text-text-faint mb-2">Problem Statement</p>
                <p className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">{challenge.description}</p>
              </div>
              {challenge.successCriteria && (
                <div className="p-4 bg-bg rounded-xl border border-border">
                  <p className="text-xs uppercase tracking-wider text-text-faint mb-2">Success Criteria</p>
                  <p className="text-sm text-text-muted leading-relaxed">{challenge.successCriteria}</p>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'files' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {files.length === 0 ? (
                <p className="text-sm text-text-faint text-center py-8">No files attached</p>
              ) : (
                files.map((f, i) => <FileRow key={i} file={f} />)
              )}
              {challenge.restricted && (
                <div className="flex items-center gap-3 p-4 bg-amber-400/5 border border-amber-400/20 rounded-xl">
                  <Lock size={14} className="text-amber-400" />
                  <p className="text-xs text-amber-400">Some files are restricted. Access granted after winner selection.</p>
                </div>
              )}
            </motion.div>
          )}

          {tab === 'submissions' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <Send size={32} className="text-text-faint mx-auto mb-3" />
                  <p className="text-sm text-text-muted">No submissions yet. Be the first to solve it.</p>
                </div>
              ) : (
                submissions.map((sub) => <SubmissionCard key={sub.id} submission={sub} />)
              )}
            </motion.div>
          )}

          {tab === 'activity' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="relative space-y-0">
                {ACTIVITY.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
                      {i < ACTIVITY.length - 1 && (
                        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
                      )}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center z-10 ${
                        item.done
                          ? 'bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan'
                          : 'bg-surface border-border text-text-faint'
                      }`}>
                        <Icon size={14} />
                      </div>
                      <div className="pt-0.5">
                        <p className={`text-sm font-medium ${item.done ? 'text-text-primary' : 'text-text-faint'}`}>{item.label}</p>
                        <p className="text-xs text-text-muted mt-0.5">{item.detail}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Right sticky rail */}
      <div>
        <div className="sticky top-24 card p-5 space-y-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-text-faint mb-1">Bounty</p>
            <p className="text-4xl font-extrabold text-cyber-cyan">
              {challenge.bountyAmount} <span className="text-xl font-semibold">XRP</span>
            </p>
          </div>

          <div className="p-4 bg-bg rounded-xl border border-border space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Escrow</span>
              <StatusChip status={challenge.escrowSequence ? 'locked' : 'draft'} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Submissions</span>
              <span className="text-text-primary font-medium">{submissions.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Files</span>
              <span className="text-text-primary font-medium">{files.length}</span>
            </div>
            {challenge.deadline && (
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Deadline</span>
                <span className="text-text-primary font-medium">{new Date(challenge.deadline).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {challenge.status === 'open' && (
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-sm font-semibold hover:bg-cyber-cyan/20 transition-colors">
                <Send size={15} /> Submit Solution
              </button>
              {isOwner && submissions.length > 0 && (
                <Link
                  to={`/challenges/${id}/review`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-sm font-medium text-text-muted hover:text-text-primary hover:border-text-faint/40 transition-colors"
                >
                  <Eye size={15} /> Review Submissions
                </Link>
              )}
            </div>
          )}

          {challenge.status === 'reviewing' && isOwner && (
            <Link
              to={`/challenges/${id}/review`}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-sm font-semibold hover:bg-cyber-cyan/20 transition-colors"
            >
              Select Winner
            </Link>
          )}

          <div className="pt-2 border-t border-border">
            <p className="text-[10px] text-text-faint leading-relaxed">
              <Lock size={9} className="inline mr-1" />Locked on XRPL ·{' '}
              <Files size={9} className="inline mr-1" />Stored on Pinata
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
