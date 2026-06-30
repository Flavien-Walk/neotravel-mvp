'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Inbox, Navigation, Calculator, Send, Bell, UserCheck } from 'lucide-react'
import Link from 'next/link'

const STEPS = [
  {
    num: '01',
    Icon: Inbox,
    title: 'Demande reçue',
    desc: 'Vous remplissez le formulaire NeoTravel : trajet, date, passagers, options. Votre demande est enregistrée immédiatement — sans email, sans téléphone.',
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.22)',
    who: 'Client',
  },
  {
    num: '02',
    Icon: Navigation,
    title: 'Trajet qualifié',
    desc: 'L\'agent vérifie les informations, identifie les données manquantes et classe la demande selon sa complexité. Rien n\'est laissé sans statut.',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.22)',
    who: 'NeoTravel',
  },
  {
    num: '03',
    Icon: Calculator,
    title: 'Prix calculé',
    desc: 'Le moteur <code>calculer_devis()</code> applique les règles tarifaires — distance, durée, passagers, péages, options, TVA. Déterministe. Auditable. Reproductible.',
    color: '#FCD34D',
    bg: 'rgba(252,211,77,0.08)',
    border: 'rgba(252,211,77,0.22)',
    who: 'NeoTravel',
    badge: 'Jamais par IA',
  },
  {
    num: '04',
    Icon: Send,
    title: 'Devis envoyé',
    desc: 'Le devis formaté est envoyé par email avec le détail ligne par ligne : distance, options, TVA. Le client comprend chaque centime.',
    color: '#4ADE80',
    bg: 'rgba(74,222,128,0.08)',
    border: 'rgba(74,222,128,0.22)',
    who: 'Client',
  },
  {
    num: '05',
    Icon: Bell,
    title: 'Suivi activé',
    desc: 'Un lien de tracking est inclus dans chaque email. Le client suit l\'avancement en temps réel — sans créer de compte.',
    color: '#38BDF8',
    bg: 'rgba(56,189,248,0.08)',
    border: 'rgba(56,189,248,0.22)',
    who: 'Client',
  },
  {
    num: '06',
    Icon: UserCheck,
    title: 'Reprise humaine si nécessaire',
    desc: 'Circuit multi-étapes, groupe > 85 pax, ville hors base — le système flagge et transmet à un conseiller NeoTravel. Aucun cas n\'est laissé sans réponse.',
    color: '#FB923C',
    bg: 'rgba(251,146,60,0.08)',
    border: 'rgba(251,146,60,0.22)',
    who: 'NeoTravel',
  },
]

