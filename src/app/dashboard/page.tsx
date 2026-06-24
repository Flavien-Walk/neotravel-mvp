'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users, Clock, Bell, CheckCircle, TrendingUp, RefreshCw,
  Send, ExternalLink, ArrowRight, AlertCircle, BarChart3,
  UserCheck, ChevronRight, MapPin, Plus, Zap, Navigation,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Lead, LeadStatus } from '@/types'
import { useAuth } from '@/context/AuthContext'
import StatusBadge from '@/components/StatusBadge'
import UrgencyBadge from '@/components/UrgencyBadge'

const EASE = [0.21, 0.47, 0.32, 0.98] as const

const PIPELINE_STAGES: { label: string; statuts: LeadStatus[]; color: string; glow: string }[] = [
  { label: 'Nouveau',    statuts: ['nouveau'],                              color: '#A78BFA', glow: 'rgba(167,139,250,0.4)' },
  { label: 'Qualifié',  statuts: ['qualifie', 'incomplet'],               color: '#60A5FA', glow: 'rgba(96,165,250,0.4)'  },
  { label: 'Devis prêt',statuts: ['devis_genere'],                         color: '#FBBF24', glow: 'rgba(251,191,36,0.4)'  },
  { label: 'Envoyé',    statuts: ['devis_envoye'],                         color: '#38BDF8', glow: 'rgba(56,189,248,0.4)'  },
  { label: 'Relance',   statuts: ['relance_1', 'relance_2'],               color: '#FB923C', glow: 'rgba(251,146,60,0.4)'  },
  { label: 'Accepté',   statuts: ['accepte'],                              color: '#4ADE80', glow: 'rgba(74,222,128,0.4)'  },
  { label: 'Reprise',   statuts: ['reprise_humaine', 'cas_complexe'],      color: '#F87171', glow: 'rgba(248,113,113,0.4)' },
]

function fade(i: number) {
  return {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: i * 0.055, ease: EASE },
  }
}

function RouteSVG() {
  return (
    <svg viewBox="0 0 280 80" fill="none" className="w-full h-full">
      <path
        d="M 24 58 C 70 16, 190 72, 254 28"
        stroke="url(#rg)" strokeWidth="1.8" strokeDasharray="5 3.5"
        strokeLinecap="round"
      />
      <circle cx="24"  cy="58" r="5"   fill="rgba(167,139,250,0.2)" stroke="#A78BFA" strokeWidth="1.5" />
      <circle cx="24"  cy="58" r="2"   fill="#A78BFA" />
      <circle cx="254" cy="28" r="5"   fill="rgba(56,189,248,0.2)"  stroke="#38BDF8" strokeWidth="1.5" />
      <circle cx="254" cy="28" r="2"   fill="#38BDF8" />
      <circle cx="139" cy="46" r="3.5" fill="rgba(251,191,36,0.2)"  stroke="#FBBF24" strokeWidth="1.2" />
      <defs>
        <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#A78BFA" />
          <stop offset="50%"  stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function KPICard({
  label, value, Icon, color, bg, accent, loading, pct,
}: {
  label: string; value: number; Icon: typeof BarChart3; color: string; bg: string;
  accent: string; loading: boolean; pct?: number;
}) {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-default group"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.025) 100%)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 2px 0 rgba(255,255,255,0.06) inset, 0 8px 32px rgba(0,0,0,0.35)',
      }}
    >
      <div className="absolute top-0 inset-x-0 h-[3px] rounded-t-2xl" style={{ background: accent }} />
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full transition-opacity opacity-20 group-hover:opacity-30"
        style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }}
      />
      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-4" style={{ background: bg }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="text-3xl font-bold text-white tabular-nums mb-0.5">
        {loading ? <span className="text-white/10">—</span> : value}
      </div>
      <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.28)' }}>
        {label}
      </div>
      {pct !== undefined && (
        <div className="mt-3.5 h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${Math.max(pct, 0)}%`, background: accent }}
          />
        </div>
      )}
    </div>
  )
}

