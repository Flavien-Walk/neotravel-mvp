'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Inbox, CheckSquare, Zap, Euro, Mail, Bell } from 'lucide-react'

const CITIES = [
  { id: 'paris',     label: 'Paris',     x: 200, y: 65  },
  { id: 'lyon',      label: 'Lyon',      x: 258, y: 188 },
  { id: 'marseille', label: 'Marseille', x: 265, y: 295 },
  { id: 'bordeaux',  label: 'Bordeaux',  x: 105, y: 248 },
  { id: 'toulouse',  label: 'Toulouse',  x: 155, y: 298 },
  { id: 'nice',      label: 'Nice',      x: 318, y: 280 },
]

type PhaseInfo = {
  cityId: string
  Icon: React.FC<{ className?: string }>
  title: string
  desc: string
  svgColor: string
  colorCls: string
}

const PHASES: PhaseInfo[] = [
  { cityId: 'paris',     Icon: Inbox,       title: 'Demande reçue',     desc: 'Paris → Nice · 28 passagers',       svgColor: '#60A5FA', colorCls: 'text-blue-400'   },
  { cityId: 'lyon',      Icon: CheckSquare, title: 'Dossier qualifié',  desc: 'Trajet vérifié · Score 94 %',       svgColor: '#A78BFA', colorCls: 'text-violet-400' },
  { cityId: 'marseille', Icon: Zap,         title: 'Calcul du devis',   desc: 'Moteur métier — règles tarifaires', svgColor: '#FCD34D', colorCls: 'text-amber-400'  },
  { cityId: 'bordeaux',  Icon: Euro,        title: 'Devis calculé',     desc: '2 340 € HT · généré en 14 s',      svgColor: '#4ADE80', colorCls: 'text-green-400'  },
  { cityId: 'toulouse',  Icon: Mail,        title: 'Email envoyé',      desc: 'Client notifié · devis joint',      svgColor: '#38BDF8', colorCls: 'text-sky-400'    },
  { cityId: 'nice',      Icon: Bell,        title: 'Relance planifiée', desc: 'Automatique si sans réponse J+3',   svgColor: '#FB923C', colorCls: 'text-orange-400' },
]

// Bus path visits ALL 6 cities before looping
const BUS_PATH = 'M 200 65 L 258 188 L 265 295 L 105 248 L 155 298 L 318 280 L 200 65'
const BUS_DUR  = `${PHASES.length * 2}s` // 12 s total, 2 s / phase

export default function TransportHeroVisual() {
  const [phase, setPhase] = useState(0)

  // Change phase every 2 s, synchronized with the 12 s bus animation
  useEffect(() => {
    const id = setInterval(() => setPhase(p => (p + 1) % PHASES.length), 2000)
    return () => clearInterval(id)
  }, [])

  const cityMap = Object.fromEntries(CITIES.map(c => [c.id, c]))
  const current = PHASES[phase]
  const active  = cityMap[current.cityId]
  const PhaseIcon = current.Icon

  return (
    <div className="relative h-full w-full select-none">

      {/* ── SVG map ─────────────────────────────────────────── */}
      <svg viewBox="0 0 400 360" className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }} aria-hidden="true">
        <defs>
          <path id="ntBusPath" d={BUS_PATH} />
        </defs>

        {/* All route lines (faint) */}
        <path d={BUS_PATH} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" strokeDasharray="5 5" />

        {/* Highlight the two segments around the active city */}
        {CITIES.map(({ id, x, y }, i) => {
          const next = CITIES[(i + 1) % CITIES.length]
          const isActive = id === current.cityId || next.id === current.cityId
          if (!isActive) return null
          return (
            <line
              key={`hl-${id}`}
              x1={x} y1={y}
              x2={next.x} y2={next.y}
              stroke={current.svgColor}
              strokeWidth="1.5"
              strokeOpacity="0.45"
              strokeDasharray="6 3"
            />
          )
        })}

        {/* City nodes */}
        {CITIES.map(({ id, label, x, y }) => {
          const isActive = id === current.cityId
          return (
            <g key={id}>
              {/* Pulsing ring on active city */}
              {isActive && (
                <circle cx={x} cy={y} r="14" fill="none" stroke={current.svgColor} strokeWidth="1" strokeOpacity="0.5">
                  <animate attributeName="r"       values="10;20;10"  dur="1.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0.9;0.5" dur="1.4s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Outer ring */}
              <circle
                cx={x} cy={y} r="10"
                fill={isActive ? `${current.svgColor}18` : 'rgba(37,99,235,0.06)'}
                stroke={isActive ? current.svgColor : 'rgba(37,99,235,0.18)'}
                strokeWidth="1"
                strokeOpacity={isActive ? 0.6 : 1}
              />
              {/* Core dot */}
              <circle cx={x} cy={y} r={isActive ? 5.5 : 3.5} fill={isActive ? current.svgColor : '#2563EB'} opacity={isActive ? 1 : 0.7} />
              {/* Label */}
              <text
                x={x + 13} y={y + 4}
                fill={isActive ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.30)'}
                fontSize="10"
                fontFamily="system-ui,-apple-system,sans-serif"
                fontWeight={isActive ? '600' : '400'}
              >
                {label}
              </text>
            </g>
          )
        })}

        {/* Bus — halo */}
        <circle r="14" fill="rgba(37,99,235,0.09)">
          <animateMotion dur={BUS_DUR} repeatCount="indefinite" calcMode="linear">
            <mpath xlinkHref="#ntBusPath" />
          </animateMotion>
        </circle>
        {/* Bus — core */}
        <circle r="6.5" fill="#2563EB" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 8px rgba(37,99,235,0.9))' }}>
          <animateMotion dur={BUS_DUR} repeatCount="indefinite" calcMode="linear">
            <mpath xlinkHref="#ntBusPath" />
          </animateMotion>
        </circle>
      </svg>

      {/* ── Map label ────────────────────────────────────────── */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] text-white/18 tracking-widest uppercase pointer-events-none whitespace-nowrap">
        Réseau NeoTravel · France
      </div>

      {/* ── Active city pill (top-left) ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="absolute top-6 left-0 glass rounded-xl px-3.5 py-3 hidden sm:block"
      >
        <div className="text-[10px] text-white/30 mb-1.5 uppercase tracking-wide">Étape active</div>
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={`text-sm font-bold ${current.colorCls}`}
          >
            {active.label}
          </motion.div>
        </AnimatePresence>
        <div className="text-[11px] text-white/25 mt-0.5">
          {phase + 1}&thinsp;/&thinsp;{PHASES.length}
        </div>
      </motion.div>

      {/* ── Main phase card (bottom-right) ───────────────────── */}
      <div className="absolute bottom-4 right-0 w-56 hidden sm:block">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="glass-blue rounded-2xl px-4 py-3.5"
          >
            <div className="flex items-center gap-2 mb-2">
              <PhaseIcon className={`w-3.5 h-3.5 ${current.colorCls}`} />
              <span className={`text-[11px] font-semibold uppercase tracking-wide ${current.colorCls}`}>
                {current.title}
              </span>
            </div>
            <div className="text-white/75 text-sm leading-snug">{current.desc}</div>

            {/* Progress bar */}
            <div className="flex gap-1.5 mt-3">
              {PHASES.map((_, i) => (
                <div
                  key={i}
                  className="h-[3px] rounded-full transition-all duration-500"
                  style={{
                    flex: i === phase ? 3 : 1,
                    background: i === phase ? current.svgColor : 'rgba(255,255,255,0.15)',
                  }}
                />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
