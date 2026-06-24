'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { Inbox, CheckSquare, Zap, Euro, Mail, Bell, MapPin, Clock, TrendingUp } from 'lucide-react'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json'

// ── Coordinate system ──────────────────────────────────────────────────────────
// ComposableMap: width=800 height=620
// geoMercator: scale=2400 center=[2.5, 46.5] translate=[400, 310]
// Formula: x = 400 + 2400*(lon-2.5)*π/180
//          y = 310 - 2400*(ln(tan(π/4+lat*π/360)) - ln(tan(π/4+46.5*π/360)))
const C = {
  paris:       { x: 399,  y: 185 },  // 48.85°N  2.35°E
  lille:       { x: 420,  y:  85 },  // 50.63°N  3.07°E
  rouen:       { x: 349,  y: 148 },  // 49.44°N  1.10°E
  rennes:      { x: 258,  y: 192 },  // 48.11°N -1.68°E
  nantes:      { x: 252,  y: 244 },  // 47.22°N -1.55°E
  strasbourg:  { x: 570,  y: 168 },  // 48.57°N  7.75°E
  bordeaux:    { x: 280,  y: 376 },  // 44.84°N -0.58°E
  toulouse:    { x: 348,  y: 440 },  // 43.60°N  1.44°E
  lyon:        { x: 488,  y: 326 },  // 45.75°N  4.83°E
  grenoble:    { x: 516,  y: 364 },  // 45.19°N  5.72°E
  clermont:    { x: 418,  y: 344 },  // 45.78°N  3.09°E
  montpellier: { x: 432,  y: 448 },  // 43.61°N  3.88°E
  marseille:   { x: 487,  y: 468 },  // 43.30°N  5.37°E
  nice:        { x: 546,  y: 456 },  // 43.70°N  7.26°E — côte SE, pas Corse
}

// ── City metadata ──────────────────────────────────────────────────────────────
interface CityInfo {
  id: string; label: string; zone: string
  x: number;  y: number
  hub?: boolean; isRoute?: boolean
  hint?: string; price?: string
}

const CITIES: CityInfo[] = [
  { id: 'paris',       label: 'Paris',           zone: 'Île-de-France', ...C.paris,       hub: true, isRoute: true, hint: 'Hub principal · Départs fréquents', price: 'Lyon dès 1 420 € HT' },
  { id: 'lille',       label: 'Lille',            zone: 'Nord',          ...C.lille,       hint: 'A1 · Eurostar',              price: 'Paris dès 680 € HT'   },
  { id: 'rouen',       label: 'Rouen',            zone: 'Nord',          ...C.rouen,       hint: 'Normandie · A13',            price: 'Paris dès 520 € HT'   },
  { id: 'rennes',      label: 'Rennes',           zone: 'Ouest',         ...C.rennes,      hint: 'Bretagne · LGV',             price: 'Paris dès 890 € HT'   },
  { id: 'nantes',      label: 'Nantes',           zone: 'Ouest',         ...C.nantes,      hint: 'Loire-Atlantique · A11',     price: 'Paris dès 1 050 € HT' },
  { id: 'strasbourg',  label: 'Strasbourg',       zone: 'Grand Est',     ...C.strasbourg,  hint: 'Grand Est · Frontière DE',   price: 'Paris dès 1 380 € HT' },
  { id: 'bordeaux',    label: 'Bordeaux',         zone: 'Sud-Ouest',     ...C.bordeaux,    hub: true, hint: 'A10 · A63 · Gironde', price: 'Paris dès 1 620 € HT' },
  { id: 'toulouse',    label: 'Toulouse',         zone: 'Sud-Ouest',     ...C.toulouse,    hub: true, hint: 'Hub Sud-Ouest · A62',  price: 'Paris dès 1 850 € HT' },
  { id: 'lyon',        label: 'Lyon',             zone: 'Centre-Est',    ...C.lyon,        hub: true, isRoute: true, hint: 'Hub Centre-Est · A6/A7', price: 'Paris dès 1 420 € HT' },
  { id: 'grenoble',    label: 'Grenoble',         zone: 'Centre-Est',    ...C.grenoble,    hint: 'Isère · Alpes · A48',        price: 'Lyon dès 460 € HT'    },
  { id: 'clermont',    label: 'Clermont-Fd',      zone: 'Centre-Est',    ...C.clermont,    hint: 'Auvergne · A71/A75',         price: 'Paris dès 1 100 € HT' },
  { id: 'montpellier', label: 'Montpellier',      zone: 'Sud-Est',       ...C.montpellier, hint: 'Hérault · A9',               price: 'Paris dès 2 100 € HT' },
  { id: 'marseille',   label: 'Marseille',        zone: 'Sud-Est',       ...C.marseille,   hub: true, hint: 'Hub PACA · A7 · Port', price: 'Paris dès 2 200 € HT' },
  { id: 'nice',        label: 'Nice',             zone: 'Sud-Est',       ...C.nice,        isRoute: true, hint: 'Côte d\'Azur · A8', price: 'Paris dès 2 340 € HT' },
]

