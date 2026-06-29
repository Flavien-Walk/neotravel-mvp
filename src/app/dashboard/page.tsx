'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Users, Clock, CheckCircle, TrendingUp, RefreshCw,
  Send, ArrowRight, AlertCircle, BarChart3,
  UserCheck, MapPin, ArrowUpRight, Activity,
  ChevronRight, AlertTriangle, Zap, FileText,
  Mail, Bot, CircleDot, ShieldCheck, Bell,
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
  label, value, sub, icon: Icon, accent, loading, trend,
}: {
  label: string; value: number | string; sub?: string; trend?: string;
  icon: typeof BarChart3; accent: string; loading: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md group"
      style={{
        background: 'var(--dash-surface)',
        border: '1px solid var(--dash-border)',
        boxShadow: 'var(--dash-shadow)',
        borderTop: `3px solid ${accent}`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
          style={{ background: accent + '14' }}
        >
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        {trend && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ background: '#F0FDF4', color: '#16A34A' }}>
            {trend}
          </span>
        )}
      </div>
      {loading ? (
        <div className="h-7 w-12 rounded-md animate-pulse" style={{ background: 'var(--dash-border)' }} />
      ) : (
        <div className="text-2xl font-bold font-mono" style={{ color: 'var(--dash-text)' }}>{value}</div>
      )}
      <div className="mt-0.5 text-xs font-medium" style={{ color: 'var(--dash-text-muted)' }}>{label}</div>
      {sub && (
        <div className="mt-1 text-[10px]" style={{ color: 'var(--dash-text-faint)' }}>{sub}</div>
      )}
    </div>
  )
}

