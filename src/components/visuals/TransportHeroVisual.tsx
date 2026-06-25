'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { geoMercator } from 'd3-geo'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { Inbox, CheckSquare, Zap, Euro, Mail, Bell, ArrowRight, RotateCcw } from 'lucide-react'

// ─── PROJECTION ────────────────────────────────────────────────────────────────
const W = 800, H = 620
const PROJ = geoMercator()
  .scale(1800)
  .center([2.0, 46.5] as [number, number])
  .translate([W / 2, H / 2])

const gps = (lon: number, lat: number): [number, number] => {
  const p = PROJ([lon, lat])
  return p ? [p[0], p[1]] : [W / 2, H / 2]
}

// ─── CITIES ────────────────────────────────────────────────────────────────────
interface City {
  id: string; label: string; lon: number; lat: number
  zone: string; hub?: boolean; secondary?: boolean; hint: string
}

const CITIES: City[] = [
  { id: 'paris',       label: 'Paris',       lon:  2.3522, lat: 48.8566, zone: 'Île-de-France', hub: true,  hint: 'Hub principal · Départs fréquents' },
  { id: 'lille',       label: 'Lille',        lon:  3.0573, lat: 50.6292, zone: 'Nord',                      hint: 'A1 · Hauts-de-France' },
  { id: 'rennes',      label: 'Rennes',       lon: -1.6778, lat: 48.1173, zone: 'Ouest',       secondary: true, hint: 'Bretagne · LGV Atlantique' },
  { id: 'nantes',      label: 'Nantes',       lon: -1.5536, lat: 47.2184, zone: 'Ouest',                    hint: 'Loire-Atlantique · A11' },
  { id: 'bordeaux',    label: 'Bordeaux',     lon: -0.5792, lat: 44.8378, zone: 'Sud-Ouest',   hub: true,   hint: 'A10 · A63 · Gironde' },
  { id: 'toulouse',    label: 'Toulouse',     lon:  1.4442, lat: 43.6047, zone: 'Sud-Ouest',   hub: true,   hint: 'Hub Sud-Ouest · A62' },
  { id: 'strasbourg',  label: 'Strasbourg',   lon:  7.7521, lat: 48.5734, zone: 'Grand Est',   secondary: true, hint: 'Grand Est · Frontière DE' },
  { id: 'clermont',    label: 'Clermont-Fd',  lon:  3.0863, lat: 45.7772, zone: 'Centre-Est',  secondary: true, hint: 'Auvergne · A71 / A75' },
  { id: 'lyon',        label: 'Lyon',         lon:  4.8357, lat: 45.7640, zone: 'Centre-Est',  hub: true,   hint: 'Hub Centre-Est · A6 / A7' },
  { id: 'grenoble',    label: 'Grenoble',     lon:  5.7245, lat: 45.1885, zone: 'Centre-Est',  secondary: true, hint: 'Isère · Alpes · A48' },
  { id: 'montpellier', label: 'Montpellier',  lon:  3.8767, lat: 43.6119, zone: 'Sud-Est',     secondary: true, hint: 'Hérault · A9' },
  { id: 'marseille',   label: 'Marseille',    lon:  5.3698, lat: 43.2965, zone: 'Sud-Est',     hub: true,   hint: 'Hub PACA · A7' },
  { id: 'nice',        label: 'Nice',         lon:  7.2620, lat: 43.7102, zone: 'Sud-Est',                  hint: "Côte d'Azur · A8" },
]

const CITIES_XY = CITIES.map(c => ({ ...c, xy: gps(c.lon, c.lat) }))
const cityXY = (id: string): [number, number] => CITIES_XY.find(c => c.id === id)!.xy

// ─── ROUTES ────────────────────────────────────────────────────────────────────
interface RouteConfig {
  id: string; label: string; tab: string
  cityIds: string[]; pax: number; priceRaw: number; price: string
  distance: string; duration: string; color: string; glow: string
}

