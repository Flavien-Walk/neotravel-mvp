'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, LayoutDashboard, Users, Clock, CheckCircle } from 'lucide-react'

const HeroScene = dynamic(() => import('@/components/3d/HeroScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-2 border-neo-blue/30 border-t-neo-blue animate-spin" />
    </div>
  ),
})

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11, delayChildren: 0.25 } },
}
const item = {
  hidden:   { opacity: 0, y: 24 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] as const } },
}

const METRICS = [
  { icon: Users,        value: '60+',   label: 'leads entrants / jour' },
  { icon: Clock,        value: '< 2h',  label: 'délai de réponse cible' },
  { icon: CheckCircle,  value: '100 %', label: 'calcul déterministe' },
]

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16 bg-gradient-hero">
      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-dark opacity-40" />
      {/* Blue glow top */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 40% at 60% -5%, rgba(37,99,235,0.2) 0%, transparent 70%)' }}
      />

      <div className="container-neo px-4 sm:px-6 relative z-10 w-full py-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-6 items-center min-h-[calc(100vh-96px)]">

          {/* ─── Left — copy ─────────────────────────── */}
          <motion.div
            className="flex flex-col items-start"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={item}>
              <span className="label-tag mb-7">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Prototype opérationnel · Transport de groupe
              </span>
            </motion.div>

            <motion.h1
              variants={item}
              className="text-4xl sm:text-5xl xl:text-[3.35rem] font-bold leading-[1.1] tracking-tight text-white mb-5"
            >
              Le devis de transport<br />
              de groupe,{' '}
              <span className="text-gradient-blue">enfin rapide et suivi.</span>
            </motion.h1>

            <motion.p
              variants={item}
              className="text-lg text-white/55 leading-relaxed max-w-lg mb-8"
            >
              NeoTravel centralise les demandes, qualifie les trajets et génère des devis fiables —
              pour les entreprises, collectivités, associations et groupes privés.
              Chaque lead est suivi, chaque devis est tracé, chaque relance est planifiée.
            </motion.p>

            <motion.div variants={item} className="flex flex-wrap gap-3 mb-10">
              <Link href="/devis" className="btn-gold gap-2 !px-7 !py-3.5 !text-base">
                Demander un devis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="btn-ghost gap-2 !px-5 !py-3.5 !text-base">
                <LayoutDashboard className="w-4 h-4" />
                Accéder au dashboard
              </Link>
            </motion.div>

            {/* Metric chips */}
            <motion.div variants={item} className="flex flex-wrap gap-3">
              {METRICS.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl glass"
                >
                  <Icon className="w-4 h-4 text-neo-blue" />
                  <span className="font-bold text-white text-sm">{value}</span>
                  <span className="text-white/40 text-xs">{label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ─── Right — 3D city network ──────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.21, 0.47, 0.32, 0.98] as const, delay: 0.3 }}
            className="relative h-[380px] lg:h-[540px]"
          >
            {/* Radial glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.10) 0%, transparent 65%)' }}
            />
            <HeroScene />

            {/* Label overlay */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/25 tracking-widest uppercase pointer-events-none">
              Réseau NeoTravel — trajets actifs
            </div>

            {/* Floating card — Paris hub */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1, duration: 0.55 }}
              className="absolute bottom-8 right-0 glass-blue rounded-2xl px-4 py-3.5 pointer-events-none hidden sm:block"
            >
              <div className="text-[10px] text-white/40 mb-1 uppercase tracking-wide">Hub central</div>
              <div className="font-bold text-white text-sm">Paris → 8 villes</div>
              <div className="text-[11px] text-neo-blue mt-0.5">Route la plus demandée : Lyon</div>
            </motion.div>

            {/* Floating card — response time */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.3, duration: 0.55 }}
              className="absolute top-10 left-0 glass rounded-xl px-4 py-3 pointer-events-none hidden sm:block"
            >
              <div className="text-[10px] text-white/40 mb-1 uppercase tracking-wide">Dernier devis</div>
              <div className="font-bold text-white text-sm">Bordeaux → Nice, 52 pax</div>
              <div className="text-[11px] text-green-400 mt-0.5">Généré en 14 s · 2 340 € HT</div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/25 text-xs pointer-events-none"
      >
        <span className="tracking-widest uppercase text-[10px]">Découvrir</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="w-px h-8 bg-gradient-to-b from-white/25 to-transparent"
        />
      </motion.div>
    </section>
  )
}
