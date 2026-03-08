import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wallet, Key, Loader2, CheckCircle2 } from 'lucide-react'

export default function WalletModal({ open, onClose, onCreateWallet, onLoadWallet }) {
  const [tab, setTab] = useState('new')
  const [seed, setSeed] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    try {
      const wallet = await onCreateWallet()
      setSuccess(wallet)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const handleImport = async () => {
    if (!seed.trim()) return
    setLoading(true)
    setError('')
    try {
      await onLoadWallet(seed.trim())
      setSuccess({ imported: true })
    } catch (e) {
      setError('Invalid seed phrase.')
    }
    setLoading(false)
  }

  const handleClose = () => {
    setSeed('')
    setSuccess(null)
    setError('')
    setLoading(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative w-full max-w-md bg-surface border border-border rounded-2xl p-6 shadow-2xl"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg transition-colors"
            >
              <X size={16} />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={18} className="text-cyber-cyan" />
                <h2 className="text-lg font-bold text-text-primary">Connect Wallet</h2>
              </div>
              <p className="text-sm text-text-muted">XRPL Testnet — No mainnet funds at risk</p>
            </div>

            {success ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-4"
              >
                <CheckCircle2 size={40} className="text-cyber-green mx-auto mb-3" />
                <p className="text-text-primary font-semibold mb-1">
                  {success.imported ? 'Wallet imported!' : 'Wallet created!'}
                </p>
                {success.address && (
                  <p className="text-xs text-text-muted font-mono break-all">{success.address}</p>
                )}
                {success.seed && !success.imported && (
                  <div className="mt-4 p-3 bg-bg border border-amber-400/30 rounded-lg text-left">
                    <p className="text-xs text-amber-400 font-semibold mb-1">Save your seed phrase</p>
                    <p className="text-xs text-text-muted font-mono break-all">{success.seed}</p>
                  </div>
                )}
                <button
                  onClick={handleClose}
                  className="mt-4 w-full py-2.5 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-sm font-semibold hover:bg-cyber-cyan/20 transition-colors"
                >
                  Done
                </button>
              </motion.div>
            ) : (
              <>
                <div className="flex gap-1 p-1 bg-bg rounded-lg mb-5">
                  {[['new', 'New Wallet'], ['import', 'Import Seed']].map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                        tab === id
                          ? 'bg-surface text-text-primary'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {tab === 'new' ? (
                  <div>
                    <p className="text-sm text-text-muted mb-4">
                      Generate a fresh XRPL testnet wallet. A seed phrase will be shown once — save it.
                    </p>
                    {error && <p className="text-xs text-cyber-pink mb-3">{error}</p>}
                    <button
                      onClick={handleCreate}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-sm font-semibold hover:bg-cyber-cyan/20 transition-colors disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
                      {loading ? 'Creating…' : 'Create Testnet Wallet'}
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-text-muted mb-4">
                      Enter your XRPL seed phrase to restore an existing wallet.
                    </p>
                    <div className="mb-4">
                      <label className="label flex items-center gap-1.5">
                        <Key size={12} /> Seed Phrase
                      </label>
                      <input
                        type="text"
                        value={seed}
                        onChange={(e) => setSeed(e.target.value)}
                        placeholder="sXXXX…"
                        className="input-field font-mono"
                      />
                    </div>
                    {error && <p className="text-xs text-cyber-pink mb-3">{error}</p>}
                    <button
                      onClick={handleImport}
                      disabled={loading || !seed.trim()}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-sm font-semibold hover:bg-cyber-cyan/20 transition-colors disabled:opacity-50"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                      {loading ? 'Importing…' : 'Import Wallet'}
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