// ── Route ─────────────────────────────────────────────────────────────────────
const ROUTE_PATH = `M ${C.paris.x} ${C.paris.y} L ${C.lyon.x} ${C.lyon.y} L ${C.nice.x} ${C.nice.y}`

const PIN_POS = [
  C.paris,
  C.paris,
  { x: (C.paris.x + C.lyon.x) / 2, y: (C.paris.y + C.lyon.y) / 2 },
  C.lyon,
  { x: (C.lyon.x + C.nice.x) / 2, y: (C.lyon.y + C.nice.y) / 2 },
  C.nice,
]

// ── Phases ────────────────────────────────────────────────────────────────────
const PHASES = [
  { Icon: Inbox,       label: 'Demande reçue',  color: '#60A5FA', zone: 'Île-de-France → Sud-Est', distance: '948 km', duration: '11h30', price: null as string | null, basis: 'Trajet en cours de qualification' },
  { Icon: CheckSquare, label: 'Trajet qualifié', color: '#A78BFA', zone: 'Île-de-France → Sud-Est', distance: '948 km', duration: '11h30', price: null as string | null, basis: 'Distance + type de trajet + péages A6/A7/A8' },
  { Icon: Zap,         label: 'Calcul du devis', color: '#FCD34D', zone: 'Île-de-France → Sud-Est', distance: '948 km', duration: '11h30', price: null as string | null, basis: 'Moteur déterministe · base kilométrique certifiée' },
  { Icon: Euro,        label: 'Devis généré',    color: '#4ADE80', zone: 'Île-de-France → Sud-Est', distance: '948 km', duration: '11h30', price: '2 340 € HT',          basis: 'Distance, durée, 28 passagers, options, péages' },
  { Icon: Mail,        label: 'Devis envoyé',    color: '#38BDF8', zone: 'Île-de-France → Sud-Est', distance: '948 km', duration: '11h30', price: '2 340 € HT',          basis: 'Envoyé sous 2h ouvrées · lien de suivi inclus' },
  { Icon: Bell,        label: 'Suivi en cours',  color: '#FB923C', zone: 'Île-de-France → Sud-Est', distance: '948 km', duration: '11h30', price: '2 340 € HT',          basis: 'Relance automatique J+3 · tracking temps réel' },
]

