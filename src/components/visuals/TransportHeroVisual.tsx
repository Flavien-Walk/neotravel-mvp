'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { geoMercator } from 'd3-geo'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion'
import { Inbox, CheckSquare, Zap, Euro, Mail, Bell, RotateCcw, MousePointerClick } from 'lucide-react'

// ─── PROJECTION ────────────────────────────────────────────────────────────────
const W = 800, H = 660
const PROJ = geoMercator()
  .scale(1900)
  .center([2.3, 46.8] as [number, number])
  .translate([W / 2, H / 2])

const gps = (lon: number, lat: number): [number, number] => {
  const p = PROJ([lon, lat])
  return p ? [p[0], p[1]] : [W / 2, H / 2]
}

// ─── CITY DATA ─────────────────────────────────────────────────────────────────
interface CityData {
  id: string; label: string; lon: number; lat: number
  zone: string; hub?: boolean; secondary?: boolean
  price: number; distance: string; duration: string; pax: number
  hint: string
}

const CITIES: CityData[] = [
  { id: 'paris',       label: 'Paris',       lon:  2.3522, lat: 48.8566, zone: 'Île-de-France', hub: true,  price: 0,    distance: '—',    duration: '—',     pax: 0,  hint: 'Hub principal NeoTravel' },
  { id: 'lille',       label: 'Lille',        lon:  3.0573, lat: 50.6292, zone: 'Nord',                      price: 680,  distance: '225 km', duration: '3h00', pax: 35, hint: 'Hauts-de-France · A1' },
  { id: 'rennes',      label: 'Rennes',       lon: -1.6778, lat: 48.1173, zone: 'Bretagne',                  price: 890,  distance: '350 km', duration: '4h20', pax: 42, hint: 'Bretagne · A11' },
  { id: 'nantes',      label: 'Nantes',       lon: -1.5536, lat: 47.2184, zone: 'Pays de la Loire',          price: 1050, distance: '385 km', duration: '4h40', pax: 38, hint: 'Loire-Atlantique · A11' },
  { id: 'bordeaux',    label: 'Bordeaux',     lon: -0.5792, lat: 44.8378, zone: 'Nouvelle-Aquitaine', hub: true, price: 1620, distance: '584 km', duration: '7h00', pax: 40, hint: 'A10 · A63 · Gironde' },
  { id: 'toulouse',    label: 'Toulouse',     lon:  1.4442, lat: 43.6047, zone: 'Occitanie',     hub: true,  price: 1850, distance: '683 km', duration: '8h10', pax: 55, hint: 'Hub Sud-Ouest · A62' },
  { id: 'strasbourg',  label: 'Strasbourg',   lon:  7.7521, lat: 48.5734, zone: 'Grand Est',     secondary: true, price: 1380, distance: '490 km', duration: '5h50', pax: 28, hint: 'Grand Est · Frontière DE' },
  { id: 'clermont',    label: 'Clermont-Fd',  lon:  3.0863, lat: 45.7772, zone: 'Auvergne',      secondary: true, price: 1100, distance: '425 km', duration: '5h10', pax: 30, hint: 'Auvergne · A71 / A75' },
  { id: 'lyon',        label: 'Lyon',         lon:  4.8357, lat: 45.7640, zone: 'Auvergne-Rhône-Alpes', hub: true, price: 1420, distance: '465 km', duration: '5h30', pax: 50, hint: 'Hub Centre-Est · A6 / A7' },
  { id: 'grenoble',    label: 'Grenoble',     lon:  5.7245, lat: 45.1885, zone: 'Isère',         secondary: true, price: 1560, distance: '560 km', duration: '6h30', pax: 32, hint: 'Isère · Alpes · A48' },
  { id: 'montpellier', label: 'Montpellier',  lon:  3.8767, lat: 43.6119, zone: 'Occitanie',     secondary: true, price: 2100, distance: '750 km', duration: '8h50', pax: 45, hint: 'Hérault · A9' },
  { id: 'marseille',   label: 'Marseille',    lon:  5.3698, lat: 43.2965, zone: 'Provence-Alpes', hub: true, price: 2200, distance: '775 km', duration: '9h10', pax: 60, hint: 'Hub PACA · A7' },
  { id: 'nice',        label: 'Nice',         lon:  7.2620, lat: 43.7102, zone: "Côte d'Azur",              price: 2340, distance: '940 km', duration: '11h30', pax: 28, hint: "Côte d'Azur · A8" },
]

