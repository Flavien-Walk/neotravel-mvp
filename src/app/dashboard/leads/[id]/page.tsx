'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Calculator, Bell, UserCheck, RefreshCw, CheckCircle, Activity, MapPin, Users, Calendar } from 'lucide-react'
import { api } from '@/lib/api'
import { Lead, Quote, Log, LeadStatus, LEAD_STATUS_LABELS } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import UrgencyBadge from '@/components/UrgencyBadge'

const STATUS_OPTIONS: LeadStatus[] = [
  'nouveau', 'incomplet', 'qualifie', 'devis_genere', 'devis_envoye',
  'relance_1', 'relance_2', 'accepte', 'refuse', 'cas_complexe', 'cloture',
]

const LOG_DOT: Record<string, string> = {
  success: 'bg-green-400',
  error:   'bg-red-400',
  info:    'bg-blue-400',
  warning: 'bg-amber-400',
}

export default function DashboardLeadDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const [lead, setLead]         = useState<Lead | null>(null)
  const [quote, setQuote]       = useState<Quote | null>(null)
  const [logs, setLogs]         = useState<Log[]>([])
  const [loading, setLoading]   = useState(true)
  const [calculating, setCalc]  = useState(false)
  const [relancing, setRelance] = useState(false)

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
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function calculateQuote() {
    if (!lead) return
    setCalc(true)
    try {
      const q = await api.quotes.calculate({ leadId: lead._id }) as Quote
      setQuote(q)
      await api.leads.updateStatus(lead._id, 'devis_genere')
      await fetchAll()
    } catch {}
    setCalc(false)
  }

  async function simulateRelance() {
    if (!lead) return
    setRelance(true)
    try {
      await api.leads.updateStatus(lead._id, 'relance_1')
      await api.logs.create({ action: 'relance_simulee', leadId: lead._id, status: 'success', message: 'Relance simulée depuis le dashboard' })
      await fetchAll()
    } catch {}
    setRelance(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-5 h-5 animate-spin text-white/30" />
      </div>
    )
  }

  if (!lead) return null

  return (
    <div className="p-6 sm:p-8">
      {/* Back + header */}
      <div className="mb-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Retour au dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">{lead.nom}</h1>
            {lead.societe && <p className="text-white/40 text-sm">{lead.societe}</p>}
          </div>
          <div className="flex items-center gap-2">
            <UrgencyBadge urgence={lead.urgence} />
            <StatusBadge status={lead.statut} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ─── Main column ─── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Route card */}
          <div className="card-neo">
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Trajet demandé</h2>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-center">
                <MapPin className="w-4 h-4 text-neo-blue mx-auto mb-1.5" />
                <div className="font-bold text-white">{lead.depart}</div>
                <div className="text-white/35 text-xs">Départ</div>
              </div>
              <div className="flex-1 flex items-center">
                <div className="h-px flex-1 bg-gradient-to-r from-neo-blue/60 via-neo-sky/60 to-transparent" />
                <div className="mx-2 text-xs text-white/30 font-mono">{lead.type_trajet.replace('_', ' ')}</div>
                <div className="h-px flex-1 bg-gradient-to-l from-neo-sky/60 via-neo-blue/60 to-transparent" />
              </div>
              <div className="flex-1 text-center">
                <MapPin className="w-4 h-4 text-neo-sky mx-auto mb-1.5" />
                <div className="font-bold text-white">{lead.destination}</div>
                <div className="text-white/35 text-xs">Arrivée</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { icon: Calendar, label: 'Date départ', val: new Date(lead.date_depart).toLocaleDateString('fr-FR') },
                { icon: Users,    label: 'Passagers',   val: `${lead.nb_passagers} pax` },
                { icon: Activity, label: 'Complétude',  val: `${lead.score_completude ?? 0} %` },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="glass rounded-xl px-3 py-2.5 text-center">
                  <Icon className="w-3.5 h-3.5 text-white/30 mx-auto mb-1" />
                  <div className="text-sm font-semibold text-white">{val}</div>
                  <div className="text-[10px] text-white/30">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="card-neo">
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Contact</h2>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                ['Email',     lead.email],
                ['Téléphone', lead.telephone],
                ...(lead.societe ? [['Société', lead.societe]] : []),
                ...(lead.options?.length ? [['Options', lead.options.join(', ')]] : []),
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-white/30 text-xs mb-0.5">{k}</div>
                  <div className="text-white font-medium">{v}</div>
                </div>
              ))}
            </div>
            {lead.commentaire && (
              <div className="mt-4 pt-4 border-t border-white/6">
                <div className="text-white/30 text-xs mb-1">Commentaire client</div>
                <p className="text-white/60 text-sm">{lead.commentaire}</p>
              </div>
            )}
          </div>

          {/* Devis */}
          <div className="card-neo">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Devis calculé</h2>
              {!quote && (
                <button
                  onClick={calculateQuote}
                  disabled={calculating}
                  className="btn-gold !px-4 !py-2 !text-sm gap-2"
                >
                  {calculating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Calculator className="w-3.5 h-3.5" />}
                  {calculating ? 'Calcul…' : 'Calculer le devis'}
                </button>
              )}
            </div>

            {!quote && !calculating && (
              <div className="py-8 text-center">
                <Calculator className="w-8 h-8 text-white/15 mx-auto mb-2" />
                <p className="text-white/30 text-sm">Aucun devis calculé pour ce lead.</p>
              </div>
            )}

            {quote && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-neo-gold mb-1">
                    {quote.prix_ttc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </div>
                  <div className="text-white/35 text-sm">TTC · dont {quote.prix_ht.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} HT</div>
                </div>

                {quote.lignes_calcul?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-white/30 text-xs uppercase tracking-wider mb-2">Détail du calcul</div>
                    {quote.lignes_calcul.map((ligne, i) => (
                      <div key={i} className="flex justify-between items-center py-2.5 px-3 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div>
                          <div className="text-white text-sm">{ligne.label}</div>
                          {ligne.detail && <div className="text-white/30 text-[11px]">{ligne.detail}</div>}
                        </div>
                        <div className="text-white font-mono text-sm">
                          {ligne.montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Logs */}
          <div className="card-neo">
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">
              Historique des actions
            </h2>
            {logs.length === 0 && (
              <p className="text-white/25 text-sm">Aucun log pour ce lead.</p>
            )}
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log._id} className="flex items-start gap-3 py-2.5 px-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${LOG_DOT[log.status] ?? 'bg-white/20'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-white/70 text-sm">{log.message}</div>
                    <div className="text-white/25 text-[11px] font-mono mt-0.5">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Sidebar ─── */}
        <div className="space-y-5">

          {/* Status */}
          <div className="card-neo">
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Statut du lead</h3>
            <div className="space-y-1.5">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => api.leads.updateStatus(lead._id, s).then(fetchAll)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center gap-2 ${
                    lead.statut === s
                      ? 'bg-neo-blue/15 text-neo-blue font-semibold'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {lead.statut === s && <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                  {lead.statut !== s && <span className="w-3.5 h-3.5 rounded-full border border-white/15 flex-shrink-0" />}
                  {LEAD_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="card-neo">
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Actions rapides</h3>
            <div className="space-y-2">
              <button
                onClick={simulateRelance}
                disabled={relancing}
                className="btn-ghost w-full !justify-start gap-2 text-sm"
              >
                <Bell className="w-4 h-4 text-amber-400" />
                {relancing ? 'En cours…' : 'Simuler une relance'}
              </button>
              <button
                onClick={() => api.leads.updateStatus(lead._id, 'cas_complexe').then(fetchAll)}
                className="btn-ghost w-full !justify-start gap-2 text-sm"
              >
                <UserCheck className="w-4 h-4 text-rose-400" />
                Transmettre à un commercial
              </button>
              {!quote && (
                <button
                  onClick={calculateQuote}
                  disabled={calculating}
                  className="btn-gold w-full !justify-start gap-2 !text-sm"
                >
                  <Calculator className="w-4 h-4" />
                  {calculating ? 'Calcul en cours…' : 'Calculer le devis'}
                </button>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="card-neo text-[12px] text-white/35 space-y-1.5">
            <div>Créé le {new Date(lead.createdAt).toLocaleDateString('fr-FR')}</div>
            <div>Mis à jour {new Date(lead.updatedAt).toLocaleDateString('fr-FR')}</div>
            <div className="font-mono text-[10px] text-white/15 pt-1">{lead._id}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
