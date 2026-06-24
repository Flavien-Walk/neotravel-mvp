'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  PlusCircle, RefreshCw, ExternalLink, CheckCircle, Clock,
  FileText, MapPin, AlertCircle, ArrowRight,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Lead, LeadStatus, LEAD_STATUS_LABELS_CLIENT } from '@/types'
import { useAuth } from '@/context/AuthContext'

const EASE = [0.21, 0.47, 0.32, 0.98] as const

const STATUS_STYLE: Record<LeadStatus, { color: string; bg: string }> = {
  nouveau:      { color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  incomplet:    { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)'  },
  qualifie:     { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)'  },
  devis_genere: { color: '#38BDF8', bg: 'rgba(56,189,248,0.12)'  },
  devis_envoye: { color: '#38BDF8', bg: 'rgba(56,189,248,0.12)'  },
  relance_1:    { color: '#FB923C', bg: 'rgba(251,146,60,0.12)'  },
  relance_2:    { color: '#FB923C', bg: 'rgba(251,146,60,0.12)'  },
  accepte:      { color: '#4ADE80', bg: 'rgba(74,222,128,0.12)'  },
  refuse:       { color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
  cloture:      { color: '#94A3B8', bg: 'rgba(148,163,184,0.12)' },
  cas_complexe: { color: '#C084FC', bg: 'rgba(192,132,252,0.12)' },
}

const fade = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.42, delay: i * 0.065, ease: EASE },
})

export default function ClientDashboardPage() {
  const { user } = useAuth()
  const [leads, setLeads]     = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.leads.list({}) as Lead[]
      setLeads(data)
    } catch {
      setLeads([])
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const prenom = user?.nom?.split(' ')[0] ?? 'Client'

  const hasQuote  = leads.filter(l => ['devis_genere', 'devis_envoye', 'relance_1', 'relance_2', 'accepte'].includes(l.statut))
  const accepted  = leads.filter(l => l.statut === 'accepte')
  const inProcess = leads.filter(l => !['accepte', 'refuse', 'cloture'].includes(l.statut))

  const sortedLeads = [...leads].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <motion.div {...fade(0)} className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(14,165,233,0.1)', color: '#38BDF8', border: '1px solid rgba(14,165,233,0.2)' }}
            >
              Espace client
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">Bonjour, {prenom}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Vos demandes de transport de groupe
          </p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="flex items-center justify-center w-9 h-9 rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} style={{ color: 'rgba(255,255,255,0.4)' }} />
          </button>
          <Link
            href="/devis"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:brightness-105"
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
          { label: 'Acceptés',    value: accepted.length, Icon: CheckCircle, color: '#4ADE80', bg: 'rgba(74,222,128,0.1)'  },
        ].map(({ label, value, Icon, color, bg }, i) => (
          <motion.div
            key={label}
            {...fade(i + 1)}
            className="rounded-2xl p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.018) 100%)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
            }}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="text-2xl font-bold text-white mb-0.5">
              {loading ? <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span> : value}
            </div>
            <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.32)' }}>{label}</div>
          </motion.div>
        ))}
      </div>

      {/* En cours banner */}
      {!loading && inProcess.length > 0 && (
        <motion.div
          {...fade(4)}
          className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
          style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)' }}
        >
          <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#38BDF8' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: '#7DD3FC' }}>
              {inProcess.length} dossier{inProcess.length > 1 ? 's' : ''} en cours de traitement
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(125,211,252,0.5)' }}>
              L&apos;équipe NeoTravel traite votre demande. Vous recevrez un email dès qu&apos;un devis sera prêt.
            </p>
          </div>
        </motion.div>
      )}

      {/* Devis prêts */}
      {!loading && hasQuote.length > 0 && (
        <motion.div
          {...fade(5)}
          className="flex items-center gap-4 p-4 rounded-2xl"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(245,158,11,0.12)' }}
          >
            <AlertCircle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              {hasQuote.length > 1 ? `${hasQuote.length} devis ont été préparés` : 'Un devis a été préparé'} pour vous
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Consultez le lien de suivi de votre dossier pour voir les détails.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 flex-shrink-0 text-amber-400/60" />
        </motion.div>
      )}

      {/* Liste demandes */}
      <motion.div {...fade(6)}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white">Vos demandes</span>
        </div>

        {loading && (
          <div className="py-12 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 animate-spin" style={{ color: 'rgba(255,255,255,0.2)' }} />
          </div>
        )}

        {!loading && leads.length === 0 && (
          <div
            className="py-16 text-center rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <MapPin className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>
            <h3 className="text-white font-semibold mb-1.5">Aucune demande pour le moment</h3>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Faites votre première demande de transport de groupe.
            </p>
            <Link
              href="/devis"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              style={{
                background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
                color: '#030D20',
                boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
              }}
            >
              <PlusCircle className="w-4 h-4" />
              Faire une demande
            </Link>
          </div>
        )}

        {!loading && sortedLeads.length > 0 && (
          <div className="space-y-2.5">
            {sortedLeads.map((lead, i) => {
              const st = STATUS_STYLE[lead.statut] ?? { color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' }
              const clientLabel = LEAD_STATUS_LABELS_CLIENT[lead.statut] ?? lead.statut
              return (
                <motion.div
                  key={lead._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.04, duration: 0.35, ease: EASE }}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-colors hover:bg-white/[0.02]"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.18)' }}
                  >
                    <MapPin className="w-4 h-4" style={{ color: '#60A5FA' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white truncate">
                        {lead.depart} → {lead.destination}
                      </span>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {clientLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {lead.nb_passagers} passager{lead.nb_passagers > 1 ? 's' : ''}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.18)' }}>·</span>
                      <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {lead.trackingToken && (
                    <Link
                      href={`/suivi/${lead.trackingToken}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all hover:opacity-80"
                      style={{
                        background: 'rgba(96,165,250,0.1)',
                        color: '#60A5FA',
                        border: '1px solid rgba(96,165,250,0.2)',
                      }}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Suivre
                    </Link>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
