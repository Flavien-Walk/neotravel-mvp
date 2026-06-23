'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  PlusCircle, RefreshCw, AlertTriangle, ExternalLink, CheckCircle,
  Clock, FileText, Euro,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Lead, LEAD_STATUS_LABELS_CLIENT, LEAD_STATUS_COLORS } from '@/types'
import { useAuth } from '@/context/AuthContext'

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
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">Bonjour, {prenom}</h1>
          <p className="text-white/35 text-sm mt-0.5">Vos demandes de transport de groupe</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/devis" className="btn-gold !px-4 !py-2 !text-sm gap-2">
            <PlusCircle className="w-3.5 h-3.5" />
            Nouvelle demande
          </Link>
          <button onClick={fetchLeads} disabled={loading} className="btn-ghost !px-3 !py-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Demandes',      value: leads.length,      icon: FileText,    color: 'text-blue-400',  bg: 'bg-blue-500/10'  },
          { label: 'Devis reçus',   value: hasQuote.length,   icon: Euro,        color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Acceptés',      value: accepted.length,   icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
        ].map(({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="card-neo !p-4"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bg} mb-2.5`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-[11px] text-white/35 mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* En cours */}
      {!loading && inProcess.length > 0 && (
        <div className="mb-4 px-4 py-3 rounded-2xl bg-blue-500/8 border border-blue-500/15">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300 font-medium">
              {inProcess.length} dossier{inProcess.length > 1 ? 's' : ''} en cours de traitement
            </span>
          </div>
        </div>
      )}

      {/* Liste des demandes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white">Vos demandes</span>
        </div>

        {loading && (
          <div className="py-12 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 animate-spin text-white/20" />
          </div>
        )}

        {!loading && leads.length === 0 && (
          <div className="py-16 text-center">
            <AlertTriangle className="w-8 h-8 text-white/15 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-1">Aucune demande pour l&apos;instant</h3>
            <p className="text-white/30 text-sm mb-6">Créez votre première demande de transport de groupe.</p>
            <Link href="/devis" className="btn-gold gap-2">
              <PlusCircle className="w-4 h-4" />
              Faire une demande
            </Link>
          </div>
        )}

        {!loading && sortedLeads.length > 0 && (
          <div className="rounded-2xl overflow-hidden border border-white/7">
            <div
              className="grid grid-cols-12 gap-2 px-5 py-3 text-[11px] text-white/30 uppercase tracking-wider"
              style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="col-span-4">Trajet</span>
              <span className="col-span-2 hidden sm:block">Passagers</span>
              <span className="col-span-3">Statut</span>
              <span className="col-span-3 text-right">Date</span>
            </div>

            {sortedLeads.map((lead, i) => (
              <div
                key={lead._id}
                className="grid grid-cols-12 gap-2 px-5 py-4 items-center text-sm transition-colors hover:bg-white/2"
                style={{ borderBottom: i < sortedLeads.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined }}
              >
                <div className="col-span-4">
                  <div className="text-white font-medium text-[13px] truncate">{lead.depart} → {lead.destination}</div>
                  <div className="text-white/30 text-[11px]">{lead.type_trajet.replace(/_/g, ' ')}</div>
                </div>
                <div className="col-span-2 hidden sm:block text-white/45 text-[13px]">
                  {lead.nb_passagers} pax
                </div>
                <div className="col-span-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${LEAD_STATUS_COLORS[lead.statut]}`}>
                    {LEAD_STATUS_LABELS_CLIENT[lead.statut]}
                  </span>
                </div>
                <div className="col-span-3 flex items-center justify-end gap-2">
                  <span className="text-white/25 text-[11px] hidden sm:block">
                    {new Date(lead.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </span>
                  {lead.trackingToken && (
                    <Link
                      href={`/suivi/${lead.trackingToken}`}
                      className="p-1.5 rounded-lg text-white/25 hover:text-neo-blue hover:bg-neo-blue/10 transition-all"
                      title="Suivre ce dossier"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CTA pour leads avec devis prêt */}
      {hasQuote.length > 0 && (
        <div className="mt-6 p-5 rounded-2xl bg-amber-500/8 border border-amber-500/15">
          <div className="flex items-center gap-3">
            <Euro className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <div className="text-white text-sm font-semibold">
                {hasQuote.length > 1 ? `${hasQuote.length} devis ont été` : 'Un devis a été'} envoyé{hasQuote.length > 1 ? 's' : ''} ou préparés pour vous.
              </div>
              <div className="text-white/45 text-xs mt-0.5">
                Consultez le suivi de votre dossier pour voir les détails du devis.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