// ── Bus pin ────────────────────────────────────────────────────────────────────
function BusPin({ x, y, color }: { x: number; y: number; color: string }) {
  const gRef = useRef<SVGGElement>(null)
  const mx = useMotionValue(C.paris.x)
  const my = useMotionValue(C.paris.y)
  const sx = useSpring(mx, { stiffness: 48, damping: 14, mass: 0.8 })
  const sy = useSpring(my, { stiffness: 48, damping: 14, mass: 0.8 })

  useEffect(() => { mx.set(x); my.set(y) }, [x, y, mx, my])

  useEffect(() => {
    const sync = () => {
      if (gRef.current) gRef.current.setAttribute('transform', `translate(${sx.get()}, ${sy.get()})`)
    }
    const u1 = sx.on('change', sync)
    const u2 = sy.on('change', sync)
    sync()
    return () => { u1(); u2() }
  }, [sx, sy])

  return (
    <g ref={gRef} transform={`translate(${C.paris.x}, ${C.paris.y})`}>
      {/* Glow halos */}
      <circle cx={0} cy={0} r="26" fill={`${color}07`} />
      <circle cx={0} cy={0} r="17" fill={`${color}12`} />
      {/* Pulse ring */}
      <circle cx={0} cy={0} r="13" fill="none" stroke={color} strokeWidth="1" opacity="0.55">
        <animate attributeName="r"       values="13;28;13"   dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.55;0;0.55" dur="2.2s" repeatCount="indefinite" />
      </circle>
      {/* Bus body */}
      <rect x="-11" y="-7" width="22" height="13" rx="3.5" fill={color} opacity="0.96" />
      {/* Windows */}
      <rect x="-8"  y="-4.5" width="5" height="5" rx="1"   fill="rgba(0,8,20,0.5)" />
      <rect x="-1"  y="-4.5" width="5" height="5" rx="1"   fill="rgba(0,8,20,0.5)" />
      <rect x="6.5" y="-4.5" width="3" height="5" rx="0.8" fill="rgba(0,8,20,0.5)" />
      {/* Wheels */}
      <circle cx="-5.5" cy="7" r="2.5" fill={color} stroke="rgba(0,8,20,0.4)" strokeWidth="0.8" />
      <circle cx="5.5"  cy="7" r="2.5" fill={color} stroke="rgba(0,8,20,0.4)" strokeWidth="0.8" />
      {/* Center shine */}
      <circle cx={0} cy="-1" r="1.8" fill="white" opacity="0.7" />
    </g>
  )
}

// ── Route segment ─────────────────────────────────────────────────────────────
function RouteSegment({ x1, y1, x2, y2, color, visible }: {
  x1: number; y1: number; x2: number; y2: number; color: string; visible: boolean
}) {
  return (
    <motion.path
      d={`M ${x1} ${y1} L ${x2} ${y2}`}
      fill="none" strokeLinecap="round"
      style={{ stroke: color, strokeWidth: 3 }}
      initial={{ pathLength: 0, strokeOpacity: 0 }}
      animate={{ pathLength: visible ? 1 : 0, strokeOpacity: visible ? 0.88 : 0 }}
      transition={{ duration: 1.1, ease: 'easeOut' }}
    />
  )
}

// ── City node ─────────────────────────────────────────────────────────────────
function CityNode({ city, active, color, onHover, hovered }: {
  city: CityInfo; active: boolean; color: string
  onHover: (id: string | null) => void; hovered: string | null
}) {
  const isHov = hovered === city.id
  const r = city.hub ? 5.5 : 3.5
  const labelRight = city.x < 555

  return (
    <g style={{ cursor: 'pointer' }}
      onMouseEnter={() => onHover(city.id)}
      onMouseLeave={() => onHover(null)}
    >
      {isHov && <circle cx={city.x} cy={city.y} r="18" fill={`${color}15`} stroke={`${color}35`} strokeWidth="1" />}
      {(city.isRoute || city.hub) && (
        <circle cx={city.x} cy={city.y} r={r + 5}
          fill="rgba(37,99,235,0.08)"
          stroke={active ? color : 'rgba(37,99,235,0.20)'}
          strokeWidth={active ? 1.5 : 0.8}
          opacity={active ? 1 : 0.4}
          style={{ transition: 'stroke 0.4s, opacity 0.4s' }}
        />
      )}
      <circle cx={city.x} cy={city.y} r={r}
        fill={active ? color : city.hub ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)'}
        stroke={active ? color : 'rgba(255,255,255,0.18)'}
        strokeWidth={city.hub ? 1.1 : 0.7}
        style={{ transition: 'fill 0.4s, stroke 0.4s' }}
      />
      <text
        x={labelRight ? city.x + r + 7 : city.x - r - 7}
        y={city.y + 4}
        textAnchor={labelRight ? 'start' : 'end'}
        fill={active ? 'rgba(255,255,255,0.94)' : city.hub ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.16)'}
        fontSize={city.isRoute ? '10.5' : city.hub ? '9' : '8'}
        fontFamily="system-ui,-apple-system,sans-serif"
        fontWeight={active ? '700' : city.hub ? '500' : '400'}
        style={{ transition: 'fill 0.4s', pointerEvents: 'none' }}
      >{city.label}</text>
    </g>
  )
}

