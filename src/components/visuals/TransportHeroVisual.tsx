'use client'

import { useState, useEffect, useRef } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { Inbox, CheckSquare, Zap, Euro, Mail, Bell } from 'lucide-react'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json'

// ── SVG coordinate system ──────────────────────────────────────────────────
// ComposableMap: width=800 height=600
// geoMercator: scale=2200 center=[2, 46.9] translate=[400, 300]
// Positions pre-computed with the Mercator formula.
const C = {
  paris:      { x: 414, y: 168 },
  lille:      { x: 441, y:  67 },
  nantes:     { x: 264, y: 278 },
  bordeaux:   { x: 301, y: 397 },
  toulouse:   { x: 379, y: 465 },
  lyon:       { x: 509, y: 346 },
  marseille:  { x: 529, y: 483 },
  nice:       { x: 602, y: 458 },
  strasbourg: { x: 621, y: 188 },
}

const BG_CITIES = [
  { id: 'lille',      label: 'Lille',      ...C.lille      },
  { id: 'nantes',     label: 'Nantes',     ...C.nantes     },
  { id: 'bordeaux',   label: 'Bordeaux',   ...C.bordeaux   },
  { id: 'toulouse',   label: 'Toulouse',   ...C.toulouse   },
  { id: 'marseille',  label: 'Marseille',  ...C.marseille  },
  { id: 'strasbourg', label: 'Strasbourg', ...C.strasbourg },
]

const PHASES = [
  { Icon: Inbox,       label: 'Demande reçue',   color: '#60A5FA', detail: 'Paris → Nice · 28 passagers · Aller-retour'           },
  { Icon: CheckSquare, label: 'Trajet qualifié',  color: '#A78BFA', detail: 'Distance estimée : 932 km · Durée : 11h20'            },
  { Icon: Zap,         label: 'Calcul du devis',  color: '#FCD34D', detail: 'Base kilométrique + options + péages'                  },
  { Icon: Euro,        label: 'Devis généré',     color: '#4ADE80', detail: '2 340 € HT · Détail ligne par ligne'                  },
  { Icon: Mail,        label: 'Devis envoyé',     color: '#38BDF8', detail: 'Email envoyé au client · Lien de suivi inclus'        },
  { Icon: Bell,        label: 'Suivi en cours',   color: '#FB923C', detail: 'Relance automatique J+3 · Tracking temps réel'        },
]

// GPS pin SVG position per phase (progress along Paris → Lyon → Nice)
const PIN_POS = [
  C.paris,
  C.paris,
  { x: (C.paris.x + C.lyon.x) / 2, y: (C.paris.y + C.lyon.y) / 2 },
  C.lyon,
  { x: (C.lyon.x + C.nice.x) / 2, y: (C.lyon.y + C.nice.y) / 2 },
  C.nice,
]

// ── Animated GPS pin (uses SVG transform attribute via Framer Motion) ───────
function GpsPin({ x, y, color }: { x: number; y: number; color: string }) {
  const gRef = useRef<SVGGElement>(null)
  const mx = useMotionValue(C.paris.x)
  const my = useMotionValue(C.paris.y)
  const sx = useSpring(mx, { stiffness: 55, damping: 16, mass: 0.7 })
  const sy = useSpring(my, { stiffness: 55, damping: 16, mass: 0.7 })

  useEffect(() => {
    mx.set(x)
    my.set(y)
  }, [x, y, mx, my])

  // Write the SVG transform attribute directly to avoid CSS-vs-SVG px ambiguity
  useEffect(() => {
    const unsubX = sx.on('change', () => {
      if (gRef.current) {
        gRef.current.setAttribute('transform', `translate(${sx.get()}, ${sy.get()})`)
      }
    })
    const unsubY = sy.on('change', () => {
      if (gRef.current) {
        gRef.current.setAttribute('transform', `translate(${sx.get()}, ${sy.get()})`)
      }
    })
    // Set initial
    if (gRef.current) {
      gRef.current.setAttribute('transform', `translate(${sx.get()}, ${sy.get()})`)
    }
    return () => { unsubX(); unsubY() }
  }, [sx, sy])

  return (
    <g ref={gRef} transform={`translate(${C.paris.x}, ${C.paris.y})`}>
      <circle cx={0} cy={0} r="22" fill={`${color}0D`} />
      <circle cx={0} cy={0} r="14" fill={`${color}1A`} />
      <circle cx={0} cy={0} r="8"  fill={color} />
      <circle cx={0} cy={0} r="3.5" fill="white" />
      <circle cx={0} cy={0} r="12" fill="none" stroke={color} strokeWidth="1.5">
        <animate attributeName="r"       values="12;26;12"   dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.65;0;0.65" dur="2s" repeatCount="indefinite" />
      </circle>
    </g>
  )
}

