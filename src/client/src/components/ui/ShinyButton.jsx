import { motion } from 'framer-motion'

export default function ShinyButton({ children, onClick, disabled, className = '', size = 'md', variant = 'primary' }) {
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  }

  const variants = {
    primary: {
      base: 'bg-cyber-cyan/10 border-cyber-cyan/40 text-cyber-cyan hover:bg-cyber-cyan/20 hover:border-cyber-cyan/70',
      shine: 'from-transparent via-cyber-cyan/30 to-transparent',
    },
    ghost: {
      base: 'bg-transparent border-border text-text-muted hover:border-text-faint hover:text-text-primary',
      shine: 'from-transparent via-white/10 to-transparent',
    },
    danger: {
      base: 'bg-cyber-pink/10 border-cyber-pink/40 text-cyber-pink hover:bg-cyber-pink/20',
      shine: 'from-transparent via-cyber-pink/30 to-transparent',
    },
  }

  const v = variants[variant] || variants.primary

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`
        relative overflow-hidden rounded-lg border font-semibold
        transition-colors duration-200 cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed
        ${sizes[size]} ${v.base} ${className}
      `}
    >
      <span className="relative z-10">{children}</span>
      <span
        className={`
          absolute inset-0 bg-gradient-to-r ${v.shine}
          translate-x-[-100%] hover:translate-x-[100%]
          transition-transform duration-700 ease-in-out
        `}
        aria-hidden="true"
      />
    </motion.button>
  )
}
