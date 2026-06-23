'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Lead, Quote, Log, LeadStatus, LEAD_STATUS_LABELS } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import UrgencyBadge from '@/components/UrgencyBadge'

const STATUS_OPTIONS: LeadStatus[] = [
  'nouveau', 'incomplet', 'qualifie', 'devis_genere', 'devis_envoye',
  'relance_1', 'relance_2', 'accepte', 'refuse', 'cas_complexe', 'cloture',
]

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [leadData, logsData] = await Promise.all([
        api.leads.get(id) as Promise<Lead & { quote?: Quote }>,
        api.logs.list(id) as Promise<Log[]>,
      ])
      setLead(leadData)
      if (leadData.quote) setQuote(leadData.quote)
      setLogs(logsData)
    } catch {
      router.push('/admin')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { fetchAll() }, [fetchAll])

  const updateStatus = async (statut: LeadStatus) => {
    if (!lead) return
    await api.leads.updateStatus(lead._id, statut)
    await fetchAll()
  }

  const calculateQuote = async () => {
    if (!lead) return
    setCalculating(true)
    try {
      const result = await api.quotes.calculate({
        leadId: lead._id,
        depart: lead.depart,
        destination: lead.destination,
        date_depart: lead.date_depart,
        date_retour: lead.date_retour,
        nb_passagers: lead.nb_passagers,
        type_trajet: lead.type_trajet,
        options: lead.options,
        urgence: lead.urgence,
      }) as Quote
      setQuote(result)
      await updateStatus('devis_genere')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur calcul devis'
      alert(`Calcul impossible : ${message}`)
    } finally {
      setCalculating(false)
    }
  }

  const transmitHuman = async () => {
    if (!lead) return
    await api.logs.create({
      action: 'TRANSMISSION_HUMAINE',
      leadId: lead._id,
      status: 'info',
      message: `Lead transmis pour reprise humaine`,
      payload: { nom: lead.nom, email: lead.email },
    })
    await updateStatus('cas_complexe')
    alert('Lead marqué "Cas complexe transmis". Un conseiller prend le relais.')
  }

  const simulateRelance = async () => {
    if (!lead) return
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
      message: `Email de relance simulé → ${lead.email}`,
      payload: { email: lead.email, statut_precedent: lead.statut },
    })
    await updateStatus(next)
    alert(`Relance simulée : email envoyé à ${lead.email}`)
  }

  const sendQuote = async () => {
    if (!lead || !quote) return
    await api.logs.create({
      action: 'DEVIS_ENVOYE_SIMULE',
      leadId: lead._id,
      status: 'info',
      message: `Devis de ${quote.prix_ttc}€ TTC envoyé (simulé) à ${lead.email}`,
      payload: { email: lead.email, prix_ttc: quote.prix_ttc },
    })
    await updateStatus('devis_envoye')
    alert(`Devis envoyé (simulé) à ${lead.email} — ${quote.prix_ttc.toFixed(2)} € TTC`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">
        Chargement...
      </div>
    )
  }

  if (!lead) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <Link href="/admin" className="text-gray-500 hover:text-gray-700">Dashboard</Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium">{lead.nom}</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={lead.statut} size="sm" />
            <UrgencyBadge urgence={lead.urgence} size="sm" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Infos contact */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Informations contact</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Nom', lead.nom],
                ['Société', lead.societe || '—'],
                ['Email', lead.email],
                ['Téléphone', lead.telephone],
              ].map(([k, v]) => (
                <div key={k}>
                  <span className="text-gray-500">{k}</span>
                  <div className="font-medium text-gray-900 mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Infos trajet */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Détails du trajet</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ['Départ', lead.depart],
                ['Destination', lead.destination],
                ['Date départ', lead.date_depart],
                ['Date retour', lead.date_retour || '—'],
                ['Passagers', lead.nb_passagers.toString()],
                ['Type trajet', lead.type_trajet?.replace(/_/g, ' ')],
                ['Options', lead.options?.join(', ') || 'Aucune'],
              ].map(([k, v]) => (
                <div key={k}>
                  <span className="text-gray-500">{k}</span>
                  <div className="font-medium text-gray-900 mt-0.5">{v}</div>
                </div>
              ))}
            </div>
            {lead.commentaire && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-sm">
                <span className="text-gray-500">Commentaire</span>
                <div className="font-medium text-gray-900 mt-0.5">{lead.commentaire}</div>
              </div>
            )}
          </div>

          {/* Devis */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Devis</h2>
              {!quote && (
                <button onClick={calculateQuote} disabled={calculating} className="btn-primary !py-2 !px-4 text-sm">
                  {calculating ? 'Calcul...' : 'Calculer le devis'}
                </button>
              )}
              {quote && lead.statut === 'devis_genere' && (
                <button onClick={sendQuote} className="btn-primary !py-2 !px-4 text-sm">
                  Envoyer le devis
                </button>
              )}
            </div>
            {!quote ? (
              <p className="text-sm text-gray-400">Aucun devis calculé.</p>
            ) : (
              <div>
                <div className="space-y-2 mb-4">
                  {quote.lignes_calcul?.map((l, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{l.label}{l.detail ? ` (${l.detail})` : ''}</span>
                      <span className="font-medium">{l.montant.toFixed(2)} €</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prix HT</span>
                    <span>{quote.prix_ht?.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">TVA (10%)</span>
                    <span>{quote.tva?.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-2">
                    <span>Total TTC</span>
                    <span className="text-blue-600">{quote.prix_ttc?.toFixed(2)} €</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                  Coefficients : {Object.entries(quote.coefficients || {}).map(([k, v]) => `${k}×${v}`).join(', ')}
                </div>
              </div>
            )}
          </div>

          {/* Logs */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Journal d&apos;activité</h2>
            {logs.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune activité enregistrée.</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log._id} className="flex gap-3 text-sm">
                    <span className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${log.status === 'success' ? 'bg-green-500' : log.status === 'error' ? 'bg-red-500' : 'bg-blue-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-gray-900 font-medium">{log.action}</div>
                      <div className="text-gray-500">{log.message}</div>
                      <div className="text-gray-400 text-xs mt-0.5">{new Date(log.timestamp).toLocaleString('fr-FR')}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Changer le statut</h2>
            <div className="space-y-2">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                    ${lead.statut === s
                      ? 'bg-blue-600 text-white font-medium'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {LEAD_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Actions rapides</h2>
            <div className="space-y-2">
              <button onClick={simulateRelance} className="btn-secondary w-full text-sm !py-2">
                Simuler une relance
              </button>
              <button onClick={transmitHuman} className="btn-danger w-full !justify-start">
                Reprendre humainement
              </button>
            </div>
          </div>

          <div className="card text-sm text-gray-500 space-y-2">
            <div>
              <span className="font-medium text-gray-700">Score complétude</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${lead.score_completude >= 80 ? 'bg-green-500' : lead.score_completude >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${lead.score_completude}%` }}
                  />
                </div>
                <span className="font-medium text-gray-700">{lead.score_completude}%</span>
              </div>
            </div>
            <div>
              <span>Créé le</span>
              <div className="font-medium text-gray-700">{new Date(lead.createdAt).toLocaleString('fr-FR')}</div>
            </div>
            <div>
              <span>Mis à jour</span>
              <div className="font-medium text-gray-700">{new Date(lead.updatedAt).toLocaleString('fr-FR')}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