// ── Hover tooltip ─────────────────────────────────────────────────────────────
function CityTooltip({ city, color }: { city: CityInfo; color: string }) {
  const right = city.x < 450
  const bw = 158
  const bx = right ? city.x + 16 : city.x - 16 - bw
  const lines = [
    city.label,
    `Zone : ${city.zone}`,
    ...(city.hint  ? [city.hint]          : []),
    ...(city.price ? [`Ex : ${city.price}`] : []),
  ]
  const bh = 16 + lines.length * 14 + 4

  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={bx - 6} y={city.y - 14} width={bw + 12} height={bh}
        rx="6" fill="rgba(2,11,24,0.93)" stroke={`${color}3A`} strokeWidth="1"
      />
      {lines.map((line, i) => (
        <text
          key={i}
          x={right ? bx : bx + bw}
          y={city.y + i * 14 - 1}
          textAnchor={right ? 'start' : 'end'}
          fill={
            i === 0          ? 'rgba(255,255,255,0.96)'
            : i === lines.length - 1 && city.price ? color
            : 'rgba(255,255,255,0.45)'
          }
          fontSize={i === 0 ? '10' : '9'}
          fontWeight={i === 0 ? '700' : '400'}
          fontFamily="system-ui,-apple-system,sans-serif"
        >{line}</text>
      ))}
    </g>
  )
}