export default function ScrollTimeline() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [activeStep, setActiveStep] = useState(0)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    let triggers: (() => void)[] = []

    async function init() {
      const gsapMod = await import('gsap')
      const stMod = await import('gsap/ScrollTrigger')
      const gsap = gsapMod.default
      const ScrollTrigger = stMod.ScrollTrigger
      gsap.registerPlugin(ScrollTrigger)

      if (typeof window === 'undefined' || !sectionRef.current) return

      STEPS.forEach((_, i) => {
        const el = stepRefs.current[i]
        if (!el) return

        const trigger = ScrollTrigger.create({
          trigger: el,
          start: 'top 65%',
          onEnter: () => setActiveStep(i),
          onEnterBack: () => setActiveStep(i),
        })
        triggers.push(() => trigger.kill())

        gsap.fromTo(
          el,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        )
      })
    }

    init()
    return () => { triggers.forEach(k => k()) }
  }, [])

  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-5% 0px' })

  return (
    <section
      ref={sectionRef}
      id="comment-ca-marche"
      className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #071B3E 0%, #0B2456 50%, #071B3E 100%)' }}
    >
      <div className="absolute inset-0 bg-grid-dark opacity-25 pointer-events-none" />
      <div
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.4), transparent)' }}
      />
      {/* Center glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top, rgba(37,99,235,0.08) 0%, transparent 70%)' }}
      />

      <div className="container-neo relative z-10">
        {/* Header */}
        <div ref={headerRef}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <span className="label-tag mb-5">Comment ça marche</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-5 mb-5 leading-tight">
              De la demande au devis,{' '}
              <span className="text-gradient-blue">6 étapes.</span>
            </h2>
            <p className="text-white/45 text-lg max-w-xl mx-auto">
              Vous décrivez votre besoin. NeoTravel qualifie, calcule et envoie.
              Chaque étape est suivie — de la réception à la signature.
            </p>
          </motion.div>
        </div>

        {/* Timeline layout */}
        <div className="grid lg:grid-cols-[260px_1fr] gap-12 lg:gap-16 items-start">

          {/* Left: sticky progress nav (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-32 space-y-1">
              {STEPS.map(({ num, title, color }, i) => (
                <div
                  key={num}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300"
                  style={{
                    background: activeStep === i ? `${color}12` : 'transparent',
                    border: activeStep === i ? `1px solid ${color}30` : '1px solid transparent',
                  }}
                  onClick={() => stepRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300"
                    style={{
                      background: activeStep === i ? `${color}20` : 'rgba(255,255,255,0.06)',
                      color: activeStep === i ? color : 'rgba(255,255,255,0.28)',
                    }}
                  >
                    {num}
                  </span>
                  <span
                    className="text-sm font-medium transition-all duration-300 truncate"
                    style={{ color: activeStep === i ? color : 'rgba(255,255,255,0.28)' }}
                  >
                    {title}
                  </span>
                </div>
              ))}

              {/* Progress line */}
              <div className="pt-6 px-4">
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${((activeStep + 1) / STEPS.length) * 100}%`,
                      background: 'linear-gradient(90deg, #2563EB, #60A5FA)',
                    }}
                  />
                </div>
                <p className="text-xs text-white/28 mt-2">Étape {activeStep + 1} sur {STEPS.length}</p>
              </div>
            </div>
          </div>

          {/* Right: step cards */}
          <div className="space-y-5">
            {STEPS.map(({ num, Icon, title, desc, color, bg, border, who, badge }, i) => (
              <div
                key={num}
                ref={el => { stepRefs.current[i] = el }}
                className="rounded-3xl p-6 sm:p-8 relative overflow-hidden"
                style={{
                  background: bg,
                  border: `1px solid ${border}`,
                  opacity: 0,
                  backdropFilter: 'blur(8px)',
                }}
              >
                {/* Number watermark */}
                <span
                  className="absolute top-4 right-6 text-7xl font-black select-none pointer-events-none"
                  style={{ color: `${color}06` }}
                >
                  {num}
                </span>

                <div className="flex items-start gap-4 mb-4 relative z-10">
                  <div
                    className="relative w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{
                      background: `linear-gradient(145deg, ${color}1C 0%, ${color}08 100%)`,
                      border: `1px solid ${color}32`,
                      boxShadow: `inset 0 1px 0 ${color}18, 0 4px 16px ${color}12`,
                    }}
                  >
                    <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 35% 28%, ${color}22 0%, transparent 62%)` }} />
                    <Icon className="w-5 h-5 relative z-10" style={{ color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${color}80` }}>
                        Étape {num}
                      </span>
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          background: who === 'Client' ? 'rgba(96,165,250,0.1)' : 'rgba(167,139,250,0.1)',
                          color: who === 'Client' ? '#93C5FD' : '#C4B5FD',
                          border: `1px solid ${who === 'Client' ? 'rgba(96,165,250,0.2)' : 'rgba(167,139,250,0.2)'}`,
                        }}
                      >
                        {who}
                      </span>
                      {badge && (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(252,211,77,0.1)', color: '#FCD34D', border: '1px solid rgba(252,211,77,0.2)' }}
                        >
                          {badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                  </div>
                </div>

                <p
                  className="text-white/55 leading-relaxed relative z-10"
                  dangerouslySetInnerHTML={{ __html: desc.replace(/<code>(.*?)<\/code>/g, '<code class="font-mono text-xs px-1.5 py-0.5 rounded" style="background:rgba(255,255,255,0.1);color:#93C5FD">$1</code>') }}
                />
              </div>
            ))}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.5 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-4"
            >
              <Link href="/devis" className="btn-gold gap-2">
                Démarrer maintenant
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-sm text-white/30">
                Gratuit · Réponse sous 2h ouvrées · Sans engagement
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