const ROUTES: RouteConfig[] = [
  {
    id: 'paris-nice', label: 'Paris → Nice', tab: 'Paris → Nice',
    cityIds: ['paris', 'lyon', 'nice'], pax: 28,
    priceRaw: 2340, price: '2 340', distance: '948 km', duration: '11h30',
    color: '#60A5FA', glow: 'rgba(96,165,250,0.18)',
  },
  {
    id: 'paris-bordeaux', label: 'Paris → Bordeaux', tab: 'Paris → Bordeaux',
    cityIds: ['paris', 'bordeaux'], pax: 40,
    priceRaw: 1620, price: '1 620', distance: '584 km', duration: '7h00',
    color: '#A78BFA', glow: 'rgba(167,139,250,0.18)',
  },
  {
    id: 'paris-toulouse', label: 'Paris → Toulouse', tab: 'Paris → Toulouse',
    cityIds: ['paris', 'toulouse'], pax: 55,
    priceRaw: 1850, price: '1 850', distance: '680 km', duration: '8h10',
    color: '#4ADE80', glow: 'rgba(74,222,128,0.18)',
  },
  {
    id: 'lyon-marseille', label: 'Lyon → Marseille', tab: 'Lyon → Marseille',
    cityIds: ['lyon', 'marseille'], pax: 22,
    priceRaw: 680, price: '680', distance: '312 km', duration: '3h45',
    color: '#FB923C', glow: 'rgba(251,146,60,0.18)',
  },
]

// ─── PHASES ────────────────────────────────────────────────────────────────────
const PHASE_COLORS = ['#60A5FA', '#A78BFA', '#FCD34D', '#4ADE80', '#38BDF8', '#FB923C']

interface PhaseInfo {
  step: number; Icon: React.ElementType; label: string; description: string
  m1l: string; m1v: (r: RouteConfig) => string; m1h?: boolean
  m2l: string; m2v: (r: RouteConfig) => string; m2h?: boolean
  m3l: string; m3v: (r: RouteConfig) => string; m3h?: boolean
  showPrice: boolean
}

const PHASES: PhaseInfo[] = [
  {
    step: 1, Icon: Inbox, label: 'Demande reçue',
    description: 'NeoTravel reçoit votre demande de transport de groupe.',
    m1l: 'Trajet',    m1v: r => r.label,
    m2l: 'Passagers', m2v: r => `${r.pax} pers.`,
    m3l: 'Type',      m3v: () => 'Aller-retour',
    showPrice: false,
  },
  {
    step: 2, Icon: CheckSquare, label: 'Trajet qualifié',
    description: 'Distance et zones tarifaires confirmées. Éligible calcul auto.',
    m1l: 'Distance',  m1v: r => r.distance,
    m2l: 'Durée est.', m2v: r => r.duration,
    m3l: 'Zone',      m3v: () => 'Métropole',
    showPrice: false,
  },
  {
    step: 3, Icon: Zap, label: 'Calcul du devis',
    description: 'Le moteur NeoTravel calcule le prix en temps réel.',
    m1l: 'Distance',  m1v: r => r.distance,
    m2l: 'Durée',     m2v: r => r.duration,
    m3l: 'Estimation', m3v: () => 'en cours…',
    showPrice: false,
  },
  {
    step: 4, Icon: Euro, label: 'Devis généré',
    description: 'Prix calculé ligne par ligne — traçable, auditable.',
    m1l: 'Montant',   m1v: r => `${r.price} €`, m1h: true,
    m2l: 'Base',      m2v: () => 'Km + pax + péages',
    m3l: 'Délai',     m3v: () => '< 2h',
    showPrice: true,
  },
  {
    step: 5, Icon: Mail, label: 'Devis envoyé',
    description: 'PDF + lien de suivi personnalisé envoyé par email.',
    m1l: 'Format',    m1v: () => 'PDF + lien',
    m2l: 'Délai',     m2v: () => '< 2h ouvrées',
    m3l: 'Montant',   m3v: r => `${r.price} €`, m3h: true,
    showPrice: true,
  },
  {
    step: 6, Icon: Bell, label: 'Suivi en cours',
    description: 'Relance automatique J+3. Tracking en temps réel.',
    m1l: 'Relance',   m1v: () => 'Auto J+3',
    m2l: 'Tracking',  m2v: () => 'Temps réel',
    m3l: 'Montant',   m3v: r => `${r.price} €`, m3h: true,
    showPrice: true,
  },
]

// ─── BUS POSITION ──────────────────────────────────────────────────────────────
function getBusPos(route: RouteConfig, phase: number): [number, number] {
  const pts = route.cityIds.map(cityXY)
  const n = pts.length
  const progress = phase / (PHASES.length - 1)
  const segProgress = progress * (n - 1)
  const segIdx = Math.min(Math.floor(segProgress), n - 2)
  const t = segProgress - segIdx
  const p0 = pts[segIdx], p1 = pts[segIdx + 1]
  return [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t]
}