// ── MetaRow ───────────────────────────────────────────────────────────────────
function MetaRow({ icon: Icon, label, value, color, highlight }: {
  icon: React.ElementType; label: string; value: string; color: string; highlight?: boolean
}) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <Icon className="w-3 h-3 flex-shrink-0" style={{ color: highlight ? color : 'rgba(255,255,255,0.22)' }} />
      <span className="text-[9px] text-white/28 flex-shrink-0 tracking-wide uppercase">{label}</span>
      <span className="text-[10px] truncate font-mono"
        style={{ color: highlight ? color : 'rgba(255,255,255,0.60)', fontWeight: highlight ? '700' : '400' }}
      >{value}</span>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TransportHeroVisual() {
  const [phase,   setPhase]   = useState(0)
  const [paused,  setPaused]  = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    if (paused || hovered) return
    const id = setInterval(() => setPhase(p => (p + 1) % PHASES.length), 3000)
    return () => clearInterval(id)
  }, [paused, hovered])

  const cur   = PHASES[phase]
  const pin   = PIN_POS[phase]
  const showA = phase >= 2
  const showB = phase >= 4

  const handleHover = useCallback((id: string | null) => setHovered(id), [])
  const hovCity = hovered ? CITIES.find(c => c.id === hovered) : null

  // Render order: bg cities → route cities → tooltip → bus
  const bgCities    = CITIES.filter(c => !c.isRoute)
  const routeCities = CITIES.filter(c =>  c.isRoute)

  return (
    <div
      className="relative h-full w-full select-none overflow-hidden rounded-2xl"
      style={{ background: 'linear-gradient(145deg, #020B18 0%, #030D1E 55%, #041020 100%)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); setHovered(null) }}
    >
      {/* Subtle grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(37,99,235,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.035) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-[1]" style={{
        background: 'radial-gradient(ellipse at 50% 50%, transparent 48%, rgba(2,11,24,0.72) 100%)',
      }} />

      {/* ── Map ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-[2]">
        <ComposableMap
          width={800}
          height={620}
          projectionConfig={{ scale: 2400, center: [2.5, 46.5] as [number, number] }}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies
                .filter(geo => geo.id === '250')
                .map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="rgba(37,99,235,0.042)"
                    stroke="rgba(37,99,235,0.28)"
                    strokeWidth={1.2}
                    style={{
                      default: { outline: 'none' },
                      hover:   { outline: 'none', fill: 'rgba(37,99,235,0.042)' },
                      pressed: { outline: 'none' },
                    }}
                  />
                ))
            }
          </Geographies>

          {/* Ghost trail */}
          <path
            d={ROUTE_PATH}
            fill="none"
            stroke="rgba(255,255,255,0.055)"
            strokeWidth="2.5"
            strokeDasharray="6 7"
            strokeLinecap="round"
          />

          {/* Active segments */}
          <RouteSegment x1={C.paris.x} y1={C.paris.y} x2={C.lyon.x}  y2={C.lyon.y}  color={cur.color} visible={showA} />
          <RouteSegment x1={C.lyon.x}  y1={C.lyon.y}  x2={C.nice.x}  y2={C.nice.y}  color={cur.color} visible={showB} />

          {/* Background cities */}
          {bgCities.map(city => (
            <CityNode
              key={city.id}
              city={city}
              active={false}
              color={cur.color}
              onHover={handleHover}
              hovered={hovered}
            />
          ))}

          {/* Route cities (Nice, Lyon, Paris) — on top */}
          <CityNode city={CITIES.find(c => c.id === 'nice')!}  active={phase >= 4} color={cur.color} onHover={handleHover} hovered={hovered} />
          <CityNode city={CITIES.find(c => c.id === 'lyon')!}  active={phase >= 2} color={cur.color} onHover={handleHover} hovered={hovered} />
          <CityNode city={CITIES.find(c => c.id === 'paris')!} active={true}       color={cur.color} onHover={handleHover} hovered={hovered} />

          {/* Tooltip */}
          {hovCity && <CityTooltip city={hovCity} color={cur.color} />}

          {/* Bus pin */}
          <BusPin x={pin.x} y={pin.y} color={cur.color} />
        </ComposableMap>
      </div>

      {/* ── Route badge ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2.5 px-4 py-1.5 rounded-full whitespace-nowrap"
        style={{
          background: 'rgba(2,11,24,0.84)',
          border: '1px solid rgba(255,255,255,0.10)',
          backdropFilter: 'blur(14px)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
        <span className="text-xs font-bold text-white/90 tracking-wide">Paris → Nice</span>
        <span className="w-px h-3 bg-white/14 flex-shrink-0" />
        <span className="text-xs text-white/42">28 passagers</span>
        <span className="w-px h-3 bg-white/10 flex-shrink-0" />
        <span className="text-xs text-white/28">Aller-retour</span>
      </motion.div>

      {/* ── Info panel ──────────────────────────────────────── */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <div
          className="rounded-2xl px-4 pt-3 pb-3"
          style={{
            background:    'rgba(2,11,24,0.95)',
            border:        '1px solid rgba(37,99,235,0.18)',
            backdropFilter:'blur(20px)',
          }}
        >
          {/* Phase header */}
          <div className="flex items-center justify-between mb-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cur.color}1C` }}>
                  <cur.Icon className="w-3.5 h-3.5" style={{ color: cur.color }} />
                </div>
                <span className="text-xs font-bold tracking-wide" style={{ color: cur.color }}>
                  {cur.label}
                </span>
              </motion.div>
            </AnimatePresence>
            <span className="text-[10px] text-white/20 tabular-nums font-mono">
              {phase + 1}&thinsp;/&thinsp;{PHASES.length}
            </span>
          </div>

          {/* Meta grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`m${phase}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-2"
            >
              <MetaRow icon={MapPin}    label="Zone"     value={cur.zone}     color={cur.color} />
              <MetaRow icon={TrendingUp} label="Distance" value={cur.distance} color={cur.color} />
              <MetaRow icon={Clock}     label="Durée"    value={cur.duration} color={cur.color} />
              <MetaRow icon={Euro}      label={cur.price ? 'Estimation' : 'Calcul'} value={cur.price ?? 'En cours…'} color={cur.color} highlight={!!cur.price} />
            </motion.div>
          </AnimatePresence>

          {/* Basis */}
          <AnimatePresence mode="wait">
            <motion.p
              key={`b${phase}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              className="text-[9.5px] text-white/20 mb-2.5 leading-relaxed"
            >
              {cur.basis}
            </motion.p>
          </AnimatePresence>

          {/* Progress pills — clickable */}
          <div className="flex gap-1.5">
            {PHASES.map((p, i) => (
              <button
                key={i}
                onClick={() => setPhase(i)}
                className="h-[3px] rounded-full"
                style={{
                  flex:       i === phase ? 3 : 1,
                  background: i < phase  ? `${p.color}50`
                            : i === phase ? cur.color
                            : 'rgba(255,255,255,0.08)',
                  transition: 'flex 0.4s ease, background 0.4s ease',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
