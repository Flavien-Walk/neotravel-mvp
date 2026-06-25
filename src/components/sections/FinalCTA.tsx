'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, CheckCircle2, Mail } from 'lucide-react'
import { useRef } from 'react'

const EASE = [0.21, 0.47, 0.32, 0.98] as [number, number, number, number]

export default function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })

  return (
    <section className="relative py-32 sm:py-44 px-4 sm:px-6 overflow-hidden">

      {/* Photo background */}
      <div className="absolute inset-0">
        <Image
          src="/images/neotravel/bus-cta.jpg"
          alt="Route et autocar — NeoTravel transport de groupe"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Overlay bleu sobre — lisibilité du texte */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(160deg, rgba(15,23,42,0.88) 0%, rgba(29,78,216,0.75) 50%, rgba(15,23,42,0.85) 100%)',
          }}
        />
      </div>

      {/* Top divider */}
      <div
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}
      />

      {/* Floating devis card — top right */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ delay: 0.7, duration: 0.7, ease: EASE }}
        className="absolute top-16 right-[6%] hidden xl:block z-10"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
          className="rounded-2xl px-5 py-4"
          style={{
            background:     'rgba(255,255,255,0.12)',
            border:         '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow:      '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <p className="text-[9px] text-white/50 uppercase tracking-widest mb-2 font-mono">Devis reçu</p>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-bold text-white">Paris → Lyon</span>
          </div>
          <p className="text-[10px] text-white/50 mb-3">48 passagers · Séminaire</p>
          <div className="flex items-center justify-between gap-8">
            <div>
              <p className="text-xs text-white/40 mb-0.5">Devis HT</p>
              <span className="text-xl font-bold text-white">3 840 <span className="text-sm text-white/50">€</span></span>
            </div>
            <span
              className="text-[10px] px-2.5 py-1 rounded-full font-bold"
              style={{ background: 'rgba(74,222,128,0.2)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.3)' }}
            >
              Envoyé
            </span>
          </div>
          <p className="text-[9px] text-white/25 mt-3 font-mono">calculer_devis() · &lt; 2h ouvrées</p>
        </motion.div>
      </motion.div>

      {/* Main content */}
      <div ref={ref} className="container-neo relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <span
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-7"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Devis gratuit · Sans engagement
          </span>

          <h2 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-white mt-5 mb-6 leading-[1.05] tracking-tight">
            Obtenez un devis clair,<br />
            <span style={{ color: '#93C5FD' }}>suivi et traçable.</span>
          </h2>

          <p className="text-white/65 text-lg max-w-lg mx-auto mb-12">
            Remplissez le formulaire en 3 minutes. Un conseiller NeoTravel prépare
            votre devis et vous l&apos;envoie par email sous 2h ouvrées.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Link
              href="/devis"
              className="inline-flex items-center gap-2 font-bold px-10 py-4 rounded-2xl text-base transition-all"
              style={{
                background: '#2563EB',
                color: '#fff',
                boxShadow: '0 4px 24px rgba(37,99,235,0.45)',
              }}
            >
              Demander un devis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="mailto:commercial@neotravel.fr"
              className="inline-flex items-center gap-2 font-medium px-7 py-4 rounded-2xl text-base transition-all"
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Mail className="w-4 h-4" />
              Parler à un conseiller
            </a>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-12">
            {[
              'Devis gratuit',
              'Réponse < 2h',
              'Prix ligne par ligne',
              'Suivi en temps réel',
            ].map(item => (
              <div key={item} className="flex items-center gap-1.5 text-sm text-white/60">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#4ADE80' }} />
                {item}
              </div>
            ))}
          </div>

          {/* Reassurance grid */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-px max-w-2xl mx-auto rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            {[
              { value: 'Gratuit', label: 'Devis sans engagement' },
              { value: '< 2h',   label: 'Délai de réponse' },
              { value: 'Tracé',  label: 'Chaque ligne justifiée' },
              { value: 'Humain', label: 'Conseiller sur cas complexe' },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="px-4 py-5"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <div className="text-xl font-bold text-white">{value}</div>
                <div className="text-white/45 text-xs mt-1 leading-snug">{label}</div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-white/25 text-xs">
            Espace commercial NeoTravel ·{' '}
            <Link href="/login" className="hover:text-white/50 transition-colors">Connexion</Link>
            {' '}·{' '}
            <Link href="/register" className="hover:text-white/50 transition-colors">Créer un compte</Link>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
