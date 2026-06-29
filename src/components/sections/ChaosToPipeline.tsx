'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import {
  Inbox, Phone, MessageSquare, BellOff, FileSpreadsheet,
  ArrowRight,
} from 'lucide-react'
import { SealCheck } from '@phosphor-icons/react'
import Link from 'next/link'

const CHAOS = [
  { Icon: Inbox,           text: 'Email non lu',      sub: 'jamais traité',  x: -148, y: -82, rot: -13 },
  { Icon: Phone,           text: 'Appel sans suite',   sub: 'aucune trace',   x:  118, y: -62, rot:   9 },
  { Icon: MessageSquare,   text: 'WhatsApp ignoré',    sub: 'lu, oublié',     x: -100, y:  38, rot:  -7 },
  { Icon: BellOff,         text: 'Relance oubliée',    sub: 'lead perdu',     x:  130, y:  55, rot:  12 },
  { Icon: FileSpreadsheet, text: 'Devis Excel 40 min', sub: 'non traçable',   x:  -44, y: 108, rot:  -9 },
]

const PIPELINE = [
  { img: '/images/neotravel/demande-centralise.png', label: 'Demande centralisée', color: '#60A5FA' },
  { img: '/images/neotravel/trajet-qualifie.png',    label: 'Trajet qualifié',      color: '#A78BFA' },
  { img: '/images/neotravel/prix-calcule.png',       label: 'Prix calculé',          color: '#4ADE80' },
  { img: '/images/neotravel/devis-envoye.png',       label: 'Devis envoyé',          color: '#38BDF8' },
  { img: '/images/neotravel/suivie-automatique.png', label: 'Suivi automatique',     color: '#FCD34D' },
]

function lerp(from: number, to: number, p: number, pFrom: number, pTo: number): number {
  if (pTo === pFrom) return p >= pTo ? to : from
  return from + (to - from) * Math.max(0, Math.min(1, (p - pFrom) / (pTo - pFrom)))
}