const CITIES_XY = CITIES.map(c => ({ ...c, xy: gps(c.lon, c.lat) }))
const cityById = (id: string) => CITIES_XY.find(c => c.id === id)!

// Cities that route via Lyon when coming from Paris
const VIA_LYON = new Set(['lyon', 'grenoble', 'montpellier', 'marseille', 'nice'])

function getRoute(destId: string): string[] {
  if (destId === 'paris') return ['paris']
  if (VIA_LYON.has(destId) && destId !== 'lyon') return ['paris', 'lyon', destId]
  return ['paris', destId]
}

// Phase config
const PHASE_COLORS = ['#60A5FA', '#A78BFA', '#FCD34D', '#4ADE80', '#38BDF8', '#FB923C']

interface PhaseInfo {
  step: number; Icon: React.ElementType; label: string
  desc: string; showPrice: boolean
}

const PHASES: PhaseInfo[] = [
  { step: 1, Icon: Inbox,       label: 'Demande reçue',   desc: 'Demande de transport reçue et enregistrée.', showPrice: false },
  { step: 2, Icon: CheckSquare, label: 'Trajet qualifié', desc: 'Distance et zone tarifaire confirmées.',      showPrice: false },
  { step: 3, Icon: Zap,         label: 'Calcul du prix',  desc: 'Moteur NeoTravel en cours de calcul.',       showPrice: false },
  { step: 4, Icon: Euro,        label: 'Devis généré',    desc: 'Prix calculé ligne par ligne — traçable.',   showPrice: true  },
  { step: 5, Icon: Mail,        label: 'Devis envoyé',    desc: 'PDF + lien de suivi envoyé par email.',      showPrice: true  },
  { step: 6, Icon: Bell,        label: 'Suivi actif',     desc: 'Relance auto J+3 · Tracking en temps réel.', showPrice: true  },
]

// Price counter
function usePriceCounter(target: number, active: boolean) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!active || target === 0) { setVal(0); return }
    const start = Date.now()
    const dur = 1400
    const tick = () => {
      const t = Math.min((Date.now() - start) / dur, 1)
      const e = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(target * e))
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target, active])
  return val
}

// Bus marker with spring physics
function BusMarker({ pos, color }: { pos: [number, number]; color: string }) {
  const gRef = useRef<SVGGElement>(null)
  const mx = useMotionValue(pos[0])
  const my = useMotionValue(pos[1])
  const sx = useSpring(mx, { stiffness: 32, damping: 10, mass: 1.1 })
  const sy = useSpring(my, { stiffness: 32, damping: 10, mass: 1.1 })

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
      <circle r="36" fill={`${color}04`} />
      <circle r="22" fill={`${color}10`} />
      <circle r="15" fill="none" stroke={color} strokeWidth="1">
        <animate attributeName="r" values="15;38;15" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0;0.6" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <circle r="10" fill="none" stroke={color} strokeWidth="0.7">
        <animate attributeName="r" values="10;24;10" dur="2.4s" begin="0.7s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.35;0;0.35" dur="2.4s" begin="0.7s" repeatCount="indefinite" />
      </circle>
      {/* Body */}
      <rect x="-13" y="-7.5" width="26" height="15" rx="4.5" fill={color} opacity="0.97" />
      {/* Windows */}
      <rect x="-10" y="-5" width="6" height="5.5" rx="1.2" fill="rgba(0,8,22,0.52)" />
      <rect x="-2"  y="-5" width="6" height="5.5" rx="1.2" fill="rgba(0,8,22,0.52)" />
      <rect x="6.5" y="-5" width="4" height="5.5" rx="0.9" fill="rgba(0,8,22,0.52)" />
      {/* Wheels */}
      <circle cx="-7"  cy="8.5" r="3" fill={color} stroke="rgba(0,8,22,0.5)" strokeWidth="0.9" />
      <circle cx="7"   cy="8.5" r="3" fill={color} stroke="rgba(0,8,22,0.5)" strokeWidth="0.9" />
      {/* Shine */}
      <circle r="2" cy="-3" fill="white" opacity="0.7" />
    </g>
  )
}

