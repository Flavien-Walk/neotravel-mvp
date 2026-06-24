'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users, Clock, Bell, CheckCircle, TrendingUp, RefreshCw,
  Send, AlertTriangle, ExternalLink, Zap, ArrowRight,
  FileText, AlertCircle, BarChart3, UserCheck, ChevronRight,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Lead, LeadStatus } from '@/types'
import { useAuth } from '@/context/AuthContext'
import StatusBadge from '@/components/StatusBadge'
import UrgencyBadge from '@/components/UrgencyBadge'

const EASE = [0.21, 0.47, 0.32, 0.98] as const

const PIPELINE_STAGES: { label: string; statuts: LeadStatus[]; color: string; bg: string }[] = [
  { label: 'Nouveaux',      statuts: ['nouveau'],                color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
  { label: 'Qualifiés',     statuts: ['qualifie', 'incomplet'],  color: '#60A5FA', bg: 'rgba(96,165,250,0.1)'  },
  { label: 'Devis générés', statuts: ['devis_genere'],           color: '#FBBF24', bg: 'rgba(251,191,36,0.1)'  },
  { label: 'Devis envoyés', statuts: ['devis_envoye'],           color: '#38BDF8', bg: 'rgba(56,189,248,0.1)'  },
  { label: 'Relances',      statuts: ['relance_1', 'relance_2'], color: '#FB923C', bg: 'rgba(251,146,60,0.1)'  },
  { label: 'Acceptés',      statuts: ['accepte'],                color: '#4ADE80', bg: 'rgba(74,222,128,0.1)'  },
]

const fade = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay: i * 0.05, ease: EASE },
})

