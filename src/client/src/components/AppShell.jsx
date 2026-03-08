import { Link, useLocation } from 'react-router-dom'
import { Wallet, ChevronDown } from 'lucide-react'
import WalletModal from './ui/WalletModal'
import { ToastProvider } from './ui/Toast'

export default function AppShell({ children, wallet, onCreateWallet, onLoadWallet, walletModalOpen, onOpenWalletModal, onCloseWalletModal }) {
  const location = useLocation()

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path))

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-bg">
        {/* Nav */}
        <header className="sticky top-0 z-40 bg-bg/90 backdrop-blur-md border-b border-border">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Wordmark */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center">
                <div className="w-3 h-3 rounded-sm bg-cyber-cyan" />
              </div>
              <span className="text-base font-bold tracking-tight text-text-primary">BountyCapsule</span>
            </Link>

            {/* Nav links + wallet */}
            <div className="flex items-center gap-6">
              <nav className="hidden sm:flex items-center gap-1">
                {[
                  { to: '/challenges', label: 'Browse' },
                  { to: '/challenges/new', label: 'Create' },
                ].map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive(to)
                        ? 'text-text-primary bg-surface'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </nav>

              {wallet ? (
                <button
                  onClick={onOpenWalletModal}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyber-cyan/5 border border-cyber-cyan/20 text-cyber-cyan text-xs font-mono hover:bg-cyber-cyan/10 transition-colors"
                >
                  <Wallet size={13} />
                  {wallet.address?.slice(0, 8)}…{wallet.address?.slice(-4)}
                  <ChevronDown size={12} className="text-cyber-cyan/50" />
                </button>
              ) : (
                <button
                  onClick={onOpenWalletModal}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-sm font-semibold hover:bg-cyber-cyan/20 transition-colors"
                >
                  <Wallet size={14} />
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
          {children}
        </main>

        <WalletModal
          open={walletModalOpen}
          onClose={onCloseWalletModal}
          onCreateWallet={onCreateWallet}
          onLoadWallet={onLoadWallet}
        />
      </div>
    </ToastProvider>
  )
}
