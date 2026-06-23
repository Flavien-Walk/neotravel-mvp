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
    <div className="min-h-screen bg-neo-900 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-neo-blue/30 border-t-neo-blue animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-neo-900 flex flex-col">
      {/* Header */}
      <header className="glass border-b border-white/6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-white/20">/</span>
            <span className="text-sm text-white/60 font-medium">Dashboard Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/devis" className="btn-gold !px-4 !py-2 text-xs gap-1.5">
              + Nouveau lead
            </Link>
            <button onClick={fetchLeads} className="btn-ghost !px-3 !py-2" aria-label="Actualiser">
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
              <div className="card-premium !p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg, border: `1px solid ${s.color}30` }}>
                  <s.icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{loading ? '—' : s.value}</div>
                  <div className="text-xs text-white/40">{s.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="card-premium !p-4 mb-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher nom, email, ville..."
              className="input !pl-9 w-full" />
          </div>
          <div className="relative sm:w-52">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="select !pl-9 w-full">
              <option value="">Tous les statuts</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          {(search || filterStatus) && (
            <button onClick={() => { setSearch(''); setFilterStatus('') }} className="btn-ghost !px-4 text-xs shrink-0">
              Effacer
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="card-premium flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4 text-white/30">
              <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-neo-blue animate-spin" />
              <span className="text-sm">Chargement des leads...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-premium flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/4 flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/50 mb-2 font-medium">Aucun lead{search || filterStatus ? ' pour ces filtres' : ''}</p>
            <p className="text-sm text-white/25 mb-6">Soumettez une demande de devis pour créer un lead de test</p>
            <Link href="/devis" className="btn-primary text-sm gap-2">
              Créer un lead test <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-premium !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/6">
                    <th className="text-left px-4 py-3.5 text-xs text-white/35 font-semibold uppercase tracking-wider">Contact</th>
                    <th className="text-left px-4 py-3.5 text-xs text-white/35 font-semibold uppercase tracking-wider">Trajet</th>
                    <th className="text-left px-4 py-3.5 text-xs text-white/35 font-semibold uppercase tracking-wider">Pax</th>
                    <th className="text-left px-4 py-3.5 text-xs text-white/35 font-semibold uppercase tracking-wider">Statut</th>
                    <th className="text-left px-4 py-3.5 text-xs text-white/35 font-semibold uppercase tracking-wider">Urgence</th>
                    <th className="text-left px-4 py-3.5 text-xs text-white/35 font-semibold uppercase tracking-wider">Score</th>
                    <th className="text-left px-4 py-3.5 text-xs text-white/35 font-semibold uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3.5 text-xs text-white/35 font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead, i) => (
                    <motion.tr
                      key={lead._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/4 hover:bg-white/2 transition-colors group"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-white text-sm">{lead.nom}</div>
                        <div className="text-xs text-white/40 mt-0.5">{lead.email}</div>
                        {lead.societe && <div className="text-[10px] text-white/25 mt-0.5">{lead.societe}</div>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="text-white/80 text-sm">{lead.depart} → {lead.destination}</div>
                        <div className="text-[10px] text-white/30 mt-0.5">{lead.date_depart}{lead.date_retour ? ` · R ${lead.date_retour}` : ''}</div>
                      </td>
                      <td className="px-4 py-3.5 text-white/70 text-sm font-medium">{lead.nb_passagers}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={lead.statut} size="sm" /></td>
                      <td className="px-4 py-3.5"><UrgencyBadge urgence={lead.urgence} size="sm" /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1 rounded-full bg-white/8 overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${lead.score_completude >= 80 ? 'bg-green-500' : lead.score_completude >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${lead.score_completude}%` }} />
                          </div>
                          <span className="text-[10px] text-white/35 font-mono">{lead.score_completude}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[10px] text-white/30 font-mono">
                        {new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}<br />
                        {new Date(lead.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/admin/leads/${lead._id}`} className="btn-outline !px-2.5 !py-1.5 text-[11px] gap-1 shrink-0">
                            Voir <ExternalLink className="w-3 h-3" />
                          </Link>
                          <select value={lead.statut} onChange={e => updateStatus(lead._id, e.target.value as LeadStatus)}
                            className="text-[11px] border border-white/10 rounded-lg px-2 py-1.5 bg-white/4 text-white/60 focus:outline-none focus:border-neo-blue/40 cursor-pointer max-w-[110px]">
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
                          </select>
                          {(lead.statut === 'devis_envoye' || lead.statut === 'relance_1') && (
                            <button onClick={() => simulateRelance(lead)} className="btn-danger gap-1 shrink-0" title="Simuler relance">
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
            <div className="px-4 py-3 border-t border-white/4 text-xs text-white/25 flex items-center justify-between">
              <span>{filtered.length} lead{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}</span>
              {search && <span>· filtrés sur &quot;{search}&quot;</span>}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
