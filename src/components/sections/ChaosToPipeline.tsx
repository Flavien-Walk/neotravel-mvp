'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Inbox, Phone, MessageSquare, BellOff, FileSpreadsheet,
  Zap, CheckCircle2, Send, Bell, ArrowRight, Euro,
} from 'lucide-react'
import Link from 'next/link'

const EASE = [0.21, 0.47, 0.32, 0.98] as [number, number, number, number]

const CHAOS = [
  { Icon: Inbox,           text: 'Email non lu',       sub: 'jamais traité',   x: -148, y: -88,  rot: -13 },
  { Icon: Phone,           text: 'Appel sans suite',    sub: 'aucune trace',    x:  118, y: -68,  rot:   9 },
  { Icon: MessageSquare,   text: 'WhatsApp ignoré',     sub: 'lu, oublié',      x: -104, y:  38,  rot:  -7 },
  { Icon: BellOff,         text: 'Relance oubliée',     sub: 'lead perdu',      x:  132, y:  58,  rot:  12 },
  { Icon: FileSpreadsheet, text: 'Devis Excel 40 min',  sub: 'non traçable',    x:  -48, y: 112,  rot:  -9 },
]

const PIPELINE = [
  { Icon: Inbox, label: 'Demande centralisée', color: '#60A5FA' },
  { Icon: Zap,   label: 'Trajet qualifié',      color: '#A78BFA' },
  { Icon: Euro,  label: 'Prix calculé',         color: '#4ADE80' },
  { Icon: Send,  label: 'Devis envoyé',         color: '#38BDF8' },
  { Icon: Bell,  label: 'Suivi automatique',    color: '#FCD34D' },
]

