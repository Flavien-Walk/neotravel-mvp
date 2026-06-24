'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Users, Clock, CheckCircle, TrendingUp, RefreshCw,
  Send, ArrowRight, AlertCircle, BarChart3,
  UserCheck, MapPin, ArrowUpRight, Activity,
  ChevronRight, AlertTriangle,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Lead, LeadStatus } from '@/types'
import { useAuth } from '@/context/AuthContext'

const PIPELINE_STAGES: { label: string; statuts: LeadStatus[]; color: string; lightBg: string }[] = [
  { label: 'Nouveau',    statuts: ['nouveau'],                         color: '#7C3AED', lightBg: '#F5F3FF' },
  { label: 'Qualifié',  statuts: ['qualifie', 'incomplet'],           color: '#2563EB', lightBg: '#EFF6FF' },
  { label: 'Devis prêt',statuts: ['devis_genere'],                    color: '#D97706', lightBg: '#FFFBEB' },
  { label: 'Envoyé',    statuts: ['devis_envoye'],                    color: '#0284C7', lightBg: '#F0F9FF' },
  { label: 'Relance',   statuts: ['relance_1', 'relance_2'],          color: '#EA580C', lightBg: '#FFF7ED' },
  { label: 'Accepté',   statuts: ['accepte'],                         color: '#16A34A', lightBg: '#F0FDF4' },
  { label: 'Reprise',   statuts: ['reprise_humaine', 'cas_complexe'], color: '#DC2626', lightBg: '#FEF2F2' },
]

const STATUS_DOT: Record<string, string> = {
  nouveau: '#7C3AED', incomplet: '#D97706', qualifie: '#2563EB',
  devis_genere: '#D97706', devis_envoye: '#0284C7',
  relance_1: '#EA580C', relance_2: '#DC2626',
  accepte: '#16A34A', refuse: '#94A3B8',
  cas_complexe: '#DB2777', reprise_humaine: '#DC2626', cloture: '#94A3B8',
}

const STATUS_LABEL: Record<string, string> = {
  nouveau: 'Nouveau', incomplet: 'Incomplet', qualifie: 'Qualifié',
  devis_genere: 'Devis prêt', devis_envoye: 'Envoyé',
  relance_1: 'Relance 1', relance_2: 'Relance 2',
  accepte: 'Accepté', refuse: 'Refusé',
  cas_complexe: 'Cas complexe', reprise_humaine: 'Reprise humaine', cloture: 'Clôturé',
}

function StatusChip({ statut }: { statut: string }) {
  const color = STATUS_DOT[statut] ?? '#94A3B8'
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium"
      style={{
        background: color + '14',
        color,
        border: `1px solid ${color}28`,
      }}
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
  label, value, sub, icon: Icon, accent, loading,
}: {
  label: string; value: number | string; sub?: string;
  icon: typeof BarChart3; accent: string; loading: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4 transition-all duration-150 hover:-translate-y-px"
      style={{
        background: 'var(--dash-surface)',
        border: '1px solid var(--dash-border)',
        boxShadow: 'var(--dash-shadow)',
        borderTop: `3px solid ${accent}`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: accent + '14' }}
        >
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
      </div>
      {loading ? (
        <div className="h-7 w-12 rounded-md animate-pulse" style={{ background: 'var(--dash-border)' }} />
      ) : (
        <div className="text-2xl font-bold" style={{ color: 'var(--dash-text)' }}>{value}</div>
      )}
      <div className="mt-0.5 text-xs" style={{ color: 'var(--dash-text-muted)' }}>{label}</div>
      {sub && <div className="mt-1 text-[10px]" style={{ color: 'var(--dash-text-faint)' }}>{sub}</div>}
    </div>
  )
}

