'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusCircle, RefreshCw, ExternalLink, CheckCircle2, Clock,
  FileText, MapPin, AlertCircle, ArrowRight, UserCheck,
  Package, Send, ChevronDown, ChevronUp,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Lead, LeadStatus } from '@/types'
import { useAuth } from '@/context/AuthContext'

const EASE = [0.21, 0.47, 0.32, 0.98] as const

// Client-facing status labels (reassuring, no jargon)
const CLIENT_LABELS: Record<LeadStatus, string> = {
  nouveau:               'Demande reçue',
  incomplet:             'Informations manquantes',
  qualifie:              'Qualification en cours',
  devis_genere:          'Devis en cours de préparation',
  en_attente_validation: 'Devis en cours de validation',
  devis_valide:          'Devis validé',
  devis_envoye:          'Devis disponible',
  relance_1:             'Devis disponible',
  relance_2:             'Devis disponible',
  accepte:               'Demande acceptée ✓',
  refuse:                'Demande non retenue',
  cloture:               'Dossier clôturé',
  cas_complexe:          'Suivi personnalisé',
  reprise_humaine:       'Suivi par un conseiller',
  erreur_envoi:          'En cours de traitement',
}

const STATUS_STYLE: Record<LeadStatus, { color: string; bg: string; border: string }> = {
  nouveau:               { color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  incomplet:             { color: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
  qualifie:              { color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE' },
  devis_genere:          { color: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
  en_attente_validation: { color: '#7E22CE', bg: '#FAF5FF', border: '#E9D5FF' },
  devis_valide:          { color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4' },
  devis_envoye:          { color: '#0369A1', bg: '#F0F9FF', border: '#BAE6FD' },
  relance_1:             { color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA' },
  relance_2:             { color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
  accepte:               { color: '#15803D', bg: '#F0FDF4', border: '#BBF7D0' },
  refuse:                { color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
  cloture:               { color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
  cas_complexe:          { color: '#7E22CE', bg: '#FAF5FF', border: '#E9D5FF' },
  reprise_humaine:       { color: '#7E22CE', bg: '#FAF5FF', border: '#E9D5FF' },
  erreur_envoi:          { color: '#92400E', bg: '#FFFBEB', border: '#FDE68A' },
}

interface TimelineStep {
  label: string
  Icon: typeof FileText
  statuts: LeadStatus[]
  color: string
}

const TIMELINE: TimelineStep[] = [
  { label: 'Demande reçue',  Icon: FileText,    statuts: ['nouveau', 'incomplet'],                      color: '#A78BFA' },
  { label: 'Qualification',  Icon: Clock,        statuts: ['qualifie'],                                  color: '#60A5FA' },
  { label: 'Préparation',    Icon: Package,      statuts: ['devis_genere'],                              color: '#FBBF24' },
  { label: 'Devis envoyé',   Icon: Send,         statuts: ['devis_envoye', 'relance_1', 'relance_2'],    color: '#38BDF8' },
  { label: 'Finalisé',       Icon: CheckCircle2, statuts: ['accepte', 'refuse', 'cloture'],              color: '#4ADE80' },
]

function getTimelineIndex(statut: LeadStatus): number {
  if (['nouveau', 'incomplet'].includes(statut))                          return 0
  if (statut === 'qualifie')                                              return 1
  if (['devis_genere', 'en_attente_validation', 'devis_valide'].includes(statut)) return 2
  if (['devis_envoye', 'relance_1', 'relance_2'].includes(statut))        return 3
  if (['accepte', 'refuse', 'cloture'].includes(statut))                  return 4
  return 0
}

function isSpecial(statut: LeadStatus): boolean {
  return ['cas_complexe', 'reprise_humaine', 'erreur_envoi'].includes(statut)
}

function LeadCard({ lead, index }: { lead: Lead; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const st    = STATUS_STYLE[lead.statut] ?? { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' }
  const label = CLIENT_LABELS[lead.statut] ?? lead.statut
  const step  = getTimelineIndex(lead.statut)
  const special = isSpecial(lead.statut)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 + index * 0.05, duration: 0.38, ease: EASE }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'var(--dash-surface)',
        border: '1px solid var(--dash-border)',
        boxShadow: 'var(--dash-shadow)',
      }}
    >
      {/* Card header */}
      <div className="flex items-center gap-4 px-5 py-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
        >
          <MapPin className="w-4 h-4" style={{ color: '#2563EB' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white truncate">
              {lead.depart} → {lead.destination}
            </span>
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border"
              style={{ background: st.bg, color: st.color, borderColor: st.border }}
            >
              {label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {lead.nb_passagers} passager{lead.nb_passagers > 1 ? 's' : ''}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.14)' }}>·</span>
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {lead.trackingToken && (
            <Link
              href={`/suivi/${lead.trackingToken}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" />
              Suivre
            </Link>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/6"
            style={{ color: 'var(--dash-text-muted)', border: '1px solid var(--dash-border)' }}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Timeline — always visible below header */}
      {!special && (
        <div className="px-5 pb-4 pt-1">
          <div className="flex items-center gap-0">
            {TIMELINE.map((ts, i) => {
              const done    = i < step
              const current = i === step
              const future  = i > step
              return (
                <div key={ts.label} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
                      style={
                        done    ? { background: ts.color + '25', border: `1.5px solid ${ts.color}` } :
                        current ? { background: ts.color + '18', border: `1.5px solid ${ts.color}`, boxShadow: `0 0 10px ${ts.color}35` } :
                        { background: 'var(--dash-muted)', border: '1.5px solid var(--dash-border)' }
                      }
                    >
                      {done
                        ? <CheckCircle2 className="w-3.5 h-3.5" style={{ color: ts.color }} />
                        : <ts.Icon className="w-3.5 h-3.5" style={{ color: current ? ts.color : 'rgba(255,255,255,0.2)' }} />
                      }
                    </div>
                    <span
                      className="text-[9px] font-medium text-center leading-tight max-w-[52px] hidden sm:block"
                      style={{ color: done || current ? 'var(--dash-text-muted)' : 'var(--dash-text-faint)' }}
                    >
                      {ts.label}
                    </span>
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div
                      className="flex-1 h-[1.5px] mx-1 transition-all"
                      style={{ background: done ? ts.color + '60' : 'var(--dash-border)' }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Special state (cas_complexe / reprise_humaine) */}
      {special && (
        <div className="mx-5 mb-4 flex items-center gap-2.5 px-4 py-2.5 rounded-xl" style={{ background: '#FAF5FF', border: '1px solid #E9D5FF' }}>
          <UserCheck className="w-4 h-4 flex-shrink-0" style={{ color: '#C084FC' }} />
          <p className="text-xs" style={{ color: '#6B21A8' }}>
            Un conseiller NeoTravel s&apos;occupe personnellement de votre dossier et vous recontactera rapidement.
          </p>
        </div>
      )}

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pt-1 space-y-1" style={{ borderTop: '1px solid var(--dash-border)' }}>
              <div className="pt-3 grid grid-cols-2 gap-x-6 gap-y-1.5">
                {[
                  { label: 'Départ',      value: lead.depart },
                  { label: 'Destination', value: lead.destination },
                  { label: 'Date départ', value: lead.date_depart ? new Date(lead.date_depart).toLocaleDateString('fr-FR') : '—' },
                  { label: 'Passagers',   value: `${lead.nb_passagers} personnes` },
                  { label: 'Type trajet', value: lead.type_trajet?.replace('_', ' ') ?? '—' },
                  { label: 'Urgence',     value: lead.urgence ?? '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <span className="text-[10px] block" style={{ color: 'var(--dash-text-faint)' }}>{label}</span>
                    <span className="text-xs font-medium capitalize" style={{ color: 'var(--dash-text)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ClientDashboardPage() {
  const { user }   = useAuth()
  const [leads, setLeads]     = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.leads.list({}) as Lead[]
      setLeads(data)
    } catch { setLeads([]) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const prenom       = user?.nom?.split(' ')[0] ?? 'Client'
  const hasQuote     = leads.filter(l => ['devis_genere', 'devis_envoye', 'relance_1', 'relance_2', 'accepte'].includes(l.statut))
  const accepted     = leads.filter(l => l.statut === 'accepte')
  const inProcess    = leads.filter(l => !['accepte', 'refuse', 'cloture'].includes(l.statut) && !isSpecial(l.statut))
  const needAdvisor  = leads.filter(l => isSpecial(l.statut))
  const sortedLeads  = [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const fade = (i: number) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: i * 0.06, ease: EASE },
  })

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ background: 'var(--dash-bg)' }}>
      <div className="p-6 sm:p-8 max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <motion.div {...fade(0)} className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}
              >
                Espace client
              </span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--dash-text)' }}>Bonjour, {prenom}</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--dash-text-muted)' }}>
              Suivez l&apos;avancement de vos demandes de transport
            </p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={fetchLeads}
              disabled={loading}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/6"
              style={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)', boxShadow: 'var(--dash-shadow)' }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: 'rgba(255,255,255,0.38)' }} />
            </button>
            <Link
              href="/devis"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
                color: '#030D20',
                boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
              }}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Nouvelle demande
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Demandes',    value: leads.length,    Icon: FileText,    color: '#60A5FA', bg: 'rgba(96,165,250,0.1)'  },
            { label: 'Devis reçus', value: hasQuote.length, Icon: AlertCircle, color: '#FBBF24', bg: 'rgba(251,191,36,0.1)'  },
            { label: 'Acceptés',    value: accepted.length, Icon: CheckCircle2,color: '#4ADE80', bg: 'rgba(74,222,128,0.1)'  },
          ].map(({ label, value, Icon, color, bg }, i) => (
            <motion.div
              key={label}
              {...fade(i + 1)}
              className="rounded-xl p-4"
              style={{
                background: 'var(--dash-surface)',
                border: '1px solid var(--dash-border)',
                boxShadow: 'var(--dash-shadow)',
              }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="text-2xl font-bold mb-0.5" style={{ color: 'var(--dash-text)' }}>
                {loading ? <span style={{ color: 'var(--dash-text-faint)' }}>—</span> : value}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Bannière traitement en cours */}
        {!loading && inProcess.length > 0 && (
          <motion.div
            {...fade(4)}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={{ background: '#F0F9FF', border: '1px solid #BAE6FD' }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(56,189,248,0.1)' }}>
              <Clock className="w-4 h-4" style={{ color: '#38BDF8' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#0369A1' }}>
                {inProcess.length} dossier{inProcess.length > 1 ? 's' : ''} en traitement
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: '#0284C7' }}>
                Vous recevrez un email dès qu&apos;un devis sera prêt.
              </p>
            </div>
          </motion.div>
        )}

        {/* Bannière conseiller */}
        {!loading && needAdvisor.length > 0 && (
          <motion.div
            {...fade(4.5)}
            className="flex items-start gap-3 px-4 py-3.5 rounded-2xl"
            style={{ background: '#FAF5FF', border: '1px solid #E9D5FF' }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(192,132,252,0.1)' }}>
              <UserCheck className="w-4 h-4" style={{ color: '#7E22CE' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#6D28D9' }}>
                Un conseiller NeoTravel s&apos;occupe de votre dossier
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: '#7C3AED' }}>
                Votre demande nécessite une validation personnalisée. Vous serez recontacté rapidement.
              </p>
            </div>
          </motion.div>
        )}

        {/* Bannière devis prêt */}
        {!loading && hasQuote.length > 0 && (
          <motion.div
            {...fade(5)}
            className="flex items-center gap-4 p-4 rounded-2xl"
            style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: 'var(--dash-text)' }}>
                {hasQuote.length > 1 ? `${hasQuote.length} devis préparés` : 'Un devis préparé'} pour vous
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--dash-text-muted)' }}>
                Consultez votre lien de suivi pour voir les détails.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 flex-shrink-0 text-amber-400/55" />
          </motion.div>
        )}

        {/* Liste demandes */}
        <motion.div {...fade(6)}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold" style={{ color: 'var(--dash-text)' }}>Vos demandes</span>
          </div>

          {loading && (
            <div className="py-14 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 animate-spin" style={{ color: 'var(--dash-text-faint)' }} />
            </div>
          )}

          {!loading && leads.length === 0 && (
            <div
              className="py-16 text-center rounded-xl"
              style={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)' }}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <MapPin className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.18)' }} />
              </div>
              <h3 className="font-bold mb-1.5" style={{ color: 'var(--dash-text)' }}>Aucune demande pour le moment</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--dash-text-muted)' }}>
                Faites votre première demande de transport de groupe.
              </p>
              <Link
                href="/devis"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)', color: '#030D20', boxShadow: '0 4px 16px rgba(245,158,11,0.3)' }}
              >
                <PlusCircle className="w-4 h-4" />
                Faire une demande
              </Link>
            </div>
          )}

          {!loading && sortedLeads.length > 0 && (
            <div className="space-y-3">
              {sortedLeads.map((lead, i) => (
                <LeadCard key={lead._id} lead={lead} index={i} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
