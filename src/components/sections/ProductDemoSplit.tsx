'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  User, BarChart3, CheckCircle2, Clock, ArrowRight,
  Bell, FileText, Eye, Users, AlertCircle, Send,
} from 'lucide-react'
import Link from 'next/link'

type Tab = 'client' | 'commercial'

/* ── CLIENT SIDE ──────────────────────────────────────── */
const CLIENT_STATUSES = [
  { label: 'Demande reçue',   done: true,  active: false },
  { label: 'Trajet qualifié', done: true,  active: false },
  { label: 'Calcul du devis', done: false, active: true  },
  { label: 'Devis envoyé',    done: false, active: false },
  { label: 'Suivi / Relance', done: false, active: false },
]

function ClientView() {
  return (
    <div className="flex flex-col gap-4">
      {/* Request header */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-white/35 uppercase tracking-wider mb-1 font-semibold">Votre demande</p>
            <h4 className="text-base font-bold text-white">Paris → Lyon · 48 pax</h4>
            <p className="text-xs text-white/40 mt-0.5">Séminaire entreprise · 14 mars 2025</p>
          </div>
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(252,211,77,0.12)', color: '#FCD34D', border: '1px solid rgba(252,211,77,0.2)' }}
          >
            En cours
          </span>
        </div>

        {/* Progress steps */}
        <div className="relative">
          <div
            className="absolute left-3.5 top-4 bottom-4 w-px"
            style={{ background: 'linear-gradient(to bottom, rgba(37,99,235,0.5), rgba(37,99,235,0.05))' }}
          />
          <div className="space-y-3 relative z-10">
            {CLIENT_STATUSES.map(({ label, done, active }, i) => (
              <div key={label} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: done ? 'rgba(74,222,128,0.15)' : active ? 'rgba(252,211,77,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${done ? 'rgba(74,222,128,0.35)' : active ? 'rgba(252,211,77,0.35)' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  {done ? (
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#4ADE80' }} />
                  ) : active ? (
                    <motion.div
                      className="w-2 h-2 rounded-full"
                      style={{ background: '#FCD34D' }}
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  ) : (
                    <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
                  )}
                </div>
                <span
                  className="text-sm"
                  style={{ color: done ? 'rgba(255,255,255,0.65)' : active ? 'rgba(252,211,77,0.9)' : 'rgba(255,255,255,0.25)' }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Clock, label: 'Réponse estimée', val: '~45 min', color: '#60A5FA' },
          { icon: Eye,   label: 'Vues statut',     val: '3 fois',  color: '#A78BFA' },
          { icon: Bell,  label: 'Notifications',   val: 'Actives', color: '#4ADE80' },
        ].map(({ icon: Icon, label, val, color }) => (
          <div
            key={label}
            className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color }} />
            <div className="text-sm font-semibold text-white">{val}</div>
            <div className="text-[10px] text-white/30 mt-0.5 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* Devis placeholder */}
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: 'rgba(37,99,235,0.06)', border: '1px dashed rgba(37,99,235,0.25)' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(37,99,235,0.1)' }}
        >
          <FileText className="w-5 h-5 text-neo-blue" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white/60">Votre devis</p>
          <p className="text-xs text-white/30">Sera disponible ici dès qu&apos;il sera prêt</p>
        </div>
        <span className="text-xs text-white/20">~45 min</span>
      </div>
    </div>
  )
}

/* ── COMMERCIAL SIDE ─────────────────────────────────── */
const MOCK_LEADS = [
  { nom: 'Groupe Suez',        trajet: 'Paris → Lyon',       pax: 52, statut: 'Devis envoyé', price: '3 840 €', urgent: false },
  { nom: 'Mairie de Bordeaux', trajet: 'Bordeaux → Nice',    pax: 38, statut: 'Relance 1',    price: '2 190 €', urgent: true  },
  { nom: 'Club Rugby Nantes',  trajet: 'Nantes → Paris',     pax: 25, statut: 'Nouveau',      price: '—',       urgent: false },
  { nom: 'Lycée Jean Moulin',  trajet: 'Toulouse → Lourdes', pax: 60, statut: 'Qualifiée',    price: '—',       urgent: false },
]

const STAT_CARDS = [
  { icon: Users,        val: '12', label: 'Nouveaux leads',     color: '#60A5FA', bg: 'rgba(96,165,250,0.1)'  },
  { icon: Clock,        val: '7',  label: 'Devis en attente',   color: '#FCD34D', bg: 'rgba(252,211,77,0.1)'  },
  { icon: AlertCircle,  val: '3',  label: 'Relances à envoyer', color: '#FB923C', bg: 'rgba(251,146,60,0.1)'  },
  { icon: CheckCircle2, val: '24', label: 'Acceptés ce mois',   color: '#4ADE80', bg: 'rgba(74,222,128,0.1)'  },
]

const STATUS_COLORS: Record<string, string> = {
  'Nouveau':      'rgba(96,165,250,0.12)',
  'Qualifiée':    'rgba(167,139,250,0.12)',
  'Devis envoyé': 'rgba(56,189,248,0.12)',
  'Relance 1':    'rgba(251,146,60,0.12)',
}
const STATUS_TEXT: Record<string, string> = {
  'Nouveau':      '#93C5FD',
  'Qualifiée':    '#C4B5FD',
  'Devis envoyé': '#7DD3FC',
  'Relance 1':    '#FDBA74',
}

function CommercialView() {
  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STAT_CARDS.map(({ icon: Icon, val, label, color, bg }) => (
          <div
            key={label}
            className="rounded-xl p-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: bg }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="text-xl font-bold text-white">{val}</div>
            <div className="text-[11px] text-white/30 mt-0.5 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div
          className="px-4 py-2.5 grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-3 text-[10px] text-white/30 uppercase tracking-wider font-semibold"
          style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span>Client</span>
          <span className="hidden sm:block">Trajet</span>
          <span>Statut</span>
          <span className="text-right">HT</span>
        </div>
        {MOCK_LEADS.map((lead, i) => (
          <div
            key={lead.nom}
            className="px-4 py-3 grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-center"
            style={{
              borderBottom: i < MOCK_LEADS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined,
              background: lead.urgent ? 'rgba(251,146,60,0.04)' : undefined,
            }}
          >
            <div>
              <div className="text-sm font-medium text-white truncate flex items-center gap-1.5">
                {lead.urgent && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />}
                {lead.nom}
              </div>
              <div className="text-[11px] text-white/30">{lead.pax} pax</div>
            </div>
            <div className="hidden sm:block text-xs text-white/40 truncate">{lead.trajet}</div>
            <div>
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{
                  background: STATUS_COLORS[lead.statut] ?? 'rgba(255,255,255,0.05)',
                  color: STATUS_TEXT[lead.statut] ?? 'rgba(255,255,255,0.4)',
                }}
              >
                {lead.statut}
              </span>
            </div>
            <div className="text-right text-xs font-mono text-white/55">{lead.price}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { icon: Send,     label: 'Envoyer devis',  color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)' },
          { icon: Bell,     label: 'Relancer (3)',    color: '#FB923C', bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.2)' },
          { icon: BarChart3,label: 'Export CSV',      color: '#A78BFA', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' },
        ].map(({ icon: Icon, label, color, bg, border }) => (
          <button
            key={label}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all hover:brightness-125"
            style={{ background: bg, border: `1px solid ${border}`, color }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Main component ─────────────────────────────────── */
export default function ProductDemoSplit() {
  const [tab, setTab] = useState<Tab>('client')
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-8% 0px' })

  return (
    <section
      id="demo"
      className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden"
      style={{ background: '#0A1628' }}
    >
      <div className="absolute inset-0 bg-grid-dark opacity-20 pointer-events-none" />
      <div
        className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.35), transparent)' }}
      />

      <div ref={ref} className="container-neo relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="label-tag mb-5">Deux espaces, un outil</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-5 mb-4 leading-tight">
            Côté client. Côté{' '}
            <span className="text-gradient-blue">NeoTravel.</span>
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Le client suit sa demande en temps réel. L&apos;équipe NeoTravel pilote les leads,
            calcule, envoie et relance — depuis un seul dashboard.
          </p>
        </motion.div>

        {/* Mock browser */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.65 }}
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {/* Browser chrome */}
          <div
            className="flex items-center gap-3 px-5 py-3.5"
            style={{ background: '#0D1B36', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(239,68,68,0.6)' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(245,158,11,0.6)' }} />
              <span className="w-3 h-3 rounded-full" style={{ background: 'rgba(74,222,128,0.6)' }} />
            </div>

            {/* Tab switcher */}
            <div
              className="flex-1 flex items-center justify-center"
            >
              <div
                className="flex rounded-xl p-0.5 gap-0.5"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {([
                  { id: 'client' as Tab,     icon: User,       label: 'Espace client' },
                  { id: 'commercial' as Tab, icon: BarChart3,  label: 'NeoTravel dashboard' },
                ] as const).map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer"
                    style={{
                      background: tab === id ? 'rgba(37,99,235,0.25)' : 'transparent',
                      color: tab === id ? '#93C5FD' : 'rgba(255,255,255,0.35)',
                      border: tab === id ? '1px solid rgba(37,99,235,0.3)' : '1px solid transparent',
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-20" />
          </div>

          {/* Content area */}
          <div className="p-5 sm:p-7" style={{ background: '#061028', minHeight: 380 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                {tab === 'client' ? <ClientView /> : <CommercialView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
        >
          <Link href="/devis" className="btn-gold gap-2">
            Faire une demande de devis
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-white/30 text-sm">
            Vous êtes conseiller NeoTravel ?{' '}
            <Link href="/login" className="text-neo-blue hover:underline">Accéder au dashboard →</Link>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
