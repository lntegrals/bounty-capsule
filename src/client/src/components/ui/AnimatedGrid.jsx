import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export default function AnimatedGrid({ children, className = '' }) {
  const canvasRef = useRef(null)
  const mouse = useRef({ x: 0, y: 0 })
  const rafRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const CELL = 40
    let width, height, cols, rows

    const resize = () => {
      width = canvas.offsetWidth
      height = canvas.offsetHeight
      canvas.width = width
      canvas.height = height
      cols = Math.ceil(width / CELL)
      rows = Math.ceil(height / CELL)
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      for (let c = 0; c <= cols; c++) {
        for (let r = 0; r <= rows; r++) {
          const x = c * CELL
          const y = r * CELL
          const dx = x - mouse.current.x
          const dy = y - mouse.current.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const radius = 120
          const alpha = dist < radius ? (1 - dist / radius) * 0.6 : 0.08
          ctx.beginPath()
          ctx.arc(x, y, 1, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`
          ctx.fill()
        }
      }
      rafRef.current = requestAnimationFrame(draw)
    }

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    canvas.parentElement?.addEventListener('mousemove', onMouseMove)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
      canvas.parentElement?.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
      className={`relative ${className}`}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}
