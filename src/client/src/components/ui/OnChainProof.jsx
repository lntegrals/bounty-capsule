import { ExternalLink } from 'lucide-react'
import CopyButton from './CopyButton'

function TxRow({ label, hash, explorerBase }) {
  if (!hash) return null
  const short = `${hash.slice(0, 8)}…${hash.slice(-6)}`
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-wider text-text-faint" title={label}>{label}</p>
      <div className="flex items-center gap-1">
        <span className="font-mono text-xs text-text-muted">{short}</span>
        <CopyButton text={hash} />
        <a
          href={`${explorerBase}/${hash}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${label} on XRPL explorer`}
          className="text-cyber-cyan hover:text-cyber-cyan/80 transition-colors ml-0.5"
        >
          <ExternalLink size={11} />
        </a>
      </div>
    </div>
  )
}

export default function OnChainProof({ challenge }) {
  if (!challenge) return null

  const { escrowTxHash, payoutTxHash, escrowSequence, status } = challenge
  const explorerBase = 'https://testnet.xrpl.org/transactions'

  const escrowStatus = payoutTxHash ? 'released' : escrowSequence ? 'locked' : 'draft'
  const chipColor = {
    locked: 'bg-amber-400/10 border-amber-400/30 text-amber-400',
    released: 'bg-cyber-green/10 border-cyber-green/30 text-cyber-green',
    draft: 'bg-text-faint/10 border-border text-text-faint',
  }[escrowStatus]

  if (!escrowTxHash && !payoutTxHash && !escrowSequence) return null

  return (
    <div className="p-4 bg-bg rounded-xl border border-border space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-text-primary">On-Chain Proof</p>
        <span className="text-[10px] text-text-faint px-2 py-0.5 rounded border border-border bg-surface">
          XRPL Testnet
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${chipColor}`}>
          {escrowStatus === 'locked' ? 'Locked' : escrowStatus === 'released' ? 'Released' : 'Draft'}
        </span>
        {escrowSequence && (
          <span className="text-[10px] text-text-faint">seq #{escrowSequence}</span>
        )}
      </div>

      <TxRow label="Escrow Tx" hash={escrowTxHash} explorerBase={explorerBase} />
      {payoutTxHash && <TxRow label="Payout Tx" hash={payoutTxHash} explorerBase={explorerBase} />}
    </div>
  )
}
