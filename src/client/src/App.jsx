import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell'
import Landing from './pages/Landing'
import ChallengeIndex from './pages/ChallengeIndex'
import CreateChallenge from './pages/CreateChallenge'
import ChallengeDetail from './pages/ChallengeDetail'
import ReviewPage from './pages/ReviewPage'
import SubmitSolution from './pages/SubmitSolution'
import DemoTour from './components/DemoTour'

const API = '/api'

export default function App() {
  const [wallet, setWallet] = useState(null)
  const [challenges, setChallenges] = useState([])
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const [tourActive, setTourActive] = useState(false)

  useEffect(() => {
    const savedSeed = localStorage.getItem('bounty_seed')
    if (savedSeed) loadWallet(savedSeed)
    fetchChallenges()
  }, [])

  const loadWallet = async (seed) => {
    try {
      const res = await fetch(`${API}/wallet/from-seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed }),
      })
      const data = await res.json()
      setWallet({ seed, ...data })
    } catch (e) {
      console.error(e)
    }
  }

  const createWallet = async () => {
    const res = await fetch(`${API}/wallet/create`, { method: 'POST' })
    const data = await res.json()
    setWallet(data)
    localStorage.setItem('bounty_seed', data.seed)
    return data
  }

  const fetchChallenges = async () => {
    try {
      const res = await fetch(`${API}/challenges`)
      const data = await res.json()
      setChallenges(data.challenges || [])
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <BrowserRouter>
      <AppShell
        wallet={wallet}
        onCreateWallet={createWallet}
        onLoadWallet={loadWallet}
        walletModalOpen={walletModalOpen}
        onOpenWalletModal={() => setWalletModalOpen(true)}
        onCloseWalletModal={() => setWalletModalOpen(false)}
        onStartTour={() => setTourActive(true)}
      >
        <Routes>
          <Route path="/" element={<Landing challenges={challenges} onStartTour={() => setTourActive(true)} />} />
          <Route path="/challenges" element={<ChallengeIndex challenges={challenges} onRefresh={fetchChallenges} wallet={wallet} />} />
          <Route path="/challenges/new" element={<CreateChallenge wallet={wallet} onSuccess={fetchChallenges} onConnectWallet={() => setWalletModalOpen(true)} />} />
          <Route path="/challenges/:id" element={<ChallengeDetail wallet={wallet} />} />
          <Route path="/challenges/:id/review" element={<ReviewPage wallet={wallet} />} />
          <Route path="/challenges/:id/submit" element={<SubmitSolution wallet={wallet} />} />
        </Routes>
      </AppShell>

      {tourActive && (
        <DemoTour
          onOpenWalletModal={() => setWalletModalOpen(true)}
          onClose={() => setTourActive(false)}
        />
      )}
    </BrowserRouter>
  )
}
