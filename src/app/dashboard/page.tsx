'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Users, RefreshCw, Send, ArrowRight,
  UserCheck, ArrowUpRight,
  ChevronRight, Zap, FileText, ShieldCheck, Bell,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Lead, LeadStatus } from '@/types'
import { useAuth } from '@/context/AuthContext'

const PIPELINE_STAGES: { label: string; statuts: LeadStatus[]; color: string; short: string }[] = [
  { label: 'Nouveau',    statuts: ['nouveau'],                                        color: '#7C3AED', short: 'N' },
  { label: 'Qualifié',  statuts: ['qualifie', 'incomplet'],                          color: '#2563EB', short: 'Q' },
  { label: 'À valider', statuts: ['en_attente_validation', 'devis_valide'],           color: '#9333EA', short: 'V' },
  { label: 'Envoyé',    statuts: ['devis_envoye'],                                    color: '#0284C7', short: 'E' },
  { label: 'Relance',   statuts: ['relance_1', 'relance_2'],                         color: '#EA580C', short: 'R' },
  { label: 'Accepté',   statuts: ['accepte'],                                        color: '#16A34A', short: 'A' },
  { label: 'Reprise',   statuts: ['reprise_humaine', 'cas_complexe', 'erreur_envoi'], color: '#DC2626', short: '!' },
]

const STATUS_DOT: Record<string, string> = {
  nouveau: '#7C3AED', incomplet: '#D97706', qualifie: '#2563EB',
  devis_genere: '#D97706',
  en_attente_validation: '#9333EA', devis_valide: '#059669',
  devis_envoye: '#0284C7',
  relance_1: '#EA580C', relance_2: '#DC2626',
  accepte: '#16A34A', refuse: '#94A3B8',
  erreur_envoi: '#DC2626',
  cas_complexe: '#DB2777', reprise_humaine: '#DC2626', cloture: '#94A3B8',
}

const STATUS_LABEL: Record<string, string> = {
  nouveau: 'Nouveau', incomplet: 'Incomplet', qualifie: 'Qualifié',
  devis_genere: 'Devis prêt',
  en_attente_validation: 'À valider', devis_valide: 'Validé',
  devis_envoye: 'Envoyé',
  relance_1: 'Relance 1', relance_2: 'Relance 2',
  accepte: 'Accepté', refuse: 'Refusé',
  erreur_envoi: 'Erreur envoi',
  cas_complexe: 'Cas complexe', reprise_humaine: 'Reprise humaine', cloture: 'Clôturé',
}

function StatusChip({ statut }: { statut: string }) {
  const color = STATUS_DOT[statut] ?? '#94A3B8'
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ background: color + '14', color, border: `1px solid ${color}28` }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
      {STATUS_LABEL[statut] ?? statut}
    </span>
  )
}

function UrgencyChip({ urgence }: { urgence: string }) {
  const map: Record<string, { label: string; color: string }> = {
    normal:      { label: 'Normal',      color: '#64748B' },
    urgent:      { label: 'Urgent',      color: '#EA580C' },
    tres_urgent: { label: 'Très urgent', color: '#DC2626' },
  }
  const { label, color } = map[urgence] ?? map.normal
  if (urgence === 'normal') return null
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
      style={{ background: color + '14', color, border: `1px solid ${color}28` }}
    >
      {label}
    </span>
  )
}

function KPICard({
  label, value, sub, accent, loading, trend,
}: {
  label: string; value: number | string; sub?: string; trend?: string;
  accent: string; loading: boolean;
}) {
  return (
    <div className="rounded-xl p-4 bg-white dark:bg-[#0F1B2D] border border-slate-200 dark:border-white/8 shadow-sm">
      {loading ? (
        <div className="h-7 w-12 rounded-md animate-pulse bg-slate-100 dark:bg-white/5" />
      ) : (
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{value}</div>
          {trend && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400">
              {trend}
            </span>
          )}
        </div>
      )}
      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{label}</div>
      {sub && (
        <div className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">{sub}</div>
      )}
      <div className="mt-2 h-0.5 rounded-full" style={{ background: accent + '30' }}>
        <div className="h-full w-full rounded-full" style={{ background: accent }} />
      </div>
    </div>
  )
}

