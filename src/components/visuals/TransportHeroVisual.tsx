'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { geoMercator } from 'd3-geo'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { Inbox, CheckSquare, Zap, Euro, Mail, Bell, ArrowRight } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// PROJECTION — single source of truth for all SVG coordinates.
//
// Must match <ComposableMap> props below:
//   projection="geoMercator"  width=800  height=620
//   projectionConfig={{ scale: 1800, center: [2, 46.5] }}
//
// react-simple-maps sets translate=[width/2, height/2] internally.
// ─────────────────────────────────────────────────────────────────────────────
const W = 800, H = 620
const PROJ = geoMercator()
  .scale(1800)
  .center([2.0, 46.5] as [number, number])
  .translate([W / 2, H / 2])

const gps = (lon: number, lat: number): [number, number] => {
  const p = PROJ([lon, lat])
  return p ? [p[0], p[1]] : [W / 2, H / 2]
}

// ─────────────────────────────────────────────────────────────────────────────
// CITIES — real GPS coordinates [lon, lat].
// ─────────────────────────────────────────────────────────────────────────────
interface City {
  id: string
  label: string
  lon: number; lat: number
  zone: string
  hub?: boolean
  isRoute?: boolean
  secondary?: boolean   // less prominent label on desktop, hidden on mobile
  hint: string
  price: string
}

const CITIES: City[] = [
  { id: 'paris',       label: 'Paris',        lon:  2.3522, lat: 48.8566, zone: 'Île-de-France', hub: true,  isRoute: true,                 hint: 'Hub principal · Départs fréquents',  price: 'Lyon dès 1 420 € HT'  },
  { id: 'lille',       label: 'Lille',         lon:  3.0573, lat: 50.6292, zone: 'Nord',                                                     hint: 'A1 · Eurostar · Hauts-de-France',    price: 'Paris dès 680 € HT'   },
  { id: 'rennes',      label: 'Rennes',        lon: -1.6778, lat: 48.1173, zone: 'Ouest',                       secondary: true,             hint: 'Bretagne · LGV Atlantique',          price: 'Paris dès 890 € HT'   },
  { id: 'nantes',      label: 'Nantes',        lon: -1.5536, lat: 47.2184, zone: 'Ouest',                                                    hint: 'Loire-Atlantique · A11',             price: 'Paris dès 1 050 € HT' },
  { id: 'bordeaux',    label: 'Bordeaux',      lon: -0.5792, lat: 44.8378, zone: 'Sud-Ouest',     hub: true,                                 hint: 'A10 · A63 · Gironde',                price: 'Paris dès 1 620 € HT' },
  { id: 'toulouse',    label: 'Toulouse',      lon:  1.4442, lat: 43.6047, zone: 'Sud-Ouest',     hub: true,                                 hint: 'Hub Sud-Ouest · A62 · A61',          price: 'Paris dès 1 850 € HT' },
  { id: 'strasbourg',  label: 'Strasbourg',    lon:  7.7521, lat: 48.5734, zone: 'Grand Est',                   secondary: true,             hint: 'Grand Est · Frontière DE',           price: 'Paris dès 1 380 € HT' },
  { id: 'clermont',    label: 'Clermont-Fd',   lon:  3.0863, lat: 45.7772, zone: 'Centre-Est',                  secondary: true,             hint: 'Auvergne · A71 / A75',               price: 'Paris dès 1 100 € HT' },
  { id: 'lyon',        label: 'Lyon',          lon:  4.8357, lat: 45.7640, zone: 'Centre-Est',    hub: true,  isRoute: true,                 hint: 'Hub Centre-Est · A6 / A7',           price: 'Paris dès 1 420 € HT' },
  { id: 'grenoble',    label: 'Grenoble',      lon:  5.7245, lat: 45.1885, zone: 'Centre-Est',                  secondary: true,             hint: 'Isère · Alpes · A48',                price: 'Lyon dès 460 € HT'    },
  { id: 'montpellier', label: 'Montpellier',   lon:  3.8767, lat: 43.6119, zone: 'Sud-Est',                     secondary: true,             hint: 'Hérault · A9',                       price: 'Paris dès 2 100 € HT' },
  { id: 'marseille',   label: 'Marseille',     lon:  5.3698, lat: 43.2965, zone: 'Sud-Est',       hub: true,                                 hint: 'Hub PACA · A7 · Grand Port Maritime', price: 'Paris dès 2 200 € HT' },
  { id: 'nice',        label: 'Nice',          lon:  7.2620, lat: 43.7102, zone: 'Sud-Est',                    isRoute: true,                hint: 'Côte d\'Azur · A8',                  price: 'Paris dès 2 340 € HT' },
]

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE  Paris → Lyon → Nice
// ─────────────────────────────────────────────────────────────────────────────
const P  = gps(2.3522, 48.8566)   // Paris
const L  = gps(4.8357, 45.7640)   // Lyon
const N  = gps(7.2620, 43.7102)   // Nice

