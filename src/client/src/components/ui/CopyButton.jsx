import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useToast } from './Toast'

export default function CopyButton({ text, className = '' }) {
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast('Copied!', 'success')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast('Failed to copy', 'error')
    }
  }

  return (
    <button
      onClick={copy}
      title="Copy to clipboard"
      aria-label="Copy to clipboard"
      className={`text-text-faint hover:text-text-primary transition-colors ml-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyber-cyan/50 rounded ${className}`}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  )
}
