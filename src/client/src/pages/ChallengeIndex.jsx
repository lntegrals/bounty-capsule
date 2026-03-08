import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, Plus, Inbox } from 'lucide-react'
import ShinyButton from '../components/ui/ShinyButton'
import StatusChip from '../components/ui/StatusChip'
import { useToast } from '../components/ui/Toast'

const STATUSES = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'completed', label: 'Completed' },
  { value: 'closed', label: 'Closed' },
]

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'bounty', label: 'Highest bounty' },
]

const DIFFICULTIES = ['', 'easy', 'medium', 'hard', 'expert']
const DIFFICULTY_LABELS = { '': 'Any Difficulty', easy: 'Easy', medium: 'Medium', hard: 'Hard', expert: 'Expert' }

const BOUNTY_BUCKETS = [
  { value: '', label: 'Any Bounty' },
  { value: 'lt100', label: '< 100 XRP' },
  { value: '100to500', label: '100–500 XRP' },
  { value: 'gt500', label: '500+ XRP' },
]

function matchBounty(amount, bucket) {
  if (!bucket) return true
  const n = parseFloat(amount) || 0
  if (bucket === 'lt100') return n < 100
  if (bucket === '100to500') return n >= 100 && n <= 500
  if (bucket === 'gt500') return n > 500
  return true
}

export default function ChallengeIndex({ challenges, onRefresh, wallet }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('newest')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [bountyBucket, setBountyBucket] = useState('')

  const categories = ['', ...new Set(challenges.map((c) => c.category).filter(Boolean))]

  const filtered = challenges
    .filter((c) => !search || c.title?.toLowerCase().includes(search.toLowerCase()))
    .filter((c) => !status || c.status === status)
    .filter((c) => !category || c.category === category)
    .filter((c) => !difficulty || c.difficulty?.toLowerCase() === difficulty)
    .filter((c) => matchBounty(c.bountyAmount, bountyBucket))
    .sort((a, b) => {
      if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt)
      if (sort === 'bounty') return parseFloat(b.bountyAmount) - parseFloat(a.bountyAmount)
      return 0
    })

  const hasFilters = !!(search || status || category || difficulty || bountyBucket)
  const showSkeleton = challenges.length === 0 && !hasFilters

  const handleCreate = () => {
    if (!wallet) {
      toast('Connect your wallet to create a challenge', 'error')
      return
    }
    navigate('/challenges/new')
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Challenges</h1>
        <ShinyButton onClick={handleCreate}>
          <span className="flex items-center gap-2"><Plus size={14} /> Create Challenge</span>
        </ShinyButton>
      </div>

      {/* Filter bar */}
      <div className="card p-4 mb-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search challenges…"
                className="input-field pl-9"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <SlidersHorizontal size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input-field pl-8 pr-3 w-36 appearance-none cursor-pointer"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="input-field w-40 cursor-pointer"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.length > 1 && (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field w-40 cursor-pointer"
              >
                <option value="">All Categories</option>
                {categories.filter(Boolean).map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            )}
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="input-field w-40 cursor-pointer"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
              ))}
            </select>
            <select
              value={bountyBucket}
              onChange={(e) => setBountyBucket(e.target.value)}
              className="input-field w-40 cursor-pointer"
            >
              {BOUNTY_BUCKETS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Result count */}
      {!showSkeleton && (
        <p className="text-xs text-text-muted mb-4">
          {filtered.length} challenge{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Grid */}
      {showSkeleton ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="h-5 w-16 bg-surface/60 rounded-full" />
                <div className="h-3 w-20 bg-surface/60 rounded" />
              </div>
              <div className="h-4 w-3/4 bg-surface/60 rounded mb-2" />
              <div className="h-3 w-full bg-surface/60 rounded mb-1" />
              <div className="h-3 w-2/3 bg-surface/60 rounded mb-4" />
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <div className="h-6 w-20 bg-surface/60 rounded" />
                <div className="h-6 w-16 bg-surface/60 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-16 text-center">
          <Inbox size={40} className="text-text-faint mx-auto mb-4" />
          <p className="text-text-muted font-medium mb-2">No challenges found</p>
          <p className="text-sm text-text-faint mb-6">
            {hasFilters ? 'Try adjusting filters.' : 'No challenges yet — be the first to fund one.'}
          </p>
          {!hasFilters && (
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-sm font-semibold hover:bg-cyber-cyan/20 transition-colors"
            >
              <Plus size={14} /> Create Challenge
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((challenge, i) => (
            <ChallengeCard key={challenge.id} challenge={challenge} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function ChallengeCard({ challenge, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.015 }}
    >
      <Link
        to={`/challenges/${challenge.id}`}
        className="block card p-5 hover:border-text-faint/40 transition-colors group h-full"
      >
        <div className="flex items-center justify-between mb-3">
          <StatusChip status={challenge.status} />
          <span className="text-xs text-text-faint">
            {challenge.createdAt ? new Date(challenge.createdAt).toLocaleDateString() : '—'}
          </span>
        </div>

        <h3 className="text-sm font-semibold text-text-primary leading-snug mb-2 line-clamp-2 group-hover:text-cyber-cyan/90 transition-colors">
          {challenge.title}
        </h3>

        {(challenge.category || challenge.difficulty) && (
          <div className="flex gap-1.5 mb-2 flex-wrap">
            {challenge.category && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-border text-text-muted capitalize">
                {challenge.category}
              </span>
            )}
            {challenge.difficulty && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-border text-text-muted capitalize">
                {challenge.difficulty}
              </span>
            )}
          </div>
        )}

        <p className="text-sm text-text-muted leading-relaxed mb-4 line-clamp-2">
          {challenge.description}
        </p>

        <div className="border-t border-border pt-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-text-faint mb-0.5">Bounty</p>
            <p className="text-base font-bold text-cyber-cyan">{challenge.bountyAmount} <span className="text-xs font-semibold">XRP</span></p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-text-faint mb-0.5">Submissions</p>
            <p className="text-base font-bold text-text-primary">{challenge.submissionCount || 0}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
