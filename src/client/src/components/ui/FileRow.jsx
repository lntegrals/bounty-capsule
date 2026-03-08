import { FileText, Download, Lock } from 'lucide-react'
import StatusChip from './StatusChip'

export default function FileRow({ file }) {
  const { name, size, type, visibility = 'stored' } = file || {}

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-bg border border-border rounded-lg group hover:border-text-faint/40 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded bg-surface border border-border">
        <FileText size={14} className="text-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">{name || 'Unknown file'}</p>
        <p className="text-xs text-text-muted">{type || 'file'}{size ? ` · ${size}` : ''}</p>
      </div>
      <StatusChip status={visibility} />
      <button className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-surface text-text-muted hover:text-text-primary">
        {visibility === 'restricted' ? <Lock size={14} /> : <Download size={14} />}
      </button>
    </div>
  )
}
