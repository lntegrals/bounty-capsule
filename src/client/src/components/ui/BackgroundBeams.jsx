import { motion } from 'framer-motion'

export default function BackgroundBeams() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0"
      >
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1440 800"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="beam1" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="beam2" cx="20%" cy="80%" r="40%">
              <stop offset="0%" stopColor="#7000FF" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#7000FF" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="beam3" cx="80%" cy="60%" r="35%">
              <stop offset="0%" stopColor="#00FFA3" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#00FFA3" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#beam1)" />
          <rect width="100%" height="100%" fill="url(#beam2)" />
          <rect width="100%" height="100%" fill="url(#beam3)" />
          {/* Diagonal beam lines */}
          <line x1="0" y1="200" x2="1440" y2="600" stroke="#00F0FF" strokeOpacity="0.03" strokeWidth="1" />
          <line x1="0" y1="400" x2="1440" y2="100" stroke="#7000FF" strokeOpacity="0.03" strokeWidth="1" />
          <line x1="200" y1="0" x2="800" y2="800" stroke="#00F0FF" strokeOpacity="0.02" strokeWidth="1" />
        </svg>
      </motion.div>
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, #1A1A24 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  )
}
