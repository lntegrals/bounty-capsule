import { ExternalLink, Package } from 'lucide-react'
import CopyButton from './CopyButton'

export default function CapsuleManifest({ cid, fileCount = 0, label = 'Capsule' }) {
  if (!cid) return null

  const short = `${cid.slice(0, 10)}…${cid.slice(-6)}`
  const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`

  return (
    <div className="p-4 bg-bg rounded-xl border border-border space-y-3">
      <div className="flex items-center gap-2">
        <Package size={13} className="text-text-muted" />
        <p className="text-xs font-semibold text-text-primary">{label} on IPFS</p>
      </div>

      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-text-faint">CID</p>
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs text-text-muted break-all">{short}</span>
          <CopyButton text={cid} />
          <a
            href={gatewayUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View on IPFS gateway"
            className="text-cyber-cyan hover:text-cyber-cyan/80 transition-colors ml-0.5"
          >
            <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {fileCount > 0 && (
        <p className="text-[10px] text-text-faint">{fileCount} file{fileCount !== 1 ? 's' : ''} pinned</p>
      )}
    </div>
  )
}
