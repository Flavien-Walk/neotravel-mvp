'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Calculator, Bell, UserCheck, RefreshCw,
  CheckCircle, Activity, MapPin, Users, Calendar,
  Send, Mail, AlertTriangle, XCircle, X, Edit2, Save,
  Info, ChevronDown, ChevronUp, Euro, Download, FileText,
  ShieldCheck, Clock,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Lead, Quote, Log, LeadStatus, LEAD_STATUS_LABELS, CalculationSource, LigneCalcul } from '@/types'
import StatusBadge from '@/components/StatusBadge'
import UrgencyBadge from '@/components/UrgencyBadge'
import ManualQuoteModal from '@/components/ManualQuoteModal'

const STATUS_OPTIONS: LeadStatus[] = [
  'nouveau', 'incomplet', 'qualifie',
  'devis_genere', 'en_attente_validation', 'devis_valide', 'devis_envoye',
  'relance_1', 'relance_2', 'accepte', 'refuse',
  'cas_complexe', 'reprise_humaine', 'erreur_envoi', 'cloture',
]

const LOG_STATUS: Record<string, { dot: string }> = {
  success: { dot: '#22C55E' },
  error:   { dot: '#EF4444' },
  info:    { dot: '#3B82F6' },
  warning: { dot: '#F59E0B' },
}

const SOURCE_TYPE_LABELS: Record<string, { label: string; bg: string; color: string; border: string }> = {
  regle_documentee: { label: 'Règle documentée', bg: 'var(--dash-success-bg)', color: 'var(--dash-success-text)', border: 'var(--dash-success-border)' },
  mock_mvp:         { label: 'Estimation MVP',   bg: 'var(--dash-warning-bg)', color: 'var(--dash-warning-text)', border: 'var(--dash-warning-border)' },
  hypothese_mvp:    { label: 'Hypothèse MVP',    bg: 'var(--dash-orange-bg)',  color: 'var(--dash-orange-text)',  border: 'var(--dash-orange-border)'  },
  a_definir:        { label: 'À affiner',        bg: 'var(--dash-muted)',      color: 'var(--dash-text-muted)',   border: 'var(--dash-border)'         },
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{
        background: 'var(--dash-surface)',
        border: '1px solid var(--dash-border)',
        boxShadow: 'var(--dash-shadow)',
      }}
    >
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: 'var(--dash-text-faint)' }}>
      {children}
    </div>
  )
}

