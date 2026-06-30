'use client'

import { useState, useCallback } from 'react'
import { RefreshCw, TrendingUp, AlertTriangle, Info, BarChart2 } from 'lucide-react'
import type { MarketBenchmark } from '@/types'
import { api } from '@/lib/api'

interface Props {
  quoteId: string
  initial: MarketBenchmark | null
}

function fmt(n: number | null): string {
  if (n === null) return '—'
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

export default function MarketBenchmarkBlock({ quoteId, initial }: Props) {
  const [benchmark, setBenchmark] = useState<MarketBenchmark | null>(initial)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const requestBenchmark = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.quotes.benchmark.request(quoteId)
      setBenchmark(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [quoteId])

  const isReady = benchmark?.status === 'ready'
  const isInsufficient = benchmark?.status === 'insufficient_data'
  const collectDate = benchmark
    ? new Date(benchmark.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div
      style={{
        background: 'var(--dash-card-bg)',
        border: '1px solid var(--dash-border)',
        borderRadius: 12,
        padding: '20px 24px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--dash-info-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <BarChart2 size={16} style={{ color: 'var(--dash-info-text)' }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--dash-text)' }}>
              Référentiel marché
            </div>
            <div style={{ fontSize: 11, color: 'var(--dash-text-faint)', marginTop: 1 }}>
              Aide à la décision — usage commercial uniquement
            </div>
          </div>
        </div>

        <button
          onClick={requestBenchmark}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            background: 'var(--dash-muted)',
            color: 'var(--dash-text)',
            border: '1px solid var(--dash-border)',
            fontSize: 12, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--dash-border)' }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--dash-muted)' }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          {benchmark ? 'Actualiser' : 'Calculer'}
        </button>
      </div>

      {/* Disclaimer */}
      <div
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '8px 12px', borderRadius: 8, marginBottom: 16,
          background: 'var(--dash-warning-bg)',
          border: '1px solid var(--dash-warning-border)',
        }}
      >
        <AlertTriangle size={13} style={{ color: 'var(--dash-warning-text)', flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 11, color: 'var(--dash-warning-text)', margin: 0, lineHeight: 1.5 }}>
          <strong>Indicatif uniquement.</strong> Ce benchmark ne modifie pas le devis automatiquement.
          Toute modification de prix doit être saisie manuellement et justifiée.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: '10px 12px', borderRadius: 8, marginBottom: 12,
            background: 'var(--dash-danger-bg)',
            border: '1px solid var(--dash-danger-border)',
            color: 'var(--dash-danger-text)', fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      {/* Empty state */}
      {!benchmark && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--dash-text-faint)', fontSize: 13 }}>
          <TrendingUp size={28} style={{ marginBottom: 8, opacity: 0.3, display: 'block', margin: '0 auto 8px' }} />
          Cliquez sur "Calculer" pour obtenir les prix pratiqués sur des trajets similaires.
        </div>
      )}

      {/* Insufficient data */}
      {benchmark && isInsufficient && (
        <div
          style={{
            padding: '12px 16px', borderRadius: 8,
            background: 'var(--dash-muted)',
            border: '1px solid var(--dash-border)',
          }}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Info size={14} style={{ color: 'var(--dash-text-muted)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dash-text)', marginBottom: 4 }}>
                Historique insuffisant
              </div>
              <div style={{ fontSize: 12, color: 'var(--dash-text-muted)', lineHeight: 1.5 }}>
                {benchmark.justification}
              </div>
              {collectDate && (
                <div style={{ fontSize: 11, color: 'var(--dash-text-faint)', marginTop: 6 }}>
                  Vérifié le {collectDate} par {benchmark.requested_by ?? 'inconnu'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ready benchmark */}
      {benchmark && isReady && (
        <>
          {/* Price bars */}
          <div
            style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14,
            }}
          >
            {[
              { label: 'Prix bas', value: benchmark.prix_bas, color: 'var(--dash-success-text)', bg: 'var(--dash-success-bg)', border: 'var(--dash-success-border)' },
              { label: 'Prix médian', value: benchmark.prix_median, color: 'var(--dash-info-text)', bg: 'var(--dash-info-bg)', border: 'var(--dash-info-border)' },
              { label: 'Prix haut', value: benchmark.prix_haut, color: 'var(--dash-orange-text)', bg: 'var(--dash-orange-bg)', border: 'var(--dash-orange-border)' },
            ].map(({ label, value, color, bg, border }) => (
              <div
                key={label}
                style={{
                  background: bg, border: `1px solid ${border}`,
                  borderRadius: 10, padding: '12px 14px', textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, color, fontWeight: 500, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color }}>{fmt(value)}</div>
                <div style={{ fontSize: 10, color, opacity: 0.7, marginTop: 2 }}>HT</div>
              </div>
            ))}
          </div>

          {/* Meta infos */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            <span
              style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 6,
                background: 'var(--dash-selected-bg)', color: 'var(--dash-selected-text)',
                border: '1px solid var(--dash-selected-border)', fontWeight: 500,
              }}
            >
              {benchmark.nb_trajets_similaires} trajets similaires
            </span>
            {benchmark.sources.map(s => (
              <span
                key={s}
                style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 6,
                  background: 'var(--dash-muted)', color: 'var(--dash-text-muted)',
                  border: '1px solid var(--dash-border)',
                }}
              >
                {s}
              </span>
            ))}
          </div>

          {/* Justification */}
          {benchmark.justification && (
            <p style={{ fontSize: 11, color: 'var(--dash-text-faint)', lineHeight: 1.5, margin: '8px 0 0' }}>
              {benchmark.justification}
            </p>
          )}

          {/* Footer */}
          <div style={{ fontSize: 10, color: 'var(--dash-text-faint)', marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--dash-border)' }}>
            Collecté le {collectDate} · Demandé par {benchmark.requested_by ?? 'inconnu'}
          </div>
        </>
      )}
    </div>
  )
}
