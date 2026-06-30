'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Calculator, Send, Bell, UserCheck, RefreshCw, CheckCircle, Activity } from 'lucide-react'
import { api } from '@/lib/api'
import { Lead, Quote, Log, LeadStatus, LEAD_STATUS_LABELS } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import UrgencyBadge from '@/components/UrgencyBadge'
import Logo from '@/components/brand/Logo'

const STATUS_OPTIONS: LeadStatus[] = [
  'nouveau', 'incomplet', 'qualifie', 'devis_genere', 'devis_envoye',
  'relance_1', 'relance_2', 'accepte', 'refuse', 'cas_complexe', 'cloture',
]

const LOG_COLORS: Record<string, string> = { success: '#22C55E', error: '#EF4444', info: '#4B8EF8', warning: '#F59E0B' }

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
        api.logs.list({ leadId: id }) as Promise<Log[]>,
      ])
      setLead(leadData)
      if (leadData.quote) setQuote(leadData.quote)
      setLogs(logsData)
    } catch { router.push('/admin') } finally { setLoading(false) }
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
      const result = await api.quotes.calculate({ leadId: lead._id, depart: lead.depart, destination: lead.destination, date_depart: lead.date_depart, date_retour: lead.date_retour, nb_passagers: lead.nb_passagers, type_trajet: lead.type_trajet, options: lead.options, urgence: lead.urgence }) as Quote
      setQuote(result)
      await updateStatus('devis_genere')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur calcul devis'
      alert(`Calcul impossible : ${message}`)
    } finally { setCalculating(false) }
  }

  const transmitHuman = async () => {
    if (!lead) return
    await api.logs.create({ action: 'TRANSMISSION_HUMAINE', leadId: lead._id, status: 'info', message: 'Lead transmis pour reprise humaine', payload: { nom: lead.nom, email: lead.email } })
    await updateStatus('cas_complexe')
  }

  const simulateRelance = async () => {
    if (!lead) return
    const nextStatus: Partial<Record<LeadStatus, LeadStatus>> = { devis_envoye: 'relance_1', relance_1: 'relance_2' }
    const next = nextStatus[lead.statut]
    if (!next) { alert('Aucune relance prévue pour ce statut.'); return }
    await api.logs.create({ action: 'RELANCE_SIMULEE', leadId: lead._id, status: 'info', message: `Email de relance simulé → ${lead.email}`, payload: { email: lead.email, statut_precedent: lead.statut } })
    await updateStatus(next)
  }

  const sendQuote = async () => {
    if (!lead || !quote) return
    await api.logs.create({ action: 'DEVIS_ENVOYE_SIMULE', leadId: lead._id, status: 'info', message: `Devis ${quote.prix_ttc?.toFixed(2)} € TTC envoyé (simulé) à ${lead.email}`, payload: { email: lead.email, prix_ttc: quote.prix_ttc } })
    await updateStatus('devis_envoye')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--dash-bg)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
    </div>
  )

  if (!lead) return null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--dash-bg)' }}>
      <header
        className="sticky top-0 z-40 transition-colors"
        style={{
          background: 'var(--dash-surface)',
          borderBottom: '1px solid var(--dash-border)',
          boxShadow: 'var(--dash-shadow)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <Logo size="sm" />
            <span style={{ color: 'var(--dash-text-faint)' }}>/</span>
            <Link
              href="/admin"
              className="flex items-center gap-1.5 transition-colors"
              style={{ color: 'var(--dash-text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--dash-text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--dash-text-muted)'}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span style={{ color: 'var(--dash-text-faint)' }}>/</span>
            <span className="font-medium truncate max-w-[180px]" style={{ color: 'var(--dash-text)' }}>{lead.nom}</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={lead.statut} size="sm" />
            <UrgencyBadge urgence={lead.urgence} size="sm" />
            <button
              onClick={fetchAll}
              className="flex items-center px-2 py-1.5 rounded-lg ml-1 transition-all"
              style={{ color: 'var(--dash-text-muted)', border: '1px solid var(--dash-border)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--dash-muted)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              aria-label="Actualiser"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">

        {/* Main column */}
        <div className="space-y-5">

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-6"
            style={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)', boxShadow: 'var(--dash-shadow)' }}
          >
            <h2 className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: 'var(--dash-text-faint)' }}>Contact</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[['Nom', lead.nom], ['Société', lead.societe || '—'], ['Email', lead.email], ['Téléphone', lead.telephone]].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs mb-0.5" style={{ color: 'var(--dash-text-faint)' }}>{k}</div>
                  <div className="font-medium" style={{ color: 'var(--dash-text)' }}>{v}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Trajet */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="rounded-xl p-6"
            style={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)', boxShadow: 'var(--dash-shadow)' }}
          >
            <h2 className="text-xs uppercase tracking-widest font-semibold mb-4" style={{ color: 'var(--dash-text-faint)' }}>Trajet</h2>

            {/* Route visual */}
            <div className="flex items-center gap-4 mb-5 p-4 rounded-xl" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
              <div className="text-center">
                <div className="text-xs mb-1" style={{ color: '#6B7280' }}>Départ</div>
                <div className="font-bold" style={{ color: '#1E40AF' }}>{lead.depart}</div>
                {lead.date_depart && <div className="text-[10px] mt-1" style={{ color: '#6B7280' }}>{lead.date_depart}</div>}
              </div>
              <div className="flex-1 flex items-center gap-1">
                <div className="flex-1 h-0.5 rounded-full" style={{ background: 'linear-gradient(to right, #3B82F6, #06B6D4)' }} />
                <div style={{ color: '#2563EB' }}>→</div>
                <div className="flex-1 h-0.5 rounded-full" style={{ background: 'linear-gradient(to right, #06B6D4, transparent)' }} />
              </div>
              <div className="text-center">
                <div className="text-xs mb-1" style={{ color: '#6B7280' }}>Destination</div>
                <div className="font-bold" style={{ color: '#1E40AF' }}>{lead.destination}</div>
                {lead.date_retour && <div className="text-[10px] mt-1" style={{ color: '#6B7280' }}>R: {lead.date_retour}</div>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              {[
                ['Passagers', lead.nb_passagers.toString()],
                ['Type', lead.type_trajet?.replace(/_/g, ' ') || '—'],
                ['Options', lead.options?.join(', ') || 'Aucune'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs mb-0.5" style={{ color: 'var(--dash-text-faint)' }}>{k}</div>
                  <div className="font-medium capitalize" style={{ color: 'var(--dash-text)' }}>{v}</div>
                </div>
              ))}
            </div>
            {lead.commentaire && (
              <div className="mt-4 pt-4 text-sm" style={{ borderTop: '1px solid var(--dash-border)' }}>
                <div className="text-xs mb-0.5" style={{ color: 'var(--dash-text-faint)' }}>Commentaire</div>
                <div className="leading-relaxed" style={{ color: 'var(--dash-text-muted)' }}>{lead.commentaire}</div>
              </div>
            )}
          </motion.div>

          {/* Devis */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-xl p-6"
            style={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)', boxShadow: 'var(--dash-shadow)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--dash-text-faint)' }}>Devis</h2>
              <div className="flex items-center gap-2">
                {!quote && (
                  <button
                    onClick={calculateQuote}
                    disabled={calculating}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{ background: '#2563EB', color: '#fff' }}
                  >
                    {calculating ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Calcul...</>
                    ) : (
                      <><Calculator className="w-3.5 h-3.5" /> Calculer le devis</>
                    )}
                  </button>
                )}
                {quote && lead.statut === 'devis_genere' && (
                  <button
                    onClick={sendQuote}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{ background: '#2563EB', color: '#fff' }}
                  >
                    <Send className="w-3.5 h-3.5" /> Envoyer le devis
                  </button>
                )}
              </div>
            </div>

            {!quote ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
                >
                  <Calculator className="w-5 h-5" style={{ color: '#3B82F6' }} />
                </div>
                <p className="text-sm" style={{ color: 'var(--dash-text-muted)' }}>Aucun devis calculé.</p>
                <p className="text-xs mt-1" style={{ color: 'var(--dash-text-faint)' }}>Cliquez sur &quot;Calculer le devis&quot; pour lancer <code style={{ color: '#2563EB' }}>calculer_devis()</code></p>
              </div>
            ) : (
              <div>
                {/* Price highlight */}
                <div className="flex items-center gap-6 p-4 rounded-xl mb-5" style={{ background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
                  <div>
                    <div className="text-xs mb-0.5" style={{ color: '#6B7280' }}>Prix TTC</div>
                    <div className="text-3xl font-bold" style={{ color: '#0369A1' }}>{quote.prix_ttc?.toFixed(2)} €</div>
                  </div>
                  <div className="flex flex-col gap-1 text-xs" style={{ color: '#6B7280' }}>
                    <span>HT : {quote.prix_ht?.toFixed(2)} €</span>
                    <span>TVA 10% : {quote.tva?.toFixed(2)} €</span>
                  </div>
                </div>

                {/* Lignes calcul */}
                {quote.lignes_calcul && quote.lignes_calcul.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--dash-text-faint)' }}>Détail du calcul</div>
                    {quote.lignes_calcul.map((l, i) => (
                      <div key={i} className="flex justify-between text-sm py-1.5" style={{ borderBottom: '1px solid var(--dash-border)' }}>
                        <span style={{ color: 'var(--dash-text-muted)' }}>{l.label}{l.detail ? <span className="text-xs" style={{ color: 'var(--dash-text-faint)' }}> ({l.detail})</span> : ''}</span>
                        <span className="font-medium" style={{ color: 'var(--dash-text)' }}>{l.montant.toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                )}

                {quote.coefficients && Object.keys(quote.coefficients).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-3" style={{ borderTop: '1px solid var(--dash-border)' }}>
                    {Object.entries(quote.coefficients).map(([k, v]) => (
                      <span
                        key={k}
                        className="text-[10px] px-2 py-1 rounded-full font-mono"
                        style={{ background: 'var(--dash-muted)', border: '1px solid var(--dash-border)', color: 'var(--dash-text-muted)' }}
                      >
                        {k}×{v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Logs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-xl p-6"
            style={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)', boxShadow: 'var(--dash-shadow)' }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Activity className="w-4 h-4" style={{ color: 'var(--dash-text-faint)' }} />
              <h2 className="text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--dash-text-faint)' }}>Journal d&apos;activité</h2>
              <span className="ml-auto text-[10px]" style={{ color: 'var(--dash-text-faint)' }}>{logs.length} événement{logs.length > 1 ? 's' : ''}</span>
            </div>
            {logs.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--dash-text-faint)' }}>Aucune activité enregistrée.</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => {
                  const color = LOG_COLORS[log.status] || '#64748B'
                  return (
                    <div key={log._id} className="flex gap-3 text-sm group">
                      <div className="flex flex-col items-center shrink-0 pt-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                      </div>
                      <div className="flex-1 min-w-0 pb-3" style={{ borderBottom: '1px solid var(--dash-border)' }}>
                        <div className="font-medium font-mono text-xs" style={{ color }}>{log.action}</div>
                        <div className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--dash-text-muted)' }}>{log.message}</div>
                        <div className="text-[10px] mt-1 font-mono" style={{ color: 'var(--dash-text-faint)' }}>{new Date(log.timestamp).toLocaleString('fr-FR')}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Status */}
          <motion.div
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="rounded-xl p-5"
            style={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)', boxShadow: 'var(--dash-shadow)' }}
          >
            <h2 className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--dash-text-faint)' }}>Changer le statut</h2>
            <div className="space-y-1">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150"
                  style={lead.statut === s ? {
                    background: '#EFF6FF',
                    color: '#1D4ED8',
                    fontWeight: 600,
                    border: '1px solid #BFDBFE',
                  } : {
                    color: 'var(--dash-text-muted)',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={e => { if (lead.statut !== s) e.currentTarget.style.background = 'var(--dash-muted)' }}
                  onMouseLeave={e => { if (lead.statut !== s) e.currentTarget.style.background = 'transparent' }}
                >
                  {lead.statut === s && <CheckCircle className="w-3 h-3 inline mr-1.5" style={{ color: '#2563EB' }} />}
                  {LEAD_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="rounded-xl p-5"
            style={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)', boxShadow: 'var(--dash-shadow)' }}
          >
            <h2 className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--dash-text-faint)' }}>Actions rapides</h2>
            <div className="space-y-2">
              <button
                onClick={simulateRelance}
                className="flex items-center w-full gap-2 px-3 py-2.5 rounded-lg text-xs transition-all"
                style={{ color: 'var(--dash-text-muted)', border: '1px solid var(--dash-border)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--dash-muted)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Bell className="w-3.5 h-3.5" /> Simuler une relance
              </button>
              <button
                onClick={transmitHuman}
                className="flex items-center w-full gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all"
                style={{ background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}
              >
                <UserCheck className="w-3.5 h-3.5" /> Reprise humaine
              </button>
            </div>
          </motion.div>

          {/* Meta */}
          <motion.div
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="rounded-xl p-5 text-xs"
            style={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)', boxShadow: 'var(--dash-shadow)' }}
          >
            <h2 className="uppercase tracking-widest font-semibold mb-3" style={{ color: 'var(--dash-text-faint)' }}>Méta</h2>
            <div className="space-y-3">
              <div>
                <div className="mb-1.5" style={{ color: 'var(--dash-text-faint)' }}>Score complétude</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--dash-border)' }}>
                    <div className={`h-full rounded-full ${lead.score_completude >= 80 ? 'bg-green-500' : lead.score_completude >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${lead.score_completude}%` }} />
                  </div>
                  <span className="font-mono shrink-0" style={{ color: 'var(--dash-text-muted)' }}>{lead.score_completude}%</span>
                </div>
              </div>
              <div>
                <div className="mb-0.5" style={{ color: 'var(--dash-text-faint)' }}>Créé le</div>
                <div className="font-mono" style={{ color: 'var(--dash-text-muted)' }}>{new Date(lead.createdAt).toLocaleString('fr-FR')}</div>
              </div>
              <div>
                <div className="mb-0.5" style={{ color: 'var(--dash-text-faint)' }}>Mis à jour</div>
                <div className="font-mono" style={{ color: 'var(--dash-text-muted)' }}>{new Date(lead.updatedAt).toLocaleString('fr-FR')}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
