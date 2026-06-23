'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Calculator, Bell, UserCheck, RefreshCw,
  CheckCircle, Activity, MapPin, Users, Calendar,
  Send, Mail, AlertTriangle, XCircle, X,
} from 'lucide-react'
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
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [lead, setLead]       = useState<Lead | null>(null)
  const [quote, setQuote]     = useState<Quote | null>(null)
  const [logs, setLogs]       = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalc] = useState(false)
  const [sending, setSending]  = useState(false)
  const [reminding, setRemind] = useState(false)
  const [actionMsg, setMsg]    = useState<{ text: string; ok: boolean } | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      const [leadData, logsData] = await Promise.all([
        api.leads.get(id) as Promise<Lead & { quote?: Quote }>,
        api.logs.list({ leadId: id }) as Promise<Log[]>,
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

  function flash(text: string, ok: boolean) {
    setMsg({ text, ok })
    setTimeout(() => setMsg(null), 4000)
  }

  async function calculateQuote() {
    if (!lead) return
    setCalc(true)
    try {
      const q = await api.quotes.calculate({ leadId: lead._id }) as Quote
      setQuote(q)
      await fetchAll()
      flash('Devis calculé avec succès.', true)
    } catch (e: unknown) {
      flash((e as Error).message || 'Erreur calcul devis', false)
    }
    setCalc(false)
  }

  async function sendQuote() {
    if (!quote) return
    setSending(true)
    try {
      await api.quotes.send(quote._id)
      await fetchAll()
      flash('Devis envoyé par email au client.', true)
    } catch (e: unknown) {
      flash((e as Error).message || 'Erreur envoi devis', false)
    }
    setSending(false)
  }

  async function remindQuote() {
    if (!quote) return
    setRemind(true)
    try {
      await api.quotes.remind(quote._id)
      await fetchAll()
      flash('Email de relance envoyé au client.', true)
    } catch (e: unknown) {
      flash((e as Error).message || 'Erreur relance', false)
    }
    setRemind(false)
  }

  async function markComplex() {
    if (!lead) return
    try {
      await api.leads.updateStatus(lead._id, 'cas_complexe')
      await fetchAll()
      flash('Dossier transmis pour reprise humaine.', true)
    } catch {
      flash('Erreur mise à jour statut', false)
    }
  }

  async function markAccepted() {
    if (!lead) return
    try {
      await api.leads.updateStatus(lead._id, 'accepte')
      await fetchAll()
      flash('Dossier marqué comme accepté.', true)
    } catch {
      flash('Erreur mise à jour statut', false)
    }
  }

  async function markRefused() {
    if (!lead) return
    try {
      await api.leads.updateStatus(lead._id, 'refuse')
      await fetchAll()
      flash('Dossier marqué comme refusé.', true)
    } catch {
      flash('Erreur mise à jour statut', false)
    }
  }

  async function closeLead() {
    if (!lead) return
    try {
      await api.leads.updateStatus(lead._id, 'cloture')
      await fetchAll()
      flash('Dossier clôturé.', true)
    } catch {
      flash('Erreur mise à jour statut', false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-5 h-5 animate-spin text-white/30" />
      </div>
    )
  }

  if (!lead) return null

  const canSend    = quote && ['devis_genere'].includes(lead.statut)
  const canRemind  = quote && ['devis_envoye', 'relance_1'].includes(lead.statut)

  return (
    <div className="p-6 sm:p-8">
      {/* Flash message */}
      {actionMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className={`mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2 ${
            actionMsg.ok ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'
          }`}
        >
          {actionMsg.ok ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
          {actionMsg.text}
        </motion.div>
      )}

      {/* Header */}
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
        {/* ─── Colonne principale ─── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Trajet */}
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
                <div className="mx-2 text-xs text-white/30 font-mono">{lead.type_trajet.replace(/_/g, ' ')}</div>
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
                <button onClick={calculateQuote} disabled={calculating} className="btn-gold !px-4 !py-2 !text-sm gap-2">
                  {calculating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Calculator className="w-3.5 h-3.5" />}
                  {calculating ? 'Calcul…' : 'Calculer le devis'}
                </button>
              )}
              {quote && (
                <div className="flex gap-2">
                  {canSend && (
                    <button onClick={sendQuote} disabled={sending} className="btn-primary !px-4 !py-2 !text-sm gap-2">
                      {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      {sending ? 'Envoi…' : 'Envoyer par email'}
                    </button>
                  )}
                  {canRemind && (
                    <button onClick={remindQuote} disabled={reminding} className="btn-ghost !px-4 !py-2 !text-sm gap-2">
                      {reminding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                      {reminding ? 'Envoi…' : 'Relance email'}
                    </button>
                  )}
                </div>
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
                  <div className="text-white/35 text-sm">
                    TTC · dont {quote.prix_ht.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} HT
                  </div>
                </div>
                {quote.lignes_calcul?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-white/30 text-xs uppercase tracking-wider mb-2">Détail du calcul</div>
                    {quote.lignes_calcul.map((ligne, i) => (
                      <div key={i} className="flex justify-between items-center py-2.5 px-3 rounded-lg bg-white/3">
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
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Historique des actions</h2>
            {logs.length === 0 && <p className="text-white/25 text-sm">Aucun log pour ce lead.</p>}
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log._id} className="flex items-start gap-3 py-2.5 px-3 rounded-lg bg-white/2">
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

        {/* ─── Barre latérale ─── */}
        <div className="space-y-5">

          {/* Statut */}
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
                  {lead.statut === s
                    ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    : <span className="w-3.5 h-3.5 rounded-full border border-white/15 flex-shrink-0" />}
                  {LEAD_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="card-neo">
            <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">Actions</h3>
            <div className="space-y-2">
              {!quote && (
                <button onClick={calculateQuote} disabled={calculating} className="btn-gold w-full !justify-start gap-2 !text-sm">
                  <Calculator className="w-4 h-4" />
                  {calculating ? 'Calcul en cours…' : 'Calculer le devis'}
                </button>
              )}
              {canSend && (
                <button onClick={sendQuote} disabled={sending} className="btn-primary w-full !justify-start gap-2 !text-sm">
                  <Send className="w-4 h-4" />
                  {sending ? 'Envoi en cours…' : 'Envoyer le devis'}
                </button>
              )}
              {canRemind && (
                <button onClick={remindQuote} disabled={reminding} className="btn-ghost w-full !justify-start gap-2 text-sm">
                  <Mail className="w-4 h-4 text-amber-400" />
                  {reminding ? 'Envoi en cours…' : 'Email de relance'}
                </button>
              )}
              <button onClick={markComplex} className="btn-ghost w-full !justify-start gap-2 text-sm">
                <UserCheck className="w-4 h-4 text-rose-400" />
                Reprise humaine
              </button>
              {!['accepte', 'refuse', 'cloture'].includes(lead.statut) && (
                <>
                  <button onClick={markAccepted} className="btn-ghost w-full !justify-start gap-2 text-sm border-green-500/20 hover:bg-green-500/10 hover:border-green-500/30">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Marquer accepté
                  </button>
                  <button onClick={markRefused} className="btn-danger w-full !justify-start gap-2">
                    <XCircle className="w-4 h-4" />
                    Marquer refusé
                  </button>
                </>
              )}
              {lead.statut !== 'cloture' && (
                <button onClick={closeLead} className="btn-ghost w-full !justify-start gap-2 text-sm text-white/30 hover:text-white/55">
                  <X className="w-4 h-4" />
                  Clôturer le dossier
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
