'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Users, Clock, Bell, CheckCircle, TrendingUp, RefreshCw, ExternalLink, Search, Filter, AlertCircle, Zap } from 'lucide-react'
import { api } from '@/lib/api'
import { Lead, LeadStatus, LEAD_STATUS_LABELS } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import UrgencyBadge from '@/components/UrgencyBadge'

const STATUS_OPTIONS: LeadStatus[] = [
  'nouveau', 'incomplet', 'qualifie', 'devis_genere', 'devis_envoye',
  'relance_1', 'relance_2', 'accepte', 'refuse', 'cas_complexe', 'cloture',
]

const cardAnim = {
  hidden:   { opacity: 0, y: 16 },
  visible:  (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.45 } }),
}

export default function DashboardPage() {
  const [leads, setLeads]           = useState<Lead[]>([])
  const [loading, setLoading]       = useState(true)
  const [filterStatus, setFilter]   = useState<string>('')
  const [search, setSearch]         = useState('')
  const [stats, setStats]           = useState({ total: 0, nouveau: 0, enCours: 0, relance: 0, accepte: 0 })
  const [relancing, setRelancing]   = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (filterStatus) params.statut = filterStatus
      const data = await api.leads.list(params) as Lead[]
      setLeads(data)
      setStats({
        total:    data.length,
        nouveau:  data.filter(l => l.statut === 'nouveau').length,
        enCours:  data.filter(l => ['qualifie','devis_genere','devis_envoye'].includes(l.statut)).length,
        relance:  data.filter(l => ['relance_1','relance_2'].includes(l.statut)).length,
        accepte:  data.filter(l => l.statut === 'accepte').length,
      })
    } catch {
      setLeads([])
    }
    setLoading(false)
  }, [filterStatus])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const filtered = leads.filter(l =>
    !search ||
    l.nom.toLowerCase().includes(search.toLowerCase()) ||
    l.email.toLowerCase().includes(search.toLowerCase()) ||
    l.depart.toLowerCase().includes(search.toLowerCase()) ||
    l.destination.toLowerCase().includes(search.toLowerCase())
  )

  async function handleRelance(id: string) {
    setRelancing(id)
    try {
      await api.leads.updateStatus(id, 'relance_1')
      await api.logs.create({ action: 'RELANCE_EMAIL', leadId: id, status: 'success', message: 'Relance envoyée depuis le dashboard' })
      await fetchLeads()
    } catch {}
    setRelancing(null)
  }

  const STAT_CARDS = [
    { label: 'Leads total',          value: stats.total,   icon: Users,        color: 'text-blue-400',   bg: 'bg-blue-500/10' },
    { label: 'Nouveaux leads',        value: stats.nouveau, icon: TrendingUp,   color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Relances à envoyer',    value: stats.relance, icon: Bell,         color: 'text-amber-400',  bg: 'bg-amber-500/10' },
    { label: 'Acceptés',              value: stats.accepte, icon: CheckCircle,  color: 'text-green-400',  bg: 'bg-green-500/10' },
  ]

  return (
    <div className="p-6 sm:p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">Vue d&apos;ensemble</h1>
          <p className="text-white/35 text-sm mt-0.5">Pipeline commercial NeoTravel</p>
        </div>
        <button
          onClick={fetchLeads}
          disabled={loading}
          className="btn-ghost !px-3 !py-2 gap-2 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={cardAnim}
            className="card-neo"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bg} mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-[11px] text-white/35 mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* À traiter maintenant */}
      {!loading && (() => {
        const urgents    = leads.filter(l => l.urgence === 'urgent' && !['accepte','refuse','cloture'].includes(l.statut))
        const incomplets = leads.filter(l => l.statut === 'incomplet')
        const aRelancer  = leads.filter(l => ['devis_envoye','relance_1'].includes(l.statut))
        const aEnvoyer   = leads.filter(l => l.statut === 'devis_genere')
        const items = [
          urgents.length    > 0 && { label: `${urgents.length} lead${urgents.length>1?'s':''} urgent${urgents.length>1?'s':''}`,     color: 'text-red-400 bg-red-500/10 border-red-500/20' },
          incomplets.length > 0 && { label: `${incomplets.length} demande${incomplets.length>1?'s':''} incomplète${incomplets.length>1?'s':''}`, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
          aEnvoyer.length   > 0 && { label: `${aEnvoyer.length} devis à envoyer`,                                                    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
          aRelancer.length  > 0 && { label: `${aRelancer.length} relance${aRelancer.length>1?'s':''} à envoyer`,                    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
        ].filter(Boolean) as { label: string; color: string }[]

        if (items.length === 0) return null
        return (
          <div className="mb-6 rounded-2xl border border-white/8 px-5 py-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white">À traiter maintenant</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {items.map(({ label, color }) => (
                <span key={label} className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium border ${color}`}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            className="input !pl-9"
            placeholder="Rechercher un lead…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <select
            className="select !pl-9 min-w-[200px]"
            value={filterStatus}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Leads table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Header */}
        <div
          className="grid grid-cols-12 gap-2 px-5 py-3 text-[11px] text-white/30 uppercase tracking-wider font-medium"
          style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="col-span-3">Client</span>
          <span className="col-span-2 hidden sm:block">Trajet</span>
          <span className="col-span-1 text-center hidden md:block">Pax</span>
          <span className="col-span-2">Statut</span>
          <span className="col-span-2 hidden sm:block">Urgence</span>
          <span className="col-span-2 text-right">Actions</span>
        </div>

        {loading && (
          <div className="px-5 py-12 text-center">
            <RefreshCw className="w-5 h-5 animate-spin text-white/30 mx-auto mb-2" />
            <p className="text-white/30 text-sm">Chargement des leads…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="px-5 py-12 text-center">
            <AlertCircle className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/35 text-sm">Aucun lead trouvé.</p>
            {(search || filterStatus) && (
              <button
                onClick={() => { setSearch(''); setFilter('') }}
                className="text-neo-blue text-xs mt-2 hover:underline"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        )}

        {!loading && filtered.map((lead, i) => (
          <motion.div
            key={lead._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center text-sm"
            style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined }}
          >
            <div className="col-span-3">
              <div className="text-white font-medium text-[13px] truncate">{lead.nom}</div>
              <div className="text-white/30 text-[11px] truncate">{lead.email}</div>
            </div>
            <div className="col-span-2 hidden sm:block text-white/45 text-[12px] truncate">
              {lead.depart} → {lead.destination}
            </div>
            <div className="col-span-1 text-center hidden md:block text-white/45 text-[12px]">
              {lead.nb_passagers}
            </div>
            <div className="col-span-2">
              <StatusBadge status={lead.statut} size="sm" />
            </div>
            <div className="col-span-2 hidden sm:block">
              <UrgencyBadge urgence={lead.urgence} size="sm" />
            </div>
            <div className="col-span-2 flex items-center justify-end gap-1.5">
              <button
                onClick={() => handleRelance(lead._id)}
                disabled={relancing === lead._id}
                className="p-1.5 rounded-lg text-white/30 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                title="Envoyer une relance"
              >
                <Bell className={`w-3.5 h-3.5 ${relancing === lead._id ? 'animate-pulse' : ''}`} />
              </button>
              <Link
                href={`/dashboard/leads/${lead._id}`}
                className="p-1.5 rounded-lg text-white/30 hover:text-neo-blue hover:bg-neo-blue/10 transition-all"
                title="Voir le détail"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        ))}

        {!loading && filtered.length > 0 && (
          <div
            className="px-5 py-2.5 text-[11px] text-white/25"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}
          >
            {filtered.length} lead{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
            {filterStatus || search ? ` (filtrés sur ${leads.length})` : ''}
          </div>
        )}
      </div>
    </div>
  )
}