// Route segment
function RouteSegment({ p1, p2, color, visible }: {
  p1: [number, number]; p2: [number, number]; color: string; visible: boolean
}) {
  return (
    <motion.path
      d={`M ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]}`}
      fill="none" strokeLinecap="round"
      style={{ stroke: color, strokeWidth: 4 }}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: visible ? 1 : 0, opacity: visible ? 0.95 : 0 }}
      transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1] }}
    />
  )
}

// City tooltip — rich SVG card
function CityTooltip({ city, color, isActive }: {
  city: typeof CITIES_XY[0]; color: string; isActive: boolean
}) {
  const [cx, cy] = city.xy
  const right = cx < 420
  const W2 = 188, H2 = city.id === 'paris' ? 48 : 82
  const bx = right ? cx + 22 : cx - 22 - W2
  const by = Math.max(cy - H2 / 2, 10)

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Drop shadow */}
      <rect x={bx - 4} y={by - 4} width={W2 + 8} height={H2 + 8} rx="10" fill="rgba(0,0,0,0.55)" />
      {/* Card */}
      <rect x={bx} y={by} width={W2} height={H2} rx="9" fill="rgba(2,10,22,0.97)" stroke={`${color}50`} strokeWidth="1.2" />
      {/* Connector */}
      <circle cx={right ? bx : bx + W2} cy={by + H2 / 2} r="4" fill={color} />
      <line x1={right ? bx : bx + W2} y1={by + H2 / 2} x2={cx} y2={cy} stroke={`${color}40`} strokeWidth="1" strokeDasharray="4 3" />

      {/* City name */}
      <text x={bx + 12} y={by + 18} fill="rgba(255,255,255,0.95)" fontSize="13" fontWeight="700" fontFamily="system-ui,-apple-system,sans-serif">{city.label}</text>

      {city.id !== 'paris' && (
        <>
          <text x={bx + 12} y={by + 34} fill="rgba(255,255,255,0.38)" fontSize="9.5" fontFamily="system-ui,-apple-system,sans-serif">{city.hint}</text>
          <rect x={bx + 10} y={by + 42} width={W2 - 20} height={22} rx="5" fill={`${color}14`} stroke={`${color}28`} strokeWidth="0.8" />
          <text x={bx + 20} y={by + 57} fill={color} fontSize="9.5" fontWeight="600" fontFamily="system-ui,-apple-system,sans-serif">
            Paris → {city.label} · dès {city.price.toLocaleString('fr-FR')} € HT
          </text>
          {!isActive && (
            <text x={bx + W2 - 14} y={by + 57} fill={`${color}70`} fontSize="9" fontFamily="system-ui,-apple-system,sans-serif" textAnchor="end">cliquer ↗</text>
          )}
          {isActive && (
            <text x={bx + W2 - 14} y={by + 57} fill={`${color}80`} fontSize="9" fontFamily="system-ui,-apple-system,sans-serif" textAnchor="end">✓ sélectionné</text>
          )}
        </>
      )}
    </g>
  )
}

// Bus position on a route for a given phase
function getBusPos(routeIds: string[], phase: number): [number, number] {
  const pts = routeIds.map(id => cityById(id).xy)
  const n = pts.length
  if (n === 1) return pts[0]
  const progress = phase / (PHASES.length - 1)
  const sp = progress * (n - 1)
  const idx = Math.min(Math.floor(sp), n - 2)
  const t = sp - idx
  return [pts[idx][0] + (pts[idx + 1][0] - pts[idx][0]) * t, pts[idx][1] + (pts[idx + 1][1] - pts[idx][1]) * t]
}

