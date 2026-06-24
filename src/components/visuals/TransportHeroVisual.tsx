'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Inbox, CheckSquare, Zap, Euro, Mail, Bell } from 'lucide-react'

// French cities — geographically coherent (SVG viewBox 0 0 350 280)
const CITIES = [
  { id: 'lille',      label: 'Lille',      x: 198, y: 18,  onRoute: false },
  { id: 'paris',      label: 'Paris',      x: 183, y: 75,  onRoute: true  },
  { id: 'strasbourg', label: 'Strasbourg', x: 308, y: 82,  onRoute: false },
  { id: 'nantes',     label: 'Nantes',     x: 80,  y: 128, onRoute: false },
  { id: 'bordeaux',   label: 'Bordeaux',   x: 98,  y: 205, onRoute: false },
  { id: 'lyon',       label: 'Lyon',       x: 245, y: 178, onRoute: true  },
  { id: 'nice',       label: 'Nice',       x: 300, y: 222, onRoute: true  },
]

// Bus position per pipeline phase (moves along Paris → Lyon → Nice)
const BUS = [
  { x: 183, y: 75  }, // 0 — Paris  (demande reçue)
  { x: 183, y: 75  }, // 1 — Paris  (qualifié)
  { x: 214, y: 126 }, // 2 — route  (calcul en cours)
  { x: 245, y: 178 }, // 3 — Lyon   (devis prêt)
  { x: 272, y: 200 }, // 4 — route  (email envoyé)
  { x: 300, y: 222 }, // 5 — Nice   (suivi activé)
]

const PHASES = [
  { Icon: Inbox,       label: 'Demande reçue',    color: '#60A5FA', detail: 'Paris → Nice · 28 passagers · Aller-retour'            },
  { Icon: CheckSquare, label: 'Dossier qualifié',  color: '#A78BFA', detail: 'Trajet vérifié · 932 km · Données complètes'           },
  { Icon: Zap,         label: 'Calcul du devis',   color: '#FCD34D', detail: 'Moteur métier NeoTravel · règles tarifaires explicites' },
  { Icon: Euro,        label: 'Devis calculé',     color: '#4ADE80', detail: '2 340 € HT · 2 574 € TTC · détail ligne par ligne'    },
  { Icon: Mail,        label: 'Email envoyé',      color: '#38BDF8', detail: 'Client notifié · lien de suivi inclus dans l\'email'   },
  { Icon: Bell,        label: 'Suivi activé',      color: '#FB923C', detail: 'Tracking temps réel · relance automatique J+3'         },
]

