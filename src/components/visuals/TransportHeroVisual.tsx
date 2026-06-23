'use client'
import { motion } from 'framer-motion'
import { CheckCircle, Mail, Bus } from 'lucide-react'

const CITIES = [
  { id: 'paris',     label: 'Paris',     x: 200, y: 65  },
  { id: 'lyon',      label: 'Lyon',      x: 258, y: 188 },
  { id: 'marseille', label: 'Marseille', x: 265, y: 295 },
  { id: 'nice',      label: 'Nice',      x: 318, y: 280 },
  { id: 'bordeaux',  label: 'Bordeaux',  x: 105, y: 248 },
  { id: 'toulouse',  label: 'Toulouse',  x: 155, y: 298 },
]

const SECONDARY: [string, string][] = [
  ['paris', 'bordeaux'], ['bordeaux', 'toulouse'], ['toulouse', 'marseille'], ['marseille', 'nice'],
]
const MAIN: [string, string][] = [
  ['paris', 'lyon'], ['lyon', 'marseille'],
]

// Native SVG motion path: Paris → Lyon → Marseille → Nice → back
const BUS_PATH = 'M 200 65 L 258 188 L 265 295 L 318 280 L 265 295 L 258 188 L 200 65'

export default function TransportHeroVisual() {
  type CityMap = Record<string, typeof CITIES[number]>
  const cityMap: CityMap = Object.fromEntries(CITIES.map(c => [c.id, c]))

  return (
    <div className="relative h-full w-full">
      <svg viewBox="0 0 400 360" className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }} aria-hidden="true">
        <defs>
          <path id="neoTravelBusPath" d={BUS_PATH} />
        </defs>

        {/* Secondary routes */}
        {SECONDARY.map(([from, to]) => {
          const a = cityMap[from], b = cityMap[to]
          return (
            <line key={`sec-${from}-${to}`}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="5 5"
            />
          )
        })}

        {/* Main route */}
        {MAIN.map(([from, to]) => {
          const a = cityMap[from], b = cityMap[to]
          return (
            <g key={`main-${from}-${to}`}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(37,99,235,0.22)" strokeWidth="3.5" />
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(37,99,235,0.65)" strokeWidth="1.5" strokeDasharray="6 4" />
            </g>
          )
        })}

        {/* City nodes */}
        {CITIES.map(({ id, label, x, y }) => (
          <g key={id}>
            <circle cx={x} cy={y} r="11" fill="rgba(37,99,235,0.07)" stroke="rgba(37,99,235,0.2)" strokeWidth="1" />
            <circle cx={x} cy={y} r="4"  fill="#2563EB" opacity="0.9" />
            <text x={x + 14} y={y + 4} fill="rgba(255,255,255,0.36)" fontSize="10" fontFamily="system-ui,sans-serif" fontWeight="500">
              {label}
            </text>
          </g>
        ))}

        {/* Animated bus — halo (native SVG animateMotion) */}
        <circle r="14" fill="rgba(37,99,235,0.10)">
          <animateMotion dur="10s" repeatCount="indefinite" calcMode="linear">
            <mpath xlinkHref="#neoTravelBusPath" />
          </animateMotion>
        </circle>

        {/* Animated bus — core */}
        <circle r="7" fill="#2563EB" stroke="rgba(255,255,255,0.55)" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 9px rgba(37,99,235,0.95))' }}>
          <animateMotion dur="10s" repeatCount="indefinite" calcMode="linear">
            <mpath xlinkHref="#neoTravelBusPath" />
          </animateMotion>
        </circle>
      </svg>

      {/* Map label */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] text-white/20 tracking-widest uppercase pointer-events-none whitespace-nowrap">
        Réseau NeoTravel · France
      </div>

      {/* Card — nouvelle demande */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="absolute top-8 left-0 glass rounded-xl px-4 py-3 pointer-events-none hidden sm:block"
      >
        <div className="flex items-center gap-1.5 text-[10px] text-white/40 mb-1 uppercase tracking-wide">
          <Bus className="w-3 h-3 text-neo-blue" />
          Nouvelle demande
        </div>
        <div className="font-bold text-white text-sm">Paris → Lyon · 28 pax</div>
        <div className="text-[11px] text-green-400 mt-0.5">Reçu il y a 2 min</div>
      </motion.div>

      {/* Card — devis calculé */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.3, duration: 0.5 }}
        className="absolute bottom-8 right-0 glass-blue rounded-2xl px-4 py-3.5 pointer-events-none hidden sm:block"
      >
        <div className="flex items-center gap-1.5 text-[10px] text-white/40 mb-1 uppercase tracking-wide">
          <CheckCircle className="w-3 h-3 text-green-400" />
          Devis calculé
        </div>
        <div className="font-bold text-white text-sm">Bordeaux → Nice · 52 pax</div>
        <div className="text-[11px] text-neo-blue mt-0.5">2 340 € HT · 14 secondes</div>
      </motion.div>

      {/* Card — email */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.55, duration: 0.5 }}
        className="absolute bottom-28 left-1 glass rounded-xl px-3 py-2.5 pointer-events-none hidden lg:flex items-center gap-2"
      >
        <Mail className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
        <div>
          <div className="text-xs font-semibold text-white">Email envoyé</div>
          <div className="text-[10px] text-white/35">Client notifié · Relance J+3</div>
        </div>
      </motion.div>
    </div>
  )
}
