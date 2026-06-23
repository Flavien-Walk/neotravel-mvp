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
        api.logs.list(id) as Promise<Log[]>,
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
    <div className="min-h-screen bg-neo-900 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-neo-blue animate-spin" />
    </div>
  )

  if (!lead) return null

  return (
    <div className="min-h-screen bg-neo-900 flex flex-col">
      <header className="glass border-b border-white/6 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <Logo size="sm" />
            <span className="text-white/20">/</span>
            <Link href="/admin" className="text-white/40 hover:text-white transition-colors flex items-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-white/70 font-medium truncate max-w-[180px]">{lead.nom}</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={lead.statut} size="sm" />
            <UrgencyBadge urgence={lead.urgence} size="sm" />
            <button onClick={fetchAll} className="btn-ghost !px-2 !py-1.5 ml-1" aria-label="Actualiser">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">

        {/* Main column */}
        <div className="space-y-5">

          {/* Contact */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card-premium !p-6">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-white/30 mb-4">Contact</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[['Nom', lead.nom], ['Société', lead.societe || '—'], ['Email', lead.email], ['Téléphone', lead.telephone]].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs text-white/30 mb-0.5">{k}</div>
                  <div className="font-medium text-white">{v}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Trajet */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card-premium !p-6">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-white/30 mb-4">Trajet</h2>

            {/* Route visual */}
            <div className="flex items-center gap-4 mb-5 p-4 rounded-xl bg-neo-blue/8 border border-neo-blue/15">
              <div className="text-center">
                <div className="text-xs text-white/40 mb-1">Départ</div>
                <div className="font-bold text-white">{lead.depart}</div>
                {lead.date_depart && <div className="text-[10px] text-white/30 mt-1">{lead.date_depart}</div>}
              </div>
              <div className="flex-1 flex items-center gap-1">
                <div className="flex-1 h-0.5 bg-gradient-to-r from-neo-blue/60 to-neo-cyan/60 rounded-full" />
                <div className="text-neo-blue">→</div>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-neo-cyan/60 to-transparent rounded-full" />
              </div>
              <div className="text-center">
                <div className="text-xs text-white/40 mb-1">Destination</div>
                <div className="font-bold text-white">{lead.destination}</div>
                {lead.date_retour && <div className="text-[10px] text-white/30 mt-1">R: {lead.date_retour}</div>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              {[
                ['Passagers', lead.nb_passagers.toString()],
                ['Type', lead.type_trajet?.replace(/_/g, ' ') || '—'],
                ['Options', lead.options?.join(', ') || 'Aucune'],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs text-white/30 mb-0.5">{k}</div>
                  <div className="font-medium text-white capitalize">{v}</div>
                </div>
              ))}
            </div>
            {lead.commentaire && (
              <div className="mt-4 pt-4 border-t border-white/5 text-sm">
                <div className="text-xs text-white/30 mb-0.5">Commentaire</div>
                <div className="text-white/70 leading-relaxed">{lead.commentaire}</div>
              </div>
            )}
          </motion.div>

          {/* Devis */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-premium !p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs uppercase tracking-widest font-semibold text-white/30">Devis</h2>
              <div className="flex items-center gap-2">
                {!quote && (
                  <button onClick={calculateQuote} disabled={calculating} className="btn-gold !px-4 !py-2 text-xs gap-1.5">
                    {calculating ? (
                      <><span className="w-3 h-3 rounded-full border-2 border-neo-900/30 border-t-neo-900 animate-spin" /> Calcul...</>
                    ) : (
                      <><Calculator className="w-3.5 h-3.5" /> Calculer le devis</>
                    )}
                  </button>
                )}
                {quote && lead.statut === 'devis_genere' && (
                  <button onClick={sendQuote} className="btn-primary !px-4 !py-2 text-xs gap-1.5">
                    <Send className="w-3.5 h-3.5" /> Envoyer le devis
                  </button>
                )}
              </div>
            </div>

            {!quote ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-neo-blue/8 border border-neo-blue/15 flex items-center justify-center mb-3">
                  <Calculator className="w-5 h-5 text-neo-blue/50" />
                </div>
                <p className="text-sm text-white/30">Aucun devis calculé.</p>
                <p className="text-xs text-white/20 mt-1">Cliquez sur &quot;Calculer le devis&quot; pour lancer <code className="text-neo-blue/60">calculer_devis()</code></p>
              </div>
            ) : (
              <div>
                {/* Price highlight */}
                <div className="flex items-center gap-6 p-4 rounded-xl bg-neo-gold/8 border border-neo-gold/15 mb-5">
                  <div>
                    <div className="text-xs text-white/40 mb-0.5">Prix TTC</div>
                    <div className="text-3xl font-bold text-neo-gold">{quote.prix_ttc?.toFixed(2)} €</div>
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-white/40">
                    <span>HT : {quote.prix_ht?.toFixed(2)} €</span>
                    <span>TVA 10% : {quote.tva?.toFixed(2)} €</span>
                  </div>
                </div>

                {/* Lignes calcul */}
                {quote.lignes_calcul && quote.lignes_calcul.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <div className="text-xs text-white/25 uppercase tracking-wider mb-2">Détail du calcul</div>
                    {quote.lignes_calcul.map((l, i) => (
                      <div key={i} className="flex justify-between text-sm py-1.5 border-b border-white/4 last:border-0">
                        <span className="text-white/50">{l.label}{l.detail ? <span className="text-white/25 text-xs"> ({l.detail})</span> : ''}</span>
                        <span className="font-medium text-white">{l.montant.toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                )}

                {quote.coefficients && Object.keys(quote.coefficients).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-white/5">
                    {Object.entries(quote.coefficients).map(([k, v]) => (
                      <span key={k} className="text-[10px] px-2 py-1 rounded-full bg-white/4 border border-white/8 text-white/40 font-mono">
                        {k}×{v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Logs */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card-premium !p-6">
            <div className="flex items-center gap-2 mb-5">
              <Activity className="w-4 h-4 text-white/25" />
              <h2 className="text-xs uppercase tracking-widest font-semibold text-white/30">Journal d&apos;activité</h2>
              <span className="ml-auto text-[10px] text-white/20">{logs.length} événement{logs.length > 1 ? 's' : ''}</span>
            </div>
            {logs.length === 0 ? (
              <p className="text-sm text-white/25 text-center py-6">Aucune activité enregistrée.</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => {
                  const color = LOG_COLORS[log.status] || '#64748B'
                  return (
                    <div key={log._id} className="flex gap-3 text-sm group">
                      <div className="flex flex-col items-center shrink-0 pt-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}60` }} />
                      </div>
                      <div className="flex-1 min-w-0 pb-3 border-b border-white/4 last:border-0">
                        <div className="font-medium text-white/80 font-mono text-xs">{log.action}</div>
                        <div className="text-white/40 text-xs mt-0.5 leading-relaxed">{log.message}</div>
                        <div className="text-[10px] text-white/20 mt-1 font-mono">{new Date(log.timestamp).toLocaleString('fr-FR')}</div>
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
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card-premium !p-5">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-white/30 mb-3">Changer le statut</h2>
            <div className="space-y-1">
              {STATUS_OPTIONS.map(s => (
                <button key={s} onClick={() => updateStatus(s)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150
                    ${lead.statut === s ? 'bg-neo-blue text-white' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                  {lead.statut === s && <CheckCircle className="w-3 h-3 inline mr-1.5 opacity-70" />}
                  {LEAD_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Quick actions */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="card-premium !p-5">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-white/30 mb-3">Actions rapides</h2>
            <div className="space-y-2">
              <button onClick={simulateRelance} className="btn-ghost w-full !justify-start gap-2 !px-3 !py-2.5 text-xs">
                <Bell className="w-3.5 h-3.5" /> Simuler une relance
              </button>
              <button onClick={transmitHuman} className="btn-danger w-full !justify-start gap-2 !px-3 !py-2.5">
                <UserCheck className="w-3.5 h-3.5" /> Reprise humaine
              </button>
            </div>
          </motion.div>

          {/* Meta */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card-premium !p-5 text-xs">
            <h2 className="uppercase tracking-widest font-semibold text-white/30 mb-3">Méta</h2>
            <div className="space-y-3">
              <div>
                <div className="text-white/30 mb-1.5">Score complétude</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-white/8 overflow-hidden">
                    <div className={`h-full rounded-full ${lead.score_completude >= 80 ? 'bg-green-500' : lead.score_completude >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${lead.score_completude}%` }} />
                  </div>
                  <span className="font-mono text-white/50 shrink-0">{lead.score_completude}%</span>
                </div>
              </div>
              <div>
                <div className="text-white/30 mb-0.5">Créé le</div>
                <div className="text-white/60 font-mono">{new Date(lead.createdAt).toLocaleString('fr-FR')}</div>
              </div>
              <div>
                <div className="text-white/30 mb-0.5">Mis à jour</div>
                <div className="text-white/60 font-mono">{new Date(lead.updatedAt).toLocaleString('fr-FR')}</div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