// Segment visible threshold: seg 0 at phase≥2, seg 1 at phase≥4
const segVisible = (i: number, phase: number) => phase >= 2 + i * 2

// City activation: departure always, intermediate at phase≥2, arrival at phase≥4
const isCityActive = (idx: number, phase: number) => {
  if (idx === 0) return true
  return phase >= 2 + (idx - 1) * 2
}

// ─── PRICE COUNTER ─────────────────────────────────────────────────────────────
function usePriceCounter(target: number, active: boolean) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active) { setVal(0); return }
    const start = Date.now()
    const duration = 1500
    const tick = () => {
      const t = Math.min((Date.now() - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(target * eased))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, active])
  return val
}

// ─── BUS MARKER ────────────────────────────────────────────────────────────────
function BusMarker({ pos, color }: { pos: [number, number]; color: string }) {
  const gRef = useRef<SVGGElement>(null)
  const mx = useMotionValue(pos[0])
  const my = useMotionValue(pos[1])
  const sx = useSpring(mx, { stiffness: 36, damping: 11, mass: 1 })
  const sy = useSpring(my, { stiffness: 36, damping: 11, mass: 1 })

  useEffect(() => { mx.set(pos[0]); my.set(pos[1]) }, [pos, mx, my])
  useEffect(() => {
    const sync = () => gRef.current?.setAttribute('transform', `translate(${sx.get()},${sy.get()})`)
    const u1 = sx.on('change', sync)
    const u2 = sy.on('change', sync)
    sync()
    return () => { u1(); u2() }
  }, [sx, sy])

  return (
    <g ref={gRef} transform={`translate(${pos[0]},${pos[1]})`}>
      {/* Outer glow rings */}
      <circle r="32" fill={`${color}05`} />
      <circle r="20" fill={`${color}11`} />
      {/* Animated pulse */}
      <circle r="14" fill="none" stroke={color} strokeWidth="1" opacity="0.55">
        <animate attributeName="r" values="14;34;14" dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.55;0;0.55" dur="2.2s" repeatCount="indefinite" />
      </circle>
      {/* Second pulse, offset */}
      <circle r="10" fill="none" stroke={color} strokeWidth="0.7" opacity="0.3">
        <animate attributeName="r" values="10;26;10" dur="2.2s" begin="0.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;0;0.3" dur="2.2s" begin="0.6s" repeatCount="indefinite" />
      </circle>
      {/* Bus body */}
      <rect x="-12" y="-7" width="24" height="14" rx="4" fill={color} opacity="0.98" />
      {/* Windows */}
      <rect x="-9"   y="-4.5" width="5"   height="5" rx="1"   fill="rgba(0,8,22,0.5)" />
      <rect x="-2"   y="-4.5" width="5"   height="5" rx="1"   fill="rgba(0,8,22,0.5)" />
      <rect x="5.5"  y="-4.5" width="4"   height="5" rx="0.8" fill="rgba(0,8,22,0.5)" />
      {/* Wheels */}
      <circle cx="-6"  cy="7.5" r="2.8" fill={color} stroke="rgba(0,8,22,0.5)" strokeWidth="0.8" />
      <circle cx="6"   cy="7.5" r="2.8" fill={color} stroke="rgba(0,8,22,0.5)" strokeWidth="0.8" />
      {/* Headlight shine */}
      <circle r="1.8" cy="-2.5" fill="white" opacity="0.7" />
    </g>
  )
}

// ─── ROUTE SEGMENT ─────────────────────────────────────────────────────────────
function RouteSegment({ x1, y1, x2, y2, color, visible }: {
  x1: number; y1: number; x2: number; y2: number; color: string; visible: boolean
}) {
  return (
    <motion.path
      d={`M ${x1} ${y1} L ${x2} ${y2}`}
      fill="none" strokeLinecap="round"
      style={{ stroke: color, strokeWidth: 3.5 }}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: visible ? 1 : 0, opacity: visible ? 0.92 : 0 }}
      transition={{ duration: 1.3, ease: [0.4, 0, 0.2, 1] }}
    />
  )
}