export default function ChaosToPipeline() {
  const sectionRef   = useRef<HTMLDivElement>(null)
  const chaosRef     = useRef<HTMLDivElement>(null)
  const arrowRef     = useRef<HTMLDivElement>(null)
  const pipeRef      = useRef<HTMLDivElement>(null)
  const statsRef     = useRef<HTMLDivElement>(null)
  const ctaRef       = useRef<HTMLDivElement>(null)
  const hintRef      = useRef<HTMLDivElement>(null)
  const avantRef     = useRef<HTMLSpanElement>(null)
  const apresRef     = useRef<HTMLSpanElement>(null)
  const phaseBarRef  = useRef<HTMLDivElement>(null)
  const pipeItems    = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    function update() {
      const rect  = section!.getBoundingClientRect()
      const total = section!.offsetHeight - window.innerHeight
      const p     = Math.max(0, Math.min(1, -rect.top / total))

      const chaosOp = lerp(1, 0, p, 0.12, 0.38)
      const arrowOp = p < 0.28 ? 0
        : p < 0.46 ? lerp(0, 1, p, 0.28, 0.46)
        : p < 0.62 ? 1
        : lerp(1, 0, p, 0.62, 0.72)
      const pipeOp  = lerp(0, 1, p, 0.44, 0.68)
      const statsOp = lerp(0, 1, p, 0.76, 0.91)
      const hintOp  = lerp(1, 0, p, 0, 0.05)
      const avantOp = lerp(1, 0, p, 0.22, 0.38)
      const apresOp = lerp(0, 1, p, 0.50, 0.65)

      if (chaosRef.current)    chaosRef.current.style.opacity    = String(chaosOp)
      if (arrowRef.current)    arrowRef.current.style.opacity    = String(arrowOp)
      if (arrowRef.current)    arrowRef.current.style.transform  = `scale(${lerp(0.6, 1, p, 0.28, 0.46)})`
      if (pipeRef.current)     pipeRef.current.style.opacity     = String(pipeOp)
      if (pipeRef.current)     pipeRef.current.style.transform   = `translateY(${lerp(28, 0, p, 0.44, 0.68)}px)`
      if (statsRef.current)    statsRef.current.style.opacity    = String(statsOp)
      if (statsRef.current)    statsRef.current.style.transform  = `translateY(${lerp(16, 0, p, 0.76, 0.91)}px)`
      if (ctaRef.current)      ctaRef.current.style.opacity      = String(statsOp)
      if (hintRef.current)     hintRef.current.style.opacity     = String(hintOp)
      if (avantRef.current)    avantRef.current.style.opacity    = String(avantOp)
      if (apresRef.current)    apresRef.current.style.opacity    = String(apresOp)

      pipeItems.current.forEach((el, i) => {
        if (!el) return
        const start = 0.44 + i * 0.022
        const end   = start + 0.095
        const op    = lerp(0, 1, p, start, end)
        const x     = lerp(-20, 0, p, start, end)
        el.style.opacity   = String(op)
        el.style.transform = `translateX(${x}px)`
      })

      if (phaseBarRef.current) {
        phaseBarRef.current.style.transform = `scaleX(${p})`
      }
    }

    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <>
      {/* ── DESKTOP animated version ── */}
      <section
        ref={sectionRef}
        id="avant-apres"
        className="relative hidden md:block"
        style={{ height: '360vh' }}
      >
        <div
          className="sticky top-0 h-screen overflow-hidden flex flex-col"
          style={{ background: 'linear-gradient(160deg, #071B3E 0%, #0B2456 50%, #071B3E 100%)' }}
        >
          {/* Bg decorations */}
          <div className="absolute inset-0 bg-grid-dark opacity-30 pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-px pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.5), transparent)' }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 65% 55% at 50% 55%, rgba(37,99,235,0.06) 0%, transparent 70%)' }} />

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div
              ref={phaseBarRef}
              className="h-full origin-left"
              style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0.6), rgba(37,99,235,0.8))', transform: 'scaleX(0)', transition: 'none' }}
            />
          </div>

          <div className="flex-1 flex flex-col justify-center container-neo px-4 sm:px-6 relative z-10">

            {/* Header */}
            <div className="text-center mb-6">
              <span className="label-tag mb-3">Avant / Après</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-4 mb-3 leading-tight">
                Du chaos au pipeline.<br />
                <span className="text-gradient-blue">En un seul outil.</span>
              </h2>
              <p className="text-white/45 text-base max-w-md mx-auto">
                Faites défiler — regardez vos demandes éparpillées se transformer en pipeline structuré.
              </p>
            </div>

            {/* Phase labels */}
            <div className="flex justify-center mb-3 h-8 relative pointer-events-none">
              <span
                ref={avantRef}
                className="absolute text-[11px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.22)' }}
              >
                Avant NeoTravel
              </span>
              <span
                ref={apresRef}
                className="absolute text-[11px] font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full"
                style={{ background: 'rgba(37,99,235,0.12)', color: '#93C5FD', border: '1px solid rgba(37,99,235,0.28)', opacity: 0 }}
              >
                Avec NeoTravel ✓
              </span>
            </div>

            {/* Animation stage */}
            <div
              className="relative flex items-center justify-center mx-auto"
              style={{ height: 308, width: '100%', maxWidth: 560 }}
            >
              {/* ── CHAOS ── */}
              <div
                ref={chaosRef}
                className="absolute inset-0 flex items-center justify-center"
                style={{ willChange: 'opacity' }}
              >
                <div
                  className="absolute rounded-full pointer-events-none"
                  style={{ inset: '8%', background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.07) 0%, transparent 70%)' }}
                />
                {CHAOS.map(({ Icon, text, sub, x, y, rot }, i) => (
                  <div
                    key={text}
                    className="absolute flex items-center gap-3 px-3.5 py-2.5 rounded-2xl select-none"
                    style={{
                      left:           `calc(50% + ${x}px)`,
                      top:            `calc(50% + ${y}px)`,
                      translate:      '-50% -50%',
                      rotate:         `${rot}deg`,
                      background:     'rgba(239,68,68,0.08)',
                      border:         '1px solid rgba(239,68,68,0.2)',
                      backdropFilter: 'blur(10px)',
                      animation:      `chaos-float-${i} ${3.5 + i * 0.7}s ease-in-out infinite`,
                    }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.14)' }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: '#FCA5A5' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80 whitespace-nowrap">{text}</p>
                      <p className="text-[10px] whitespace-nowrap" style={{ color: 'rgba(252,165,165,0.5)' }}>{sub}</p>
                    </div>
                    <span className="ml-1 text-[10px] flex-shrink-0" style={{ color: 'rgba(252,165,165,0.35)' }}>✕</span>
                  </div>
                ))}
              </div>

              {/* ── ARROW ── */}
              <div
                ref={arrowRef}
                className="absolute z-20 flex flex-col items-center gap-2 pointer-events-none"
                style={{ opacity: 0, willChange: 'opacity, transform' }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(37,99,235,0.18)',
                    border:     '1px solid rgba(37,99,235,0.5)',
                    boxShadow:  '0 0 40px rgba(37,99,235,0.35), 0 0 80px rgba(37,99,235,0.1)',
                  }}
                >
                  <ArrowRight className="w-7 h-7 text-neo-blue" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">NeoTravel</span>
              </div>

              {/* ── PIPELINE ── */}
              <div
                ref={pipeRef}
                className="absolute inset-0 flex items-center justify-center"
                style={{ opacity: 0, willChange: 'opacity, transform' }}
              >
                <div className="absolute rounded-full pointer-events-none" style={{ inset: '5%', background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.08) 0%, transparent 70%)' }} />
                <div className="relative flex flex-col gap-2.5" style={{ width: 330 }}>
                  <div
                    className="absolute z-0 pointer-events-none"
                    style={{ left: 36, top: 18, bottom: 18, width: 1, background: 'linear-gradient(to bottom, rgba(96,165,250,0.45), rgba(252,211,77,0.45))' }}
                  />
                  {PIPELINE.map(({ img, label, color }, i) => (
                    <div
                      key={label}
                      ref={el => { pipeItems.current[i] = el }}
                      className="relative z-10 flex items-center gap-3 px-4 py-2 rounded-2xl"
                      style={{
                        opacity:    0,
                        background: 'rgba(255,255,255,0.05)',
                        border:     `1px solid ${color}28`,
                        willChange: 'opacity, transform',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <div className="w-12 h-12 flex-shrink-0 rounded-2xl overflow-hidden" style={{ background: '#071B3E' }}>
                        <Image src={img} alt={label} width={48} height={48} className="w-full h-full object-contain" unoptimized />
                      </div>
                      <span className="text-sm font-medium text-white/85">{label}</span>
                      <SealCheck weight="duotone" className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: `${color}90` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div
              ref={statsRef}
              className="grid grid-cols-3 gap-5 max-w-sm mx-auto mt-6"
              style={{ opacity: 0, willChange: 'opacity, transform' }}
            >
              {[
                { val: '< 2h',  label: 'Délai de réponse' },
                { val: '100%',  label: 'Demandes trackées' },
                { val: '100%',  label: 'Devis traçables' },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-gradient-blue">{val}</div>
                  <div className="text-xs text-white/30 mt-1 leading-tight">{label}</div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div
              ref={ctaRef}
              className="flex justify-center mt-6"
              style={{ opacity: 0, willChange: 'opacity' }}
            >
              <Link href="/devis" className="btn-gold gap-2">
                Démarrer maintenant
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Scroll hint */}
          <div
            ref={hintRef}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
            style={{ willChange: 'opacity' }}
          >
            <span className="text-[9px] uppercase tracking-widest text-white/20">Faites défiler</span>
            <div
              className="w-px h-6"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)',
                animation: 'hint-bounce 1.5s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </section>

      {/* ── MOBILE static version ── */}
      <section
        id="avant-apres"
        className="md:hidden py-20 px-5"
        style={{ background: 'linear-gradient(160deg, #030D20 0%, #061435 60%, #030D20 100%)' }}
      >
        <div className="text-center mb-10">
          <span className="label-tag mb-3">Avant / Après</span>
          <h2 className="text-2xl font-bold text-white mt-4 mb-2 leading-tight">
            Du chaos au pipeline.<br />
            <span className="text-gradient-blue">En un seul outil.</span>
          </h2>
        </div>

        <div className="space-y-4 max-w-sm mx-auto">
          {/* AVANT */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-3 text-center" style={{ color: '#FCA5A5' }}>
              Avant NeoTravel
            </div>
            <div className="space-y-2">
              {CHAOS.map(({ Icon, text, sub }) => (
                <div key={text} className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.14)' }}>
                    <Icon className="w-3 h-3" style={{ color: '#FCA5A5' }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/75">{text}</p>
                    <p className="text-[10px]" style={{ color: 'rgba(252,165,165,0.5)' }}>{sub}</p>
                  </div>
                  <span className="ml-auto text-[10px]" style={{ color: 'rgba(252,165,165,0.35)' }}>✕</span>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center py-1">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(37,99,235,0.18)', border: '1px solid rgba(37,99,235,0.4)', boxShadow: '0 0 20px rgba(37,99,235,0.25)' }}>
              <ArrowRight className="w-5 h-5 text-neo-blue rotate-90" />
            </div>
          </div>

          {/* APRÈS */}
          <div className="rounded-2xl p-4" style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' }}>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-3 text-center" style={{ color: '#93C5FD' }}>
              Avec NeoTravel ✓
            </div>
            <div className="space-y-2">
              {PIPELINE.map(({ img, label, color }) => (
                <div key={label} className="flex items-center gap-2.5 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}25` }}>
                  <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden" style={{ background: '#071B3E' }}>
                    <Image src={img} alt={label} width={40} height={40} className="w-full h-full object-contain" unoptimized />
                  </div>
                  <span className="text-xs font-medium text-white/80">{label}</span>
                  <SealCheck weight="duotone" className="w-3.5 h-3.5 ml-auto flex-shrink-0" style={{ color: `${color}80` }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <Link href="/devis" className="btn-gold gap-2">
            Démarrer maintenant
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <style>{`
        @keyframes hint-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.8; }
          50%       { transform: translateY(6px); opacity: 0.3; }
        }
      `}</style>
    </>
  )
}
