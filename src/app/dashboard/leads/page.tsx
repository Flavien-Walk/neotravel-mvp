'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users, RefreshCw, Search, Filter, ExternalLink, Bell, AlertCircle, ArrowUpDown,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Lead, LeadStatus, LEAD_STATUS_LABELS } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import UrgencyBadge from '@/components/UrgencyBadge'

const STATUS_OPTIONS: LeadStatus[] = [
  'nouveau', 'incomplet', 'qualifie', 'devis_genere', 'devis_envoye',
  'relance_1', 'relance_2', 'accepte', 'refuse', 'cas_complexe', 'cloture',
]

type SortKey = 'date' | 'score' | 'nom'

export default function DashboardLeadsPage() {
  const [leads, setLeads]           = useState<Lead[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [filterStatus, setFilter]   = useState<string>('')
  const [filterUrgence, setUrgence] = useState<string>('')
  const [sortKey, setSortKey]       = useState<SortKey>('date')
  const [sortAsc, setSortAsc]       = useState(false)
  const [relancing, setRelancing]   = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (filterStatus)  params.statut  = filterStatus
      if (filterUrgence) params.urgence = filterUrgence
      const data = await api.leads.list(params) as Lead[]
      setLeads(data)
    } catch {
      setLeads([])
    }
    setLoading(false)
  }, [filterStatus, filterUrgence])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  async function handleRelance(id: string) {
    setRelancing(id)
    try {
      await api.leads.updateStatus(id, 'relance_1')
      await api.logs.create({ action: 'RELANCE_EMAIL', leadId: id, status: 'success', message: 'Relance envoyée depuis le pipeline' })
      await fetchLeads()
    } catch {}
    setRelancing(null)
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(v => !v)
    else { setSortKey(key); setSortAsc(false) }
  }

  const filtered = leads
    .filter(l => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        l.nom.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.societe ?? '').toLowerCase().includes(q) ||
        l.depart.toLowerCase().includes(q) ||
        l.destination.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortKey === 'date')  cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortKey === 'score') cmp = (b.score_completude ?? 0) - (a.score_completude ?? 0)
      if (sortKey === 'nom')   cmp = a.nom.localeCompare(b.nom, 'fr')
      return sortAsc ? -cmp : cmp
    })

  function SortBtn({ k, label }: { k: SortKey; label: string }) {
    const active = sortKey === k
    return (
      <button
        onClick={() => toggleSort(k)}
        className={`flex items-center gap-1 transition-colors ${active ? 'text-neo-blue' : 'text-white/30 hover:text-white/55'}`}
      >
        {label}
        <ArrowUpDown className="w-3 h-3" />
      </button>
    )
  }

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-neo-blue" />
            Pipeline leads
          </h1>
          <p className="text-white/35 text-sm mt-0.5">
            {!loading && `${leads.length} lead${leads.length > 1 ? 's' : ''} au total`}
          </p>
        </div>
        <button onClick={fetchLeads} disabled={loading} className="btn-ghost !px-3 !py-2 gap-2 text-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            className="input !pl-9"
            placeholder="Rechercher client, trajet…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <select
            className="select !pl-9 min-w-[190px]"
            value={filterStatus}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <select
          className="select min-w-[160px]"
          value={filterUrgence}
          onChange={e => setUrgence(e.target.value)}
        >
          <option value="">Toutes urgences</option>
          <option value="urgent">Urgent</option>
          <option value="normal">Normal</option>
        </select>
        {(search || filterStatus || filterUrgence) && (
          <button
            onClick={() => { setSearch(''); setFilter(''); setUrgence('') }}
            className="text-white/35 hover:text-white text-xs px-3 py-2 rounded-xl hover:bg-white/5 transition-all"
          >
            Effacer filtres
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Header */}
        <div
          className="grid grid-cols-12 gap-2 px-5 py-3 text-[11px] uppercase tracking-wider font-medium"
          style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="col-span-3"><SortBtn k="nom" label="Client" /></span>
          <span className="col-span-2 hidden md:block text-white/30">Organisation</span>
          <span className="col-span-2 hidden sm:block text-white/30">Trajet</span>
          <span className="col-span-1 text-center hidden lg:block text-white/30">Pax</span>
          <span className="col-span-2">Statut</span>
          <span className="col-span-1 hidden md:block"><SortBtn k="score" label="Score" /></span>
          <span className="col-span-1 text-right"><SortBtn k="date" label="Date" /></span>
        </div>

        {loading && (
          <div className="px-5 py-12 text-center">
            <RefreshCw className="w-5 h-5 animate-spin text-white/25 mx-auto mb-2" />
            <p className="text-white/25 text-sm">Chargement…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="px-5 py-14 text-center">
            <AlertCircle className="w-8 h-8 text-white/15 mx-auto mb-3" />
            <p className="text-white/30 text-sm font-medium">Aucun lead trouvé</p>
            {(search || filterStatus || filterUrgence) && (
              <button
                onClick={() => { setSearch(''); setFilter(''); setUrgence('') }}
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
            transition={{ delay: i * 0.025 }}
            className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center text-sm group"
            style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined }}
          >
            {/* Client */}
            <div className="col-span-3">
              <div className="text-white font-medium text-[13px] truncate flex items-center gap-1.5">
                {lead.urgence === 'urgent' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                )}
                {lead.nom}
              </div>
              <div className="text-white/30 text-[11px] truncate">{lead.email}</div>
            </div>

            {/* Organisation */}
            <div className="col-span-2 hidden md:block text-white/40 text-[12px] truncate">
              {lead.societe ?? '—'}
            </div>

            {/* Trajet */}
            <div className="col-span-2 hidden sm:block text-white/45 text-[12px] truncate">
              {lead.depart} → {lead.destination}
            </div>

            {/* Pax */}
            <div className="col-span-1 text-center hidden lg:block text-white/40 text-[12px]">
              {lead.nb_passagers}
            </div>

            {/* Statut */}
            <div className="col-span-2">
              <StatusBadge status={lead.statut} size="sm" />
            </div>

            {/* Score */}
            <div className="col-span-1 hidden md:block">
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${lead.score_completude ?? 0}%`,
                      background: (lead.score_completude ?? 0) >= 80
                        ? '#22c55e'
                        : (lead.score_completude ?? 0) >= 50
                        ? '#f59e0b'
                        : '#ef4444',
                    }}
                  />
                </div>
                <span className="text-[10px] text-white/30 w-7 text-right">{lead.score_completude ?? 0}%</span>
              </div>
            </div>

            {/* Date + actions */}
            <div className="col-span-1 flex items-center justify-end gap-1">
              <span className="text-white/22 text-[10px] hidden lg:block">
                {new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </span>
              <button
                onClick={() => handleRelance(lead._id)}
                disabled={relancing === lead._id}
                title="Envoyer une relance"
                className="p-1.5 rounded-lg text-white/25 hover:text-amber-400 hover:bg-amber-500/10 transition-all opacity-0 group-hover:opacity-100"
              >
                <Bell className={`w-3.5 h-3.5 ${relancing === lead._id ? 'animate-pulse' : ''}`} />
              </button>
              <Link
                href={`/dashboard/leads/${lead._id}`}
                title="Ouvrir le dossier"
                className="p-1.5 rounded-lg text-white/25 hover:text-neo-blue hover:bg-neo-blue/10 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        ))}

        {!loading && filtered.length > 0 && (
          <div
            className="px-5 py-2.5 text-[11px] text-white/22"
            style={{ borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}
          >
            {filtered.length} lead{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
            {(filterStatus || filterUrgence || search) ? ` (filtrés sur ${leads.length})` : ''}
          </div>
        )}
      </div>
    </div>
  )
}