function ActionCard({
  label, count, desc, color, href, cta, loading,
}: {
  label: string; count: number; desc: string; color: string;
  href: string; cta: string; loading: boolean; icon: typeof Zap;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl p-4 flex flex-col gap-2 bg-white dark:bg-[#0F1B2D] border border-slate-200 dark:border-white/8 shadow-sm hover:shadow-md transition-shadow"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div>
        {loading ? (
          <div className="h-7 w-8 rounded animate-pulse bg-slate-100 dark:bg-white/5 mb-1" />
        ) : (
          <div
            className="text-xl font-bold font-mono"
            style={{ color: count > 0 ? color : '#94A3B8' }}
          >
            {count}
          </div>
        )}
        <div className="font-medium text-sm text-slate-900 dark:text-white mt-0.5">{label}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</div>
      </div>
      <div
        className="flex items-center gap-1 text-xs font-medium mt-auto pt-2 border-t border-slate-100 dark:border-white/5 transition-all group-hover:gap-2"
        style={{ color }}
      >
        {cta}
        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [leads, setLeads]     = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRef]  = useState(false)

  const fetch = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true); else setRef(true)
    try {
      const data = await api.leads.list() as Lead[]
      setLeads(Array.isArray(data) ? data : [])
    } catch { /* ignore */ }
    finally { setLoading(false); setRef(false) }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const total        = leads.length
  const enCours      = leads.filter(l => !['accepte','refuse','cloture'].includes(l.statut)).length
  const devisEnv     = leads.filter(l => ['devis_envoye','relance_1','relance_2'].includes(l.statut)).length
  const acceptes     = leads.filter(l => l.statut === 'accepte').length
  const taux         = total > 0 ? Math.round((acceptes / total) * 100) : 0

  const aValider       = leads.filter(l => ['en_attente_validation', 'devis_valide'].includes(l.statut)).length
  const aEnvoyer       = leads.filter(l => l.statut === 'devis_genere').length
  const aRelancer      = leads.filter(l => ['relance_1','relance_2'].includes(l.statut)).length
  const repriseHumaine = leads.filter(l => ['reprise_humaine','cas_complexe','erreur_envoi'].includes(l.statut)).length
  const autoEnvoyes    = leads.filter(l => l.statut === 'devis_envoye').length
  const enRelance1     = leads.filter(l => l.statut === 'relance_1').length
  const enRelance2     = leads.filter(l => l.statut === 'relance_2').length
  const devisCalcules  = leads.filter(l => ['en_attente_validation','devis_valide','devis_genere','devis_envoye','relance_1','relance_2','accepte'].includes(l.statut)).length
  const emailsEnvoyes  = leads.filter(l => ['devis_envoye','relance_1','relance_2','accepte'].includes(l.statut)).length

  const urgents = leads
    .filter(l => l.urgence !== 'normal' && !['accepte','refuse','cloture'].includes(l.statut))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4)

  const recent = leads
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)

  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bonne après-midi' : 'Bonsoir'
  const firstName = user?.nom?.split(' ')[0] ?? 'Commercial'

  const totalActions = aValider + aEnvoyer + aRelancer + repriseHumaine

  return (
    <div className="p-6 lg:p-8 min-h-full bg-slate-50 dark:bg-[#07111F]">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            {greeting}, {firstName}
          </h1>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {totalActions > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20">
                {totalActions} action{totalActions > 1 ? 's' : ''} requise{totalActions > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => fetch(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <KPICard
          label="Total leads"
          value={total}
          accent="#2563EB"
          loading={loading}
          sub={`${enCours} actif${enCours > 1 ? 's' : ''}`}
        />
        <KPICard
          label="Devis envoyés"
          value={devisEnv}
          accent="#0284C7"
          loading={loading}
          sub={`${autoEnvoyes} automatiquement`}
        />
        <KPICard
          label="Acceptés"
          value={acceptes}
          accent="#16A34A"
          loading={loading}
          sub="dossiers signés"
          trend={total > 0 ? `${taux}%` : undefined}
        />
        <KPICard
          label="Taux conversion"
          value={`${taux}%`}
          accent="#7C3AED"
          loading={loading}
          sub={`sur ${total} leads total`}
        />
      </div>

      {/* ── Action cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <ActionCard
          label="Devis à valider"
          count={aValider}
          loading={loading}
          desc="Calculés — validation humaine requise avant envoi"
          color="#9333EA"
          href="/dashboard/leads?statut=en_attente_validation"
          cta="Valider maintenant"
          icon={ShieldCheck}
        />
        <ActionCard
          label="En cours de relance"
          count={aRelancer}
          loading={loading}
          desc={`${enRelance1} relance 1 · ${enRelance2} relance 2 — auto par n8n`}
          color="#EA580C"
          href="/dashboard/leads?statut=relance_1"
          cta="Voir les leads"
          icon={Bell}
        />
        <ActionCard
          label="Reprise humaine"
          count={repriseHumaine}
          loading={loading}
          desc="Cas complexes ou erreurs d'envoi"
          color="#DC2626"
          href="/dashboard/leads?statut=reprise_humaine"
          cta="Traiter les cas"
          icon={UserCheck}
        />
      </div>

      {/* ── Pipeline ── */}
      <div className="rounded-xl p-5 mb-5 bg-white dark:bg-[#0F1B2D] border border-slate-200 dark:border-white/8 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-slate-900 dark:text-white">Pipeline commercial</div>
          <Link
            href="/dashboard/leads"
            className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:opacity-80"
          >
            Tous les leads <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {PIPELINE_STAGES.map(({ label, statuts, color }) => {
            const count = leads.filter(l => statuts.includes(l.statut)).length
            const active = count > 0
            return (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: active ? color : undefined,
                    color: active ? '#fff' : '#94A3B8',
                    border: active ? 'none' : '2px solid #E2E8F0',
                  }}
                >
                  {loading ? '–' : (active ? count : '·')}
                </div>
                <div className={`text-[10px] leading-tight ${active ? 'font-medium text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
                  {label}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Bottom grid ── */}
      <div className="grid lg:grid-cols-[1fr_260px] gap-5">

        {/* Leads récents */}
        <div className="rounded-xl overflow-hidden bg-white dark:bg-[#0F1B2D] border border-slate-200 dark:border-white/8 shadow-sm">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-white/5">
            <div className="text-sm font-medium text-slate-900 dark:text-white">Leads récents</div>
            <Link
              href="/dashboard/leads"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:opacity-75"
            >
              Voir tout <ChevronRight className="w-3 h-3 inline" />
            </Link>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg animate-pulse bg-slate-50 dark:bg-white/3" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-slate-400">Aucun lead pour l&apos;instant</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5">
                  {['Client', 'Trajet', 'Statut', 'Urgence', ''].map(h => (
                    <th key={h} className="px-5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map(lead => (
                  <tr
                    key={lead._id}
                    className="group border-b border-slate-50 dark:border-white/3 last:border-0 hover:bg-slate-50 dark:hover:bg-white/3 transition-colors"
                  >
                    <td className="px-5 py-2.5">
                      <div className="font-medium text-[13px] text-slate-800 dark:text-slate-100">{lead.nom}</div>
                      {lead.societe && (
                        <div className="text-[11px] text-slate-400">{lead.societe}</div>
                      )}
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        {lead.depart} → {lead.destination}
                      </span>
                    </td>
                    <td className="px-5 py-2.5">
                      <StatusChip statut={lead.statut} />
                    </td>
                    <td className="px-5 py-2.5">
                      <UrgencyChip urgence={lead.urgence} />
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <Link
                        href={`/dashboard/leads/${lead._id}`}
                        className="opacity-0 group-hover:opacity-100 text-xs font-medium text-blue-600 dark:text-blue-400 transition-opacity"
                      >
                        Ouvrir →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-3">

          {/* Activité */}
          <div className="rounded-xl p-4 bg-white dark:bg-[#0F1B2D] border border-slate-200 dark:border-white/8 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
              Activité
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Dossiers actifs',   value: enCours,        color: '#2563EB' },
                { label: 'À valider',          value: aEnvoyer,       color: '#D97706' },
                { label: 'Relance 1',          value: leads.filter(l => l.statut === 'relance_1').length, color: '#EA580C' },
                { label: 'Relance 2',          value: leads.filter(l => l.statut === 'relance_2').length, color: '#DC2626' },
                { label: 'Taux de conversion', value: `${taux}%`,     color: '#16A34A' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{label}</span>
                  <span
                    className="text-xs font-mono font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      color,
                      background: typeof value === 'number' && value > 0 ? color + '10' : undefined,
                    }}
                  >
                    {loading ? '–' : value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Urgents */}
          {urgents.length > 0 && (
            <div className="rounded-xl p-4 bg-white dark:bg-[#0F1B2D] border border-orange-200 dark:border-orange-500/20 shadow-sm">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 mb-2">
                Urgents · {urgents.length}
              </div>
              <div className="space-y-1.5">
                {urgents.map(l => (
                  <Link
                    key={l._id}
                    href={`/dashboard/leads/${l._id}`}
                    className="flex items-center justify-between py-1.5 hover:opacity-75 transition-opacity"
                  >
                    <div>
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-100">{l.nom}</div>
                      <div className="text-[10px] text-slate-400">{l.depart} → {l.destination}</div>
                    </div>
                    <UrgencyChip urgence={l.urgence} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