const ROUTE_D = `M ${P[0]} ${P[1]} L ${L[0]} ${L[1]} L ${N[0]} ${N[1]}`

// Bus position per phase (0–5)
const BUS: Array<[number, number]> = [
  P,
  P,
  [(P[0] + L[0]) / 2, (P[1] + L[1]) / 2],
  L,
  [(L[0] + N[0]) / 2, (L[1] + N[1]) / 2],
  N,
]

// ─────────────────────────────────────────────────────────────────────────────
// PHASES — business pipeline steps
// ─────────────────────────────────────────────────────────────────────────────
interface Metric { label: string; value: string; highlight?: boolean }

interface Phase {
  step: number
  Icon: React.ElementType
  label: string
  color: string
  description: string
  metrics: Metric[]
  price: string | null
  note: string | null
}

const PHASES: Phase[] = [
  {
    step: 1, Icon: Inbox, label: 'Demande reçue', color: '#60A5FA',
    description: 'NeoTravel reçoit votre demande : Paris → Nice, 28 passagers, aller-retour.',
    metrics: [
      { label: 'Trajet',     value: 'Paris → Nice' },
      { label: 'Passagers',  value: '28 personnes' },
      { label: 'Type',       value: 'Aller-retour' },
    ],
    price: null, note: null,
  },
  {
    step: 2, Icon: CheckSquare, label: 'Trajet qualifié', color: '#A78BFA',
    description: 'Distance et zones tarifaires confirmées. Trajet éligible au calcul automatique.',
    metrics: [
      { label: 'Distance',   value: '948 km' },
      { label: 'Durée est.', value: '11h30' },
      { label: 'Zone',       value: 'IDF → Sud-Est' },
    ],
    price: null, note: null,
  },
  {
    step: 3, Icon: Zap, label: 'Calcul du devis', color: '#FCD34D',
    description: 'Le moteur NeoTravel calcule le prix : distance, durée, passagers, options, péages.',
    metrics: [
      { label: 'Distance',    value: '948 km' },
      { label: 'Durée',       value: '11h30' },
      { label: 'Estimation',  value: 'en cours…' },
    ],
    price: null, note: null,
  },
  {
    step: 4, Icon: Euro, label: 'Devis généré', color: '#4ADE80',
    description: 'Devis calculé ligne par ligne — traçable, auditable, non-arbitraire.',
    metrics: [
      { label: 'Estimation',  value: '2 340 € HT', highlight: true },
      { label: 'Base',        value: 'Distance + passagers + péages' },
      { label: 'Délai',       value: '< 2h ouvrées' },
    ],
    price: '2 340 € HT',
    note: 'Simulation basée sur les règles métier NeoTravel',
  },
  {
    step: 5, Icon: Mail, label: 'Devis envoyé', color: '#38BDF8',
    description: 'Devis envoyé par email avec lien de suivi personnalisé inclus.',
    metrics: [
      { label: 'Format',      value: 'PDF + lien suivi' },
      { label: 'Délai',       value: '< 2h ouvrées' },
      { label: 'Estimation',  value: '2 340 € HT', highlight: true },
    ],
    price: '2 340 € HT',
    note: 'Simulation basée sur les règles métier NeoTravel',
  },
  {
    step: 6, Icon: Bell, label: 'Suivi en cours', color: '#FB923C',
    description: 'Relance automatique J+3 si pas de réponse. Tracking en temps réel.',
    metrics: [
      { label: 'Relance',     value: 'Automatique J+3' },
      { label: 'Tracking',    value: 'Temps réel' },
      { label: 'Estimation',  value: '2 340 € HT', highlight: true },
    ],
    price: '2 340 € HT',
    note: 'Simulation basée sur les règles métier NeoTravel',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Animated bus that follows the route using SVG transform (avoids CSS-px / SVG-unit mismatch) */
function BusMarker({ pos, color }: { pos: [number, number]; color: string }) {
  const gRef = useRef<SVGGElement>(null)
  const mx = useMotionValue(P[0])
  const my = useMotionValue(P[1])
  const sx = useSpring(mx, { stiffness: 44, damping: 13, mass: 0.8 })
  const sy = useSpring(my, { stiffness: 44, damping: 13, mass: 0.8 })

  useEffect(() => { mx.set(pos[0]); my.set(pos[1]) }, [pos, mx, my])

  useEffect(() => {
    const sync = () => {
      gRef.current?.setAttribute('transform', `translate(${sx.get()}, ${sy.get()})`)
    }
    const u1 = sx.on('change', sync)
    const u2 = sy.on('change', sync)
    sync()
    return () => { u1(); u2() }
  }, [sx, sy])

  return (
    <g ref={gRef} transform={`translate(${P[0]}, ${P[1]})`}>
      {/* Glow halos */}
      <circle r="26" fill={`${color}07`} />
      <circle r="17" fill={`${color}14`} />
      {/* Pulse ring */}
      <circle r="13" fill="none" stroke={color} strokeWidth="1.1" opacity="0.5">
        <animate attributeName="r"       values="13;28;13"    dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0;0.5"   dur="2.2s" repeatCount="indefinite" />
      </circle>
      {/* Bus body */}
      <rect x="-10" y="-6" width="20" height="12" rx="3" fill={color} opacity="0.97" />
      {/* Windows */}
      <rect x="-7"  y="-3.5" width="4" height="4" rx="1"   fill="rgba(0,8,22,0.48)" />
      <rect x="-1"  y="-3.5" width="4" height="4" rx="1"   fill="rgba(0,8,22,0.48)" />
      <rect x="5.5" y="-3.5" width="3" height="4" rx="0.8" fill="rgba(0,8,22,0.48)" />
      {/* Wheels */}
      <circle cx="-5"  cy="6.5" r="2.3" fill={color} stroke="rgba(0,8,22,0.45)" strokeWidth="0.8" />
      <circle cx="5"   cy="6.5" r="2.3" fill={color} stroke="rgba(0,8,22,0.45)" strokeWidth="0.8" />
      {/* Shine */}
      <circle r="1.5" cy="-1" fill="white" opacity="0.6" />
    </g>
  )
}

/** Animated route segment that draws progressively */
function RouteSegment({ x1, y1, x2, y2, color, visible }: {
  x1: number; y1: number; x2: number; y2: number; color: string; visible: boolean
}) {
  return (
    <motion.path
      d={`M ${x1} ${y1} L ${x2} ${y2}`}
      fill="none" strokeLinecap="round"
      style={{ stroke: color, strokeWidth: 3 }}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: visible ? 1 : 0, opacity: visible ? 0.88 : 0 }}
      transition={{ duration: 1.1, ease: 'easeOut' }}
    />
  )
}

