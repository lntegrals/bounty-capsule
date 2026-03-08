import { motion } from 'framer-motion'
import { Eye, Download, Check } from 'lucide-react'

export default function SubmissionCard({ submission, selected, onSelect, showSelect = false }) {
  const { solverName, description, submittedAt, files = [] } = submission || {}
  const initial = (solverName || 'A')[0].toUpperCase()

  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      onClick={onSelect}
      className={`
        relative p-5 rounded-xl border transition-all duration-200
        ${showSelect ? 'cursor-pointer' : ''}
        ${selected
          ? 'bg-cyber-cyan/5 border-cyber-cyan/40 cyber-glow'
          : 'bg-surface border-border hover:border-text-faint/40'
        }
      `}
    >
      {selected && (
        <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-cyber-cyan flex items-center justify-center">
          <Check size={12} className="text-bg" />
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center text-cyber-cyan font-bold text-sm">
          {initial}
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">{solverName || 'Anonymous'}</p>
          <p className="text-xs text-text-muted">
            {submittedAt ? new Date(submittedAt).toLocaleString() : '—'}
          </p>
        </div>
      </div>

      <p className="text-sm text-text-muted leading-relaxed mb-4">{description}</p>

      {files.length > 0 && (
        <p className="text-xs text-text-faint mb-3">{files.length} file{files.length !== 1 ? 's' : ''} attached</p>
      )}

      <div className="flex gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted border border-border rounded-lg hover:text-text-primary hover:border-text-faint/40 transition-colors">
          <Eye size={12} /> Open capsule
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-muted border border-border rounded-lg hover:text-text-primary hover:border-text-faint/40 transition-colors">
          <Download size={12} /> Download
        </button>
      </div>
    </motion.div>
  )
}