export default function DashboardLeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [lead, setLead]       = useState<Lead | null>(null)
  const [quote, setQuote]     = useState<Quote | null>(null)
  const [logs, setLogs]       = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalc]    = useState(false)
  const [approving, setApproving] = useState(false)
  const [sending, setSending]     = useState(false)
  const [reminding, setRemind]    = useState(false)
  const [editingQuote, setEditQ]  = useState(false)
  const [adjAmount, setAdjAmount] = useState('')
  const [adjReason, setAdjReason] = useState('')
  const [savingAdj, setSavingAdj] = useState(false)
  const [editingLignes, setEditLignes] = useState(false)
  const [editedLignes, setEditedLignes] = useState<LigneCalcul[]>([])
  const [savingLignes, setSavingLignes] = useState(false)
  const [showSources, setShowSrc] = useState(false)
  const [actionMsg, setMsg]       = useState<{ text: string; ok: boolean } | null>(null)
  const [downloading, setDl]      = useState(false)
  const [manualModal, setManual]  = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [leadData, logsData] = await Promise.all([
        api.leads.get(id) as Promise<Lead & { quote?: Quote }>,
        api.logs.list({ leadId: id }) as Promise<Log[]>,
      ])
      setLead(leadData)
      if (leadData.quote) {
        setQuote(leadData.quote)
        setAdjAmount(String(leadData.quote.ajustement_manuel_ht ?? 0))
        setAdjReason(leadData.quote.raison_ajustement ?? '')
      }
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
      setAdjAmount('0')
      setAdjReason('')
      await fetchAll()
      flash('Devis calculé avec succès.', true)
      if (q.besoin_reprise_humaine) flash(`⚠ Reprise humaine : ${q.raison_reprise_humaine}`, false)
    } catch (e: unknown) {
      flash((e as Error).message || 'Erreur calcul devis', false)
    }
    setCalc(false)
  }

  async function saveAdjustment() {
    if (!quote) return
    setSavingAdj(true)
    try {
      const updated = await api.quotes.update(quote._id, {
        ajustement_manuel_ht: Number(adjAmount) || 0,
        raison_ajustement: adjReason,
      }) as Quote
      setQuote(updated)
      setEditQ(false)
      await fetchAll()
      flash('Devis modifié.', true)
    } catch (e: unknown) {
      flash((e as Error).message || 'Erreur modification devis', false)
    }
    setSavingAdj(false)
  }

  function startEditLignes() {
    if (!quote) return
    setEditedLignes(quote.lignes_calcul.map(l => ({ ...l })))
    setEditLignes(true)
  }

  function updateLigneMontant(index: number, value: string) {
    setEditedLignes(prev => prev.map((l, i) => i === index ? { ...l, montant: parseFloat(value) || 0 } : l))
  }

  async function saveLignes() {
    if (!quote) return
    setSavingLignes(true)
    try {
      const updated = await api.quotes.update(quote._id, { lignes_calcul: editedLignes }) as Quote
      setQuote(updated)
      setEditLignes(false)
      await fetchAll()
      flash('Lignes mises à jour.', true)
    } catch (e: unknown) {
      flash((e as Error).message || 'Erreur modification lignes', false)
    }
    setSavingLignes(false)
  }

  async function approveQuote() {
    if (!quote) return
    setApproving(true)
    try {
      await api.quotes.approve(quote._id)
      await fetchAll()
      flash('Devis approuvé. Cliquez sur "Envoyer le devis" pour l\'envoyer au client.', true)
    } catch (e: unknown) {
      flash((e as Error).message || 'Erreur approbation devis', false)
    }
    setApproving(false)
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
    } catch { flash('Erreur mise à jour statut', false) }
  }

  async function markAccepted() {
    if (!lead) return
    try {
      await api.leads.updateStatus(lead._id, 'accepte')
      await fetchAll()
      flash('Dossier marqué comme accepté.', true)
    } catch { flash('Erreur mise à jour statut', false) }
  }

  async function markRefused() {
    if (!lead) return
    try {
      await api.leads.updateStatus(lead._id, 'refuse')
      await fetchAll()
      flash('Dossier marqué comme refusé.', true)
    } catch { flash('Erreur mise à jour statut', false) }
  }

  async function downloadPdf() {
    if (!quote) return
    setDl(true)
    try {
      const res = await api.quotes.downloadPdf(quote._id)
      if (!res.ok) throw new Error('PDF non disponible')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `devis-neotravel-${lead?._id ?? quote._id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: unknown) {
      flash((e as Error).message || 'Erreur téléchargement PDF', false)
    }
    setDl(false)
  }

  async function closeLead() {
    if (!lead) return
    try {
      await api.leads.updateStatus(lead._id, 'cloture')
      await fetchAll()
      flash('Dossier clôturé.', true)
    } catch { flash('Erreur mise à jour statut', false) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ background: 'var(--dash-bg)' }}>
        <RefreshCw className="w-5 h-5 animate-spin" style={{ color: 'var(--dash-text-faint)' }} />
      </div>
    )
  }

  if (!lead) return null

  const canApprove   = quote && quote.statut_devis === 'pending_human_validation'
  const canSend      = quote && quote.statut_devis === 'approved'
  const stopStatuts  = ['accepte', 'refuse', 'cloture', 'reprise_humaine', 'cas_complexe']
  const canRemind    = quote && quote.statut_devis === 'sent'
    && (quote.reminder_count ?? 0) < 2
    && !stopStatuts.includes(lead.statut)
  const reminderCount = quote?.reminder_count ?? 0
  const nextRelanceLevel = reminderCount + 1
  const finalTtc   = quote ? (quote.prix_final_ttc || quote.prix_ttc) : 0
  const finalHt    = quote ? (quote.prix_final_ht  || quote.prix_ht)  : 0
  const hasAdj     = quote && quote.ajustement_manuel_ht && quote.ajustement_manuel_ht !== 0
  const fmt = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

  return (
    <div className="p-6 sm:p-8 transition-colors duration-200" style={{ background: 'var(--dash-bg)', minHeight: '100vh' }}>

      {/* Flash */}
      {actionMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
          style={actionMsg.ok
            ? { background: 'var(--dash-success-bg)', color: 'var(--dash-success-text)', border: '1px solid var(--dash-success-border)' }
            : { background: 'var(--dash-danger-bg)',  color: 'var(--dash-danger-text)',  border: '1px solid var(--dash-danger-border)'  }
          }
        >
          {actionMsg.ok
            ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
            : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
          {actionMsg.text}
        </motion.div>
      )}

      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/leads"
          className="inline-flex items-center gap-1.5 text-sm mb-4 transition-colors"
          style={{ color: 'var(--dash-text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--dash-text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--dash-text-muted)'}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Tous les leads
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--dash-text)' }}>{lead.nom}</h1>
            {lead.societe && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--dash-text-muted)' }}>{lead.societe}</p>
            )}
            <p className="text-xs mt-1 font-mono" style={{ color: 'var(--dash-text-faint)' }}>
              {lead._id}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <UrgencyBadge urgence={lead.urgence} />
            <StatusBadge status={lead.statut} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Colonne principale ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Trajet */}
          <Card className="p-5">
            <SectionTitle>Trajet demandé</SectionTitle>
            <div className="flex items-center gap-4">
              <div className="flex-1 text-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2"
                  style={{ background: 'var(--dash-selected-bg)' }}
                >
                  <MapPin className="w-4 h-4" style={{ color: 'var(--dash-selected-text)' }} />
                </div>
                <div className="font-bold text-sm" style={{ color: 'var(--dash-text)' }}>{lead.depart}</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--dash-text-faint)' }}>Départ</div>
              </div>
              <div className="flex-1 flex items-center">
                <div className="h-px flex-1" style={{ background: 'var(--dash-border)' }} />
                <span className="mx-2 text-[10px] font-medium px-2 py-0.5 rounded"
                  style={{ color: 'var(--dash-text-muted)', background: 'var(--dash-muted)' }}>
                  {lead.type_trajet.replace(/_/g, ' ')}
                </span>
                <div className="h-px flex-1" style={{ background: 'var(--dash-border)' }} />
              </div>
              <div className="flex-1 text-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2"
                  style={{ background: 'var(--dash-info-bg)' }}
                >
                  <MapPin className="w-4 h-4" style={{ color: 'var(--dash-info-text)' }} />
                </div>
                <div className="font-bold text-sm" style={{ color: 'var(--dash-text)' }}>{lead.destination}</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--dash-text-faint)' }}>Arrivée</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { icon: Calendar, label: 'Départ',      val: new Date(lead.date_depart).toLocaleDateString('fr-FR') },
                { icon: Users,    label: 'Passagers',   val: `${lead.nb_passagers} pax` },
                { icon: Activity, label: 'Complétude',  val: `${lead.score_completude ?? 0} %` },
              ].map(({ icon: Icon, label, val }) => (
                <div
                  key={label}
                  className="rounded-lg px-3 py-2.5 text-center"
                  style={{ background: 'var(--dash-muted)', border: '1px solid var(--dash-border)' }}
                >
                  <Icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: 'var(--dash-text-faint)' }} />
                  <div className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>{val}</div>
                  <div className="text-[10px]" style={{ color: 'var(--dash-text-faint)' }}>{label}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Contact */}
          <Card className="p-5">
            <SectionTitle>Informations contact</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {[
                ['Email',     lead.email],
                ['Téléphone', lead.telephone],
                ...(lead.societe ? [['Société', lead.societe]] : []),
                ...(lead.options?.length ? [['Options', lead.options.join(', ')]] : []),
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--dash-text-faint)' }}>{k}</div>
                  <div className="font-medium" style={{ color: 'var(--dash-text)' }}>{v}</div>
                </div>
              ))}
            </div>
            {lead.commentaire && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--dash-border)' }}>
                <div className="text-[10px] font-medium mb-1" style={{ color: 'var(--dash-text-faint)' }}>Commentaire client</div>
                <p className="text-sm" style={{ color: 'var(--dash-text-muted)' }}>{lead.commentaire}</p>
              </div>
            )}
            {lead.trackingToken && (
              <div className="mt-4 pt-4 flex items-center gap-2 text-xs" style={{ borderTop: '1px solid var(--dash-border)', color: 'var(--dash-text-faint)' }}>
                <span>Lien de suivi :</span>
                <a
                  href={`/suivi/${lead.trackingToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline font-mono"
                  style={{ color: 'var(--dash-selected-text)' }}
                >
                  /suivi/{lead.trackingToken.slice(0, 12)}…
                </a>
              </div>
            )}
          </Card>

          {/* Devis */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Devis</SectionTitle>
              <div className="flex gap-2 flex-wrap">
                {!quote && (
                  <>
                    <button
                      onClick={calculateQuote}
                      disabled={calculating}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                      style={{ background: '#2563EB', color: '#fff' }}
                    >
                      {calculating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Calculator className="w-3.5 h-3.5" />}
                      {calculating ? 'Calcul…' : 'Calcul auto'}
                    </button>
                    <button
                      onClick={() => setManual(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                      style={{ background: 'var(--dash-muted)', color: 'var(--dash-text)', border: '1px solid var(--dash-border)' }}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Devis manuel
                    </button>
                  </>
                )}
                {quote && !editingQuote && (
                  <>
                    <button
                      onClick={() => setEditQ(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all"
                      style={{ background: 'var(--dash-muted)', color: 'var(--dash-text)', border: '1px solid var(--dash-border)' }}
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Ajuster
                    </button>
                    {canSend && (
                      <button
                        onClick={sendQuote}
                        disabled={sending}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                        style={{ background: '#2563EB', color: '#fff' }}
                      >
                        {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        {sending ? 'Envoi…' : 'Envoyer'}
                      </button>
                    )}
                    {canRemind && (
                      <button
                        onClick={remindQuote}
                        disabled={reminding}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all"
                        style={{ background: 'var(--dash-orange-bg)', color: 'var(--dash-orange-text)', border: '1px solid var(--dash-orange-border)' }}
                      >
                        {reminding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}
                        {reminding ? 'Envoi…' : `Relance ${nextRelanceLevel} manuelle`}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {!quote && !calculating && (
              <div className="py-10 text-center rounded-lg" style={{ background: 'var(--dash-muted)', border: '1px solid var(--dash-border)' }}>
                <Calculator className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--dash-text-faint)' }} />
                <p className="text-sm" style={{ color: 'var(--dash-text-muted)' }}>Aucun devis pour ce lead.</p>
                <p className="text-xs mt-1" style={{ color: 'var(--dash-text-faint)' }}>
                  Utilisez le calcul automatique ou créez un devis manuel.
                </p>
              </div>
            )}

            {quote && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                {/* Bandeau validation humaine */}
                {quote.statut_devis === 'pending_human_validation' && (
                  <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
                    style={{ background: 'var(--dash-purple-bg)', border: '1px solid var(--dash-purple-border)' }}>
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--dash-purple-text)' }}>
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium">En attente de validation humaine</span>
                    </div>
                    <button
                      onClick={approveQuote}
                      disabled={approving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex-shrink-0"
                      style={{ background: '#7E22CE', color: '#fff' }}
                    >
                      {approving
                        ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        : <ShieldCheck className="w-3.5 h-3.5" />}
                      {approving ? 'Approbation…' : 'Approuver le devis'}
                    </button>
                  </div>
                )}

                {/* Bandeau devis approuvé */}
                {quote.statut_devis === 'approved' && (
                  <div className="mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
                    style={{ background: 'var(--dash-success-bg)', border: '1px solid var(--dash-success-border)' }}>
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--dash-success-text)' }}>
                      <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                      <span><strong>Devis approuvé.</strong> Cliquez sur &quot;Envoyer le devis&quot; pour l&apos;envoyer au client.</span>
                    </div>
                  </div>
                )}

                {/* Bandeau devis envoyé + suivi relances */}
                {quote.statut_devis === 'sent' && (
                  <div className="mb-4 rounded-xl overflow-hidden" style={{ border: '1px solid var(--dash-info-border)' }}>
                    <div className="flex items-center gap-2 px-4 py-2.5 text-sm" style={{ background: 'var(--dash-info-bg)', color: 'var(--dash-info-text)' }}>
                      <Send className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>
                        <strong>Devis envoyé</strong>
                        {quote.email_sent_at && (
                          <> le {new Date(quote.email_sent_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</>
                        )}
                      </span>
                    </div>
                    <div className="px-4 py-3" style={{ background: 'var(--dash-muted)' }}>
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--dash-info-text)' }}>
                        Relances automatiques (n8n)
                      </div>
                      <div className="space-y-1.5">
                        {/* Relance 1 */}
                        <div className="flex items-center gap-2 text-xs">
                          {reminderCount >= 1
                            ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--dash-success-text)' }} />
                            : <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--dash-info-text)' }} />}
                          <span style={{ color: reminderCount >= 1 ? 'var(--dash-success-text)' : 'var(--dash-info-text)' }}>
                            {reminderCount >= 1
                              ? <>Relance 1 envoyée{quote.lastReminderAt && reminderCount === 1
                                  ? ` le ${new Date(quote.lastReminderAt).toLocaleDateString('fr-FR')}`
                                  : ''}</>
                              : <>Relance 1 : 48h après envoi
                                  {quote.email_sent_at && (() => {
                                    const due = new Date(new Date(quote.email_sent_at).getTime() + 48 * 3600000)
                                    const now = new Date()
                                    const diffH = Math.round((due.getTime() - now.getTime()) / 3600000)
                                    return diffH > 0
                                      ? ` (dans ~${diffH}h)`
                                      : ' (dû — n8n va envoyer prochainement)'
                                  })()}
                                </>
                            }
                          </span>
                        </div>
                        {/* Relance 2 */}
                        <div className="flex items-center gap-2 text-xs">
                          {reminderCount >= 2
                            ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--dash-success-text)' }} />
                            : reminderCount === 1
                            ? <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--dash-orange-text)' }} />
                            : <span className="w-3.5 h-3.5 rounded-full flex-shrink-0 border" style={{ borderColor: 'var(--dash-border)' }} />}
                          <span style={{ color: reminderCount >= 2 ? 'var(--dash-success-text)' : reminderCount === 1 ? 'var(--dash-orange-text)' : 'var(--dash-text-faint)' }}>
                            {reminderCount >= 2
                              ? <>Relance 2 envoyée le {quote.lastReminderAt ? new Date(quote.lastReminderAt).toLocaleDateString('fr-FR') : '—'}</>
                              : reminderCount === 1
                              ? <>Relance 2 : 72h après relance 1
                                  {quote.lastReminderAt && (() => {
                                    const due = new Date(new Date(quote.lastReminderAt).getTime() + 72 * 3600000)
                                    const now = new Date()
                                    const diffH = Math.round((due.getTime() - now.getTime()) / 3600000)
                                    return diffH > 0
                                      ? ` (dans ~${diffH}h)`
                                      : ' (dû — n8n va envoyer prochainement)'
                                  })()}
                                </>
                              : 'Relance 2 : après relance 1 + 72h'}
                          </span>
                        </div>
                        {/* Max atteint */}
                        {reminderCount >= 2 && (
                          <div className="flex items-center gap-2 text-xs mt-1" style={{ color: 'var(--dash-text-muted)' }}>
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            Toutes les relances automatiques ont été envoyées. Traitement manuel requis.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {quote.warnings?.length > 0 && (
                  <div className="mb-4 space-y-1.5">
                    {quote.warnings.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs"
                        style={{ background: 'var(--dash-warning-bg)', color: 'var(--dash-warning-text)', border: '1px solid var(--dash-warning-border)' }}>
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        {w}
                      </div>
                    ))}
                  </div>
                )}

                {/* Reprise humaine */}
                {quote.besoin_reprise_humaine && (
                  <div className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-lg text-xs"
                    style={{ background: 'var(--dash-danger-bg)', color: 'var(--dash-danger-text)', border: '1px solid var(--dash-danger-border)' }}>
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Reprise humaine :</span> {quote.raison_reprise_humaine}
                    </div>
                  </div>
                )}

                {/* Prix TTC */}
                <div
                  className="text-center py-5 mb-5 rounded-xl"
                  style={{ background: 'var(--dash-info-bg)', border: '1px solid var(--dash-info-border)' }}
                >
                  <div className="text-3xl font-bold mb-1" style={{ color: 'var(--dash-info-text)' }}>{fmt(finalTtc)}</div>
                  <div className="text-xs" style={{ color: 'var(--dash-text-muted)' }}>
                    TTC · {fmt(finalHt)} HT + {fmt(quote.tva)} TVA (10%)
                  </div>
                  {hasAdj && (
                    <div className="mt-1.5 text-xs" style={{ color: 'var(--dash-warning-text)' }}>
                      Ajustement commercial : {fmt(quote.ajustement_manuel_ht!)}
                      {quote.raison_ajustement ? ` — ${quote.raison_ajustement}` : ''}
                    </div>
                  )}
                </div>

                {/* Formulaire ajustement */}
                {editingQuote && (
                  <div className="mb-5 p-4 rounded-xl space-y-3"
                    style={{ background: 'var(--dash-muted)', border: '1px solid var(--dash-border)' }}>
                    <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-text-faint)' }}>
                      Ajustement commercial
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--dash-text-muted)' }}>
                          Montant HT (€ positif ou négatif)
                        </label>
                        <div className="relative">
                          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--dash-text-faint)' }} />
                          <input
                            type="number" step="10" value={adjAmount}
                            onChange={e => setAdjAmount(e.target.value)}
                            className="w-full rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none"
                            style={{
                              background: 'var(--dash-surface)',
                              border: '1px solid var(--dash-border)',
                              color: 'var(--dash-text)',
                            }}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: 'var(--dash-text-muted)' }}>
                          Motif de l&apos;ajustement
                        </label>
                        <input
                          type="text" value={adjReason}
                          onChange={e => setAdjReason(e.target.value)}
                          className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                          style={{
                            background: 'var(--dash-surface)',
                            border: '1px solid var(--dash-border)',
                            color: 'var(--dash-text)',
                          }}
                          placeholder="Ex: remise fidélité"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditQ(false)}
                        className="px-3 py-1.5 rounded-lg text-sm transition-all"
                        style={{ color: 'var(--dash-text-muted)', border: '1px solid var(--dash-border)' }}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={saveAdjustment}
                        disabled={savingAdj}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
                        style={{ background: '#2563EB', color: '#fff', border: 'none' }}
                      >
                        {savingAdj ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {savingAdj ? 'Sauvegarde…' : 'Sauvegarder'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Lignes */}
                {quote.lignes_calcul?.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--dash-text-faint)' }}>
                        Détail du calcul
                      </div>
                      {!editingLignes ? (
                        <button
                          onClick={startEditLignes}
                          className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md transition-colors"
                          style={{ color: 'var(--dash-text-muted)', border: '1px solid var(--dash-border)' }}
                        >
                          <Edit2 className="w-3 h-3" /> Modifier
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditLignes(false)}
                            className="text-[11px] px-2 py-1 rounded-md transition-colors"
                            style={{ color: 'var(--dash-text-muted)', border: '1px solid var(--dash-border)' }}
                          >
                            Annuler
                          </button>
                          <button
                            onClick={saveLignes}
                            disabled={savingLignes}
                            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-md font-medium transition-colors"
                            style={{ background: '#2563EB', color: '#fff', border: 'none' }}
                          >
                            {savingLignes ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            Sauvegarder
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {(editingLignes ? editedLignes : quote.lignes_calcul).map((ligne: LigneCalcul, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-start py-2.5 px-3 rounded-lg"
                          style={{ background: 'var(--dash-muted)', border: `1px solid ${editingLignes ? '#3B82F6' : 'var(--dash-border)'}` }}
                        >
                          <div className="flex-1 min-w-0 mr-3">
                            <div className="text-sm" style={{ color: 'var(--dash-text)' }}>{ligne.label}</div>
                            {ligne.justification && (
                              <div className="text-[11px] mt-0.5" style={{ color: 'var(--dash-text-faint)' }}>
                                {ligne.justification}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {ligne.source_type && SOURCE_TYPE_LABELS[ligne.source_type] && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border"
                                style={{
                                  background:  SOURCE_TYPE_LABELS[ligne.source_type].bg,
                                  color:       SOURCE_TYPE_LABELS[ligne.source_type].color,
                                  borderColor: SOURCE_TYPE_LABELS[ligne.source_type].border,
                                }}
                              >
                                {SOURCE_TYPE_LABELS[ligne.source_type].label}
                              </span>
                            )}
                            {editingLignes ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs" style={{ color: 'var(--dash-text-faint)' }}>€</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editedLignes[i]?.montant ?? ligne.montant}
                                  onChange={e => updateLigneMontant(i, e.target.value)}
                                  className="w-24 text-right font-mono text-sm font-semibold rounded px-1.5 py-0.5 outline-none"
                                  style={{
                                    background: 'var(--dash-bg)',
                                    border: '1px solid #3B82F6',
                                    color: 'var(--dash-text)',
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="font-mono text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>
                                {fmt(ligne.montant)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    {editingLignes && (
                      <div className="mt-2 px-3 py-2 rounded-lg text-[11px]" style={{ background: 'var(--dash-selected-bg)', border: '1px solid var(--dash-selected-border)', color: 'var(--dash-selected-text)' }}>
                        Total HT recalculé : <strong>{editedLignes.reduce((s, l) => s + (Number(l.montant) || 0), 0).toFixed(2)} €</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Sources toggle */}
                {(quote.sources_calcul?.length > 0 || quote.explication_calcul) && (
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--dash-border)' }}>
                    <button
                      onClick={() => setShowSrc(!showSources)}
                      className="flex items-center gap-2 text-xs mb-3 transition-colors"
                      style={{ color: 'var(--dash-text-muted)' }}
                    >
                      <Info className="w-3.5 h-3.5" />
                      Sources et justification du calcul
                      {showSources ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {showSources && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        {quote.explication_calcul && (
                          <div className="mb-3 px-3 py-2.5 rounded-lg text-xs"
                            style={{ background: 'var(--dash-selected-bg)', border: '1px solid var(--dash-selected-border)', color: 'var(--dash-selected-text)' }}>
                            {quote.explication_calcul}
                          </div>
                        )}
                        {quote.sources_calcul?.length > 0 && (
                          <div className="space-y-1.5">
                            {quote.sources_calcul.map((src: CalculationSource, i) => (
                              <div key={i}
                                className="flex items-start gap-2 py-2 px-3 rounded-lg text-xs"
                                style={{ background: 'var(--dash-muted)' }}>
                                <div className="flex-1">
                                  <span className="font-medium" style={{ color: 'var(--dash-text-muted)' }}>{src.label} : </span>
                                  <span style={{ color: 'var(--dash-text)' }}>{src.valeur}</span>
                                </div>
                                {SOURCE_TYPE_LABELS[src.source_type] && (
                                  <span
                                    className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] border"
                                    style={{
                                      background:  SOURCE_TYPE_LABELS[src.source_type].bg,
                                      color:       SOURCE_TYPE_LABELS[src.source_type].color,
                                      borderColor: SOURCE_TYPE_LABELS[src.source_type].border,
                                    }}
                                  >
                                    {SOURCE_TYPE_LABELS[src.source_type].label}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </Card>

          {/* Historique */}
          <Card className="p-5">
            <SectionTitle>Historique des actions</SectionTitle>
            {logs.length === 0 && (
              <p className="text-sm py-4 text-center" style={{ color: 'var(--dash-text-faint)' }}>
                Aucun log pour ce lead.
              </p>
            )}
            <div className="space-y-1.5">
              {logs.map((log) => {
                const dot = (LOG_STATUS[log.status] ?? { dot: '#94A3B8' }).dot
                return (
                  <div
                    key={log._id}
                    className="flex items-start gap-3 py-2.5 px-3 rounded-lg"
                    style={{ background: 'var(--dash-muted)' }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: dot }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm" style={{ color: 'var(--dash-text)' }}>{log.message}</div>
                      <div className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--dash-text-faint)' }}>
                        {new Date(log.timestamp).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* ── Sidebar actions ── */}
        <div className="space-y-4">

          {/* Actions principales */}
          <Card className="p-4">
            <SectionTitle>Actions</SectionTitle>
            <div className="space-y-2">
              {!quote && (
                <>
                  <button
                    onClick={calculateQuote}
                    disabled={calculating}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                    style={{ background: '#2563EB', color: '#fff' }}
                  >
                    {calculating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                    {calculating ? 'Calcul en cours…' : 'Calculer le devis auto'}
                  </button>
                  <button
                    onClick={() => setManual(true)}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                    style={{ background: 'var(--dash-muted)', color: 'var(--dash-text)', border: '1px solid var(--dash-border)' }}
                  >
                    <FileText className="w-4 h-4" />
                    Créer devis manuel
                  </button>
                </>
              )}
              {canApprove && (
                <button
                  onClick={approveQuote}
                  disabled={approving}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: '#7E22CE', color: '#fff' }}
                >
                  {approving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {approving ? 'Approbation…' : 'Approuver le devis'}
                </button>
              )}
              {canSend && (
                <button
                  onClick={sendQuote}
                  disabled={sending}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{ background: '#2563EB', color: '#fff' }}
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Envoi en cours…' : 'Envoyer le devis'}
                </button>
              )}
              {canRemind && (
                <button
                  onClick={remindQuote}
                  disabled={reminding}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm transition-all"
                  style={{ background: 'var(--dash-orange-bg)', color: 'var(--dash-orange-text)', border: '1px solid var(--dash-orange-border)' }}
                >
                  <Mail className="w-4 h-4" />
                  {reminding ? 'Envoi en cours…' : `Relance ${nextRelanceLevel} manuelle`}
                </button>
              )}
              {quote && quote.statut_devis === 'sent' && reminderCount >= 2 && (
                <div className="text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--dash-muted)', color: 'var(--dash-text-muted)', border: '1px solid var(--dash-border)' }}>
                  Relances automatiques terminées. Pour contacter le client, utilisez l&apos;email direct.
                </div>
              )}
              {quote && (
                <button
                  onClick={downloadPdf}
                  disabled={downloading}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm transition-all"
                  style={{ background: 'var(--dash-info-bg)', color: 'var(--dash-info-text)', border: '1px solid var(--dash-info-border)' }}
                >
                  {downloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {downloading ? 'Génération PDF…' : 'Télécharger PDF'}
                </button>
              )}
              <button
                onClick={markComplex}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm transition-all"
                style={{ background: 'var(--dash-purple-bg)', color: 'var(--dash-purple-text)', border: '1px solid var(--dash-purple-border)' }}
              >
                <UserCheck className="w-4 h-4" />
                Reprise humaine
              </button>
              {!['accepte', 'refuse', 'cloture'].includes(lead.statut) && (
                <>
                  <button
                    onClick={markAccepted}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm transition-all"
                    style={{ background: 'var(--dash-success-bg)', color: 'var(--dash-success-text)', border: '1px solid var(--dash-success-border)' }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Marquer accepté
                  </button>
                  <button
                    onClick={markRefused}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm transition-all"
                    style={{ background: 'var(--dash-danger-bg)', color: 'var(--dash-danger-text)', border: '1px solid var(--dash-danger-border)' }}
                  >
                    <XCircle className="w-4 h-4" />
                    Marquer refusé
                  </button>
                </>
              )}
              {lead.statut !== 'cloture' && (
                <button
                  onClick={closeLead}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm transition-all"
                  style={{ color: 'var(--dash-text-muted)', border: '1px solid var(--dash-border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--dash-muted)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <X className="w-4 h-4" />
                  Clôturer le dossier
                </button>
              )}
            </div>
          </Card>

          {/* Statut */}
          <Card className="p-4">
            <SectionTitle>Statut du lead</SectionTitle>
            <div className="space-y-0.5">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => api.leads.updateStatus(lead._id, s).then(fetchAll)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-2"
                  style={lead.statut === s ? {
                    background: 'var(--dash-selected-bg)',
                    color: 'var(--dash-selected-text)',
                    fontWeight: 600,
                    border: '1px solid var(--dash-selected-border)',
                  } : {
                    color: 'var(--dash-text-muted)',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={e => { if (lead.statut !== s) e.currentTarget.style.background = 'var(--dash-muted)' }}
                  onMouseLeave={e => { if (lead.statut !== s) e.currentTarget.style.background = 'transparent' }}
                >
                  {lead.statut === s
                    ? <CheckCircle className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--dash-selected-text)' }} />
                    : <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ border: '1px solid var(--dash-border)' }} />}
                  {LEAD_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </Card>

          {/* Meta */}
          <Card className="p-4">
            <div className="text-xs space-y-1.5" style={{ color: 'var(--dash-text-muted)' }}>
              <div>Créé le {new Date(lead.createdAt).toLocaleDateString('fr-FR')}</div>
              <div>Mis à jour {new Date(lead.updatedAt).toLocaleDateString('fr-FR')}</div>
              {quote?.modifiedAt && (
                <div style={{ color: 'var(--dash-warning-text)' }}>
                  Devis modifié le {new Date(quote.modifiedAt).toLocaleDateString('fr-FR')}
                </div>
              )}
              {quote?.email_sent_at && (
                <div style={{ color: 'var(--dash-info-text)' }}>
                  Envoyé le {new Date(quote.email_sent_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              {quote?.lastReminderAt && (
                <div style={{ color: 'var(--dash-orange-text)' }}>
                  Dernière relance le {new Date(quote.lastReminderAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {' '}({reminderCount}/{2})
                </div>
              )}
              {quote?.statut_devis === 'sent' && reminderCount < 2 && (
                <div style={{ color: 'var(--dash-text-faint)' }}>
                  Relances n8n : {reminderCount}/2 envoyées
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {manualModal && (
        <ManualQuoteModal
          onClose={() => { setManual(false); fetchAll() }}
          leadId={lead._id}
          defaultClient={{
            nom: lead.nom,
            email: lead.email,
            telephone: lead.telephone,
            societe: lead.societe,
          }}
          defaultTrajet={{
            depart: lead.depart,
            destination: lead.destination,
            date_depart: lead.date_depart,
            date_retour: lead.date_retour,
            nb_passagers: lead.nb_passagers,
            type_trajet: lead.type_trajet,
            urgence: lead.urgence,
          }}
        />
      )}
    </div>
  )
}
