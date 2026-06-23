'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users, Clock, Bell, CheckCircle, TrendingUp, RefreshCw,
  Send, AlertTriangle, ExternalLink, Zap, ArrowRight,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Lead, LeadStatus, LEAD_STATUS_LABELS } from '@/types'
import { useAuth } from '@/context/AuthContext'
import StatusBadge from '@/components/StatusBadge'
import UrgencyBadge from '@/components/UrgencyBadge'

const cardAnim = {
  hidden:   { opacity: 0, y: 16 },
  visible:  (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.45 } }),
}

const PIPELINE_STAGES: { label: string; statuts: LeadStatus[]; color: string; bg: string }[] = [
  { label: 'Nouveaux',      statuts: ['nouveau'],                            color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { label: 'Qualifiés',     statuts: ['qualifie', 'incomplet'],              color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
  { label: 'Devis générés', statuts: ['devis_genere'],                       color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
  { label: 'Devis envoyés', statuts: ['devis_envoye'],                       color: 'text-sky-400',    bg: 'bg-sky-500/10'    },
  { label: 'Relances',      statuts: ['relance_1', 'relance_2'],             color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { label: 'Acceptés',      statuts: ['accepte'],                            color: 'text-green-400',  bg: 'bg-green-500/10'  },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [leads, setLeads]     = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats]     = useState({
    total: 0, nouveau: 0, enCours: 0, aEnvoyer: 0, relance: 0, accepte: 0, casComplexe: 0,
  })

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.leads.list({}) as Lead[]
      setLeads(data)
      setStats({
        total:       data.length,
        nouveau:     data.filter(l => l.statut === 'nouveau').length,
        enCours:     data.filter(l => ['qualifie', 'incomplet'].includes(l.statut)).length,
        aEnvoyer:    data.filter(l => l.statut === 'devis_genere').length,
        relance:     data.filter(l => ['relance_1', 'relance_2'].includes(l.statut)).length,
        accepte:     data.filter(l => l.statut === 'accepte').length,
        casComplexe: data.filter(l => l.statut === 'cas_complexe').length,
      })
    } catch {
      setLeads([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const prenom = user?.nom?.split(' ')[0] ?? 'Commercial'
  const today  = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  const STAT_CARDS = [
    { label: 'Leads total',      value: stats.total,       icon: Users,         color: 'text-blue-400',   bg: 'bg-blue-500/10'   },
    { label: 'Nouveaux',         value: stats.nouveau,     icon: TrendingUp,    color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'En attente',       value: stats.enCours,     icon: Clock,         color: 'text-sky-400',    bg: 'bg-sky-500/10'    },
    { label: 'Devis à envoyer',  value: stats.aEnvoyer,    icon: Send,          color: 'text-amber-400',  bg: 'bg-amber-500/10'  },
    { label: 'Relances',         value: stats.relance,     icon: Bell,          color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Acceptés',         value: stats.accepte,     icon: CheckCircle,   color: 'text-green-400',  bg: 'bg-green-500/10'  },
  ]

  // "À traiter maintenant" items
  const urgents    = leads.filter(l => l.urgence === 'urgent' && !['accepte', 'refuse', 'cloture'].includes(l.statut))
  const incomplets = leads.filter(l => l.statut === 'incomplet')
  const aEnvoyer   = leads.filter(l => l.statut === 'devis_genere')
  const aRelancer  = leads.filter(l => ['devis_envoye', 'relance_1'].includes(l.statut))
  const casComplx  = leads.filter(l => l.statut === 'cas_complexe')

  const alertItems = [
    urgents.length    > 0 && { label: `${urgents.length} lead${urgents.length > 1 ? 's' : ''} urgent${urgents.length > 1 ? 's' : ''}`,          color: 'text-red-400    bg-red-500/10    border-red-500/20'    },
    incomplets.length > 0 && { label: `${incomplets.length} demande${incomplets.length > 1 ? 's' : ''} incomplète${incomplets.length > 1 ? 's' : ''}`, color: 'text-amber-400  bg-amber-500/10  border-amber-500/20'  },
    aEnvoyer.length   > 0 && { label: `${aEnvoyer.length} devis à envoyer`,                                                                      color: 'text-blue-400   bg-blue-500/10   border-blue-500/20'   },
    aRelancer.length  > 0 && { label: `${aRelancer.length} relance${aRelancer.length > 1 ? 's' : ''} à envoyer`,                                 color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
    casComplx.length  > 0 && { label: `${casComplx.length} cas complexe${casComplx.length > 1 ? 's' : ''} à traiter`,                            color: 'text-rose-400   bg-rose-500/10   border-rose-500/20'   },
  ].filter(Boolean) as { label: string; color: string }[]

  // Recent leads (last 5 by date)
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">
            Bonjour, {prenom} 👋
          </h1>
          <p className="text-white/35 text-sm mt-0.5 capitalize">{today} · Pipeline commercial NeoTravel</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/leads" className="btn-ghost !px-4 !py-2 !text-sm gap-2">
            Voir tous les leads
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button onClick={fetchLeads} disabled={loading} className="btn-ghost !px-3 !py-2 gap-2 text-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI cards — 3 col × 2 rows */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardAnim}
            className="card-neo !p-4"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg} mb-2.5`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-[11px] text-white/35 mt-0.5 leading-tight">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* À traiter maintenant */}
      {!loading && alertItems.length > 0 && (
        <div className="mb-6 rounded-2xl border border-white/8 px-5 py-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-white">À traiter maintenant</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alertItems.map(({ label, color }) => (
              <Link
                key={label}
                href="/dashboard/leads"
                className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium border transition-opacity hover:opacity-80 ${color}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline stages */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-white">Pipeline</span>
          <span className="text-xs text-white/30">— répartition par étape</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {PIPELINE_STAGES.map(({ label, statuts, color, bg }) => {
            const count = leads.filter(l => statuts.includes(l.statut)).length
            return (
              <Link
                key={label}
                href="/dashboard/leads"
                className="rounded-xl p-3 text-center transition-all hover:scale-[1.02] border border-white/5 hover:border-white/10"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className={`text-xl font-bold ${color} mb-0.5`}>{count}</div>
                <div className="text-[10px] text-white/35 leading-tight">{label}</div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Leads récents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white">Leads récents</span>
          <Link href="/dashboard/leads" className="text-xs text-neo-blue hover:underline">Voir tous</Link>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Header */}
          <div
            className="grid grid-cols-12 gap-2 px-5 py-3 text-[11px] text-white/30 uppercase tracking-wider font-medium"
            style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="col-span-3">Client</span>
            <span className="col-span-3 hidden sm:block">Trajet</span>
            <span className="col-span-2">Statut</span>
            <span className="col-span-2 hidden md:block">Urgence</span>
            <span className="col-span-2 text-right">Date</span>
          </div>

          {loading && (
            <div className="px-5 py-8 text-center">
              <RefreshCw className="w-4 h-4 animate-spin text-white/25 mx-auto" />
            </div>
          )}

          {!loading && recentLeads.length === 0 && (
            <div className="px-5 py-10 text-center">
              <AlertTriangle className="w-7 h-7 text-white/15 mx-auto mb-2" />
              <p className="text-white/30 text-sm">Aucun lead pour l&apos;instant.</p>
              <Link href="/devis" className="text-neo-blue text-xs mt-2 inline-block hover:underline">
                Créer une première demande →
              </Link>
            </div>
          )}

          {!loading && recentLeads.map((lead, i) => (
            <div
              key={lead._id}
              className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center text-sm"
              style={{ borderBottom: i < recentLeads.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined }}
            >
              <div className="col-span-3">
                <div className="text-white font-medium text-[13px] truncate">{lead.nom}</div>
                <div className="text-white/30 text-[11px] truncate">{lead.email}</div>
              </div>
              <div className="col-span-3 hidden sm:block text-white/45 text-[12px] truncate">
                {lead.depart} → {lead.destination}
              </div>
              <div className="col-span-2">
                <StatusBadge status={lead.statut} size="sm" />
              </div>
              <div className="col-span-2 hidden md:block">
                <UrgencyBadge urgence={lead.urgence} size="sm" />
              </div>
              <div className="col-span-2 flex items-center justify-end gap-1.5">
                <span className="text-white/25 text-[11px] hidden sm:block">
                  {new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
                <Link
                  href={`/dashboard/leads/${lead._id}`}
                  className="p-1.5 rounded-lg text-white/25 hover:text-neo-blue hover:bg-neo-blue/10 transition-all"
                  title="Ouvrir le dossier"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
