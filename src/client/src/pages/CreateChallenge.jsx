import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Lock, Shield, AlertTriangle, Loader2, X } from 'lucide-react'
import ShinyButton from '../components/ui/ShinyButton'
import { useToast } from '../components/ui/Toast'

const API = '/api'

const STEPS = [
  { id: 0, label: 'Define', desc: 'Problem & criteria' },
  { id: 1, label: 'Materials', desc: 'Upload files' },
  { id: 2, label: 'Fund', desc: 'Lock bounty' },
  { id: 3, label: 'Review', desc: 'Confirm & publish' },
]

const CATEGORIES = ['Engineering', 'Design', 'Product', 'Data Science', 'Research', 'Other']
const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Expert']

export default function CreateChallenge({ wallet, onSuccess, onConnectWallet }) {
  const navigate = useNavigate()
  const toast = useToast()
  const isDemo = !wallet
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    successCriteria: '',
    category: '',
    difficulty: '',
    deadline: '',
    files: [],
    restricted: false,
    bountyAmount: '',
    recipient: '',
  })

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = async () => {
    if (!wallet) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/challenge/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          successCriteria: form.successCriteria,
          category: form.category,
          difficulty: form.difficulty,
          deadline: form.deadline,
          issuerSeed: wallet.seed,
          bountyAmount: form.bountyAmount,
          recipient: form.recipient || wallet.address,
        }),
      })
      const data = await res.json()
      if (data.challenge) {
        toast('Challenge published!', 'success')
        onSuccess?.()
        navigate(`/challenges/${data.challenge.id}`)
      } else {
        toast(data.error || 'Failed to publish challenge', 'error')
      }
    } catch (e) {
      toast(e.message || 'Failed to publish challenge', 'error')
      console.error(e)
    }
    setLoading(false)
  }

  const slide = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
    transition: { duration: 0.25 },
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Create Challenge</h1>
        <Link to="/challenges" className="text-sm text-text-muted hover:text-text-primary flex items-center gap-1 transition-colors">
          <X size={14} /> Cancel
        </Link>
      </div>

      {/* Demo mode banner */}
      {isDemo && (
        <div className="flex items-center gap-2 p-3 bg-amber-400/5 border border-amber-400/20 rounded-lg mb-6">
          <span className="text-xs font-bold text-amber-400 px-1.5 py-0.5 bg-amber-400/10 rounded">DEMO</span>
          <p className="text-xs text-amber-400">Explore the form freely — publishing requires a connected wallet.</p>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((s) => (
          <div key={s.id} className="flex-1">
            <div className={`h-1 rounded-full transition-all duration-300 ${
              s.id < step ? 'bg-cyber-cyan' : s.id === step ? 'bg-cyber-cyan' : 'bg-border'
            }`} />
            <div className="mt-2 hidden sm:block">
              <p className={`text-xs font-semibold ${s.id <= step ? 'text-text-primary' : 'text-text-faint'}`}>{s.label}</p>
              <p className="text-[10px] text-text-faint">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 0 — Define */}
        {step === 0 && (
          <motion.div key="step0" {...slide} className="card p-6 space-y-5">
            <div>
              <label className="label">Challenge Title *</label>
              <input
                className="input-field"
                placeholder="e.g., Optimize PostgreSQL queries for 5s dashboard load"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Problem Description *</label>
              <textarea
                className="input-field min-h-[100px] resize-y"
                placeholder="Describe the problem in detail. What needs to be solved?"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Success Criteria</label>
              <textarea
                className="input-field min-h-[80px] resize-y"
                placeholder="What should a valid submission include and prove?"
                value={form.successCriteria}
                onChange={(e) => set('successCriteria', e.target.value)}
              />
              <p className="text-xs text-text-faint mt-1.5">Be specific — this is what you'll use to judge submissions.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Category</label>
                <select className="input-field" value={form.category} onChange={(e) => set('category', e.target.value)}>
                  <option value="">Select…</option>
                  {CATEGORIES.map((c) => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Difficulty</label>
                <select className="input-field" value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)}>
                  <option value="">Select…</option>
                  {DIFFICULTIES.map((d) => <option key={d} value={d.toLowerCase()}>{d}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Deadline</label>
              <input
                type="date"
                className="input-field"
                value={form.deadline}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => set('deadline', e.target.value)}
              />
            </div>
            <ShinyButton
              onClick={() => setStep(1)}
              disabled={!form.title || !form.description}
              className="w-full justify-center"
            >
              Continue
            </ShinyButton>
          </motion.div>
        )}

        {/* Step 1 — Materials */}
        {step === 1 && (
          <motion.div key="step1" {...slide} className="card p-6 space-y-5">
            <div>
              <p className="text-sm font-semibold text-text-primary mb-1">Challenge Materials</p>
              <p className="text-sm text-text-muted">Upload files that help solvers understand the problem.</p>
            </div>

            <motion.div
              animate={{ borderColor: dragOver ? '#00F0FF' : '#1A1A24', boxShadow: dragOver ? '0 0 20px rgba(0,240,255,0.15)' : 'none' }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragOver(false)
                const dropped = Array.from(e.dataTransfer.files).map((f) => ({ name: f.name, size: `${(f.size / 1024).toFixed(0)} KB`, type: f.name.split('.').pop().toUpperCase(), visibility: form.restricted ? 'restricted' : 'stored' }))
                set('files', [...form.files, ...dropped])
              }}
              className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors bg-bg"
            >
              <Upload size={28} className="mx-auto mb-3 text-text-faint" />
              <p className="text-sm font-medium text-text-primary mb-1">Drag files here or click to browse</p>
              <p className="text-xs text-text-faint">ZIP, PDF, MD, SQL, code files supported</p>
            </motion.div>

            {form.files.length > 0 && (
              <div className="space-y-2">
                {form.files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 bg-bg border border-border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{f.name}</p>
                      <p className="text-xs text-text-muted">{f.size}</p>
                    </div>
                    <button onClick={() => set('files', form.files.filter((_, j) => j !== i))} className="text-text-faint hover:text-cyber-pink transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-bg rounded-xl border border-border">
              <div>
                <p className="text-sm font-medium text-text-primary">Restrict file access</p>
                <p className="text-xs text-text-muted">Only winners can download restricted files</p>
              </div>
              <button
                onClick={() => set('restricted', !form.restricted)}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.restricted ? 'bg-cyber-cyan' : 'bg-border'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.restricted ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            <div className="flex items-start gap-3 p-4 bg-cyber-cyan/5 border border-cyber-cyan/20 rounded-xl">
              <Shield size={16} className="text-cyber-cyan mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-cyber-cyan">Stored via Pinata · IPFS</p>
                <p className="text-xs text-text-muted">Content-addressed, tamper-evident. CID verifiable by anyone.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="px-4 py-2.5 rounded-lg border border-border text-sm text-text-muted hover:text-text-primary hover:border-text-faint/40 transition-colors">
                Back
              </button>
              <ShinyButton onClick={() => setStep(2)} className="flex-1 justify-center">Continue</ShinyButton>
            </div>
          </motion.div>
        )}

        {/* Step 2 — Fund */}
        {step === 2 && (
          <motion.div key="step2" {...slide} className="card p-6 space-y-5">
            <div>
              <p className="text-sm font-semibold text-text-primary mb-1">Fund the Bounty</p>
              <p className="text-sm text-text-muted">Lock the bounty in XRPL escrow. Funds release only when you select a winner.</p>
            </div>

            <div>
              <label className="label">Bounty Amount *</label>
              <div className="relative">
                <input
                  type="number"
                  className="input-field pr-16"
                  placeholder="100"
                  min="1"
                  value={form.bountyAmount}
                  onChange={(e) => set('bountyAmount', e.target.value)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-mono font-semibold text-text-faint">XRP</span>
              </div>
            </div>

            <div>
              <label className="label">Recipient Address (optional)</label>
              <input
                type="text"
                className="input-field font-mono text-xs"
                placeholder="Defaults to your address"
                value={form.recipient}
                onChange={(e) => set('recipient', e.target.value)}
              />
            </div>

            {/* Funding status animation */}
            <div className="p-4 bg-bg border border-border rounded-xl">
              <p className="text-xs uppercase tracking-wider text-text-faint mb-3">Funding Status</p>
              <div className="flex items-center gap-3">
                {['Draft', 'Awaiting', 'Locked', 'Failed'].map((label, i) => {
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${i === 0 && form.bountyAmount ? 'bg-cyber-cyan animate-pulse' : 'bg-text-faint/30'}`} />
                      <span className={`text-xs ${i === 0 && form.bountyAmount ? 'text-cyber-cyan font-medium' : 'text-text-faint'}`}>{label}</span>
                      {i < 3 && <span className="text-text-faint/20 text-xs">·</span>}
                    </div>
                  )
                })}
              </div>
            </div>

            {!wallet && (
              <div className="flex items-start gap-3 p-4 bg-amber-400/5 border border-amber-400/20 rounded-xl">
                <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-400">Connect your wallet before locking the bounty.</p>
              </div>
            )}

            <div className="flex items-start gap-3 p-4 bg-cyber-cyan/5 border border-cyber-cyan/20 rounded-xl">
              <Lock size={16} className="text-cyber-cyan flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-cyber-cyan">XRPL Testnet</p>
                <p className="text-xs text-text-muted">Funds are locked in escrow, not accessible until winner selection.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-lg border border-border text-sm text-text-muted hover:text-text-primary hover:border-text-faint/40 transition-colors">
                Back
              </button>
              <ShinyButton onClick={() => setStep(3)} disabled={!form.bountyAmount} className="flex-1 justify-center">
                Continue
              </ShinyButton>
            </div>
          </motion.div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <motion.div key="step3" {...slide} className="card p-6 space-y-5">
            <p className="text-sm font-semibold text-text-primary">Review & Publish</p>

            <div className="p-4 bg-bg rounded-xl border border-border space-y-3">
              {[
                { label: 'Title', value: form.title },
                { label: 'Category', value: form.category || '—' },
                { label: 'Difficulty', value: form.difficulty || '—' },
                { label: 'Deadline', value: form.deadline || '—' },
                { label: 'Files', value: form.files.length ? `${form.files.length} attached` : 'None' },
                { label: 'Visibility', value: form.restricted ? 'Restricted' : 'Public' },
                { label: 'Bounty', value: `${form.bountyAmount} XRP` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-4">
                  <span className="text-xs text-text-muted">{label}</span>
                  <span className={`text-xs font-medium text-right max-w-[60%] truncate ${label === 'Bounty' ? 'text-cyber-cyan' : 'text-text-primary'}`}>{value}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 p-3 bg-cyber-cyan/5 border border-cyber-cyan/20 rounded-lg">
              <Lock size={14} className="text-cyber-cyan flex-shrink-0" />
              <p className="text-xs text-cyber-cyan font-medium">Bounty will be locked on XRPL upon publish</p>
            </div>

            {!wallet && (
              <div className="p-3 bg-amber-400/5 border border-amber-400/20 rounded-lg text-center">
                <p className="text-xs text-amber-400 mb-2">Connect your wallet to publish.</p>
                <button
                  onClick={() => onConnectWallet?.()}
                  className="text-xs text-cyber-cyan underline hover:text-cyber-cyan/80 transition-colors"
                >
                  Connect Wallet
                </button>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-4 py-2.5 rounded-lg border border-border text-sm text-text-muted hover:text-text-primary transition-colors">
                Back
              </button>
              <ShinyButton
                onClick={handleSubmit}
                disabled={loading || !wallet}
                className="flex-1 justify-center"
              >
                {loading
                  ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Publishing…</span>
                  : 'Lock Bounty & Publish'
                }
              </ShinyButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
