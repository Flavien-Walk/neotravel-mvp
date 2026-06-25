'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, Clock, FileText } from 'lucide-react'

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11, delayChildren: 0.25 } },
}
const item = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] as const } },
}

const REASSURANCES = [
  { icon: FileText, value: 'Devis gratuit',  label: 'sans engagement' },
  { icon: Clock,    value: 'Réponse 2h',     label: 'en heures ouvrées' },
  { icon: Shield,   value: 'Prix traçable',  label: 'ligne par ligne' },
]

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">

      {/* ── Background system ── */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(168deg, #010C1E 0%, #030D20 38%, #061435 68%, #020A16 100%)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 75% 62% at 12% -8%, rgba(37,99,235,0.26) 0%, rgba(37,99,235,0.07) 45%, transparent 68%)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 55% 48% at 95% -2%, rgba(14,165,233,0.12) 0%, transparent 55%)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 110% 42% at 50% 108%, rgba(245,158,11,0.055) 0%, transparent 62%)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 115% 95% at 50% 50%, transparent 42%, rgba(1,7,16,0.45) 100%)' }}
      />

      {/* Animated SVG route paths */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="hrg1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#2563EB" stopOpacity="0" />
            <stop offset="35%"  stopColor="#60A5FA" stopOpacity="1" />
            <stop offset="70%"  stopColor="#2563EB" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hrg2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#0EA5E9" stopOpacity="0" />
            <stop offset="50%"  stopColor="#38BDF8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hrg3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#F59E0B" stopOpacity="0" />
            <stop offset="45%"  stopColor="#FCD34D" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M 80 60 C 280 150 460 230 640 360 S 900 510 1140 590 S 1360 640 1480 660"
          stroke="url(#hrg1)" strokeWidth="1.5" fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0,0,1,1,1], opacity: [0,0.75,0.75,0.75,0] }}
          transition={{ duration: 10, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut', times: [0,0.06,0.68,0.88,1] }}
        />
        <motion.path
          d="M -60 530 C 180 500 370 450 570 420 S 840 385 1060 355 S 1300 325 1500 315"
          stroke="url(#hrg2)" strokeWidth="1" fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0,0,1,1,1], opacity: [0,0.55,0.55,0.55,0] }}
          transition={{ duration: 10, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut', times: [0,0.06,0.68,0.88,1], delay: 3.8 }}
        />
        <motion.path
          d="M 200 820 C 400 780 560 740 720 700 S 960 660 1200 640 S 1380 630 1480 625"
          stroke="url(#hrg3)" strokeWidth="0.8" fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: [0,0,1,1,1], opacity: [0,0.4,0.4,0.4,0] }}
          transition={{ duration: 10, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut', times: [0,0.06,0.68,0.88,1], delay: 6.2 }}
        />
        <motion.circle cx="640" cy="360" r="3" fill="#60A5FA"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0,0,0.9,0.9,0], scale: [0.5,0.5,1.3,1,0] }}
          transition={{ duration: 10, repeat: Infinity, repeatDelay: 4, times: [0,0.32,0.42,0.85,1] }}
        />
        <motion.circle cx="640" cy="360" r="8" fill="#60A5FA" fillOpacity="0" stroke="#60A5FA" strokeWidth="1"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0,0,0.3,0,0], scale: [0,0,2.5,3.5,0] }}
          transition={{ duration: 10, repeat: Infinity, repeatDelay: 4, times: [0,0.35,0.46,0.58,1] }}
        />
      </svg>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.065) 1px, transparent 1px)',
          backgroundSize: '36px 36px', opacity: 0.85,
        }}
      />
      <div className="absolute inset-0 bg-noise pointer-events-none" style={{ opacity: 0.55 }} />
      <div
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.4), transparent)' }}
      />

      {/* ── Content ── */}
      <div className="container-neo px-4 sm:px-6 relative z-10 w-full py-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-6 items-center min-h-[calc(100vh-96px)]">

          {/* Left — copy */}
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

            <motion.p variants={item} className="text-lg text-white/55 leading-relaxed max-w-lg mb-8">
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

            <motion.div variants={item} className="flex flex-wrap gap-3">
              {REASSURANCES.map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl glass">
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

          {/* Right — route card with bus photo as atmospheric background */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.1, ease: [0.21, 0.47, 0.32, 0.98] as const, delay: 0.35 }}
            className="relative h-[380px] lg:h-[540px] rounded-2xl overflow-hidden hidden md:block"
            style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)' }}
          >
            {/* Photo atmospheric layer */}
            <Image
              src="/images/neotravel/bus-hero.jpg"
              alt="Autocar de transport de groupe sur route"
              fill
              className="object-cover object-center scale-105"
              sizes="(max-width: 1024px) 90vw, 50vw"
              priority
            />
            {/* Overlay — deep dark blue tint, let the photo breathe subtly */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(160deg, rgba(3,13,32,0.92) 0%, rgba(6,20,53,0.72) 45%, rgba(3,13,32,0.80) 100%)' }}
            />

            {/* Top strip — status */}
            <div className="absolute top-0 inset-x-0 flex items-center justify-between px-5 py-4">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(37,99,235,0.25)', color: '#93C5FD', border: '1px solid rgba(37,99,235,0.35)' }}
              >
                Route active
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-white/40">Calcul auto</span>
              </div>
            </div>

            {/* Center — route card */}
            <div className="absolute inset-0 flex items-center justify-center px-5">
              <div
                className="w-full max-w-[280px] p-5 rounded-2xl"
                style={{
                  background: 'rgba(3,13,32,0.75)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(24px)',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
                }}
              >
                {/* From */}
                <div className="flex items-center gap-3.5 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(37,99,235,0.35)' }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400" style={{ boxShadow: '0 0 8px rgba(96,165,250,0.8)' }} />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/35 font-mono uppercase tracking-widest">Départ</p>
                    <p className="text-base font-bold text-white leading-tight">Paris</p>
                    <p className="text-[10px] text-white/35">Gare de Lyon · 08h30</p>
                  </div>
                </div>

                {/* Route connector */}
                <div className="ml-[18px] flex gap-3.5 mb-4">
                  <div
                    className="w-[2px] rounded-full flex-shrink-0"
                    style={{ background: 'linear-gradient(to bottom, #3B82F6, #4ADE80)', height: 44 }}
                  />
                  <div
                    className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-[10px]"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <span className="text-white/45">284 km</span>
                    <span className="text-white/20">·</span>
                    <span className="text-white/45">3h 20</span>
                    <span className="text-white/20">·</span>
                    <span className="text-white/45">50 pax</span>
                    <span className="text-white/20">·</span>
                    <span className="text-white/45">Wi-Fi</span>
                  </div>
                </div>

                {/* To */}
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)' }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" style={{ boxShadow: '0 0 8px rgba(74,222,128,0.8)' }} />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/35 font-mono uppercase tracking-widest">Arrivée</p>
                    <p className="text-base font-bold text-white leading-tight">Lyon</p>
                    <p className="text-[10px] text-white/35">Part-Dieu · 11h50</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom — price badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.7 }}
              className="absolute bottom-5 left-5 right-5"
            >
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: 'rgba(3,13,32,0.85)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                }}
              >
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-semibold">Devis calculé automatiquement</div>
                  <div className="text-white/35 text-[10px]">calculer_devis() · NeoTravel Engine v2</div>
                </div>
                <div className="text-right flex-shrink-0 pl-2 border-l border-white/10">
                  <div className="text-white font-bold text-sm">1 493 €</div>
                  <div className="text-white/35 text-[10px]">TTC</div>
                </div>
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