// ─── CITY DOT ──────────────────────────────────────────────────────────────────
function CityDot({ city, isRouteCity, isActive, color, onHover, hoveredId }: {
  city: typeof CITIES_XY[0]; isRouteCity: boolean; isActive: boolean
  color: string; onHover: (id: string | null) => void; hoveredId: string | null
}) {
  const [x, y] = city.xy
  const isHov = hoveredId === city.id
  const r = city.hub ? 5.5 : isRouteCity ? 5 : city.secondary ? 2.5 : 3.5
  const labelRight = x < 560

  return (
    <g style={{ cursor: 'pointer' }}
      onMouseEnter={() => onHover(city.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Hover halo */}
      {isHov && <circle cx={x} cy={y} r="24" fill={`${color}14`} stroke={`${color}35`} strokeWidth="1" />}
      {/* Route city ring */}
      {isRouteCity && (
        <circle cx={x} cy={y} r={r + 7}
          fill="rgba(37,99,235,0.06)"
          stroke={isActive ? color : 'rgba(37,99,235,0.18)'}
          strokeWidth={isActive ? 1.5 : 0.7}
          opacity={isActive ? 1 : 0.4}
          style={{ transition: 'all 0.5s' }}
        />
      )}
      {/* Active pulse ring */}
      {isActive && (
        <circle cx={x} cy={y} r={r + 12} fill="none" stroke={color} strokeWidth="0.8" opacity="0.2">
          <animate attributeName="r" values={`${r + 12};${r + 22};${r + 12}`} dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0;0.2" dur="3s" repeatCount="indefinite" />
        </circle>
      )}
      {/* Core dot */}
      <circle cx={x} cy={y} r={r}
        fill={isActive ? color : city.hub ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)'}
        stroke={isActive ? color : 'rgba(255,255,255,0.2)'}
        strokeWidth={city.hub ? 1.2 : 0.8}
        style={{ transition: 'all 0.5s' }}
      />
      {/* Label */}
      {(!city.secondary || isHov || isActive) && (
        <text
          x={labelRight ? x + r + 8 : x - r - 8}
          y={y + 4}
          textAnchor={labelRight ? 'start' : 'end'}
          fill={isActive ? 'rgba(255,255,255,0.95)' : city.hub ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.16)'}
          fontSize={isRouteCity ? '10.5' : city.hub ? '9' : '8.5'}
          fontFamily="system-ui,-apple-system,sans-serif"
          fontWeight={isActive ? '700' : city.hub ? '500' : '400'}
          style={{ transition: 'fill 0.5s', pointerEvents: 'none' }}
        >{city.label}</text>
      )}
    </g>
  )
}

// ─── CITY TOOLTIP ──────────────────────────────────────────────────────────────
function CityTooltip({ city, color, route }: {
  city: typeof CITIES_XY[0]; color: string; route: RouteConfig
}) {
  const [cx, cy] = city.xy
  const right = cx < 430
  const BW = 168, BH = 64
  const bx = right ? cx + 20 : cx - 20 - BW
  const by = Math.max(cy - 14, 10)
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={bx - 4} y={by - 4} width={BW + 8} height={BH + 8} rx="9" fill="rgba(0,0,0,0.45)" />
      <rect x={bx} y={by} width={BW} height={BH} rx="8" fill="rgba(2,11,24,0.97)" stroke={`${color}42`} strokeWidth="1" />
      <text x={bx + 11} y={by + 17} fill="rgba(255,255,255,0.96)" fontSize="11" fontWeight="700" fontFamily="system-ui,-apple-system,sans-serif">{city.label}</text>
      <text x={bx + 11} y={by + 31} fill="rgba(255,255,255,0.38)" fontSize="9" fontFamily="system-ui,-apple-system,sans-serif">Zone : {city.zone}</text>
      <text x={bx + 11} y={by + 44} fill="rgba(255,255,255,0.28)" fontSize="8.5" fontFamily="system-ui,-apple-system,sans-serif">{city.hint}</text>
      <text x={bx + 11} y={by + 57} fill={color} fontSize="9" fontWeight="600" fontFamily="system-ui,-apple-system,sans-serif">Exemple : {route.price} € HT</text>
    </g>
  )
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function TransportHeroVisual() {
  const [routeIdx, setRouteIdx] = useState(0)
  const [phase, setPhase] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const [routeKey, setRouteKey] = useState(0)

  const route = ROUTES[routeIdx]
  const cur = PHASES[phase]
  const phaseColor = PHASE_COLORS[phase]
  const showPrice = cur.showPrice
  const displayPrice = usePriceCounter(route.priceRaw, showPrice)

  const handleHover = useCallback((id: string | null) => setHovered(id), [])
  const hovCity = hovered ? CITIES_XY.find(c => c.id === hovered) : null

  const switchRoute = (i: number) => {
    setRouteIdx(i)
    setPhase(0)
    setRouteKey(k => k + 1)
    setPaused(false)
  }

  const restart = () => {
    setPhase(0)
    setRouteKey(k => k + 1)
    setPaused(false)
  }

  // Auto-advance phases
  useEffect(() => {
    if (paused || hovered) return
    const id = setInterval(() => setPhase(p => (p + 1) % PHASES.length), 3000)
    return () => clearInterval(id)
  }, [paused, hovered, routeIdx])

  const routeCities = route.cityIds
  const bgCities = CITIES_XY.filter(c => !routeCities.includes(c.id))

  return (
    <div
      className="relative h-full w-full select-none overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(150deg, #020B18 0%, #030E1F 60%, #040F1C 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 32px 64px rgba(0,0,0,0.5)',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); setHovered(null) }}
    >
      {/* Grid texture */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(37,99,235,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.028) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      {/* Route color glow top-right */}
      <motion.div
        key={routeIdx}
        className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{ background: `radial-gradient(ellipse at top right, ${route.glow} 0%, transparent 65%)` }}
      />
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-[1]" style={{
        background: 'radial-gradient(ellipse at 50% 50%, transparent 44%, rgba(2,11,24,0.72) 100%)',
      }} />

      {/* ── Route selector tabs ── */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex gap-1">
        {ROUTES.map((r, i) => (
          <motion.button
            key={r.id}
            onClick={() => switchRoute(i)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="px-2.5 py-1 rounded-lg text-[9.5px] font-bold transition-all duration-250"
            style={{
              background: routeIdx === i ? r.color : 'rgba(255,255,255,0.06)',
              color: routeIdx === i ? 'rgba(0,8,22,0.88)' : 'rgba(255,255,255,0.38)',
              border: `1px solid ${routeIdx === i ? r.color : 'rgba(255,255,255,0.07)'}`,
              boxShadow: routeIdx === i ? `0 0 12px ${r.glow}` : 'none',
            }}
          >
            {r.tab}
          </motion.button>
        ))}
      </div>

      {/* ── Journey card (top-left) ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`card-${routeIdx}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.35 }}
          className="absolute top-3 left-3 z-10 rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(2,11,24,0.9)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}
        >
          <p className="text-[8px] text-white/30 uppercase tracking-widest mb-1 font-mono">Trajet simulé</p>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[13px] font-bold text-white">{CITIES_XY.find(c => c.id === routeCities[0])?.label}</span>
            <ArrowRight className="w-3 h-3 text-white/35" />
            <span className="text-[13px] font-bold text-white">{CITIES_XY.find(c => c.id === routeCities[routeCities.length - 1])?.label}</span>
          </div>
          <div className="text-[9px] text-white/38">{route.pax} pass. · {route.distance} · {route.duration}</div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <span className="text-[8.5px] text-green-400/80 font-medium">Réponse &lt; 2h ouvrées</span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Step counter + restart (top-right) ── */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <button
          onClick={restart}
          className="flex items-center justify-center w-6 h-6 rounded-lg transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          title="Relancer"
        >
          <RotateCcw className="w-3 h-3 text-white/30" />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(2,11,24,0.8)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}
        >
          <AnimatePresence mode="wait">
            <motion.div key={phase}
              initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-2 h-2 rounded-full" style={{ background: phaseColor }}
            />
          </AnimatePresence>
          <span className="text-[10px] text-white/38 font-mono tabular-nums">
            Étape {cur.step}&thinsp;/&thinsp;{PHASES.length}
          </span>
        </div>
      </div>

      {/* ── France map ── */}
      <div className="absolute inset-0 z-[2]">
        <ComposableMap
          projection="geoMercator"
          width={W} height={H}
          projectionConfig={{ scale: 1800, center: [2.0, 46.5] as [number, number] }}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          {/* France shape */}
          <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json">
            {({ geographies }) =>
              geographies.filter(geo => geo.id === '250').map(geo => (
                <Geography key={geo.rsmKey} geography={geo}
                  fill="rgba(37,99,235,0.048)" stroke="rgba(37,99,235,0.3)" strokeWidth={1.3}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: 'rgba(37,99,235,0.048)' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Ghost trail for all segments */}
          {routeCities.slice(0, -1).map((id, i) => {
            const p1 = cityXY(id), p2 = cityXY(routeCities[i + 1])
            return (
              <path key={`ghost-${routeKey}-${i}`}
                d={`M ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]}`}
                fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2"
                strokeDasharray="7 8" strokeLinecap="round"
              />
            )
          })}

          {/* Active route segments */}
          {routeCities.slice(0, -1).map((id, i) => {
            const p1 = cityXY(id), p2 = cityXY(routeCities[i + 1])
            return (
              <RouteSegment key={`seg-${routeKey}-${i}`}
                x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]}
                color={route.color} visible={segVisible(i, phase)}
              />
            )
          })}

          {/* Background cities (non-route) */}
          {bgCities.map(city => (
            <CityDot key={city.id} city={city}
              isRouteCity={false} isActive={false}
              color={route.color} onHover={handleHover} hoveredId={hovered}
            />
          ))}

          {/* Route cities — on top */}
          {routeCities.map((id, idx) => {
            const city = CITIES_XY.find(c => c.id === id)!
            return (
              <CityDot key={city.id} city={city}
                isRouteCity isActive={isCityActive(idx, phase)}
                color={route.color} onHover={handleHover} hoveredId={hovered}
              />
            )
          })}

          {/* Tooltip */}
          {hovCity && <CityTooltip city={hovCity} color={route.color} route={route} />}

          {/* Bus */}
          <BusMarker pos={getBusPos(route, phase)} color={route.color} />
        </ComposableMap>
      </div>

      {/* ── Bottom step panel ── */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <motion.div
          className="rounded-2xl px-4 pt-3 pb-3"
          animate={{ borderColor: `${phaseColor}28` }}
          transition={{ duration: 0.5 }}
          style={{
            background: 'rgba(2,11,24,0.96)',
            border: `1px solid ${phaseColor}28`,
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <AnimatePresence mode="wait">
              <motion.div key={`step-${phase}`}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2.5"
              >
                <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${phaseColor}1e` }}>
                  <cur.Icon className="w-4 h-4" style={{ color: phaseColor }} />
                </div>
                <div>
                  <p className="text-[9px] text-white/28 uppercase tracking-wider font-mono leading-none mb-0.5">
                    Étape {cur.step} / {PHASES.length}
                  </p>
                  <p className="text-xs font-bold" style={{ color: phaseColor }}>{cur.label}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Price badge with counter animation */}
            <AnimatePresence>
              {showPrice && (
                <motion.div
                  key={`price-${routeIdx}`}
                  initial={{ opacity: 0, scale: 0.8, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
                  className="flex flex-col items-end"
                >
                  <p className="text-[8px] text-white/28 uppercase tracking-wider font-mono mb-0.5">Estimé TTC</p>
                  <div className="px-3 py-1 rounded-xl text-sm font-bold tabular-nums"
                    style={{
                      background: `${phaseColor}18`,
                      color: phaseColor,
                      border: `1px solid ${phaseColor}35`,
                      boxShadow: `0 0 16px ${phaseColor}20`,
                    }}
                  >
                    {displayPrice.toLocaleString('fr-FR')} € HT
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Description */}
          <AnimatePresence mode="wait">
            <motion.p key={`desc-${phase}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-[10px] text-white/40 mb-2 leading-relaxed"
            >
              {cur.description}
            </motion.p>
          </AnimatePresence>

          {/* Metrics */}
          <AnimatePresence mode="wait">
            <motion.div key={`metrics-${phase}-${routeIdx}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-3 gap-2 mb-2.5"
            >
              {[
                { label: cur.m1l, value: cur.m1v(route), hl: cur.m1h },
                { label: cur.m2l, value: cur.m2v(route), hl: cur.m2h },
                { label: cur.m3l, value: cur.m3v(route), hl: cur.m3h },
              ].map(m => (
                <div key={m.label} className="rounded-xl px-2.5 py-1.5"
                  style={{ background: 'rgba(255,255,255,0.032)' }}>
                  <p className="text-[7.5px] text-white/25 uppercase tracking-wide mb-0.5">{m.label}</p>
                  <p className="text-[10px] font-semibold truncate"
                    style={{ color: m.hl ? phaseColor : 'rgba(255,255,255,0.72)' }}
                  >{m.value}</p>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Progress pills — clickable */}
          <div className="flex gap-1.5">
            {PHASES.map((_, i) => (
              <button key={i}
                onClick={() => { setPhase(i); setPaused(true) }}
                className="h-[3px] rounded-full"
                style={{
                  flex: i === phase ? 3 : 1,
                  background: i < phase ? `${PHASE_COLORS[i]}55` : i === phase ? phaseColor : 'rgba(255,255,255,0.07)',
                  transition: 'flex 0.45s ease, background 0.45s ease',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