export default function ChaosToPipeline() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const chaosOp = useTransform(scrollYProgress, [0.18, 0.42], [1, 0])
  const arrowOp = useTransform(scrollYProgress, [0.28, 0.46, 0.63], [0, 1, 0])
  const arrowSc = useTransform(scrollYProgress, [0.28, 0.46], [0.5, 1])
  const pipeOp  = useTransform(scrollYProgress, [0.44, 0.67], [0, 1])
  const pipeY   = useTransform(scrollYProgress, [0.44, 0.67], [44, 0])
  const statsOp = useTransform(scrollYProgress, [0.73, 0.90], [0, 1])
  const statsY  = useTransform(scrollYProgress, [0.73, 0.90], [20, 0])
  const hintOp  = useTransform(scrollYProgress, [0, 0.06], [1, 0])

  // Pipeline items — scroll-driven stagger, no state/events needed
  const pi0o = useTransform(scrollYProgress, [0.44,  0.54 ], [0, 1])
  const pi1o = useTransform(scrollYProgress, [0.462, 0.562], [0, 1])
  const pi2o = useTransform(scrollYProgress, [0.484, 0.584], [0, 1])
  const pi3o = useTransform(scrollYProgress, [0.506, 0.606], [0, 1])
  const pi4o = useTransform(scrollYProgress, [0.528, 0.628], [0, 1])
  const pi0x = useTransform(scrollYProgress, [0.44,  0.54 ], [-18, 0])
  const pi1x = useTransform(scrollYProgress, [0.462, 0.562], [-18, 0])
  const pi2x = useTransform(scrollYProgress, [0.484, 0.584], [-18, 0])
  const pi3x = useTransform(scrollYProgress, [0.506, 0.606], [-18, 0])
  const pi4x = useTransform(scrollYProgress, [0.528, 0.628], [-18, 0])

  const PIPE_OPS = [pi0o, pi1o, pi2o, pi3o, pi4o]
  const PIPE_XS  = [pi0x, pi1x, pi2x, pi3x, pi4x]

  return (
    <section
      ref={containerRef}
      id="avant-apres"
      style={{ height: '280vh' }}
      className="relative"
    >
      <div
        className="sticky top-0 h-screen overflow-hidden flex flex-col"
        style={{ background: 'linear-gradient(160deg, #030D20 0%, #061435 50%, #030D20 100%)' }}
      >
        {/* BG */}
        <div className="absolute inset-0 bg-grid-dark opacity-25 pointer-events-none" />
        <div
          className="absolute top-0 inset-x-0 h-px pointer-events-none"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.5), transparent)' }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(37,99,235,0.05) 0%, transparent 70%)' }}
        />

        <div className="flex-1 flex flex-col justify-center container-neo px-4 sm:px-6 relative z-10">

          {/* Header */}
          <div className="text-center mb-8">
            <span className="label-tag mb-4">Avant / Après</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-4 mb-3 leading-tight">
              Du chaos au pipeline.<br />
              <span className="text-gradient-blue">En un seul outil.</span>
            </h2>
            <p className="text-white/38 text-base max-w-md mx-auto">
              Faites défiler pour voir comment NeoTravel transforme vos demandes éparpillées.
            </p>
          </div>

          {/* Animation stage */}
          <div
            className="relative flex items-center justify-center mx-auto"
            style={{ height: 300, width: '100%', maxWidth: 540 }}
          >

            {/* ── CHAOS ── */}
            <motion.div
              style={{ opacity: chaosOp }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div
                className="absolute rounded-full pointer-events-none"
                style={{
                  inset: '8%',
                  background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.08) 0%, transparent 70%)',
                }}
              />
              {CHAOS.map(({ Icon, text, sub, x, y, rot }, i) => (
                <motion.div
                  key={text}
                  className="absolute flex items-center gap-3 px-3.5 py-2.5 rounded-2xl select-none"
                  style={{
                    left:           `calc(50% + ${x}px)`,
                    top:            `calc(50% + ${y}px)`,
                    translate:      '-50% -50%',
                    rotate:         rot,
                    background:     'rgba(239,68,68,0.07)',
                    border:         '1px solid rgba(239,68,68,0.2)',
                    backdropFilter: 'blur(10px)',
                  }}
                  animate={{
                    y:      [0, -4 - i * 1.4, 0, 3 + i * 0.8, 0],
                    rotate: [rot, rot + 2, rot, rot - 1.5, rot],
                  }}
                  transition={{
                    repeat:   Infinity,
                    duration: 3.5 + i * 0.7,
                    ease:     'easeInOut',
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(239,68,68,0.15)' }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color: '#FCA5A5' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/75 whitespace-nowrap">{text}</p>
                    <p className="text-[10px] whitespace-nowrap" style={{ color: 'rgba(252,165,165,0.45)' }}>{sub}</p>
                  </div>
                  <span className="ml-1 text-[10px] flex-shrink-0" style={{ color: 'rgba(252,165,165,0.3)' }}>✕</span>
                </motion.div>
              ))}
            </motion.div>

            {/* ── TRANSFORMATION ARROW ── */}
            <motion.div
              style={{ opacity: arrowOp, scale: arrowSc }}
              className="absolute z-20 flex flex-col items-center gap-2 pointer-events-none"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(37,99,235,0.2)',
                  border:     '1px solid rgba(37,99,235,0.5)',
                  boxShadow:  '0 0 40px rgba(37,99,235,0.35), 0 0 80px rgba(37,99,235,0.1)',
                }}
              >
                <ArrowRight className="w-7 h-7 text-neo-blue" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">NeoTravel</span>
            </motion.div>

            {/* ── PIPELINE — scroll-driven opacity per item ── */}
            <motion.div
              style={{ opacity: pipeOp, y: pipeY }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div
                className="absolute rounded-full pointer-events-none"
                style={{
                  inset:      '5%',
                  background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.09) 0%, transparent 70%)',
                }}
              />
              <div className="relative flex flex-col gap-2.5" style={{ width: 320 }}>
                {/* Connector line */}
                <div
                  className="absolute z-0 pointer-events-none"
                  style={{
                    left:       26,
                    top:        18,
                    bottom:     18,
                    width:      1,
                    background: 'linear-gradient(to bottom, rgba(96,165,250,0.5), rgba(252,211,77,0.5))',
                  }}
                />
                {PIPELINE.map(({ Icon, label, color }, i) => (
                  <motion.div
                    key={label}
                    style={{
                      opacity:    PIPE_OPS[i],
                      x:          PIPE_XS[i],
                      background: 'rgba(255,255,255,0.04)',
                      border:     `1px solid ${color}22`,
                    }}
                    className="relative z-10 flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}18`, border: `1px solid ${color}30` }}
                    >
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <span className="text-sm font-medium text-white/80">{label}</span>
                    <CheckCircle2 className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: `${color}80` }} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            style={{ opacity: statsOp, y: statsY }}
            className="grid grid-cols-3 gap-4 max-w-sm mx-auto mt-6"
          >
            {[
              { val: '< 2h',  label: 'Délai de réponse' },
              { val: '100%',  label: 'Demandes trackées' },
              { val: '0',     label: 'Prix estimé par IA' },
            ].map(({ val, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gradient-blue">{val}</div>
                <div className="text-xs text-white/30 mt-1 leading-tight">{label}</div>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            style={{ opacity: statsOp }}
            className="flex justify-center mt-6"
          >
            <Link href="/devis" className="btn-gold gap-2">
              Démarrer maintenant
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          style={{ opacity: hintOp }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none"
        >
          <span className="text-[9px] uppercase tracking-widest text-white/20">Faites défiler</span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="w-px h-5"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)' }}
          />
        </motion.div>
      </div>
    </section>
  )
}