const segVisible = (i: number, phase: number) => phase >= 2 + i * 2
const isCityActive = (routeIds: string[], id: string, phase: number) => {
  const idx = routeIds.indexOf(id)
  if (idx === -1) return false
  if (idx === 0) return true
  return phase >= 2 + (idx - 1) * 2
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
export default function TransportHeroVisual() {
  const [destId, setDestId] = useState('nice')
  const [phase, setPhase] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const [animKey, setAnimKey] = useState(0)
  const [showHint, setShowHint] = useState(true)

  const dest = cityById(destId)
  const routeIds = getRoute(destId)
  const cur = PHASES[phase]
  const phaseColor = PHASE_COLORS[phase]
  const displayPrice = usePriceCounter(dest.price, cur.showPrice)

  // Fade hint after 4s
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 4000)
    return () => clearTimeout(t)
  }, [])

  // Auto-advance
  useEffect(() => {
    if (paused || hovered) return
    const id = setInterval(() => setPhase(p => (p + 1) % PHASES.length), 3000)
    return () => clearInterval(id)
  }, [paused, hovered, destId])

  const selectDest = useCallback((id: string) => {
    if (id === 'paris') return
    setDestId(id)
    setPhase(0)
    setAnimKey(k => k + 1)
    setShowHint(false)
    setPaused(false)
  }, [])

  const restart = () => { setPhase(0); setAnimKey(k => k + 1); setPaused(false) }
  const handleHover = useCallback((id: string | null) => setHovered(id), [])
  const hovCity = hovered ? CITIES_XY.find(c => c.id === hovered) : null
  const bgCities = CITIES_XY.filter(c => !routeIds.includes(c.id))

  return (
    <div
      className="relative h-full w-full select-none overflow-hidden rounded-2xl"
      style={{
        background: 'linear-gradient(150deg, #010916 0%, #030E1F 55%, #040F1C 100%)',
        boxShadow: '0 0 0 1px rgba(255,255,255,0.06), 0 32px 80px rgba(0,0,0,0.6)',
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); setHovered(null) }}
    >
      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(37,99,235,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.025) 1px, transparent 1px)',
        backgroundSize: '38px 38px',
      }} />
      {/* Glow — changes with dest city */}
      <motion.div key={destId} className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}
        style={{ background: `radial-gradient(ellipse 65% 55% at 72% 30%, ${phaseColor}12 0%, transparent 65%)` }}
      />
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-[1]" style={{
        background: 'radial-gradient(ellipse at 50% 50%, transparent 38%, rgba(1,9,22,0.75) 100%)',
      }} />

      {/* ── Top bar: journey info + step + restart ── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 pt-3 pb-0 gap-2">

        {/* Journey pill */}
        <AnimatePresence mode="wait">
          <motion.div key={`dest-${destId}`}
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(2,11,24,0.92)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <span className="text-[11px] font-bold text-white">Paris</span>
            <span className="text-[10px] text-white/30">→</span>
            <span className="text-[11px] font-bold" style={{ color: phaseColor }}>{dest.label}</span>
            {routeIds.includes('lyon') && destId !== 'lyon' && (
              <span className="text-[8.5px] text-white/25 font-mono">via Lyon</span>
            )}
            {dest.price > 0 && (
              <span className="text-[9px] text-white/35 font-mono ml-1">{dest.distance} · {dest.duration}</span>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Right: step + restart */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
            style={{ background: 'rgba(2,11,24,0.85)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}
          >
            <AnimatePresence mode="wait">
              <motion.div key={phase} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: phaseColor }}
              />
            </AnimatePresence>
            <span className="text-[9.5px] text-white/35 font-mono">Étape {cur.step}/6</span>
          </div>
          <button onClick={restart}
            className="flex items-center justify-center w-7 h-7 rounded-xl transition-all hover:bg-white/10"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <RotateCcw className="w-3 h-3 text-white/30" />
          </button>
        </div>
      </div>

      {/* ── MAP ── */}
      <div className="absolute inset-0 z-[2]" style={{ bottom: '128px' }}>
        <ComposableMap
          projection="geoMercator"
          width={W} height={H}
          projectionConfig={{ scale: 1900, center: [2.3, 46.8] as [number, number] }}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          {/* France shape */}
          <Geographies geography="https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json">
            {({ geographies }) =>
              geographies.filter(g => g.id === '250').map(geo => (
                <Geography key={geo.rsmKey} geography={geo}
                  fill="rgba(37,99,235,0.055)" stroke="rgba(37,99,235,0.32)" strokeWidth={1.4}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: 'rgba(37,99,235,0.055)' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Ghost trails */}
          {routeIds.slice(0, -1).map((id, i) => {
            const p1 = cityById(id).xy, p2 = cityById(routeIds[i + 1]).xy
            return (
              <path key={`g-${animKey}-${i}`}
                d={`M ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]}`}
                fill="none" stroke="rgba(255,255,255,0.055)" strokeWidth="2.5"
                strokeDasharray="8 9" strokeLinecap="round"
              />
            )
          })}

          {/* Active segments */}
          {routeIds.slice(0, -1).map((id, i) => (
            <RouteSegment key={`s-${animKey}-${i}`}
              p1={cityById(id).xy} p2={cityById(routeIds[i + 1]).xy}
              color={phaseColor} visible={segVisible(i, phase)}
            />
          ))}

          {/* Background cities */}
          {bgCities.map(city => {
            const [x, y] = city.xy
            const r = city.hub ? 7 : city.secondary ? 3.5 : 5
            const isHov = hovered === city.id
            const labelRight = x < 560
            return (
              <g key={city.id} style={{ cursor: 'pointer' }}
                onMouseEnter={() => handleHover(city.id)}
                onMouseLeave={() => handleHover(null)}
                onClick={() => selectDest(city.id)}
              >
                {isHov && (
                  <>
                    <circle cx={x} cy={y} r={r + 14} fill={`${phaseColor}10`} stroke={`${phaseColor}30`} strokeWidth="1" />
                    <circle cx={x} cy={y} r={r + 7} fill={`${phaseColor}08`} />
                  </>
                )}
                <circle cx={x} cy={y} r={r}
                  fill={isHov ? phaseColor : city.hub ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)'}
                  stroke={isHov ? phaseColor : 'rgba(255,255,255,0.22)'}
                  strokeWidth={city.hub ? 1.3 : 0.9}
                  style={{ transition: 'all 0.3s' }}
                />
                {(!city.secondary || isHov) && (
                  <text
                    x={labelRight ? x + r + 9 : x - r - 9}
                    y={y + 5}
                    textAnchor={labelRight ? 'start' : 'end'}
                    fill={isHov ? 'rgba(255,255,255,0.95)' : city.hub ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.2)'}
                    fontSize={city.hub ? '12' : '11'}
                    fontFamily="system-ui,-apple-system,sans-serif"
                    fontWeight={isHov ? '700' : city.hub ? '500' : '400'}
                    style={{ transition: 'fill 0.3s', pointerEvents: 'none' }}
                  >{city.label}</text>
                )}
              </g>
            )
          })}

          {/* Route cities */}
          {routeIds.map((id, idx) => {
            const city = cityById(id)
            const [x, y] = city.xy
            const active = isCityActive(routeIds, id, phase)
            const isHov = hovered === id
            const r = city.hub ? 8 : 7
            const labelRight = x < 560
            return (
              <g key={`rc-${id}`} style={{ cursor: id !== 'paris' ? 'pointer' : 'default' }}
                onMouseEnter={() => handleHover(id)}
                onMouseLeave={() => handleHover(null)}
              >
                {/* Outer glow ring */}
                <circle cx={x} cy={y} r={r + 9}
                  fill="rgba(37,99,235,0.05)"
                  stroke={active ? phaseColor : 'rgba(37,99,235,0.22)'}
                  strokeWidth={active ? 1.6 : 0.8}
                  opacity={active ? 1 : 0.45}
                  style={{ transition: 'all 0.5s' }}
                />
                {/* Pulse ring for active */}
                {active && (
                  <circle cx={x} cy={y} r={r + 16} fill="none" stroke={phaseColor} strokeWidth="0.8" opacity="0.2">
                    <animate attributeName="r" values={`${r + 16};${r + 28};${r + 16}`} dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.2;0;0.2" dur="3s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Hover halo */}
                {isHov && <circle cx={x} cy={y} r={r + 20} fill={`${phaseColor}10`} stroke={`${phaseColor}25`} strokeWidth="1" />}
                {/* Core */}
                <circle cx={x} cy={y} r={r}
                  fill={active ? phaseColor : 'rgba(255,255,255,0.12)'}
                  stroke={active ? phaseColor : 'rgba(255,255,255,0.25)'}
                  strokeWidth="1.4"
                  style={{ transition: 'all 0.5s' }}
                />
                {/* Inner dot */}
                {active && <circle cx={x} cy={y} r={r * 0.35} fill="rgba(0,8,22,0.55)" />}
                {/* Label */}
                <text
                  x={labelRight ? x + r + 11 : x - r - 11}
                  y={y + 5}
                  textAnchor={labelRight ? 'start' : 'end'}
                  fill={active ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.42)'}
                  fontSize="13.5"
                  fontFamily="system-ui,-apple-system,sans-serif"
                  fontWeight={active ? '800' : '500'}
                  style={{ transition: 'fill 0.5s', pointerEvents: 'none' }}
                >{city.label}</text>
                {/* Leg label (non-Paris non-Paris route stop) */}
                {idx > 0 && idx < routeIds.length - 1 && (
                  <text
                    x={labelRight ? x + r + 11 : x - r - 11}
                    y={y + 20}
                    textAnchor={labelRight ? 'start' : 'end'}
                    fill={`${phaseColor}60`}
                    fontSize="9"
                    fontFamily="system-ui,-apple-system,sans-serif"
                    style={{ pointerEvents: 'none' }}
                  >étape intermédiaire</text>
                )}
              </g>
            )
          })}

          {/* Tooltip — toutes les villes sauf Paris */}
          {hovCity && hovCity.id !== 'paris' && (
            <CityTooltip city={hovCity} color={phaseColor} isActive={routeIds.includes(hovCity.id)} />
          )}

          {/* Bus */}
          <BusMarker pos={getBusPos(routeIds, phase)} color={phaseColor} />
        </ComposableMap>
      </div>

      {/* Interaction hint — fades after 4s */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              bottom: '164px',
              background: 'rgba(2,11,24,0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              pointerEvents: 'none',
            }}
          >
            <MousePointerClick className="w-3 h-3 text-white/40" />
            <span className="text-[9.5px] text-white/40 font-medium">Cliquez une ville pour simuler ce trajet</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom step panel ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-3">
        <motion.div
          className="rounded-2xl px-4 py-3"
          animate={{ borderColor: `${phaseColor}28` }}
          style={{
            background: 'rgba(1,9,22,0.97)',
            border: `1px solid ${phaseColor}28`,
            backdropFilter: 'blur(24px)',
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <AnimatePresence mode="wait">
              <motion.div key={`step-${phase}`}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                className="flex items-center gap-2.5"
              >
                <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${phaseColor}1c` }}>
                  <cur.Icon className="w-3.5 h-3.5" style={{ color: phaseColor }} />
                </div>
                <div>
                  <p className="text-[8.5px] text-white/25 uppercase tracking-wider font-mono leading-none mb-0.5">
                    Étape {cur.step} / 6
                  </p>
                  <p className="text-[11px] font-bold" style={{ color: phaseColor }}>{cur.label}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Price */}
            <AnimatePresence>
              {cur.showPrice && dest.price > 0 && (
                <motion.div key={`price-${destId}`}
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 220 }}
                >
                  <p className="text-[7.5px] text-white/25 font-mono uppercase tracking-wider text-right mb-0.5">Estimé HT</p>
                  <div className="px-3 py-1 rounded-xl text-sm font-bold tabular-nums"
                    style={{
                      background: `${phaseColor}18`,
                      color: phaseColor,
                      border: `1px solid ${phaseColor}35`,
                      boxShadow: `0 0 18px ${phaseColor}22`,
                    }}
                  >
                    {displayPrice.toLocaleString('fr-FR')} €
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.p key={`d-${phase}`}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-[9.5px] text-white/38 mb-2"
            >{cur.desc}</motion.p>
          </AnimatePresence>

          {/* 3-metric strip */}
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            {[
              { l: 'Distance',  v: dest.distance || '—' },
              { l: 'Durée',     v: dest.duration || '—' },
              { l: 'Passagers', v: dest.pax ? `${dest.pax} pers.` : '—' },
            ].map(m => (
              <div key={m.l} className="rounded-lg px-2.5 py-1.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-[7.5px] text-white/22 uppercase tracking-wide mb-0.5">{m.l}</p>
                <p className="text-[9.5px] font-semibold text-white/70">{m.v}</p>
              </div>
            ))}
          </div>

          {/* Progress pills */}
          <div className="flex gap-1.5">
            {PHASES.map((_, i) => (
              <button key={i} onClick={() => { setPhase(i); setPaused(true) }}
                className="h-[3px] rounded-full"
                style={{
                  flex: i === phase ? 3 : 1,
                  background: i < phase ? `${PHASE_COLORS[i]}55` : i === phase ? phaseColor : 'rgba(255,255,255,0.07)',
                  transition: 'flex 0.4s ease, background 0.45s ease',
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
