'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Users, RefreshCw, Search, Filter, ExternalLink, Bell, AlertCircle, ArrowUpDown,
  ChevronDown,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Lead, LeadStatus, LEAD_STATUS_LABELS } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import UrgencyBadge from '@/components/UrgencyBadge'

const STATUS_OPTIONS: LeadStatus[] = [
  'nouveau', 'incomplet', 'qualifie', 'devis_genere', 'devis_envoye',
  'relance_1', 'relance_2', 'accepte', 'refuse', 'cas_complexe', 'cloture',
]

const STATUS_COLOR: Record<string, string> = {
  nouveau: '#7C3AED', incomplet: '#D97706', qualifie: '#2563EB',
  devis_genere: '#D97706', devis_envoye: '#0284C7',
  relance_1: '#EA580C', relance_2: '#DC2626',
  accepte: '#16A34A', refuse: '#94A3B8',
  cas_complexe: '#DB2777', reprise_humaine: '#DC2626', cloture: '#94A3B8',
}

type SortKey = 'date' | 'score' | 'nom'

const inputStyle: React.CSSProperties = {
  background: 'var(--dash-surface)',
  border: '1px solid var(--dash-border)',
  color: 'var(--dash-text)',
  borderRadius: '0.75rem',
  padding: '0.5rem 0.75rem 0.5rem 2.25rem',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
}

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
        className="flex items-center gap-1 transition-colors text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: active ? '#2563EB' : 'var(--dash-text-faint)' }}
      >
        {label}
        <ArrowUpDown className="w-3 h-3" />
      </button>
    )
  }

  /* ── Pipeline mini résumé ── */
  const statusCounts: Record<string, number> = {}
  leads.forEach(l => { statusCounts[l.statut] = (statusCounts[l.statut] ?? 0) + 1 })

  return (
    <div className="p-6 sm:p-8" style={{ background: 'var(--dash-bg)', minHeight: '100vh' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2.5" style={{ color: 'var(--dash-text)' }}>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: '#EFF6FF' }}
            >
              <Users className="w-4 h-4" style={{ color: '#2563EB' }} />
            </div>
            Pipeline leads
          </h1>
          <p className="text-sm mt-0.5 ml-9" style={{ color: 'var(--dash-text-muted)' }}>
            {!loading && `${leads.length} lead${leads.length > 1 ? 's' : ''} au total`}
            {filterStatus && (
              <span className="ml-2 font-medium" style={{ color: STATUS_COLOR[filterStatus] ?? '#2563EB' }}>
                — filtrés sur {LEAD_STATUS_LABELS[filterStatus as LeadStatus] ?? filterStatus}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchLeads}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
          style={{
            background: 'var(--dash-surface)',
            border: '1px solid var(--dash-border)',
            color: 'var(--dash-text-muted)',
            boxShadow: 'var(--dash-shadow)',
          }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Mini pipeline bar */}
      {!loading && leads.length > 0 && (
        <div
          className="rounded-xl p-4 mb-5 flex flex-wrap gap-2"
          style={{
            background: 'var(--dash-surface)',
            border: '1px solid var(--dash-border)',
            boxShadow: 'var(--dash-shadow)',
          }}
        >
          {Object.entries(statusCounts).map(([statut, count]) => {
            const color = STATUS_COLOR[statut] ?? '#94A3B8'
            const label = LEAD_STATUS_LABELS[statut as LeadStatus] ?? statut
            return (
              <button
                key={statut}
                onClick={() => setFilter(filterStatus === statut ? '' : statut)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: filterStatus === statut ? color + '18' : 'var(--dash-muted)',
                  border: filterStatus === statut ? `1px solid ${color}30` : '1px solid transparent',
                  color: filterStatus === statut ? color : 'var(--dash-text-muted)',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                {label}
                <span
                  className="ml-0.5 text-[10px] font-bold px-1 rounded"
                  style={{
                    background: color + '18',
                    color,
                  }}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: 'var(--dash-text-faint)' }}
          />
          <input
            style={{ ...inputStyle }}
            placeholder="Rechercher client, trajet, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={e => (e.currentTarget.style.borderColor = '#2563EB')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--dash-border)')}
          />
        </div>

        {/* Statut */}
        <div className="relative">
          <Filter
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none z-10"
            style={{ color: 'var(--dash-text-faint)' }}
          />
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none z-10"
            style={{ color: 'var(--dash-text-faint)' }}
          />
          <select
            value={filterStatus}
            onChange={e => setFilter(e.target.value)}
            style={{
              ...inputStyle,
              padding: '0.5rem 2rem 0.5rem 2.25rem',
              minWidth: '200px',
              appearance: 'none',
              WebkitAppearance: 'none',
            }}
          >
            <option value="">Tous les statuts</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {/* Urgence */}
        <div className="relative">
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            style={{ color: 'var(--dash-text-faint)' }}
          />
          <select
            value={filterUrgence}
            onChange={e => setUrgence(e.target.value)}
            style={{
              ...inputStyle,
              padding: '0.5rem 2rem 0.5rem 0.75rem',
              minWidth: '160px',
              appearance: 'none',
              WebkitAppearance: 'none',
            }}
          >
            <option value="">Toutes urgences</option>
            <option value="urgent">Urgent</option>
            <option value="tres_urgent">Très urgent</option>
            <option value="normal">Normal</option>
          </select>
        </div>

        {(search || filterStatus || filterUrgence) && (
          <button
            onClick={() => { setSearch(''); setFilter(''); setUrgence('') }}
            className="text-xs px-3 py-2 rounded-xl transition-all"
            style={{ color: 'var(--dash-text-muted)', border: '1px solid var(--dash-border)', background: 'var(--dash-surface)' }}
          >
            Effacer filtres
          </button>
        )}
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--dash-surface)',
          border: '1px solid var(--dash-border)',
          boxShadow: 'var(--dash-shadow)',
        }}
      >
        {/* Table header */}
        <div
          className="grid grid-cols-12 gap-2 px-5 py-3"
          style={{ borderBottom: '1px solid var(--dash-border)', background: 'var(--dash-muted)' }}
        >
          <span className="col-span-3"><SortBtn k="nom" label="Client" /></span>
          <span className="col-span-2 hidden md:block">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-text-faint)' }}>
              Organisation
            </span>
          </span>
          <span className="col-span-2 hidden sm:block">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-text-faint)' }}>
              Trajet
            </span>
          </span>
          <span className="col-span-1 text-center hidden lg:block">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-text-faint)' }}>
              Pax
            </span>
          </span>
          <span className="col-span-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-text-faint)' }}>
              Statut
            </span>
          </span>
          <span className="col-span-1 hidden md:block"><SortBtn k="score" label="Score" /></span>
          <span className="col-span-1 text-right"><SortBtn k="date" label="Date" /></span>
        </div>

        {loading && (
          <div className="px-5 py-12 text-center">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" style={{ color: 'var(--dash-text-faint)' }} />
            <p className="text-sm" style={{ color: 'var(--dash-text-faint)' }}>Chargement…</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="px-5 py-14 text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--dash-text-faint)', opacity: 0.4 }} />
            <p className="text-sm font-medium" style={{ color: 'var(--dash-text-muted)' }}>Aucun lead trouvé</p>
            {(search || filterStatus || filterUrgence) && (
              <button
                onClick={() => { setSearch(''); setFilter(''); setUrgence('') }}
                className="text-xs mt-2 hover:underline"
                style={{ color: '#2563EB' }}
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
            transition={{ delay: i * 0.02 }}
            className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center group cursor-default"
            style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--dash-border)' : undefined }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--dash-muted)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {/* Client */}
            <div className="col-span-3">
              <div
                className="font-medium text-[13px] truncate flex items-center gap-1.5"
                style={{ color: 'var(--dash-text)' }}
              >
                {lead.urgence !== 'normal' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 animate-pulse" />
                )}
                {lead.nom}
              </div>
              <div className="text-[11px] truncate" style={{ color: 'var(--dash-text-faint)' }}>{lead.email}</div>
            </div>

            {/* Organisation */}
            <div className="col-span-2 hidden md:block truncate text-[12px]" style={{ color: 'var(--dash-text-muted)' }}>
              {lead.societe ?? '—'}
            </div>

            {/* Trajet */}
            <div className="col-span-2 hidden sm:block truncate text-[12px]" style={{ color: 'var(--dash-text-muted)' }}>
              <span className="font-medium">{lead.depart}</span>
              <span style={{ color: 'var(--dash-text-faint)' }}> → </span>
              <span className="font-medium">{lead.destination}</span>
            </div>

            {/* Pax */}
            <div className="col-span-1 text-center hidden lg:block text-[12px] font-mono font-medium" style={{ color: 'var(--dash-text-muted)' }}>
              {lead.nb_passagers}
            </div>

            {/* Statut */}
            <div className="col-span-2">
              <StatusBadge status={lead.statut} size="sm" />
              {lead.urgence !== 'normal' && (
                <div className="mt-1">
                  <UrgencyBadge urgence={lead.urgence} />
                </div>
              )}
            </div>

            {/* Score */}
            <div className="col-span-1 hidden md:block">
              <div className="flex items-center gap-1.5">
                <div
                  className="flex-1 h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--dash-border)' }}
                >
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
                <span
                  className="text-[10px] w-7 text-right font-mono"
                  style={{ color: 'var(--dash-text-faint)' }}
                >
                  {lead.score_completude ?? 0}%
                </span>
              </div>
            </div>

            {/* Date + actions */}
            <div className="col-span-1 flex items-center justify-end gap-1">
              <span className="text-[10px] hidden lg:block" style={{ color: 'var(--dash-text-faint)' }}>
                {new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </span>
              <button
                onClick={() => handleRelance(lead._id)}
                disabled={relancing === lead._id}
                title="Envoyer une relance"
                className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                style={{ color: 'var(--dash-text-faint)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#D97706'
                  e.currentTarget.style.background = '#FEF3C7'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--dash-text-faint)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <Bell className={`w-3.5 h-3.5 ${relancing === lead._id ? 'animate-pulse' : ''}`} />
              </button>
              <Link
                href={`/dashboard/leads/${lead._id}`}
                title="Ouvrir le dossier"
                className="p-1.5 rounded-lg transition-all"
                style={{ color: 'var(--dash-text-faint)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#2563EB'
                  e.currentTarget.style.background = '#EFF6FF'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--dash-text-faint)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        ))}

        {!loading && filtered.length > 0 && (
          <div
            className="px-5 py-2.5 text-[11px] flex items-center justify-between"
            style={{ borderTop: '1px solid var(--dash-border)', background: 'var(--dash-muted)', color: 'var(--dash-text-faint)' }}
          >
            <span>
              {filtered.length} lead{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
              {(filterStatus || filterUrgence || search) ? ` (sur ${leads.length} au total)` : ''}
            </span>
            {filterStatus && (
              <button
                onClick={() => setFilter('')}
                className="text-[11px] hover:underline"
                style={{ color: '#2563EB' }}
              >
                Effacer le filtre statut
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
