'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, Clock, FileText } from 'lucide-react'
import TransportHeroVisual from '@/components/visuals/TransportHeroVisual'

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11, delayChildren: 0.25 } },
}
const item = {
  hidden:   { opacity: 0, y: 24 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] as const } },
}

const REASSURANCES = [
  { icon: FileText, value: 'Devis gratuit',   label: 'sans engagement' },
  { icon: Clock,    value: 'Réponse 2h',       label: 'en heures ouvrées' },
  { icon: Shield,   value: 'Prix traçable',    label: 'ligne par ligne' },
]

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16 bg-gradient-hero">
      {/* Background photo de bus bas-gauche */}
      <div className="absolute bottom-0 left-0 w-[480px] h-[280px] pointer-events-none hidden lg:block">
        <Image
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=70"
          alt="Autocar de transport de groupe"
          fill
          className="object-cover object-right-top"
          priority={false}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, transparent 0%, #030D20 70%), linear-gradient(to top, transparent 0%, #030D20 55%)',
          }}
        />
      </div>

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
                Transport de groupe · Devis gratuit et suivi
              </span>
            </motion.div>

            <motion.h1
              variants={item}
              className="text-4xl sm:text-5xl xl:text-[3.35rem] font-bold leading-[1.1] tracking-tight text-white mb-5"
            >
              Votre devis de transport<br />
              de groupe,{' '}
              <span className="text-gradient-blue">clair, rapide et suivi.</span>
            </motion.h1>

            <motion.p
              variants={item}
              className="text-lg text-white/55 leading-relaxed max-w-lg mb-8"
            >
              NeoTravel centralise votre demande, qualifie votre trajet et prépare un devis
              explicable — pour les entreprises, écoles, associations, collectivités et événements privés.
              Chaque demande est suivie. Chaque devis est tracé.
            </motion.p>

            <motion.div variants={item} className="flex flex-wrap gap-3 mb-10">
              <Link href="/devis" className="btn-gold gap-2 !px-7 !py-3.5 !text-base">
                Demander un devis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/client" className="btn-ghost gap-2 !px-5 !py-3.5 !text-base">
                Suivre ma demande
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Réassurances */}
            <motion.div variants={item} className="flex flex-wrap gap-3">
              {REASSURANCES.map(({ icon: Icon, value, label }) => (
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

            <motion.div variants={item} className="mt-5">
              <Link href="/login" className="text-xs text-white/25 hover:text-white/50 transition-colors">
                Connexion espace NeoTravel →
              </Link>
            </motion.div>
          </motion.div>

          {/* ─── Right — transport route map ─────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.21, 0.47, 0.32, 0.98] as const, delay: 0.3 }}
            className="relative h-[380px] lg:h-[540px]"
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.08) 0%, transparent 65%)' }}
            />
            <TransportHeroVisual />
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