export default function TransportHeroVisual() {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setPhase(p => (p + 1) % PHASES.length), 2500)
    return () => clearInterval(id)
  }, [])

  const cur   = PHASES[phase]
  const bus   = BUS[phase]
  const showA = phase >= 2   // Paris → Lyon segment visible
  const showB = phase >= 4   // Lyon  → Nice segment visible
  const routeSet = new Set(['paris', 'lyon', 'nice'])

  return (
    <div className="relative h-full w-full select-none">

      {/* Subtle card border */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ background: 'rgba(255,255,255,0.012)', border: '1px solid rgba(255,255,255,0.07)' }}
      />

      {/* ── Route badge (top-center) ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2 rounded-full glass whitespace-nowrap"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
        <span className="text-xs font-semibold text-white/80">Paris → Nice</span>
        <span className="w-px h-3 bg-white/15 flex-shrink-0" />
        <span className="text-xs text-white/40">28 passagers</span>
      </motion.div>

      {/* ── SVG Map ──────────────────────────────────────────── */}
      <svg
        viewBox="0 0 350 280"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        {/* Background city dots */}
        {CITIES.filter(c => !routeSet.has(c.id)).map(({ id, label, x, y }) => (
          <g key={id}>
            <circle cx={x} cy={y} r="3" fill="rgba(37,99,235,0.22)" />
            <text
              x={x + 5} y={y + 4}
              fill="rgba(255,255,255,0.18)"
              fontSize="8.5"
              fontFamily="system-ui,-apple-system,sans-serif"
            >
              {label}
            </text>
          </g>
        ))}

        {/* Route dashed background line */}
        <path
          d="M 183 75 L 245 178 L 300 222"
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />

        {/* Segment A: Paris → Lyon */}
        <motion.path
          d="M 183 75 L 245 178"
          fill="none"
          strokeLinecap="round"
          animate={{
            pathLength:    showA ? 1 : 0,
            strokeOpacity: showA ? 0.8 : 0,
          }}
          style={{ stroke: cur.color, strokeWidth: 2 }}
          initial={{ pathLength: 0, strokeOpacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {/* Segment B: Lyon → Nice */}
        <motion.path
          d="M 245 178 L 300 222"
          fill="none"
          strokeLinecap="round"
          animate={{
            pathLength:    showB ? 1 : 0,
            strokeOpacity: showB ? 0.8 : 0,
          }}
          style={{ stroke: cur.color, strokeWidth: 2 }}
          initial={{ pathLength: 0, strokeOpacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />

        {/* Nice — destination */}
        <g opacity={phase >= 4 ? 1 : 0.35}>
          <circle cx={300} cy={222} r="9"
            fill="rgba(37,99,235,0.12)"
            stroke={phase >= 4 ? cur.color : 'rgba(37,99,235,0.35)'}
            strokeWidth="1"
          />
          <circle cx={300} cy={222} r="4.5"
            fill={phase >= 4 ? cur.color : '#1D4ED8'}
          />
          <text x={312} y={226}
            fill={phase >= 4 ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.2)'}
            fontSize="9.5" fontFamily="system-ui,-apple-system,sans-serif"
            fontWeight={phase >= 4 ? '600' : '400'}
          >Nice</text>
        </g>

        {/* Lyon — via */}
        <g opacity={phase >= 2 ? 1 : 0.35}>
          <circle cx={245} cy={178} r="9"
            fill="rgba(37,99,235,0.12)"
            stroke={phase >= 2 ? cur.color : 'rgba(37,99,235,0.35)'}
            strokeWidth="1"
          />
          <circle cx={245} cy={178} r="4.5"
            fill={phase >= 2 ? cur.color : '#1D4ED8'}
          />
          <text x={257} y={182}
            fill={phase >= 2 ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.2)'}
            fontSize="9.5" fontFamily="system-ui,-apple-system,sans-serif"
            fontWeight={phase >= 2 ? '600' : '400'}
          >Lyon</text>
        </g>

        {/* Paris — origin (always active) */}
        {phase === 0 && (
          <circle cx={183} cy={75} r="12" fill="none" stroke={cur.color} strokeWidth="0.8">
            <animate attributeName="r"       values="12;22;12"    dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.35;0;0.35" dur="1.5s" repeatCount="indefinite" />
          </circle>
        )}
        <circle cx={183} cy={75} r="11"
          fill="rgba(37,99,235,0.18)"
          stroke={cur.color}
          strokeWidth="1.2"
        />
        <circle cx={183} cy={75} r="5.5" fill={cur.color} />
        <text x={197} y={79}
          fill="rgba(255,255,255,0.88)"
          fontSize="10" fontFamily="system-ui,-apple-system,sans-serif" fontWeight="600"
        >Paris</text>

        {/* Bus — moves along route with phase */}
        <motion.g
          initial={{ x: 183, y: 75 }}
          animate={{ x: bus.x, y: bus.y }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        >
          {/* Outer glow ring */}
          <circle cx={0} cy={0} r="15" fill="rgba(37,99,235,0.10)" />
          {/* Bus body */}
          <rect x="-9" y="-5.5" width="18" height="11" rx="3.5" fill="#1E40AF" />
          <rect x="-7" y="-8" width="14" height="5" rx="2.5" fill="#2563EB" />
          {/* Windows */}
          <rect x="-6" y="-4.5" width="4.5" height="3" rx="1" fill="rgba(255,255,255,0.55)" />
          <rect x="1.5" y="-4.5" width="4.5" height="3" rx="1" fill="rgba(255,255,255,0.55)" />
          {/* Wheels */}
          <circle cx="-5" cy="6.5" r="2.5" fill="#030D20" />
          <circle cx="5"  cy="6.5" r="2.5" fill="#030D20" />
          {/* Glow border */}
          <circle cx={0} cy={0} r="15" fill="none" stroke="rgba(37,99,235,0.35)" strokeWidth="1" />
        </motion.g>
      </svg>

      {/* ── Phase info card (bottom) ─────────────────────────── */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <div
          className="rounded-2xl px-4 py-3.5"
          style={{
            background:    'rgba(3,13,32,0.90)',
            border:        '1px solid rgba(37,99,235,0.18)',
            backdropFilter:'blur(14px)',
          }}
        >
          {/* Title row */}
          <div className="flex items-center justify-between mb-1.5">
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-2"
              >
                <cur.Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cur.color }} />
                <span className="text-xs font-bold" style={{ color: cur.color }}>
                  {cur.label}
                </span>
              </motion.div>
            </AnimatePresence>
            <span className="text-[10px] text-white/25 tabular-nums">
              {phase + 1}&thinsp;/&thinsp;{PHASES.length}
            </span>
          </div>

          {/* Detail line */}
          <AnimatePresence mode="wait">
            <motion.p
              key={`d${phase}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[11px] text-white/45 leading-relaxed mb-2.5"
            >
              {cur.detail}
            </motion.p>
          </AnimatePresence>

          {/* Progress pills */}
          <div className="flex gap-1.5">
            {PHASES.map((p, i) => (
              <div
                key={i}
                className="h-[3px] rounded-full transition-all duration-300"
                style={{
                  flex:       i === phase ? 3 : 1,
                  background: i < phase
                    ? `${p.color}55`
                    : i === phase
                    ? cur.color
                    : 'rgba(255,255,255,0.1)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