function ActionCard({
  count, label, description, color, bg, border, Icon, href, loading,
}: {
  count: number; label: string; description: string; color: string; bg: string;
  border: string; Icon: typeof Send; href: string; loading: boolean;
}) {
  if (loading) {
    return (
      <div className="rounded-2xl p-5 h-[152px] animate-pulse" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }} />
    )
  }
  return (
    <Link
      href={href}
      className="group rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-1"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        boxShadow: count > 0 ? `0 6px 28px ${color}18` : 'none',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {count > 0 && (
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: color, color: '#030D20' }}>
            {count}
          </span>
        )}
      </div>
      <div>
        <div className="text-3xl font-bold tabular-nums mb-0.5" style={{ color: count > 0 ? color : 'rgba(255,255,255,0.15)' }}>
          {count}
        </div>
        <div className="text-[13px] font-semibold text-white leading-tight">{label}</div>
        <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>{description}</div>
      </div>
      <div
        className="flex items-center gap-1 text-xs font-semibold transition-all opacity-0 group-hover:opacity-100 translate-x-0 group-hover:translate-x-1"
        style={{ color }}
      >
        Voir les dossiers <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [leads, setLeads]  = useState<Lead[]>([])
  const [loading, setLoad] = useState(true)
  const [stats, setStats]  = useState({ total: 0, nouveau: 0, enCours: 0, aEnvoyer: 0, relance: 0, accepte: 0 })

  const fetchLeads = useCallback(async () => {
    setLoad(true)
    try {
      const data = await api.leads.list({}) as Lead[]
      setLeads(data)
      setStats({
        total:    data.length,
        nouveau:  data.filter(l => l.statut === 'nouveau').length,
        enCours:  data.filter(l => ['qualifie', 'incomplet'].includes(l.statut)).length,
        aEnvoyer: data.filter(l => l.statut === 'devis_genere').length,
        relance:  data.filter(l => ['relance_1', 'relance_2'].includes(l.statut)).length,
        accepte:  data.filter(l => l.statut === 'accepte').length,
      })
    } catch { setLeads([]) }
    setLoad(false)
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const prenom       = user?.nom?.split(' ')[0] ?? 'Commercial'
  const today        = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const urgents      = leads.filter(l => l.urgence === 'urgent' && !['accepte', 'refuse', 'cloture'].includes(l.statut))
  const aEnvoyer     = leads.filter(l => l.statut === 'devis_genere')
  const aRelancer    = leads.filter(l => ['devis_envoye', 'relance_1'].includes(l.statut))
  const needsHuman   = leads.filter(l => ['cas_complexe', 'reprise_humaine'].includes(l.statut))
  const recentLeads  = [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)
  const activeleads  = leads.filter(l => !['accepte', 'refuse', 'cloture'].includes(l.statut))
  const conversion   = stats.total > 0 ? Math.round((stats.accepte / stats.total) * 100) : 0
  const totalActions = aEnvoyer.length + urgents.length + needsHuman.length

  return (
    <div
      className="min-h-screen relative"
      style={{ background: 'linear-gradient(145deg, #0F1F3E 0%, #0B1730 55%, #080F22 100%)' }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.028) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      {/* Gradient orb */}
      <div
        className="absolute top-0 right-1/4 w-[600px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(37,99,235,0.07) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <div className="relative p-6 lg:p-8 space-y-7">

        {/* ═══ HEADER ═══ */}
        <motion.div {...fade(0)} className="grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-5 items-start">
          <div>
            <div className="flex items-center gap-2.5 mb-3 flex-wrap">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(37,99,235,0.1)', color: '#93C5FD', border: '1px solid rgba(37,99,235,0.2)' }}
              >
                Cockpit commercial
              </span>
              {totalActions > 0 && (
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(251,191,36,0.1)', color: '#FBBF24', border: '1px solid rgba(251,191,36,0.22)' }}
                >
                  <Zap className="w-2.5 h-2.5 inline mr-1" />
                  {totalActions} action{totalActions > 1 ? 's' : ''} à traiter
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">Bonjour, {prenom}</h1>
            <p className="text-sm capitalize" style={{ color: 'rgba(255,255,255,0.3)' }}>{today}</p>

            <div className="flex items-center gap-2.5 mt-5 flex-wrap">
              <button
                onClick={fetchLeads}
                disabled={loading}
                className="flex items-center justify-center w-9 h-9 rounded-xl transition-all hover:bg-white/8"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: 'rgba(255,255,255,0.38)' }} />
              </button>
              <Link
                href="/dashboard/leads"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-white/8"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.6)' }}
              >
                <Users className="w-3.5 h-3.5" />
                Tous les leads
              </Link>
              <Link
                href="/devis"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #1D4ED8 0%, #0EA5E9 100%)',
                  color: '#fff',
                  boxShadow: '0 4px 18px rgba(37,99,235,0.35)',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                Nouveau lead
              </Link>
            </div>
          </div>

          {/* Route card */}
          <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 2px 0 rgba(255,255,255,0.06) inset, 0 8px 32px rgba(0,0,0,0.3)',
              height: 148,
            }}
          >
            <div className="relative z-10">
              <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.22)' }}>
                Trajets actifs
              </div>
              <div className="text-3xl font-bold text-white tabular-nums">
                {loading ? '—' : activeleads.length}
              </div>
            </div>
            <div className="absolute inset-x-3 bottom-3 top-[52px]">
              <RouteSVG />
            </div>
            <div className="absolute left-5 bottom-3 flex items-center gap-1 text-[10px] font-medium" style={{ color: 'rgba(167,139,250,0.65)' }}>
              <MapPin className="w-2.5 h-2.5" />Départ
            </div>
            <div className="absolute right-5 bottom-3 flex items-center gap-1 text-[10px] font-medium" style={{ color: 'rgba(56,189,248,0.65)' }}>
              Arrivée<MapPin className="w-2.5 h-2.5" />
            </div>
          </div>
        </motion.div>

        {/* ═══ KPI BENTO ═══ */}
        <motion.div {...fade(1)} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[
            { label: 'Total leads',   value: stats.total,    Icon: BarChart3,   color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',  accent: 'linear-gradient(90deg,#1D4ED8,#0EA5E9)', pct: 100 },
            { label: 'Nouveaux',      value: stats.nouveau,  Icon: TrendingUp,  color: '#A78BFA', bg: 'rgba(167,139,250,0.1)', accent: '#A78BFA', pct: stats.total > 0 ? (stats.nouveau  / stats.total) * 100 : 0 },
            { label: 'Qualification', value: stats.enCours,  Icon: Clock,       color: '#38BDF8', bg: 'rgba(56,189,248,0.1)',  accent: '#38BDF8', pct: stats.total > 0 ? (stats.enCours  / stats.total) * 100 : 0 },
            { label: 'À envoyer',     value: stats.aEnvoyer, Icon: Send,        color: '#FBBF24', bg: 'rgba(251,191,36,0.1)',  accent: '#FBBF24', pct: stats.total > 0 ? (stats.aEnvoyer / stats.total) * 100 : 0 },
            { label: 'Relances',      value: stats.relance,  Icon: Bell,        color: '#FB923C', bg: 'rgba(251,146,60,0.1)',  accent: '#FB923C', pct: stats.total > 0 ? (stats.relance  / stats.total) * 100 : 0 },
            { label: 'Acceptés',      value: stats.accepte,  Icon: CheckCircle, color: '#4ADE80', bg: 'rgba(74,222,128,0.1)',  accent: '#4ADE80', pct: stats.total > 0 ? (stats.accepte  / stats.total) * 100 : 0 },
          ].map(({ label, value, Icon, color, bg, accent, pct }) => (
            <KPICard key={label} label={label} value={value} Icon={Icon} color={color} bg={bg} accent={accent} loading={loading} pct={pct} />
          ))}
        </motion.div>

        {/* ═══ ACTION CARDS ═══ */}
        <motion.div {...fade(2)} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ActionCard
            count={aEnvoyer.length} loading={loading}
            label="Devis à envoyer"
            description={aEnvoyer.length === 0 ? 'Aucun devis en attente' : 'Calculés, prêts à être envoyés'}
            color="#FBBF24" bg="rgba(251,191,36,0.07)" border="rgba(251,191,36,0.18)"
            Icon={Send} href="/dashboard/leads"
          />
          <ActionCard
            count={aRelancer.length} loading={loading}
            label="Relances à faire"
            description={aRelancer.length === 0 ? 'Aucune relance en attente' : 'Clients en attente de réponse'}
            color="#FB923C" bg="rgba(251,146,60,0.07)" border="rgba(251,146,60,0.18)"
            Icon={Bell} href="/dashboard/leads"
          />
          <ActionCard
            count={needsHuman.length} loading={loading}
            label="Reprise humaine"
            description={needsHuman.length === 0 ? 'Aucun dossier complexe' : 'Dossiers nécessitant une intervention'}
            color="#F87171" bg="rgba(248,113,113,0.07)" border="rgba(248,113,113,0.18)"
            Icon={UserCheck} href="/dashboard/leads"
          />
        </motion.div>

        {/* ═══ PIPELINE TIMELINE ═══ */}
        <motion.div {...fade(3)}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Navigation className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.22)' }} />
              <span className="text-sm font-bold text-white">Pipeline commercial</span>
              {!loading && (
                <span
                  className="text-xs px-2.5 py-1 rounded-full tabular-nums"
                  style={{ background: 'rgba(74,222,128,0.08)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.18)' }}
                >
                  {conversion}% conversion
                </span>
              )}
            </div>
            <Link href="/dashboard/leads" className="text-xs font-medium hover:underline" style={{ color: '#60A5FA' }}>
              Vue complète →
            </Link>
          </div>

          <div
            className="rounded-2xl p-5 lg:p-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.018) 100%)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 2px 0 rgba(255,255,255,0.06) inset, 0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            {/* Connection line */}
            <div
              className="hidden sm:block absolute h-[1.5px] pointer-events-none"
              style={{
                top: 45, left: 80, right: 80,
                background: 'linear-gradient(90deg, #A78BFA40, #60A5FA40, #FBBF2440, #38BDF840, #FB923C40, #4ADE8040, #F8717140)',
              }}
            />

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {PIPELINE_STAGES.map(({ label, statuts, color, glow }) => {
                const count = leads.filter(l => statuts.includes(l.statut)).length
                return (
                  <Link
                    key={label}
                    href="/dashboard/leads"
                    className="flex flex-col items-center gap-2.5 py-2 group"
                  >
                    <div
                      className="relative w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold tabular-nums transition-all duration-200 group-hover:scale-110 z-10"
                      style={{
                        background:  count > 0 ? `${color}16` : 'rgba(255,255,255,0.04)',
                        border:      `2px solid ${count > 0 ? color : 'rgba(255,255,255,0.1)'}`,
                        color:       count > 0 ? color : 'rgba(255,255,255,0.2)',
                        boxShadow:   count > 0 ? `0 0 18px ${glow}, 0 0 6px ${glow}` : 'none',
                      }}
                    >
                      {loading ? '—' : count}
                    </div>
                    <span
                      className="text-[10px] font-medium text-center leading-tight"
                      style={{ color: count > 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.18)' }}
                    >
                      {label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* ═══ BOTTOM: TABLE + PILOTAGE ═══ */}
        <motion.div {...fade(4)} className="grid lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-6 items-start">

          {/* ─── Leads table ─── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-white">Leads récents</span>
              <Link href="/dashboard/leads" className="flex items-center gap-1 text-xs font-medium hover:underline" style={{ color: '#60A5FA' }}>
                Voir tous <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.018) 100%)',
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: '0 2px 0 rgba(255,255,255,0.06) inset, 0 8px 32px rgba(0,0,0,0.28)',
              }}
            >
              <div
                className="grid grid-cols-12 gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.22)' }}
              >
                <span className="col-span-4">Client</span>
                <span className="col-span-3 hidden sm:block">Trajet</span>
                <span className="col-span-2">Statut</span>
                <span className="col-span-2 hidden md:block">Urgence</span>
                <span className="col-span-1" />
              </div>

              {loading && (
                <div className="px-5 py-12 flex justify-center">
                  <RefreshCw className="w-4 h-4 animate-spin" style={{ color: 'rgba(255,255,255,0.18)' }} />
                </div>
              )}

              {!loading && recentLeads.length === 0 && (
                <div className="px-5 py-16 text-center">
                  <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <Users className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.14)' }} />
                  </div>
                  <p className="text-sm font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.22)' }}>Aucun lead pour l&apos;instant.</p>
                  <Link href="/devis" className="text-xs hover:underline" style={{ color: '#60A5FA' }}>
                    Créer une première demande →
                  </Link>
                </div>
              )}

              {!loading && recentLeads.map((lead, i) => (
                <div
                  key={lead._id}
                  className="grid grid-cols-12 gap-2 px-5 py-4 items-center text-sm cursor-pointer group"
                  style={{
                    borderBottom: i < recentLeads.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined,
                    transition: 'background 0.15s',
                  }}
                  onClick={() => { window.location.href = `/dashboard/leads/${lead._id}` }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.028)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-transform group-hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(14,165,233,0.12))',
                        color: '#93C5FD',
                        border: '1px solid rgba(37,99,235,0.22)',
                      }}
                    >
                      {lead.nom.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-white truncate">{lead.nom}</div>
                      <div className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {lead.societe || lead.email}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-3 hidden sm:flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(167,139,250,0.5)' }} />
                    <span className="text-[12px] truncate" style={{ color: 'rgba(255,255,255,0.38)' }}>
                      {lead.depart} → {lead.destination}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <StatusBadge status={lead.statut} size="sm" />
                  </div>
                  <div className="col-span-2 hidden md:block">
                    <UrgencyBadge urgence={lead.urgence} size="sm" />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(96,165,250,0.1)' }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" style={{ color: '#60A5FA' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Pilotage column ─── */}
          <div className="space-y-4">

            {/* Stats rapides */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.018) 100%)',
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: '0 2px 0 rgba(255,255,255,0.06) inset',
              }}
            >
              <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.22)' }}>
                Pilotage rapide
              </div>
              <div className="space-y-2.5">
                {[
                  { label: 'Taux de conversion', value: `${conversion}%`,     color: '#4ADE80' },
                  { label: 'Leads urgents',       value: urgents.length,       color: urgents.length > 0 ? '#F87171' : 'rgba(255,255,255,0.22)' },
                  { label: 'Incomplets',          value: leads.filter(l => l.statut === 'incomplet').length, color: '#FBBF24' },
                  { label: 'Actifs total',        value: activeleads.length,   color: '#60A5FA' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.32)' }}>{label}</span>
                    <span className="text-sm font-bold tabular-nums" style={{ color }}>
                      {loading ? '—' : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Urgents */}
            {!loading && urgents.length > 0 && (
              <div
                className="rounded-2xl p-4"
                style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)' }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-3.5 h-3.5" style={{ color: '#F87171' }} />
                  <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#F87171' }}>
                    Urgents · {urgents.length}
                  </div>
                </div>
                <div className="space-y-2">
                  {urgents.slice(0, 3).map(lead => (
                    <Link
                      key={lead._id}
                      href={`/dashboard/leads/${lead._id}`}
                      className="flex items-center gap-2 group"
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{ background: 'rgba(248,113,113,0.14)', color: '#F87171' }}
                      >
                        {lead.nom.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{lead.nom}</div>
                        <div className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.28)' }}>
                          {lead.depart} → {lead.destination}
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#F87171' }} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Garanties NeoTravel */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.012) 100%)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
                Engagements NeoTravel
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Calcul 100% traçable', color: '#4ADE80' },
                  { label: 'Reprise humaine si besoin', color: '#C084FC' },
                  { label: 'Réponse en moins de 2h', color: '#38BDF8' },
                  { label: 'Prix déterministe & auditable', color: '#FBBF24' },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Lien paramètres */}
            <Link
              href="/dashboard/settings"
              className="flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-medium transition-all hover:bg-white/8"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.38)',
              }}
            >
              <span>Paramètres de calcul</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