/** Single city dot with label, hover interaction */
function CityDot({ city, active, color, onHover, hoveredId }: {
  city: City & { xy: [number, number] }
  active: boolean
  color: string
  onHover: (id: string | null) => void
  hoveredId: string | null
}) {
  const [x, y] = city.xy
  const isHov  = hoveredId === city.id
  const r      = city.hub ? 5.5 : city.isRoute ? 5 : city.secondary ? 2.5 : 3.5
  const labelRight = x < 560

  return (
    <g
      style={{ cursor: 'pointer' }}
      onMouseEnter={() => onHover(city.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Hover halo */}
      {isHov && (
        <circle cx={x} cy={y} r="20"
          fill={`${color}18`} stroke={`${color}38`} strokeWidth="1"
        />
      )}
      {/* Outer ring for route / hub cities */}
      {(city.isRoute || city.hub) && (
        <circle cx={x} cy={y} r={r + 5.5}
          fill="rgba(37,99,235,0.07)"
          stroke={active ? color : 'rgba(37,99,235,0.18)'}
          strokeWidth={active ? 1.5 : 0.7}
          opacity={active ? 1 : 0.4}
          style={{ transition: 'stroke 0.4s, opacity 0.4s' }}
        />
      )}
      {/* Core dot */}
      <circle cx={x} cy={y} r={r}
        fill={active ? color : city.hub ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)'}
        stroke={active ? color : 'rgba(255,255,255,0.18)'}
        strokeWidth={city.hub ? 1.1 : 0.7}
        style={{ transition: 'fill 0.4s, stroke 0.4s' }}
      />
      {/* Label — hidden on secondary cities unless hovered */}
      {(!city.secondary || isHov) && (
        <text
          x={labelRight ? x + r + 7 : x - r - 7}
          y={y + 4}
          textAnchor={labelRight ? 'start' : 'end'}
          fill={active ? 'rgba(255,255,255,0.94)' : city.hub ? 'rgba(255,255,255,0.34)' : 'rgba(255,255,255,0.18)'}
          fontSize={city.isRoute ? '10.5' : city.hub ? '9' : '8.5'}
          fontFamily="system-ui,-apple-system,sans-serif"
          fontWeight={active ? '700' : city.hub ? '500' : '400'}
          style={{ transition: 'fill 0.4s', pointerEvents: 'none' }}
        >{city.label}</text>
      )}
    </g>
  )
}

/** Tooltip rendered inside SVG, positioned near hovered city */
function CityTooltip({ city, color }: { city: City & { xy: [number, number] }; color: string }) {
  const [cx, cy] = city.xy
  const right = cx < 430
  const BW = 164, BH = 68
  const bx  = right ? cx + 18 : cx - 18 - BW

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Shadow */}
      <rect x={bx - 4} y={cy - 16} width={BW + 8} height={BH + 8}
        rx="8" fill="rgba(0,0,0,0.4)" />
      {/* Card */}
      <rect x={bx} y={cy - 14} width={BW} height={BH}
        rx="7" fill="rgba(2,11,24,0.95)" stroke={`${color}38`} strokeWidth="1" />
      {/* City name */}
      <text x={bx + 10} y={cy + 3}
        fill="rgba(255,255,255,0.95)" fontSize="10.5" fontWeight="700"
        fontFamily="system-ui,-apple-system,sans-serif"
      >{city.label}</text>
      {/* Zone */}
      <text x={bx + 10} y={cy + 18}
        fill="rgba(255,255,255,0.42)" fontSize="9"
        fontFamily="system-ui,-apple-system,sans-serif"
      >Zone : {city.zone}</text>
      {/* Hint */}
      <text x={bx + 10} y={cy + 32}
        fill="rgba(255,255,255,0.32)" fontSize="8.5"
        fontFamily="system-ui,-apple-system,sans-serif"
      >{city.hint}</text>
      {/* Price example */}
      <text x={bx + 10} y={cy + 46}
        fill={color} fontSize="9" fontWeight="600"
        fontFamily="system-ui,-apple-system,sans-serif"
      >Ex : {city.price}</text>
    </g>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function TransportHeroVisual() {
  const [phase,   setPhase]   = useState(0)
  const [paused,  setPaused]  = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  // Auto-advance — pause on hover or user interaction
  useEffect(() => {
    if (paused || hovered) return
    const id = setInterval(() => setPhase(p => (p + 1) % PHASES.length), 3200)
    return () => clearInterval(id)
  }, [paused, hovered])

  const cur    = PHASES[phase]
  const showA  = phase >= 2   // Paris → Lyon segment
  const showB  = phase >= 4   // Lyon → Nice segment

  const handleHover = useCallback((id: string | null) => setHovered(id), [])
  const hovCity = hovered
    ? CITIES_WITH_XY.find(c => c.id === hovered)
    : null

  // Render order matters: bg cities → route cities → tooltip → bus
  const bgCities    = CITIES_WITH_XY.filter(c => !c.isRoute)
  const routeCities = CITIES_WITH_XY.filter(c => c.isRoute)

  const activeFor = (id: string) => {
    if (id === 'paris') return true
    if (id === 'lyon')  return phase >= 2
    if (id === 'nice')  return phase >= 4
    return false
  }

  return (
    <div
      className="relative h-full w-full select-none overflow-hidden rounded-2xl"
      style={{ background: 'linear-gradient(150deg, #020B18 0%, #030E1F 60%, #040F1C 100%)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); setHovered(null) }}
    >
      {/* Grid texture */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage:
          'linear-gradient(rgba(37,99,235,0.032) 1px, transparent 1px),' +
          'linear-gradient(90deg, rgba(37,99,235,0.032) 1px, transparent 1px)',
        backgroundSize: '42px 42px',
      }} />
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-[1]" style={{
        background: 'radial-gradient(ellipse at 50% 50%, transparent 46%, rgba(2,11,24,0.74) 100%)',
      }} />

      {/* ── Map ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-[2]">
        <ComposableMap
          projection="geoMercator"
          width={W}
          height={H}
          projectionConfig={{ scale: 1800, center: [2.0, 46.5] as [number, number] }}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          {/* France shape */}
          <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json">
            {({ geographies }) =>
              geographies
                .filter(geo => geo.id === '250')
                .map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="rgba(37,99,235,0.040)"
                    stroke="rgba(37,99,235,0.26)"
                    strokeWidth={1.2}
                    style={{
                      default: { outline: 'none' },
                      hover:   { outline: 'none', fill: 'rgba(37,99,235,0.040)' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
            }
          </Geographies>

          {/* Ghost trail */}
          <path
            d={ROUTE_D}
            fill="none"
            stroke="rgba(255,255,255,0.054)"
            strokeWidth="2.5"
            strokeDasharray="6 7"
            strokeLinecap="round"
          />

          {/* Animated route segments */}
          <RouteSegment x1={P[0]} y1={P[1]} x2={L[0]} y2={L[1]} color={cur.color} visible={showA} />
          <RouteSegment x1={L[0]} y1={L[1]} x2={N[0]} y2={N[1]} color={cur.color} visible={showB} />

          {/* Background cities */}
          {bgCities.map(city => (
            <CityDot
              key={city.id}
              city={city}
              active={false}
              color={cur.color}
              onHover={handleHover}
              hoveredId={hovered}
            />
          ))}

          {/* Route cities — rendered on top */}
          {routeCities.map(city => (
            <CityDot
              key={city.id}
              city={city}
              active={activeFor(city.id)}
              color={cur.color}
              onHover={handleHover}
              hoveredId={hovered}
            />
          ))}

          {/* Hover tooltip */}
          {hovCity && <CityTooltip city={hovCity} color={cur.color} />}

          {/* Bus */}
          <BusMarker pos={BUS[phase]} color={cur.color} />
        </ComposableMap>
      </div>

      {/* ── Journey card (top-left) ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="absolute top-3 left-3 z-10 rounded-2xl px-3.5 py-2.5"
        style={{
          background:    'rgba(2,11,24,0.88)',
          border:        '1px solid rgba(255,255,255,0.09)',
          backdropFilter:'blur(14px)',
        }}
      >
        <p className="text-[9px] text-white/35 uppercase tracking-widest mb-1 font-mono">
          Trajet simulé
        </p>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-sm font-bold text-white">Paris</span>
          <ArrowRight className="w-3 h-3 text-white/35" />
          <span className="text-sm font-bold text-white">Nice</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/42">28 passagers · Aller-retour</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
          <span className="text-[9.5px] text-green-400/80 font-medium">Réponse estimée &lt; 2h</span>
        </div>
      </motion.div>

      {/* ── Step counter (top-right) ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="absolute top-3 right-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl"
        style={{
          background: 'rgba(2,11,24,0.75)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={phase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="w-2 h-2 rounded-full"
            style={{ background: cur.color }}
          />
        </AnimatePresence>
        <span className="text-[10px] text-white/40 font-mono tabular-nums">
          Étape {cur.step}&thinsp;/&thinsp;{PHASES.length}
        </span>
      </motion.div>

      {/* ── Step panel (bottom) ──────────────────────────────── */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <div
          className="rounded-2xl px-4 pt-3.5 pb-3"
          style={{
            background:    'rgba(2,11,24,0.95)',
            border:        '1px solid rgba(37,99,235,0.16)',
            backdropFilter:'blur(20px)',
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-2.5"
              >
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cur.color}20` }}
                >
                  <cur.Icon className="w-4 h-4" style={{ color: cur.color }} />
                </div>
                <div>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider font-mono leading-none mb-0.5">
                    Étape {cur.step} / {PHASES.length}
                  </p>
                  <p className="text-xs font-bold" style={{ color: cur.color }}>
                    {cur.label}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Price badge — appears at step 4+ */}
            <AnimatePresence>
              {cur.price && (
                <motion.div
                  key="price"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.22 }}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold tabular-nums"
                  style={{ background: `${cur.color}18`, color: cur.color, border: `1px solid ${cur.color}30` }}
                >
                  {cur.price}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Description */}
          <AnimatePresence mode="wait">
            <motion.p
              key={`desc${phase}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              className="text-[10.5px] text-white/45 leading-relaxed mb-2.5"
            >
              {cur.description}
            </motion.p>
          </AnimatePresence>

          {/* Metrics */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`metrics${phase}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              className="grid grid-cols-3 gap-2 mb-2.5"
            >
              {cur.metrics.map((m) => (
                <div
                  key={m.label}
                  className="rounded-xl px-2.5 py-1.5"
                  style={{ background: 'rgba(255,255,255,0.034)' }}
                >
                  <p className="text-[8.5px] text-white/28 uppercase tracking-wide mb-0.5">{m.label}</p>
                  <p
                    className="text-[10px] font-semibold truncate"
                    style={{ color: m.highlight ? cur.color : 'rgba(255,255,255,0.72)' }}
                  >{m.value}</p>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Disclaimer */}
          <AnimatePresence>
            {cur.note && (
              <motion.p
                key="note"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[9px] text-white/18 mb-2 italic"
              >{cur.note}</motion.p>
            )}
          </AnimatePresence>

          {/* Progress pills — clickable */}
          <div className="flex gap-1.5">
            {PHASES.map((p, i) => (
              <button
                key={i}
                onClick={() => { setPhase(i); setPaused(true) }}
                className="h-[3px] rounded-full"
                style={{
                  flex:       i === phase ? 3 : 1,
                  background: i < phase    ? `${p.color}55`
                            : i === phase  ? cur.color
                            : 'rgba(255,255,255,0.08)',
                  transition: 'flex 0.4s ease, background 0.4s ease',
                  cursor:     'pointer',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Pre-attach SVG xy to each city (computed once at module level)
const CITIES_WITH_XY = CITIES.map(c => ({ ...c, xy: gps(c.lon, c.lat) }))