function StatCard({ label, value, Icon, color, bg, loading, accent }: {
  label: string; value: number; Icon: typeof BarChart3; color: string; bg: string; loading: boolean; accent?: string
}) {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden flex flex-col gap-3 transition-all hover:translate-y-[-1px]"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.022) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 20px rgba(0,0,0,0.25)',
      }}
    >
      {accent && <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl" style={{ background: accent }} />}
      <div className="flex items-start justify-between gap-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>{label}</span>
      </div>
      <div className="text-3xl font-bold text-white tabular-nums">
        {loading ? <span style={{ color: 'rgba(255,255,255,0.12)' }}>—</span> : value}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [leads, setLeads]   = useState<Lead[]>([])
  const [loading, setLoad]  = useState(true)
  const [stats, setStats]   = useState({
    total: 0, nouveau: 0, enCours: 0, aEnvoyer: 0, relance: 0, accepte: 0,
  })

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

  const prenom    = user?.nom?.split(' ')[0] ?? 'Commercial'
  const today     = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const urgents   = leads.filter(l => l.urgence === 'urgent' && !['accepte', 'refuse', 'cloture'].includes(l.statut))
  const incomplets = leads.filter(l => l.statut === 'incomplet')
  const aEnvoyer  = leads.filter(l => l.statut === 'devis_genere')
  const aRelancer = leads.filter(l => ['devis_envoye', 'relance_1'].includes(l.statut))
  const casComplx = leads.filter(l => l.statut === 'cas_complexe')
  const repriseH  = leads.filter(l => l.statut === 'reprise_humaine')
  const needsHuman = [...casComplx, ...repriseH]
  const recentLeads = [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8)
  const totalActive = stats.total - stats.accepte

  const ALERTS = [
    urgents.length    > 0 && { label: `${urgents.length} urgent${urgents.length > 1 ? 's' : ''}`,                color: '#F87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', Icon: AlertCircle   },
    aEnvoyer.length   > 0 && { label: `${aEnvoyer.length} devis à envoyer`,                                      color: '#FBBF24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.25)',  Icon: Send          },
    aRelancer.length  > 0 && { label: `${aRelancer.length} relance${aRelancer.length > 1 ? 's' : ''}`,          color: '#FB923C', bg: 'rgba(251,146,60,0.1)',  border: 'rgba(251,146,60,0.25)',  Icon: Bell          },
    incomplets.length > 0 && { label: `${incomplets.length} incomplet${incomplets.length > 1 ? 's' : ''}`,       color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)',  Icon: FileText      },
    casComplx.length  > 0 && { label: `${casComplx.length} cas complexe${casComplx.length > 1 ? 's' : ''}`,     color: '#C084FC', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.25)', Icon: AlertTriangle },
  ].filter(Boolean) as { label: string; color: string; bg: string; border: string; Icon: typeof AlertCircle }[]

  return (
    <div
      className="min-h-screen p-6 sm:p-8 max-w-5xl mx-auto space-y-6"
      style={{ background: 'linear-gradient(180deg, #081224 0%, #050E1E 100%)' }}
    >
      {/* ── Header ── */}
      <motion.div {...fade(0)} className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[10px] font-bold uppercase tracking-[0.16em] px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(37,99,235,0.12)', color: '#93C5FD', border: '1px solid rgba(37,99,235,0.22)' }}
            >
              Pipeline commercial
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">Bonjour, {prenom} 👋</h1>
          <p className="text-sm mt-0.5 capitalize" style={{ color: 'rgba(255,255,255,0.3)' }}>{today}</p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="flex items-center justify-center w-9 h-9 rounded-xl transition-all hover:bg-white/6"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: 'rgba(255,255,255,0.38)' }} />
          </button>
          <Link
            href="/dashboard/leads"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:bg-white/6"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.65)' }}
          >
            Tous les leads
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </motion.div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total leads',     value: stats.total,    Icon: BarChart3,   color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  accent: 'linear-gradient(90deg,#2563EB,#38BDF8)' },
          { label: 'Nouveaux',        value: stats.nouveau,  Icon: TrendingUp,  color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', accent: '#A78BFA' },
          { label: 'Qualification',   value: stats.enCours,  Icon: Clock,       color: '#38BDF8', bg: 'rgba(56,189,248,0.12)',  accent: '#38BDF8' },
          { label: 'À envoyer',       value: stats.aEnvoyer, Icon: Send,        color: '#FBBF24', bg: 'rgba(251,191,36,0.12)',  accent: '#FBBF24' },
          { label: 'Relances',        value: stats.relance,  Icon: Bell,        color: '#FB923C', bg: 'rgba(251,146,60,0.12)',  accent: '#FB923C' },
          { label: 'Acceptés',        value: stats.accepte,  Icon: CheckCircle, color: '#4ADE80', bg: 'rgba(74,222,128,0.12)',  accent: '#4ADE80' },
        ].map(({ label, value, Icon, color, bg, accent }, i) => (
          <motion.div key={label} {...fade(i + 1)}>
            <StatCard label={label} value={value} Icon={Icon} color={color} bg={bg} loading={loading} accent={accent} />
          </motion.div>
        ))}
      </div>

      {/* ── À traiter ── */}
      {!loading && ALERTS.length > 0 && (
        <motion.div
          {...fade(8)}
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(251,146,60,0.04) 100%)',
            border: '1px solid rgba(251,191,36,0.15)',
          }}
        >
          <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: '1px solid rgba(251,191,36,0.08)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(251,191,36,0.12)' }}>
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-sm font-bold text-white">À traiter maintenant</span>
            <span
              className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
              style={{ background: 'rgba(251,191,36,0.12)', color: '#FBBF24' }}
            >
              {ALERTS.reduce((s, a) => s + parseInt(a.label), 0) || ALERTS.length} action{ALERTS.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 px-5 py-4">
            {ALERTS.map(({ label, color, bg, border, Icon }) => (
              <Link
                key={label}
                href="/dashboard/leads"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 hover:translate-y-[-1px] active:scale-95"
                style={{ background: bg, border: `1px solid ${border}`, color, boxShadow: `0 2px 8px ${bg}` }}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                {label}
                <ChevronRight className="w-3 h-3 opacity-60" />
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── HITL ── */}
      {!loading && needsHuman.length > 0 && (
        <motion.div
          {...fade(8.5)}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.18)' }}
        >
          <div className="flex items-center gap-3 px-5 py-3.5" style={{ borderBottom: '1px solid rgba(248,113,113,0.1)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(248,113,113,0.14)' }}>
              <UserCheck className="w-4 h-4" style={{ color: '#F87171' }} />
            </div>
            <div className="flex-1">
              <span className="text-sm font-bold" style={{ color: '#FCA5A5' }}>
                {needsHuman.length} dossier{needsHuman.length > 1 ? 's' : ''} requièrent une intervention commerciale
              </span>
            </div>
            <Link
              href="/dashboard/leads"
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:opacity-80"
              style={{ background: 'rgba(248,113,113,0.12)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)' }}
            >
              Voir tous →
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(248,113,113,0.07)' }}>
            {needsHuman.slice(0, 4).map(lead => (
              <Link
                key={lead._id}
                href={`/dashboard/leads/${lead._id}`}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.012]"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'rgba(248,113,113,0.12)', color: '#F87171' }}
                >
                  {lead.nom.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{lead.nom}</div>
                  <div className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    {lead.depart} → {lead.destination} · {lead.nb_passagers} pax
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  style={{
                    background: lead.statut === 'reprise_humaine' ? 'rgba(248,113,113,0.14)' : 'rgba(192,132,252,0.14)',
                    color:      lead.statut === 'reprise_humaine' ? '#F87171' : '#C084FC',
                  }}
                >
                  {lead.statut === 'reprise_humaine' ? 'Reprise humaine' : 'Cas complexe'}
                </span>
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.18)' }} />
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Pipeline ── */}
      <motion.div {...fade(9)}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm font-bold text-white">Pipeline</span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {totalActive} lead{totalActive !== 1 ? 's' : ''} actif{totalActive !== 1 ? 's' : ''}
          </span>
        </div>
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          }}
        >
          <div className="grid grid-cols-3 sm:grid-cols-6">
            {PIPELINE_STAGES.map(({ label, statuts, color, bg }, idx) => {
              const count = leads.filter(l => statuts.includes(l.statut)).length
              const last  = idx === PIPELINE_STAGES.length - 1
              const pct   = stats.total > 0 ? (count / stats.total) * 100 : 0
              return (
                <Link
                  key={label}
                  href="/dashboard/leads"
                  className="relative flex flex-col items-center py-5 px-2 text-center transition-all hover:bg-white/[0.025] group"
                  style={{ borderRight: !last ? '1px solid rgba(255,255,255,0.05)' : undefined }}
                >
                  {/* Mini bar */}
                  {count > 0 && (
                    <div className="absolute bottom-0 inset-x-0 h-[3px]" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  )}
                  <div
                    className="text-3xl font-bold mb-1 tabular-nums"
                    style={{ color: count > 0 ? color : 'rgba(255,255,255,0.1)' }}
                  >
                    {loading ? '—' : count}
                  </div>
                  <div
                    className="text-[10px] font-medium leading-tight"
                    style={{ color: count > 0 ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.15)' }}
                  >
                    {label}
                  </div>
                  {count > 0 && (
                    <div
                      className="mt-1.5 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: bg }}
                    >
                      <ChevronRight className="w-3 h-3" style={{ color }} />
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Leads récents ── */}
      <motion.div {...fade(10)}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-white">Leads récents</span>
          <Link href="/dashboard/leads" className="text-xs font-medium hover:underline" style={{ color: '#60A5FA' }}>
            Voir tous →
          </Link>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Header */}
          <div
            className="grid grid-cols-12 gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.22)' }}
          >
            <span className="col-span-3">Client</span>
            <span className="col-span-3 hidden sm:block">Trajet</span>
            <span className="col-span-2">Statut</span>
            <span className="col-span-2 hidden md:block">Urgence</span>
            <span className="col-span-2 text-right">Date</span>
          </div>

          {loading && (
            <div className="px-5 py-10 flex justify-center">
              <RefreshCw className="w-4 h-4 animate-spin" style={{ color: 'rgba(255,255,255,0.18)' }} />
            </div>
          )}

          {!loading && recentLeads.length === 0 && (
            <div className="px-5 py-14 text-center">
              <Users className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>Aucun lead pour l&apos;instant.</p>
              <Link href="/devis" className="text-xs mt-2 inline-block hover:underline" style={{ color: '#60A5FA' }}>
                Créer une première demande →
              </Link>
            </div>
          )}

          {!loading && recentLeads.map((lead, i) => (
            <div
              key={lead._id}
              className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center text-sm transition-colors hover:bg-white/[0.025] cursor-pointer"
              style={{ borderBottom: i < recentLeads.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined }}
              onClick={() => window.location.href = `/dashboard/leads/${lead._id}`}
            >
              <div className="col-span-3 flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: 'rgba(37,99,235,0.15)', color: '#60A5FA', border: '1px solid rgba(37,99,235,0.2)' }}
                >
                  {lead.nom.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-white truncate">{lead.nom}</div>
                  <div className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.25)' }}>{lead.email}</div>
                </div>
              </div>
              <div className="col-span-3 hidden sm:block text-[12px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {lead.depart} → {lead.destination}
              </div>
              <div className="col-span-2">
                <StatusBadge status={lead.statut} size="sm" />
              </div>
              <div className="col-span-2 hidden md:block">
                <UrgencyBadge urgence={lead.urgence} size="sm" />
              </div>
              <div className="col-span-2 flex items-center justify-end gap-1.5">
                <span className="text-[11px] hidden sm:block" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  {new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
                <Link
                  href={`/dashboard/leads/${lead._id}`}
                  onClick={e => e.stopPropagation()}
                  className="p-1.5 rounded-lg transition-all hover:bg-neo-blue/10 hover:text-neo-blue"
                  style={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
