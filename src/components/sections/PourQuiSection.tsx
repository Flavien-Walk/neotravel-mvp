'use client'

import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const EASE = [0.21, 0.47, 0.32, 0.98] as [number, number, number, number]

const CLIENTS = [
  {
    img:    '/images/neotravel/bus-commercial.jpg',
    tag:    'Entreprises',
    title:  'Séminaires & événements pro',
    desc:   'Séminaires, team buildings, conventions, transferts aéroport. Devis rapide, facturation propre.',
    color:  '#60A5FA',
    accent: 'from-blue-700/60 to-neo-900/95',
  },
  {
    img:    '/images/neotravel/bus-hero.jpg',
    tag:    'Collectivités',
    title:  'Mairies & institutions',
    desc:   'Événements municipaux, sorties institutionnelles, transports de seniors. On gère le dossier.',
    color:  '#A78BFA',
    accent: 'from-violet-700/60 to-neo-900/95',
  },
  {
    img:    '/images/neotravel/group-travel.jpg',
    tag:    'Établissements scolaires',
    title:  'Sorties & voyages scolaires',
    desc:   'Voyages fin d\'année, classes découverte, sorties culturelles. Transport sécurisé, devis conforme.',
    color:  '#4ADE80',
    accent: 'from-emerald-700/60 to-neo-900/95',
  },
  {
    img:    '/images/neotravel/bus-group.jpg',
    tag:    'Associations & clubs',
    title:  'Sport & culture',
    desc:   'Compétitions, tournois, weekends culturels, pèlerinages. Vous vous concentrez sur l\'événement.',
    color:  '#38BDF8',
    accent: 'from-sky-700/60 to-neo-900/95',
  },
  {
    img:    '/images/neotravel/bus-road.jpg',
    tag:    'Groupes privés',
    title:  'Mariages & événements',
    desc:   'Mariage, EVJF, anniversaire, réunion de famille. Un autocar privatisé, aucune contrainte.',
    color:  '#FB923C',
    accent: 'from-orange-700/60 to-neo-900/95',
  },
]

export default function PourQuiSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-5% 0px' })

  return (
    <section
      id="pour-qui"
      className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #061435 0%, #030D20 60%, #061435 100%)' }}
    >
      <div className="absolute inset-0 bg-grid-dark opacity-20 pointer-events-none" />
      <div
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.4), transparent)' }}
      />

      <div ref={ref} className="container-neo relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-14"
        >
          <span className="label-tag mb-5">Pour qui ?</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-5 mb-4 leading-tight">
            Un outil pensé pour ceux qui{' '}
            <span className="text-gradient-blue">organisent des déplacements</span>
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Que vous soyez RH, directeur, enseignant ou responsable associatif — NeoTravel
            simplifie votre demande et vous garantit un devis fiable sous 2h.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {CLIENTS.map(({ img, tag, title, desc, color, accent }, i) => (
            <motion.div
              key={tag}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.07, duration: 0.55, ease: EASE }}
              className="group"
            >
              <div
                className="rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-300"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border:     `1px solid ${color}18`,
                  boxShadow:  '0 4px 24px rgba(0,0,0,0.3)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = `${color}40`
                  el.style.boxShadow   = `0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px ${color}20`
                  el.style.transform   = 'translateY(-3px)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement
                  el.style.borderColor = `${color}18`
                  el.style.boxShadow   = '0 4px 24px rgba(0,0,0,0.3)'
                  el.style.transform   = 'translateY(0)'
                }}
              >
                {/* Image */}
                <div className="relative h-44 flex-shrink-0 overflow-hidden">
                  <Image
                    src={img}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
                  />
                  {/* Gradient overlay — dark */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${accent}`} />
                  {/* Tag */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: color }}
                    />
                    <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider">
                      {tag}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-white text-sm mb-2 leading-snug">{title}</h3>
                  <p className="text-white/40 text-xs leading-relaxed flex-1">{desc}</p>
                  <div
                    className="mt-3 pt-3 flex items-center gap-1.5 text-xs font-semibold transition-colors duration-200"
                    style={{ color: `${color}80`, borderTop: `1px solid ${color}12` }}
                  >
                    <Link href="/devis" className="flex items-center gap-1.5 hover:text-white transition-colors">
                      Demander un devis
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.5, ease: EASE }}
          className="text-center mt-12"
        >
          <Link href="/devis" className="btn-gold gap-2">
            Demander un devis gratuit
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-white/20 text-xs mt-4">Gratuit · Sans engagement · Réponse &lt; 2h</p>
        </motion.div>
      </div>
    </section>
  )
}
