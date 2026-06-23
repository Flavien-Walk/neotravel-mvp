'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Play, LayoutDashboard } from 'lucide-react'

const HeroScene = dynamic(() => import('@/components/3d/HeroScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-16 h-16 rounded-full border-2 border-neo-blue/30 border-t-neo-blue animate-spin" />
    </div>
  ),
})

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
}
const item = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.21, 0.47, 0.32, 0.98] as const } },
}

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-neo" />
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(75,142,248,0.18) 0%, transparent 70%)',
      }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #4B8EF8 0%, transparent 70%)' }} />

      <div className="container-neo px-4 sm:px-6 relative z-10 w-full py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-6 items-center min-h-[calc(100vh-80px)]">

          {/* Left — Content */}
          <motion.div className="flex flex-col items-start" variants={stagger} initial="hidden" animate="visible">
            <motion.div variants={item}>
              <span className="label-tag mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Prototype fonctionnel · MVP v0.1
              </span>
            </motion.div>

            <motion.h1 variants={item} className="text-4xl sm:text-5xl xl:text-6xl font-bold leading-[1.1] tracking-tight text-white mb-6">
              De la demande client<br />
              au devis,{' '}
              <span className="text-gradient-blue">sans friction</span>
            </motion.h1>

            <motion.p variants={item} className="text-lg text-white/55 leading-relaxed max-w-lg mb-8">
              NeoTravel automatise le cycle commercial du transport de groupe — de la qualification du lead
              jusqu&apos;au suivi des relances. Un parcours plus rapide, plus fiable, plus traçable.
            </motion.p>

            <motion.div variants={item} className="flex flex-wrap gap-3 mb-10">
              <Link href="/devis" className="btn-gold gap-2 !px-7 !py-3.5 text-base">
                Demander un devis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/admin" className="btn-ghost gap-2 !px-5 !py-3.5 text-base">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard démo
              </Link>
            </motion.div>

            {/* Trust signals */}
            <motion.div variants={item} className="flex flex-wrap items-center gap-6 text-sm text-white/35">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Calcul déterministe
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-neo-blue" />
                Logs traçables
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-neo-cyan" />
                Reprise humaine
              </span>
            </motion.div>
          </motion.div>

          {/* Right — 3D Scene */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.21, 0.47, 0.32, 0.98], delay: 0.4 }}
            className="relative h-[420px] lg:h-[560px]"
          >
            {/* Glow halo */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, rgba(75,142,248,0.12) 0%, transparent 70%)' }} />
            <HeroScene />

            {/* Floating card - metrics */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="absolute bottom-8 right-0 glass-blue rounded-2xl px-5 py-4 pointer-events-none hidden sm:block"
            >
              <div className="text-xs text-white/40 mb-1">Leads traités aujourd&apos;hui</div>
              <div className="text-2xl font-bold text-white">
                60+ <span className="text-neo-blue text-sm font-normal">/ jour</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4, duration: 0.6 }}
              className="absolute top-8 left-0 glass rounded-xl px-4 py-3 pointer-events-none hidden sm:block"
            >
              <div className="text-xs text-white/40 mb-1">Délai de réponse</div>
              <div className="text-lg font-bold text-white">
                &lt; 2h <span className="text-green-400 text-xs font-normal">ouvrées</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/25 text-xs"
      >
        <span>Découvrir</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="w-0.5 h-8 bg-gradient-to-b from-white/30 to-transparent rounded-full"
        />
      </motion.div>
    </section>
  )
}
