import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Lock, Shield, Wallet, Plus, Package, Trophy, Zap } from 'lucide-react'
import BackgroundBeams from '../components/ui/BackgroundBeams'
import AnimatedGrid from '../components/ui/AnimatedGrid'
import ShinyButton from '../components/ui/ShinyButton'
import StatusChip from '../components/ui/StatusChip'
import FileRow from '../components/ui/FileRow'

const DEMO_FILES = [
  { name: 'problem-spec.pdf', size: '420 KB', type: 'PDF', visibility: 'stored' },
  { name: 'query-logs.zip', size: '1.2 MB', type: 'ZIP', visibility: 'restricted' },
  { name: 'schema.sql', size: '18 KB', type: 'SQL', visibility: 'stored' },
]

const STEPS = [
  {
    n: '01',
    title: 'Define',
    body: 'Write the problem, specify success criteria, upload reference materials. Be precise about what winning looks like.',
  },
  {
    n: '02',
    title: 'Fund',
    body: 'Lock the bounty in XRPL escrow. Funds are cryptographically held — no trust required from solvers.',
  },
  {
    n: '03',
    title: 'Award',
    body: 'Review capsules, select the winner, release escrow in one click. On-chain settlement, no middlemen.',
  },
]

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
})

export default function Landing({ challenges, onStartTour }) {
  const sample = challenges[0] || {
    id: 'demo-1',
    title: 'Optimize PostgreSQL queries — 5s dashboard load time',
    description: 'Our user dashboard takes 5+ seconds to load. We need targeted query optimization and index improvements.',
    bountyAmount: '500',
    submissionCount: 3,
    status: 'open',
  }

  return (
    <div className="-mx-6 -mt-8">
      {/* Hero */}
      <section className="relative min-h-[75vh] flex items-center overflow-hidden px-6 py-24">
        <BackgroundBeams />
        <div className="relative z-10 max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
          {/* Left copy */}
          <div>
            <motion.div {...fade(0)}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyber-cyan/20 bg-cyber-cyan/5 text-cyber-cyan text-xs font-semibold mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-cyber-cyan animate-pulse" />
                Powered by XRPL Escrow + Pinata IPFS
              </span>
            </motion.div>
            <motion.h1 {...fade(0.05)} className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight mb-5">
              Turn any hard problem into a{' '}
              <span className="text-cyber-cyan">funded market</span>
              {' '}for solutions.
            </motion.h1>
            <motion.p {...fade(0.1)} className="text-lg text-text-muted leading-relaxed mb-8 max-w-lg">
              Upload the challenge, lock the bounty on XRPL, collect solution capsules, pay the winner.
            </motion.p>
            <motion.div {...fade(0.15)} className="flex items-center gap-3 flex-wrap">
              <ShinyButton size="lg" onClick={() => window.location.href = '/challenges/new'}>
                <span className="flex items-center gap-2">Create Challenge <ArrowRight size={16} /></span>
              </ShinyButton>
              <Link
                to="/challenges"
                className="px-6 py-3 rounded-lg border border-border text-sm font-semibold text-text-muted hover:text-text-primary hover:border-text-faint/40 transition-colors"
              >
                Browse Challenges
              </Link>
              <button
                onClick={onStartTour}
                className="flex items-center gap-2 px-5 py-3 rounded-lg border border-cyber-purple/30 bg-cyber-purple/5 text-cyber-purple text-sm font-semibold hover:bg-cyber-purple/10 transition-colors"
              >
                <Zap size={15} /> Interactive Tour
              </button>
            </motion.div>
          </div>

          {/* Right preview card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <StatusChip status={sample.status} />
                <span className="text-xs text-text-muted font-mono">Demo preview</span>
              </div>
              <h3 className="text-base font-bold text-text-primary mb-2 leading-snug">{sample.title}</h3>
              <p className="text-sm text-text-muted mb-5 line-clamp-2">{sample.description}</p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-5 p-4 bg-bg rounded-xl border border-border">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-faint mb-1">Bounty</p>
                  <p className="text-xl font-bold text-cyber-cyan">{sample.bountyAmount} <span className="text-sm font-semibold">XRP</span></p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-faint mb-1">Submissions</p>
                  <p className="text-xl font-bold text-text-primary">{sample.submissionCount}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-faint mb-1">Escrow</p>
                  <p className="text-sm font-semibold text-cyber-green flex items-center gap-1"><Lock size={11} /> Locked</p>
                </div>
              </div>

              {/* Files */}
              <div className="space-y-2">
                {DEMO_FILES.map((f) => (
                  <FileRow key={f.name} file={f} />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <AnimatedGrid className="px-6 py-20 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-14"
          >
            <p className="text-xs uppercase tracking-widest text-text-faint mb-2">How it works</p>
            <h2 className="text-3xl font-bold text-text-primary">Three steps to a funded solution</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative"
              >
                <div className="text-5xl font-extrabold text-text-faint/30 mb-4 font-mono">{step.n}</div>
                <h3 className="text-xl font-bold text-text-primary mb-3">{step.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{step.body}</p>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 -right-4 w-8 text-text-faint/20 text-xl">→</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedGrid>

      {/* Onboarding */}
      <section className="px-6 py-16 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <p className="text-xs uppercase tracking-widest text-text-faint mb-3">New to BountyCapsule?</p>
            <h2 className="text-2xl font-bold text-text-primary">Get started in four steps</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n: '01', icon: Wallet, title: 'Connect Wallet', body: 'Generate a free XRPL testnet wallet in one click. No signup required.' },
              { n: '02', icon: Plus, title: 'Create a Challenge', body: 'Define the problem, upload materials, and set a bounty amount.' },
              { n: '03', icon: Package, title: 'Collect Capsules', body: 'Solvers submit solution capsules pinned to IPFS with their approach.' },
              { n: '04', icon: Trophy, title: 'Pay the Winner', body: 'Review capsules, select the best, and release the escrow in one click.' },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="card p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-mono font-bold text-text-faint/50">{s.n}</span>
                    <div className="w-8 h-8 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center">
                      <Icon size={15} className="text-cyber-cyan" />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-text-primary mb-1.5">{s.title}</h3>
                  <p className="text-xs text-text-muted leading-relaxed">{s.body}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="px-6 py-16 border-t border-border">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">
          {[
            {
              icon: Lock,
              title: 'Locked on XRPL',
              body: 'Bounties live in XRPL conditional escrow. Funds release only when you confirm the winner — no intermediary, no counterparty risk.',
              accent: 'text-cyber-cyan',
              border: 'border-cyber-cyan/20',
              bg: 'bg-cyber-cyan/5',
            },
            {
              icon: Shield,
              title: 'Stored on Pinata',
              body: 'Challenge materials stored via Pinata on IPFS. Content-addressed by CID — tamper-evident, permanent, reusable by anyone with the hash.',
              accent: 'text-cyber-purple',
              border: 'border-cyber-purple/20',
              bg: 'bg-cyber-purple/5',
            },
          ].map(({ icon: Icon, title, body, accent, border, bg }) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className={`p-6 rounded-xl border ${border} ${bg}`}
            >
              <Icon size={24} className={`${accent} mb-3`} />
              <h3 className="text-base font-bold text-text-primary mb-2">{title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
