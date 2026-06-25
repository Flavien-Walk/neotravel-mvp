'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { MapPin, Users, Clock, Settings2, Receipt, Percent, UserCheck, Lock } from 'lucide-react'

const FORMULA_ROWS = [
  { icon: MapPin,    label: 'Distance',        value: '284 km', color: '#60A5FA' },
  { icon: Clock,     label: 'Durée estimée',   value: '3h 20',  color: '#A78BFA' },
  { icon: Users,     label: 'Passagers',        value: '48 pax', color: '#4ADE80' },
  { icon: Settings2, label: 'Options',          value: 'Wi-Fi, clim, WC', color: '#38BDF8' },
  { icon: Receipt,   label: 'Péages',           value: '62 €',   color: '#FCD34D' },
  { icon: Percent,   label: 'TVA 10%',          value: 'incluse', color: '#FB923C' },
]

const PILLARS = [
  {
    icon: Lock,
    title: 'Déterministe',
    desc: 'Même trajet, mêmes passagers, mêmes options → toujours le même prix. Zéro variabilité.',
  },
  {
    icon: Receipt,
    title: 'Ligne par ligne',
    desc: 'Distance, péages, coefficient nuit/week-end, TVA — vous voyez comment chaque centime est composé.',
  },
  {
    icon: UserCheck,
    title: 'Reprise humaine',
    desc: 'Cas complexe ? Le système flagge. Un conseiller NeoTravel prend le relais et vous contacte.',
  },
]

const stagger = {
  animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const EASE = [0.21, 0.47, 0.32, 0.98] as [number, number, number, number]

const item = {
  initial: { opacity: 0, x: -16 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } },
}

export default function TraceableQuoteSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-8% 0px' })

  return (
    <section
      id="fiabilite"
      className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden"
      style={{ background: '#FFFFFF' }}
    >
      {/* Grid */}
      <div className="absolute inset-0 bg-grid-dark opacity-30 pointer-events-none" />

      {/* Top glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top, rgba(37,99,235,0.06) 0%, transparent 70%)' }}
      />

      <div ref={ref} className="container-neo relative z-10">

        {/* Big quote — center */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="text-center mb-20"
        >
          <span className="label-tag mb-6">Calcul traçable</span>

          {/* The iconic quote */}
          <blockquote className="mt-6 mb-6">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight max-w-3xl mx-auto" style={{ color: '#0F172A' }}>
              &ldquo;L&apos;agent collecte et orchestre,{' '}
              <span className="text-gradient-blue">le code calcule.&rdquo;</span>
            </p>
          </blockquote>
          <p className="text-base max-w-lg mx-auto" style={{ color: '#64748B' }}>
            L&apos;IA ne génère jamais un prix. La fonction{' '}
            <code className="font-mono text-sm px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.07)', color: '#93C5FD' }}>
              calculer_devis()
            </code>{' '}
            applique des règles métier explicites, auditables et reproductibles.
          </p>
        </motion.div>

        {/* Split layout */}
        <div className="grid lg:grid-cols-[1fr_420px] gap-10 lg:gap-16 items-start">

          {/* ── Left: calculation formula ─────────── */}
          <motion.div
            variants={stagger}
            initial="initial"
            animate={inView ? 'animate' : 'initial'}
          >
            {/* Mock calculation card */}
            <div
              className="rounded-3xl overflow-hidden"
              style={{ border: '1px solid #BFDBFE', background: '#FFFFFF', boxShadow: '0 4px 24px rgba(37,99,235,0.08)' }}
            >
              {/* Card header */}
              <div
                className="px-6 py-4 flex items-center gap-3"
                style={{ borderBottom: '1px solid #DBEAFE', background: '#EFF6FF' }}
              >
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(239,68,68,0.5)' }} />
                  <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(245,158,11,0.5)' }} />
                  <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(74,222,128,0.5)' }} />
                </div>
                <span className="text-xs font-mono text-white/30 mx-auto">calculer_devis() — NeoTravel Engine v2</span>
              </div>

              <div className="p-6">
                {/* Input row */}
                <p className="text-xs text-white/30 uppercase tracking-wider mb-4 font-semibold">Paramètres d&apos;entrée</p>
                <motion.div className="space-y-2" variants={stagger}>
                  {FORMULA_ROWS.map(({ icon: Icon, label, value, color }) => (
                    <motion.div
                      key={label}
                      variants={item}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}15` }}
                      >
                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <span className="text-sm flex-1" style={{ color: '#475569' }}>{label}</span>
                      <span className="text-sm font-mono font-semibold" style={{ color: '#1D4ED8' }}>{value}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Divider */}
                <div
                  className="my-5 h-px"
                  style={{ background: 'linear-gradient(90deg, transparent, #BFDBFE, transparent)' }}
                />

                {/* Output */}
                <p className="text-xs uppercase tracking-wider mb-3 font-semibold" style={{ color: '#64748B' }}>Résultat calculé</p>
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.65, duration: 0.5 }}
                  className="flex items-center justify-between px-5 py-4 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(37,99,235,0.06) 100%)',
                    border: '1px solid rgba(37,99,235,0.3)',
                  }}
                >
                  <div>
                    <p className="text-xs text-white/40 mb-0.5">Devis HT</p>
                    <p className="text-3xl font-bold text-white">2 340 <span className="text-lg text-white/60">€</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40 mb-0.5">Statut</p>
                    <span
                      className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{ background: 'rgba(74,222,128,0.15)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.25)' }}
                    >
                      Prêt à envoyer
                    </span>
                  </div>
                </motion.div>

                {/* Disclaimer */}
                <p className="text-[11px] text-white/25 mt-4 text-center">
                  Simulation basée sur les règles métier NeoTravel · Le prix réel est calculé à la soumission
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── Right: trust pillars ──────────────── */}
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.25, duration: 0.55 }}
            >
              <h3 className="text-2xl font-bold text-white mb-2">Chaque centime est justifiable.</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Demandez à n&apos;importe quel conseiller NeoTravel de vous expliquer votre devis.
                Il peut l&apos;ouvrir, montrer chaque ligne, et justifier chaque montant.
              </p>
            </motion.div>

            {PILLARS.map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: 24 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.35 + i * 0.1, duration: 0.55 }}
                className="flex gap-4 p-5 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.2)' }}
                >
                  <Icon className="w-5 h-5 text-neo-blue" />
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-1">{title}</h4>
                  <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}

            {/* Alert: jamais par IA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="p-5 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(252,211,77,0.08) 0%, rgba(252,211,77,0.03) 100%)',
                border: '1px solid rgba(252,211,77,0.2)',
              }}
            >
              <p className="text-sm font-semibold text-yellow-300 mb-1">Jamais de prix estimé par IA</p>
              <p className="text-xs text-white/40 leading-relaxed">
                L&apos;IA peut structurer une demande. Le prix est calculé par{' '}
                <code className="font-mono px-1 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.07)', color: '#93C5FD' }}>
                  calculer_devis()
                </code>{' '}
                — selon des règles tarifaires explicites, pas des probabilités.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