function ActionCard({
  label, count, desc, color, lightBg, href, cta,
  loading,
}: {
  label: string; count: number; desc: string; color: string; lightBg: string;
  href: string; cta: string; loading: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl p-5 flex flex-col gap-3 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
      style={{
        background: 'var(--dash-surface)',
        border: `1px solid var(--dash-border)`,
        boxShadow: 'var(--dash-shadow)',
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div>
        {loading ? (
          <div className="h-9 w-8 rounded-md animate-pulse mb-1" style={{ background: 'var(--dash-border)' }} />
        ) : (
          <div className="text-3xl font-bold leading-none" style={{ color }}>{count}</div>
        )}
        <div className="font-semibold text-sm mt-1" style={{ color: 'var(--dash-text)' }}>{label}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--dash-text-muted)' }}>{desc}</div>
      </div>
      <div
        className="flex items-center gap-1 text-xs font-medium mt-auto transition-all group-hover:gap-2"
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

  /* ── computed stats ── */
  const total    = leads.length
  const enCours  = leads.filter(l => !['accepte','refuse','cloture'].includes(l.statut)).length
  const devisEnv = leads.filter(l => ['devis_envoye','relance_1','relance_2'].includes(l.statut)).length
  const acceptes = leads.filter(l => l.statut === 'accepte').length
  const taux     = total > 0 ? Math.round((acceptes / total) * 100) : 0

  const aEnvoyer      = leads.filter(l => l.statut === 'devis_genere').length
  const aRelancer     = leads.filter(l => ['relance_1','relance_2'].includes(l.statut)).length
  const repriseHumaine = leads.filter(l => ['reprise_humaine','cas_complexe'].includes(l.statut)).length

  const urgents = leads
    .filter(l => l.urgence !== 'normal' && !['accepte','refuse','cloture'].includes(l.statut))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  const recent = leads
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bonne après-midi' : 'Bonsoir'
  const firstName = user?.nom?.split(' ')[0] ?? 'Commercial'

  return (
    <div className="p-6 lg:p-8 min-h-full" style={{ background: 'var(--dash-bg)' }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--dash-text)' }}>
            {greeting}, {firstName}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--dash-text-muted)' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            {(aEnvoyer + aRelancer + repriseHumaine) > 0 && (
              <span className="ml-2 font-medium" style={{ color: '#DC2626' }}>
                — {aEnvoyer + aRelancer + repriseHumaine} action{(aEnvoyer + aRelancer + repriseHumaine) > 1 ? 's' : ''} en attente
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetch(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
          style={{
            background: 'var(--dash-surface)',
            border: '1px solid var(--dash-border)',
            color: 'var(--dash-text-muted)',
            boxShadow: 'var(--dash-shadow)',
          }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total leads"    value={total}    icon={Users}       accent="#2563EB" loading={loading} sub={`${enCours} actifs`} />
        <KPICard label="Devis envoyés"  value={devisEnv} icon={Send}        accent="#0284C7" loading={loading} sub="en attente réponse" />
        <KPICard label="Acceptés"       value={acceptes} icon={CheckCircle} accent="#16A34A" loading={loading} />
        <KPICard label="Taux conversion" value={`${taux}%`} icon={TrendingUp} accent="#7C3AED" loading={loading} sub={`sur ${total} leads`} />
      </div>

      {/* ── Action cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <ActionCard
          label="Devis à envoyer" count={aEnvoyer} loading={loading}
          desc="Devis calculés non encore transmis"
          color="#D97706" lightBg="#FFFBEB"
          href="/dashboard/leads?statut=devis_genere" cta="Traiter maintenant"
        />
        <ActionCard
          label="Relances à faire" count={aRelancer} loading={loading}
          desc="Clients sans réponse — 1re ou 2e relance"
          color="#EA580C" lightBg="#FFF7ED"
          href="/dashboard/leads?statut=relance_1" cta="Voir les leads"
        />
        <ActionCard
          label="Reprise humaine" count={repriseHumaine} loading={loading}
          desc="Cas complexes nécessitant votre attention"
          color="#DC2626" lightBg="#FEF2F2"
          href="/dashboard/leads?statut=reprise_humaine" cta="Traiter les cas"
        />
      </div>

      {/* ── Pipeline ── */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{
          background: 'var(--dash-surface)',
          border: '1px solid var(--dash-border)',
          boxShadow: 'var(--dash-shadow)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold text-sm" style={{ color: 'var(--dash-text)' }}>Pipeline commercial</div>
          <Link
            href="/dashboard/leads"
            className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: '#2563EB' }}
          >
            Tous les leads <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {PIPELINE_STAGES.map(({ label, statuts, color, lightBg }) => {
            const count = leads.filter(l => statuts.includes(l.statut)).length
            return (
              <div key={label} className="flex flex-col items-center gap-1.5 text-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-transform hover:scale-105 cursor-default"
                  style={{
                    background: count > 0 ? color : 'var(--dash-muted)',
                    color: count > 0 ? '#fff' : 'var(--dash-text-faint)',
                  }}
                >
                  {loading ? '–' : count}
                </div>
                <div className="text-[10px] font-medium leading-tight" style={{ color: 'var(--dash-text-muted)' }}>
                  {label}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Bottom grid ── */}
      <div className="grid lg:grid-cols-[1fr_280px] gap-6">

        {/* Leads récents */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'var(--dash-surface)',
            border: '1px solid var(--dash-border)',
            boxShadow: 'var(--dash-shadow)',
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: '1px solid var(--dash-border)' }}
          >
            <div className="font-semibold text-sm" style={{ color: 'var(--dash-text)' }}>Leads récents</div>
            <Link
              href="/dashboard/leads"
              className="text-xs font-medium transition-colors hover:opacity-75"
              style={{ color: '#2563EB' }}
            >
              Voir tout <ChevronRight className="w-3 h-3 inline" />
            </Link>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'var(--dash-muted)' }} />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="p-10 text-center" style={{ color: 'var(--dash-text-faint)' }}>
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun lead pour l&apos;instant</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--dash-border)' }}>
                  {['Client', 'Trajet', 'Statut', 'Urgence', ''].map(h => (
                    <th
                      key={h}
                      className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--dash-text-faint)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map(lead => (
                  <tr
                    key={lead._id}
                    className="group transition-colors"
                    style={{ borderBottom: '1px solid var(--dash-border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--dash-muted)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium" style={{ color: 'var(--dash-text)' }}>{lead.nom}</div>
                      {lead.societe && (
                        <div className="text-[11px]" style={{ color: 'var(--dash-text-faint)' }}>{lead.societe}</div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--dash-text-muted)' }}>
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate max-w-[120px]">{lead.depart} → {lead.destination}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <StatusChip statut={lead.statut} />
                    </td>
                    <td className="px-5 py-3">
                      <UrgencyChip urgence={lead.urgence} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/dashboard/leads/${lead._id}`}
                        className="opacity-0 group-hover:opacity-100 flex items-center justify-end gap-1 text-xs font-medium transition-all"
                        style={{ color: '#2563EB' }}
                      >
                        Ouvrir <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pilotage column */}
        <div className="flex flex-col gap-4">

          {/* Urgents */}
          {urgents.length > 0 && (
            <div
              className="rounded-xl p-4"
              style={{
                background: 'var(--dash-surface)',
                border: '1px solid #FED7AA',
                boxShadow: 'var(--dash-shadow)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>
                  Urgents ({urgents.length})
                </span>
              </div>
              <div className="space-y-2">
                {urgents.map(l => (
                  <Link
                    key={l._id}
                    href={`/dashboard/leads/${l._id}`}
                    className="flex items-center justify-between p-2 rounded-lg transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/10"
                  >
                    <div>
                      <div className="text-xs font-medium" style={{ color: 'var(--dash-text)' }}>{l.nom}</div>
                      <div className="text-[10px]" style={{ color: 'var(--dash-text-faint)' }}>
                        {l.depart} → {l.destination}
                      </div>
                    </div>
                    <UrgencyChip urgence={l.urgence} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick stats */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'var(--dash-surface)',
              border: '1px solid var(--dash-border)',
              boxShadow: 'var(--dash-shadow)',
            }}
          >
            <div className="text-sm font-semibold mb-3" style={{ color: 'var(--dash-text)' }}>
              Activité
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Leads actifs',     value: enCours,  icon: Activity,   color: '#2563EB' },
                { label: 'Devis en attente', value: devisEnv, icon: Clock,      color: '#0284C7' },
                { label: 'Taux conversion',  value: `${taux}%`, icon: TrendingUp, color: '#16A34A' },
                { label: 'Reprise humaine',  value: repriseHumaine, icon: UserCheck, color: '#DC2626' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: color + '14' }}>
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                  <span className="flex-1 text-xs" style={{ color: 'var(--dash-text-muted)' }}>{label}</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--dash-text)' }}>
                    {loading ? '–' : value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Garanties */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'var(--dash-surface)',
              border: '1px solid var(--dash-border)',
              boxShadow: 'var(--dash-shadow)',
            }}
          >
            <div className="text-sm font-semibold mb-3" style={{ color: 'var(--dash-text)' }}>Garanties NeoTravel</div>
            <div className="space-y-1.5">
              {[
                'Calcul 100% traçable',
                'Prix déterministe + auditable',
                'Reprise humaine systématique si cas complexe',
                'Devis valable 30 jours',
              ].map(g => (
                <div key={g} className="flex items-start gap-2 text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>
                  <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0 text-green-500" />
                  {g}
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/dashboard/settings"
            className="flex items-center justify-between p-3 rounded-xl transition-all hover:-translate-y-px"
            style={{
              background: 'var(--dash-surface)',
              border: '1px solid var(--dash-border)',
              boxShadow: 'var(--dash-shadow)',
            }}
          >
            <div>
              <div className="text-xs font-semibold" style={{ color: 'var(--dash-text)' }}>Paramètres calcul</div>
              <div className="text-[10px]" style={{ color: 'var(--dash-text-faint)' }}>Carburant, marges, TVA…</div>
            </div>
            <ArrowRight className="w-4 h-4" style={{ color: 'var(--dash-text-faint)' }} />
          </Link>
        </div>
      </div>
    </div>
  )
}
