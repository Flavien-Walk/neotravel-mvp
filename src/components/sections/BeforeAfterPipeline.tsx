'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Inbox, Phone, BellOff, Clock, MessageSquare,
  CheckCircle2, Zap, Send, Bell, ArrowRight,
} from 'lucide-react'

const EASE = [0.21, 0.47, 0.32, 0.98] as [number, number, number, number]

const CHAOS = [
  { Icon: Inbox,         text: 'Email perdu',         sub: 'jamais lu',      rot: -8, delay: 0.00 },
  { Icon: Phone,         text: 'Appel sans suite',     sub: 'pas de trace',   rot:  5, delay: 0.08 },
  { Icon: MessageSquare, text: 'WhatsApp ignoré',      sub: 'lu mais oublié', rot: -4, delay: 0.16 },
  { Icon: Clock,         text: 'Devis manuel 40 min',  sub: 'non traçable',   rot:  7, delay: 0.24 },
  { Icon: BellOff,       text: 'Relance oubliée',      sub: 'lead perdu',     rot: -5, delay: 0.32 },
]

const PIPELINE = [
  { Icon: Inbox,        label: 'Demande centralisée', color: '#60A5FA', delay: 0.00 },
  { Icon: Zap,          label: 'Qualification auto',  color: '#A78BFA', delay: 0.10 },
  { Icon: CheckCircle2, label: 'Devis calculé',       color: '#4ADE80', delay: 0.20 },
  { Icon: Send,         label: 'Email envoyé',        color: '#38BDF8', delay: 0.30 },
  { Icon: Bell,         label: 'Suivi automatique',   color: '#FCD34D', delay: 0.40 },
]

export default function BeforeAfterPipeline() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })

  return (
    <section
      id="avant-apres"
      className="relative overflow-hidden py-24 sm:py-32 px-4 sm:px-6"
      style={{ background: 'linear-gradient(160deg, #030D20 0%, #061435 50%, #030D20 100%)' }}
    >
      <div className="absolute inset-0 bg-grid-dark opacity-30 pointer-events-none" />
      <div
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.5), transparent)' }}
      />

      <div ref={ref} className="container-neo relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <span className="label-tag mb-5">Avant / Après</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-5 mb-5 leading-tight">
            Le désordre devient<br />
            <span className="text-gradient-blue">un pipeline structuré.</span>
          </h2>
          <p className="text-white/45 text-lg max-w-xl mx-auto">
            Sans outil dédié, chaque demande est une friction.
            NeoTravel transforme ce chaos en processus traçable — de la réception à la signature.
          </p>
        </motion.div>

        {/* Two panels */}
        <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-6 items-stretch">

          {/* ── BEFORE ─────────────────────────────────── */}
          <div className="flex flex-col">
            <div className="mb-5">
              <span
                className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#FCA5A5' }}
              >
                Avant NeoTravel
              </span>
            </div>

            <div
              className="flex-1 rounded-3xl p-6 relative overflow-hidden"
              style={{
                background: 'rgba(239,68,68,0.04)',
                border: '1px solid rgba(239,68,68,0.15)',
                minHeight: 360,
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                  background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(239,68,68,0.02) 4px, rgba(239,68,68,0.02) 8px)',
                }}
              />

              <div className="relative h-full flex flex-col gap-3 pt-2">
                {CHAOS.map(({ Icon, text, sub, rot, delay }) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.55, delay, ease: EASE }}
                    style={{
                      rotate: rot,
                      background: 'rgba(239,68,68,0.06)',
                      border: '1px solid rgba(239,68,68,0.15)',
                    }}
                    className="flex items-start gap-3 px-4 py-3 rounded-2xl"
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'rgba(239,68,68,0.12)' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: '#FCA5A5' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">{text}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(252,165,165,0.5)' }}>{sub}</p>
                    </div>
                    <div className="ml-auto flex-shrink-0">
                      <span className="text-[10px] font-bold" style={{ color: 'rgba(252,165,165,0.4)' }}>✕</span>
                    </div>
                  </motion.div>
                ))}

                {/* Outcome */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: 0.5, delay: 0.45, ease: EASE }}
                  className="mt-auto pt-4 border-t"
                  style={{ borderColor: 'rgba(239,68,68,0.15)' }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(252,165,165,0.5)' }}>Résultat</p>
                  <p className="text-sm text-white/35">Leads perdus · Devis jamais envoyés · Clients sans réponse</p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* ── DIVIDER ─────────────────────────────────── */}
          <div className="hidden lg:flex flex-col items-center justify-center gap-4 w-16">
            <div className="flex-1 w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(37,99,235,0.4), transparent)' }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
              transition={{ delay: 0.5, duration: 0.4, type: 'spring' as const, stiffness: 200 }}
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.35)' }}
            >
              <ArrowRight className="w-5 h-5 text-neo-blue" />
            </motion.div>
            <div className="flex-1 w-px" style={{ background: 'linear-gradient(to bottom, transparent, rgba(37,99,235,0.4), transparent)' }} />
          </div>

          {/* ── AFTER ──────────────────────────────────── */}
          <div className="flex flex-col">
            <div className="mb-5">
              <span
                className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.3)', color: '#93C5FD' }}
              >
                Avec NeoTravel
              </span>
            </div>

            <div
              className="flex-1 rounded-3xl p-6 relative overflow-hidden"
              style={{
                background: 'rgba(37,99,235,0.05)',
                border: '1px solid rgba(37,99,235,0.2)',
                minHeight: 360,
              }}
            >
              <div
                className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)' }}
              />
              {/* Connector line */}
              <div
                className="absolute left-[2.25rem] top-10 bottom-24 w-px"
                style={{ background: 'linear-gradient(to bottom, rgba(37,99,235,0.3), rgba(37,99,235,0.05))' }}
              />

              <div className="relative flex flex-col gap-2 pt-2">
                {PIPELINE.map(({ Icon, label, color, delay }) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                    transition={{ duration: 0.5, delay: delay + 0.2, ease: EASE }}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl relative z-10"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                    >
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <span className="text-sm font-medium text-white/80">{label}</span>
                    <div className="ml-auto flex-shrink-0">
                      <span className="text-[10px] font-bold" style={{ color: `${color}90` }}>✓</span>
                    </div>
                  </motion.div>
                ))}

                {/* Outcome */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                  transition={{ delay: 0.75, duration: 0.5, ease: EASE }}
                  className="mt-auto pt-4 border-t"
                  style={{ borderColor: 'rgba(37,99,235,0.15)' }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(96,165,250,0.6)' }}>Résultat</p>
                  <p className="text-sm text-white/50">Zéro lead perdu · Chaque devis traçable · Suivi en temps réel</p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.9, duration: 0.5, ease: EASE }}
          className="mt-12 grid grid-cols-3 gap-4 max-w-lg mx-auto"
        >
          {[
            { val: '< 2h',  label: 'Délai de réponse' },
            { val: '100%',  label: 'Demandes suivies' },
            { val: '0',     label: 'Calcul par IA' },
          ].map(({ val, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-bold text-gradient-blue">{val}</div>
              <div className="text-xs text-white/35 mt-1">{label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