// ── Animated route segment (motion.path with pathLength) ────────────────────
function RouteSegment({
  x1, y1, x2, y2, color, visible,
}: {
  x1: number; y1: number; x2: number; y2: number
  color: string; visible: boolean
}) {
  return (
    <motion.path
      d={`M ${x1} ${y1} L ${x2} ${y2}`}
      fill="none"
      strokeLinecap="round"
      style={{ stroke: color, strokeWidth: 2.5 }}
      initial={{ pathLength: 0, strokeOpacity: 0 }}
      animate={{ pathLength: visible ? 1 : 0, strokeOpacity: visible ? 0.92 : 0 }}
      transition={{ duration: 0.95, ease: 'easeOut' }}
    />
  )
}

// ── Route city node ─────────────────────────────────────────────────────────
function RouteCity({
  x, y, label, active, color, labelAnchorRight = true,
}: {
  x: number; y: number; label: string
  active: boolean; color: string
  labelAnchorRight?: boolean
}) {
  return (
    <g style={{ opacity: active ? 1 : 0.35, transition: 'opacity 0.5s' }}>
      <circle cx={x} cy={y} r="10"
        fill="rgba(37,99,235,0.12)"
        stroke={active ? color : 'rgba(37,99,235,0.28)'}
        strokeWidth="1.5"
      />
      <circle cx={x} cy={y} r="5"
        fill={active ? color : 'rgba(37,99,235,0.45)'}
        style={{ transition: 'fill 0.5s' }}
      />
      <text
        x={labelAnchorRight ? x + 13 : x - 13}
        y={y + 4}
        textAnchor={labelAnchorRight ? 'start' : 'end'}
        fill={active ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.22)'}
        fontSize="10.5"
        fontFamily="system-ui,-apple-system,sans-serif"
        fontWeight={active ? '600' : '400'}
        style={{ transition: 'fill 0.5s' }}
      >{label}</text>
    </g>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function TransportHeroVisual() {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setPhase(p => (p + 1) % PHASES.length), 2800)
    return () => clearInterval(id)
  }, [])

  const cur   = PHASES[phase]
  const pin   = PIN_POS[phase]
  const showA = phase >= 2
  const showB = phase >= 4

  return (
    <div
      className="relative h-full w-full select-none overflow-hidden rounded-2xl"
      style={{ background: 'linear-gradient(135deg, #030D20 0%, #04101E 60%, #050D1C 100%)' }}
    >
      {/* Subtle vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(3,13,32,0.55) 100%)' }}
      />

      {/* ── France Map ───────────────────────────────────────── */}
      <div className="absolute inset-0">
        <ComposableMap
          width={800}
          height={600}
          projectionConfig={{ scale: 2200, center: [2.0, 46.9] as [number, number] }}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          {/* France country shape */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies
                .filter(geo => geo.id === '250')
                .map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="rgba(37,99,235,0.055)"
                    stroke="rgba(37,99,235,0.22)"
                    strokeWidth={1}
                    style={{
                      default: { outline: 'none' },
                      hover:   { outline: 'none', fill: 'rgba(37,99,235,0.055)' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
            }
          </Geographies>

          {/* Route ghost trail */}
          <path
            d={`M ${C.paris.x} ${C.paris.y} L ${C.lyon.x} ${C.lyon.y} L ${C.nice.x} ${C.nice.y}`}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="2"
            strokeDasharray="5 6"
          />

          {/* Route segment A: Paris → Lyon */}
          <RouteSegment
            x1={C.paris.x} y1={C.paris.y}
            x2={C.lyon.x}  y2={C.lyon.y}
            color={cur.color} visible={showA}
          />

          {/* Route segment B: Lyon → Nice */}
          <RouteSegment
            x1={C.lyon.x} y1={C.lyon.y}
            x2={C.nice.x} y2={C.nice.y}
            color={cur.color} visible={showB}
          />

          {/* Background (non-route) city dots */}
          {BG_CITIES.map(({ id, label, x, y }) => (
            <g key={id}>
              <circle cx={x} cy={y} r="2.5"
                fill="rgba(255,255,255,0.05)"
                stroke="rgba(255,255,255,0.10)"
                strokeWidth="0.8"
              />
              <text x={x + 5} y={y + 3}
                fill="rgba(255,255,255,0.16)"
                fontSize="8" fontFamily="system-ui,-apple-system,sans-serif"
              >{label}</text>
            </g>
          ))}

          {/* Route city: Nice */}
          <RouteCity
            x={C.nice.x} y={C.nice.y}
            label="Nice" active={phase >= 4} color={cur.color}
            labelAnchorRight={false}
          />

          {/* Route city: Lyon */}
          <RouteCity
            x={C.lyon.x} y={C.lyon.y}
            label="Lyon" active={phase >= 2} color={cur.color}
          />

          {/* Paris origin — always active, pulse ring at phase 0 */}
          {phase === 0 && (
            <circle cx={C.paris.x} cy={C.paris.y} r="16" fill="none" stroke={cur.color} strokeWidth="0.8">
              <animate attributeName="r"       values="16;30;16"    dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.45;0;0.45" dur="1.6s" repeatCount="indefinite" />
            </circle>
          )}
          <circle cx={C.paris.x} cy={C.paris.y} r="12"
            fill="rgba(37,99,235,0.18)" stroke={cur.color} strokeWidth="1.5"
          />
          <circle cx={C.paris.x} cy={C.paris.y} r="6" fill={cur.color} />
          <text x={C.paris.x + 15} y={C.paris.y + 4}
            fill="rgba(255,255,255,0.92)"
            fontSize="11" fontFamily="system-ui,-apple-system,sans-serif" fontWeight="700"
          >Paris</text>

          {/* GPS pin — animated along the route */}
          <GpsPin x={pin.x} y={pin.y} color={cur.color} />
        </ComposableMap>
      </div>

      {/* ── Route badge (top) ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2.5 px-4 py-2 rounded-full whitespace-nowrap"
        style={{ background: 'rgba(3,13,32,0.75)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
        <span className="text-xs font-bold text-white/85">Paris → Nice</span>
        <span className="w-px h-3 bg-white/12 flex-shrink-0" />
        <span className="text-xs text-white/40">28 passagers</span>
        <span className="w-px h-3 bg-white/12 flex-shrink-0" />
        <span className="text-xs text-white/30">Aller-retour</span>
      </motion.div>

      {/* ── Phase info card (bottom) ──────────────────────────── */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <div
          className="rounded-2xl px-4 py-3.5"
          style={{
            background:    'rgba(3,13,32,0.93)',
            border:        '1px solid rgba(37,99,235,0.16)',
            backdropFilter:'blur(16px)',
          }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between mb-1.5">
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <cur.Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: cur.color }}
                />
                <span className="text-xs font-bold tracking-wide" style={{ color: cur.color }}>
                  {cur.label}
                </span>
              </motion.div>
            </AnimatePresence>

            <span className="text-[10px] text-white/22 tabular-nums font-mono">
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
              transition={{ duration: 0.18 }}
              className="text-[11px] text-white/42 leading-relaxed mb-2.5"
            >
              {cur.detail}
            </motion.p>
          </AnimatePresence>

          {/* Progress pills */}
          <div className="flex gap-1.5">
            {PHASES.map((p, i) => (
              <div
                key={i}
                className="h-[3px] rounded-full"
                style={{
                  flex:       i === phase ? 3 : 1,
                  background: i < phase
                    ? `${p.color}50`
                    : i === phase
                    ? cur.color
                    : 'rgba(255,255,255,0.09)',
                  transition: 'flex 0.4s ease, background 0.4s ease',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
