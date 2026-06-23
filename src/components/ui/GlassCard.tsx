'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  hover?: boolean
  glow?: 'blue' | 'gold' | 'none'
}

export default function GlassCard({ children, className = '', hover = true, glow = 'none' }: Props) {
  const glowClass = glow === 'blue' ? 'hover:glow-blue' : glow === 'gold' ? 'hover:glow-gold' : ''

  return (
    <motion.div
      className={`card-premium ${glowClass} ${className}`}
      whileHover={hover ? { y: -4, transition: { duration: 0.2, ease: 'easeOut' } } : undefined}
    >
      {children}
    </motion.div>
  )
}
