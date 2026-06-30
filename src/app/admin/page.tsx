'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { RefreshCw, Search, Users, TrendingUp, CheckCircle, AlertCircle, Filter, ExternalLink, Bell } from 'lucide-react'
import { api } from '@/lib/api'
import { Lead, LeadStatus, LEAD_STATUS_LABELS } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import UrgencyBadge from '@/components/UrgencyBadge'
import Logo from '@/components/brand/Logo'
import { useAuth } from '@/context/AuthContext'

const STATUS_OPTIONS: LeadStatus[] = [
  'nouveau', 'incomplet', 'qualifie', 'devis_genere', 'devis_envoye',
  'relance_1', 'relance_2', 'accepte', 'refuse', 'cas_complexe', 'cloture',
]

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, nouveau: 0, enCours: 0, accepte: 0 })

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
    if (!authLoading && user && user.role === 'client') router.replace('/dashboard')
  }, [user, authLoading, router])

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (filterStatus) params.statut = filterStatus
      const data = await api.leads.list(params) as Lead[]
      setLeads(data)
      setStats({
        total: data.length,
        nouveau: data.filter(l => l.statut === 'nouveau').length,
        enCours: data.filter(l => ['qualifie', 'devis_genere', 'devis_envoye', 'relance_1', 'relance_2'].includes(l.statut)).length,
        accepte: data.filter(l => l.statut === 'accepte').length,
      })
    } catch { /* silent */ } finally { setLoading(false) }
  }, [filterStatus])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const updateStatus = async (id: string, statut: LeadStatus) => {
    try { await api.leads.updateStatus(id, statut); await fetchLeads() } catch { alert('Erreur mise à jour statut') }
  }

  const simulateRelance = async (lead: Lead) => {
    const nextStatus: Partial<Record<LeadStatus, LeadStatus>> = { devis_envoye: 'relance_1', relance_1: 'relance_2' }
    const next = nextStatus[lead.statut]
    if (!next) { alert('Aucune relance prévue pour ce statut.'); return }
    await api.logs.create({ action: 'RELANCE_SIMULEE', leadId: lead._id, status: 'info', message: `Relance simulée → ${lead.email} — statut → ${next}`, payload: { email: lead.email, statut_precedent: lead.statut } })
    await updateStatus(lead._id, next)
  }

  const filtered = leads.filter(l =>
    !search || l.nom.toLowerCase().includes(search.toLowerCase()) ||
    l.email.toLowerCase().includes(search.toLowerCase()) ||
    l.depart.toLowerCase().includes(search.toLowerCase()) ||
    l.destination.toLowerCase().includes(search.toLowerCase())
  )

  const STAT_CARDS = [
    { label: 'Total leads', value: stats.total, icon: Users, color: '#4B8EF8', bg: 'rgba(75,142,248,0.1)' },
    { label: 'Nouveaux', value: stats.nouveau, icon: AlertCircle, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    { label: 'En pipeline', value: stats.enCours, icon: TrendingUp, color: '#818CF8', bg: 'rgba(129,140,248,0.1)' },
    { label: 'Acceptés', value: stats.accepte, icon: CheckCircle, color: '#22C55E', bg: 'rgba(34,197,94,0.1)' },
  ]

  if (authLoading || !user) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--dash-bg)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--dash-bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 transition-colors"
        style={{
          background: 'var(--dash-surface)',
          borderBottom: '1px solid var(--dash-border)',
          boxShadow: 'var(--dash-shadow)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span style={{ color: 'var(--dash-text-faint)' }}>/</span>
            <span className="text-sm font-medium" style={{ color: 'var(--dash-text-muted)' }}>Dashboard Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/devis"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: '#2563EB', color: '#fff' }}
            >
              + Nouveau lead
            </Link>
            <button
              onClick={fetchLeads}
              className="flex items-center px-3 py-2 rounded-xl transition-all"
              style={{
                background: 'var(--dash-muted)',
                border: '1px solid var(--dash-border)',
                color: 'var(--dash-text-muted)',
              }}
              aria-label="Actualiser"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <div
                className="rounded-xl p-5 flex items-center gap-4 transition-all hover:-translate-y-0.5"
                style={{
                  background: 'var(--dash-surface)',
                  border: '1px solid var(--dash-border)',
                  boxShadow: 'var(--dash-shadow)',
                  borderTop: `3px solid ${s.color}`,
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg, border: `1px solid ${s.color}30` }}>
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--dash-text)' }}>{loading ? '—' : s.value}</div>
                  <div className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>{s.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div
          className="rounded-xl p-4 mb-5 flex flex-col sm:flex-row gap-3"
          style={{
            background: 'var(--dash-surface)',
            border: '1px solid var(--dash-border)',
            boxShadow: 'var(--dash-shadow)',
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--dash-text-faint)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher nom, email, ville..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-colors"
              style={{
                background: 'var(--dash-muted)',
                border: '1px solid var(--dash-border)',
                color: 'var(--dash-text)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#2563EB')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--dash-border)')}
            />
          </div>
          <div className="relative sm:w-52">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--dash-text-faint)' }} />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm appearance-none focus:outline-none transition-colors"
              style={{
                background: 'var(--dash-muted)',
                border: '1px solid var(--dash-border)',
                color: 'var(--dash-text)',
              }}
            >
              <option value="">Tous les statuts</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          {(search || filterStatus) && (
            <button
              onClick={() => { setSearch(''); setFilterStatus('') }}
              className="px-4 py-2 text-xs rounded-xl shrink-0 transition-all"
              style={{ color: 'var(--dash-text-muted)', border: '1px solid var(--dash-border)', background: 'var(--dash-muted)' }}
            >
              Effacer
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div
            className="rounded-xl flex items-center justify-center py-24"
            style={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)' }}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
              <span className="text-sm" style={{ color: 'var(--dash-text-faint)' }}>Chargement des leads...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="rounded-xl flex flex-col items-center justify-center py-24 text-center"
            style={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--dash-muted)' }}
            >
              <Users className="w-7 h-7" style={{ color: 'var(--dash-text-faint)', opacity: 0.5 }} />
            </div>
            <p className="mb-2 font-medium" style={{ color: 'var(--dash-text-muted)' }}>Aucun lead{search || filterStatus ? ' pour ces filtres' : ''}</p>
            <p className="text-sm mb-6" style={{ color: 'var(--dash-text-faint)' }}>Soumettez une demande de devis pour créer un lead de test</p>
            <Link
              href="/devis"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: '#2563EB', color: '#fff' }}
            >
              Créer un lead test <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl overflow-hidden"
            style={{
              background: 'var(--dash-surface)',
              border: '1px solid var(--dash-border)',
              boxShadow: 'var(--dash-shadow)',
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--dash-border)', background: 'var(--dash-muted)' }}>
                    {['Contact', 'Trajet', 'Pax', 'Statut', 'Urgence', 'Score', 'Date', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-text-faint)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead, i) => (
                    <motion.tr
                      key={lead._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="transition-colors group cursor-default"
                      style={{ borderBottom: '1px solid var(--dash-border)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--dash-muted)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-sm" style={{ color: 'var(--dash-text)' }}>{lead.nom}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--dash-text-muted)' }}>{lead.email}</div>
                        {lead.societe && <div className="text-[10px] mt-0.5" style={{ color: 'var(--dash-text-faint)' }}>{lead.societe}</div>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-sm" style={{ color: 'var(--dash-text)' }}>{lead.depart} → {lead.destination}</div>
                        <div className="text-[10px] mt-0.5" style={{ color: 'var(--dash-text-faint)' }}>{lead.date_depart}{lead.date_retour ? ` · R ${lead.date_retour}` : ''}</div>
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium" style={{ color: 'var(--dash-text-muted)' }}>{lead.nb_passagers}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={lead.statut} size="sm" /></td>
                      <td className="px-4 py-3.5"><UrgencyBadge urgence={lead.urgence} size="sm" /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1 rounded-full overflow-hidden" style={{ background: 'var(--dash-border)' }}>
                            <div className={`h-full rounded-full transition-all ${lead.score_completude >= 80 ? 'bg-green-500' : lead.score_completude >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${lead.score_completude}%` }} />
                          </div>
                          <span className="text-[10px] font-mono" style={{ color: 'var(--dash-text-faint)' }}>{lead.score_completude}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[10px] font-mono" style={{ color: 'var(--dash-text-faint)' }}>
                        {new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}<br />
                        {new Date(lead.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/admin/leads/${lead._id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium shrink-0 transition-all"
                            style={{ color: '#2563EB', border: '1px solid rgba(37,99,235,0.3)' }}
                          >
                            Voir <ExternalLink className="w-3 h-3" />
                          </Link>
                          <select
                            value={lead.statut}
                            onChange={e => updateStatus(lead._id, e.target.value as LeadStatus)}
                            className="text-[11px] rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer max-w-[110px]"
                            style={{
                              background: 'var(--dash-muted)',
                              border: '1px solid var(--dash-border)',
                              color: 'var(--dash-text-muted)',
                            }}
                          >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
                          </select>
                          {(lead.statut === 'devis_envoye' || lead.statut === 'relance_1') && (
                            <button
                              onClick={() => simulateRelance(lead)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs shrink-0 transition-all"
                              style={{ color: '#DC2626', border: '1px solid rgba(220,38,38,0.3)' }}
                              title="Simuler relance"
                            >
                              <Bell className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className="px-4 py-3 text-xs flex items-center justify-between"
              style={{ borderTop: '1px solid var(--dash-border)', background: 'var(--dash-muted)', color: 'var(--dash-text-faint)' }}
            >
              <span>{filtered.length} lead{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}</span>
              {search && <span>· filtrés sur &quot;{search}&quot;</span>}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
