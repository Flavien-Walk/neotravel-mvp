'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Lead, LeadStatus, LEAD_STATUS_LABELS } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import UrgencyBadge from '@/components/UrgencyBadge'

const STATUS_OPTIONS: LeadStatus[] = [
  'nouveau', 'incomplet', 'qualifie', 'devis_genere', 'devis_envoye',
  'relance_1', 'relance_2', 'accepte', 'refuse', 'cas_complexe', 'cloture',
]

export default function AdminPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, nouveau: 0, qualifie: 0, accepte: 0 })

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
        qualifie: data.filter(l => ['qualifie', 'devis_genere', 'devis_envoye'].includes(l.statut)).length,
        accepte: data.filter(l => l.statut === 'accepte').length,
      })
    } catch {
      console.error('Erreur chargement leads')
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const updateStatus = async (id: string, statut: LeadStatus) => {
    try {
      await api.leads.updateStatus(id, statut)
      await fetchLeads()
    } catch {
      alert('Erreur lors de la mise à jour du statut')
    }
  }

  const simulateRelance = async (lead: Lead) => {
    const nextStatus: Partial<Record<LeadStatus, LeadStatus>> = {
      devis_envoye: 'relance_1',
      relance_1: 'relance_2',
    }
    const next = nextStatus[lead.statut]
    if (!next) { alert('Aucune relance prévue pour ce statut.'); return }
    await api.logs.create({
      action: 'RELANCE_SIMULEE',
      leadId: lead._id,
      status: 'info',
      message: `Relance simulée vers ${lead.email} — statut → ${next}`,
      payload: { email: lead.email, statut_precedent: lead.statut },
    })
    await updateStatus(lead._id, next)
    alert(`Relance simulée ! Email envoyé à ${lead.email}`)
  }

  const filtered = leads.filter(l =>
    !search ||
    l.nom.toLowerCase().includes(search.toLowerCase()) ||
    l.email.toLowerCase().includes(search.toLowerCase()) ||
    l.depart.toLowerCase().includes(search.toLowerCase()) ||
    l.destination.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <span className="font-bold text-gray-900">NeoTravel</span>
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-600 font-medium">Dashboard Admin</span>
          </div>
          <button onClick={fetchLeads} className="btn-secondary !py-2 !px-4 text-sm">
            Actualiser
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total leads', value: stats.total, color: 'text-gray-900' },
            { label: 'Nouveaux', value: stats.nouveau, color: 'text-blue-600' },
            { label: 'En cours', value: stats.qualifie, color: 'text-indigo-600' },
            { label: 'Acceptés', value: stats.accepte, color: 'text-green-600' },
          ].map((s) => (
            <div key={s.label} className="card !p-4">
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div className="card !p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, ville..."
            className="input !py-2 flex-1"
          />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="select !py-2 sm:w-56"
          >
            <option value="">Tous les statuts</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="card flex items-center justify-center py-20 text-gray-400">
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-lg">Aucun lead trouvé</p>
            <Link href="/devis" className="btn-primary mt-4 text-sm">
              Créer un lead de test
            </Link>
          </div>
        ) : (
          <div className="card !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Contact</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Trajet</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Passagers</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Urgence</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Créé le</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((lead) => (
                    <tr key={lead._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{lead.nom}</div>
                        <div className="text-gray-400">{lead.email}</div>
                        {lead.societe && <div className="text-gray-400 text-xs">{lead.societe}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-900">{lead.depart} → {lead.destination}</div>
                        <div className="text-gray-400 text-xs">{lead.date_depart}{lead.date_retour ? ` / ${lead.date_retour}` : ''}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-900">{lead.nb_passagers}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={lead.statut} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <UrgencyBadge urgence={lead.urgence} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${lead.score_completude >= 80 ? 'bg-green-500' : lead.score_completude >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${lead.score_completude}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{lead.score_completude}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/leads/${lead._id}`} className="text-blue-600 hover:text-blue-800 font-medium text-xs">
                            Voir
                          </Link>
                          <select
                            value={lead.statut}
                            onChange={e => updateStatus(lead._id, e.target.value as LeadStatus)}
                            className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {STATUS_OPTIONS.map(s => (
                              <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                          {(lead.statut === 'devis_envoye' || lead.statut === 'relance_1') && (
                            <button onClick={() => simulateRelance(lead)} className="btn-danger !px-2 !py-1">
                              Relancer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