function ActionCard({
  label, count, desc, color, href, cta, loading, icon: Icon,
}: {
  label: string; count: number; desc: string; color: string;
  href: string; cta: string; loading: boolean; icon: typeof Zap;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl p-4 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        background: 'var(--dash-surface)',
        border: `1px solid var(--dash-border)`,
        boxShadow: 'var(--dash-shadow)',
        borderLeft: `4px solid ${color}`,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          {loading ? (
            <div className="h-8 w-8 rounded-md animate-pulse mb-1" style={{ background: 'var(--dash-border)' }} />
          ) : (
            <div className="flex items-center gap-2">
              <div
                className="text-2xl font-bold leading-none font-mono"
                style={{ color: count > 0 ? color : 'var(--dash-text-faint)' }}
              >
                {count}
              </div>
              {count > 0 && (
                <div
                  className="w-2 h-2 rounded-full animate-pulse mt-0.5"
                  style={{ background: color }}
                />
              )}
            </div>
          )}
          <div className="font-semibold text-sm mt-1" style={{ color: 'var(--dash-text)' }}>{label}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--dash-text-muted)' }}>{desc}</div>
        </div>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
          style={{ background: color + '12' }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <div
        className="flex items-center gap-1 text-xs font-semibold mt-auto transition-all group-hover:gap-2"
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
    <div className="p-6 lg:p-8 min-h-full" style={{ background: 'var(--dash-bg)' }}>

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--dash-text)' }}>
            {greeting}, {firstName}
          </h1>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-sm" style={{ color: 'var(--dash-text-muted)' }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {totalActions > 0 && (
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md"
                style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {totalActions} action{totalActions > 1 ? 's' : ''} requise{totalActions > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => fetch(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
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
        <KPICard
          label="Total leads"
          value={total}
          icon={Users}
          accent="#2563EB"
          loading={loading}
          sub={`${enCours} dossier${enCours > 1 ? 's' : ''} actif${enCours > 1 ? 's' : ''}`}
        />
        <KPICard
          label="Devis envoyés"
          value={devisEnv}
          icon={Send}
          accent="#0284C7"
          loading={loading}
          sub={`${autoEnvoyes} automatiquement`}
        />
        <KPICard
          label="Acceptés"
          value={acceptes}
          icon={CheckCircle}
          accent="#16A34A"
          loading={loading}
          sub="dossiers signés"
          trend={total > 0 ? `${taux}%` : undefined}
        />
        <KPICard
          label="Taux conversion"
          value={`${taux}%`}
          icon={TrendingUp}
          accent="#7C3AED"
          loading={loading}
          sub={`sur ${total} leads total`}
        />
      </div>

      {/* ── Action cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
      <div
        className="rounded-xl p-5 mb-6"
        style={{
          background: 'var(--dash-surface)',
          border: '1px solid var(--dash-border)',
          boxShadow: 'var(--dash-shadow)',
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="font-semibold text-sm" style={{ color: 'var(--dash-text)' }}>Pipeline commercial</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--dash-text-faint)' }}>
              {!loading && `${enCours} dossier${enCours > 1 ? 's' : ''} en cours`}
            </div>
          </div>
          <Link
            href="/dashboard/leads"
            className="flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
            style={{ color: '#2563EB' }}
          >
            Tous les leads <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Pipeline stages with connectors */}
        <div className="relative">
          {/* Connecting line */}
          <div
            className="absolute top-5 left-5 right-5 h-px hidden sm:block"
            style={{ background: 'var(--dash-border)' }}
          />
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 relative z-10">
            {PIPELINE_STAGES.map(({ label, statuts, color }, i) => {
              const count = leads.filter(l => statuts.includes(l.statut)).length
              const active = count > 0
              return (
                <div key={label} className="flex flex-col items-center gap-2 text-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 ${active ? 'shadow-sm' : ''}`}
                    style={{
                      background: active ? color : 'var(--dash-muted)',
                      color: active ? '#fff' : 'var(--dash-text-faint)',
                      border: active ? `2px solid ${color}` : '2px solid var(--dash-border)',
                      boxShadow: active ? `0 0 0 3px ${color}18` : undefined,
                    }}
                  >
                    {loading ? '–' : (active ? count : (i < 6 ? '·' : '·'))}
                  </div>
                  <div
                    className="text-[10px] font-medium leading-tight"
                    style={{ color: active ? 'var(--dash-text)' : 'var(--dash-text-faint)' }}
                  >
                    {label}
                  </div>
                </div>
              )
            })}
          </div>
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
            style={{ borderBottom: '1px solid var(--dash-border)', background: 'var(--dash-muted)' }}
          >
            <div className="font-semibold text-sm flex items-center gap-2" style={{ color: 'var(--dash-text)' }}>
              <Activity className="w-4 h-4" style={{ color: '#2563EB' }} />
              Leads récents
            </div>
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
            <div className="p-10 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: 'var(--dash-text-faint)' }} />
              <p className="text-sm" style={{ color: 'var(--dash-text-faint)' }}>Aucun lead pour l&apos;instant</p>
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
                      <div className="font-medium text-[13px]" style={{ color: 'var(--dash-text)' }}>{lead.nom}</div>
                      {lead.societe && (
                        <div className="text-[11px]" style={{ color: 'var(--dash-text-faint)' }}>{lead.societe}</div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--dash-text-muted)' }}>
                        <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: '#2563EB', opacity: 0.6 }} />
                        <span className="truncate max-w-[120px] font-medium">{lead.depart}</span>
                        <span style={{ color: 'var(--dash-text-faint)' }}>→</span>
                        <span className="truncate max-w-[80px]">{lead.destination}</span>
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
                boxShadow: '0 0 0 3px #FEF3C720',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#FEF3C7' }}>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--dash-text)' }}>
                  Urgents
                </span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ background: '#FEF3C7', color: '#D97706' }}
                >
                  {urgents.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {urgents.map(l => (
                  <Link
                    key={l._id}
                    href={`/dashboard/leads/${l._id}`}
                    className="flex items-center justify-between p-2.5 rounded-xl transition-all"
                    style={{ border: '1px solid transparent' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#FFFBEB'
                      e.currentTarget.style.borderColor = '#FDE68A'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.borderColor = 'transparent'
                    }}
                  >
                    <div>
                      <div className="text-xs font-semibold" style={{ color: 'var(--dash-text)' }}>{l.nom}</div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--dash-text-faint)' }}>
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
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--dash-text-faint)' }}>
              Activité
            </div>
            <div className="space-y-3">
              {[
                { label: 'Dossiers actifs',      value: enCours,         icon: Activity,    color: '#2563EB',  total: total },
                { label: 'À valider',             value: aValider,        icon: ShieldCheck, color: '#9333EA',  total: enCours || 1 },
                { label: 'Relance 1',             value: enRelance1,      icon: Bell,        color: '#EA580C',  total: enCours || 1 },
                { label: 'Relance 2',             value: enRelance2,      icon: AlertTriangle, color: '#DC2626', total: enCours || 1 },
                { label: 'Taux de conversion',    value: `${taux}%`,      icon: TrendingUp,  color: '#16A34A',  total: null },
              ].map(({ label, value, icon: Icon, color, total: t }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: color + '12' }}
                  >
                    <Icon className="w-3.5 h-3.5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>{label}</span>
                      <span className="text-[11px] font-semibold font-mono" style={{ color: 'var(--dash-text)' }}>
                        {loading ? '–' : value}
                      </span>
                    </div>
                    {t !== null && !loading && typeof value === 'number' && (
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--dash-border)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, t > 0 ? Math.round((value / t) * 100) : 0)}%`,
                            background: color,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Automatisation */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'var(--dash-surface)',
              border: '1px solid var(--dash-border)',
              boxShadow: 'var(--dash-shadow)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: '#EFF6FF' }}>
                <Bot className="w-3 h-3" style={{ color: '#2563EB' }} />
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--dash-text-faint)' }}>
                Automatisation
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Devis calculés',  value: devisCalcules,   icon: FileText, color: '#D97706' },
                { label: 'Emails envoyés',  value: emailsEnvoyes,   icon: Mail,     color: '#0284C7' },
                { label: 'Reprises humaines', value: repriseHumaine, icon: UserCheck, color: '#DC2626' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                    <span className="text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>{label}</span>
                  </div>
                  <span
                    className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md"
                    style={{
                      background: value > 0 ? color + '12' : 'var(--dash-muted)',
                      color: value > 0 ? color : 'var(--dash-text-faint)',
                    }}
                  >
                    {loading ? '–' : value}
                  </span>
                </div>
              ))}
            </div>
            {!loading && devisCalcules > 0 && (
              <div className="mt-3 pt-3 flex items-center gap-1.5 text-[10px]" style={{ borderTop: '1px solid var(--dash-border)', color: 'var(--dash-text-faint)' }}>
                <CircleDot className="w-3 h-3 flex-shrink-0" style={{ color: '#16A34A' }} />
                <span>
                  {Math.round((emailsEnvoyes / Math.max(devisCalcules, 1)) * 100)}% des devis envoyés automatiquement
                </span>
              </div>
            )}
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
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--dash-text-faint)' }}>
              Fiabilité NeoTravel
            </div>
            <div className="space-y-2">
              {[
                { label: 'Calcul 100% traçable',       color: '#16A34A' },
                { label: 'Prix déterministe + auditable', color: '#0284C7' },
                { label: 'Reprise humaine si cas complexe', color: '#D97706' },
                { label: 'Devis valable 30 jours',     color: '#7C3AED' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-start gap-2">
                  <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color }} />
                  <span className="text-[11px]" style={{ color: 'var(--dash-text-muted)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/dashboard/settings"
            className="group flex items-center justify-between p-3 rounded-xl transition-all hover:-translate-y-px"
            style={{
              background: 'var(--dash-surface)',
              border: '1px solid var(--dash-border)',
              boxShadow: 'var(--dash-shadow)',
            }}
          >
            <div>
              <div className="text-xs font-semibold" style={{ color: 'var(--dash-text)' }}>Paramètres</div>
              <div className="text-[10px]" style={{ color: 'var(--dash-text-faint)' }}>Profil, carburant, marges, TVA…</div>
            </div>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" style={{ color: 'var(--dash-text-faint)' }} />
          </Link>
        </div>
      </div>
    </div>
  )
}
