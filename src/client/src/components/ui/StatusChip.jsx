const STATUS_MAP = {
  // Challenge statuses
  draft:      { label: 'Draft',      dot: 'bg-text-faint',   pill: 'bg-text-faint/10 text-text-muted border-text-faint/20' },
  funded:     { label: 'Funded',     dot: 'bg-cyber-cyan',   pill: 'bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/20' },
  open:       { label: 'Open',       dot: 'bg-cyber-cyan',   pill: 'bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/20' },
  reviewing:  { label: 'Reviewing',  dot: 'bg-amber-400',    pill: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  awarded:    { label: 'Awarded',    dot: 'bg-cyber-purple', pill: 'bg-cyber-purple/10 text-cyber-purple border-cyber-purple/20' },
  completed:  { label: 'Completed',  dot: 'bg-cyber-purple', pill: 'bg-cyber-purple/10 text-cyber-purple border-cyber-purple/20' },
  closed:     { label: 'Closed',     dot: 'bg-text-faint',   pill: 'bg-text-faint/10 text-text-muted border-text-faint/20' },
  // File statuses
  stored:     { label: 'Stored',     dot: 'bg-cyber-green',  pill: 'bg-cyber-green/10 text-cyber-green border-cyber-green/20' },
  restricted: { label: 'Restricted', dot: 'bg-amber-400',    pill: 'bg-amber-400/10 text-amber-400 border-amber-400/20' },
  uploading:  { label: 'Uploading',  dot: 'bg-blue-400',     pill: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
  // Payout statuses
  locked:     { label: 'Locked',     dot: 'bg-cyber-cyan',   pill: 'bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/20' },
  released:   { label: 'Released',   dot: 'bg-cyber-green',  pill: 'bg-cyber-green/10 text-cyber-green border-cyber-green/20' },
  expired:    { label: 'Expired',    dot: 'bg-cyber-pink',   pill: 'bg-cyber-pink/10 text-cyber-pink border-cyber-pink/20' },
}

export default function StatusChip({ status, className = '' }) {
  const s = STATUS_MAP[status?.toLowerCase()] || STATUS_MAP.draft
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.pill} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}
