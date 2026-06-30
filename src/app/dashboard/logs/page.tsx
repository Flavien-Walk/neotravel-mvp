'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Log } from '@/types'
import { RefreshCw, ScrollText, ExternalLink } from 'lucide-react'
import Link from 'next/link'


export default function DashboardLogsPage() {
  const [logs, setLogs]       = useState<Log[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchLogs() {
    setLoading(true)
    try {
      const data = await api.logs.list() as Log[]
      setLogs(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
    } catch { setLogs([]) }
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [])

  return (
    <div className="p-6 sm:p-8" style={{ background: 'var(--dash-bg)', minHeight: '100vh' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--dash-text)' }}>Logs système</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--dash-text-muted)' }}>Historique complet de toutes les actions</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
          style={{
            background: 'var(--dash-surface)',
            border: '1px solid var(--dash-border)',
            color: 'var(--dash-text-muted)',
            boxShadow: 'var(--dash-shadow)',
          }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'var(--dash-surface)',
          border: '1px solid var(--dash-border)',
          boxShadow: 'var(--dash-shadow)',
        }}
      >
        <div
          className="grid grid-cols-12 gap-2 px-5 py-3 text-[11px] uppercase tracking-wider"
          style={{ background: 'var(--dash-muted)', borderBottom: '1px solid var(--dash-border)', color: 'var(--dash-text-faint)' }}
        >
          <span className="col-span-1">Status</span>
          <span className="col-span-4">Message</span>
          <span className="col-span-3 hidden sm:block">Action</span>
          <span className="col-span-2 hidden md:block">Lead ID</span>
          <span className="col-span-2 text-right">Horodatage</span>
        </div>

        {loading && (
          <div className="px-5 py-12 text-center">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" style={{ color: 'var(--dash-text-faint)' }} />
            <p className="text-sm" style={{ color: 'var(--dash-text-faint)' }}>Chargement des logs…</p>
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className="px-5 py-12 text-center">
            <ScrollText className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--dash-text-faint)', opacity: 0.4 }} />
            <p className="text-sm" style={{ color: 'var(--dash-text-faint)' }}>Aucun log enregistré.</p>
          </div>
        )}

        {!loading && logs.map((log, i) => {
          const dotColor: Record<string, string> = { success: '#22C55E', error: '#EF4444', info: '#3B82F6', warning: '#F59E0B' }
          const actionColor = dotColor[log.status] ?? 'var(--dash-text-faint)'
          return (
            <div
              key={log._id}
              className="grid grid-cols-12 gap-2 px-5 py-3 items-start text-sm"
              style={{ borderBottom: i < logs.length - 1 ? '1px solid var(--dash-border)' : undefined }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--dash-muted)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div className="col-span-1 flex items-center pt-0.5">
                <div className="w-2 h-2 rounded-full" style={{ background: dotColor[log.status] ?? 'var(--dash-text-faint)' }} />
              </div>
              <div className="col-span-4 text-[12px] leading-relaxed" style={{ color: 'var(--dash-text)' }}>{log.message}</div>
              <div className="col-span-3 hidden sm:block">
                <span className="font-mono text-[11px]" style={{ color: actionColor }}>{log.action}</span>
              </div>
              <div className="col-span-2 hidden md:block">
                {log.leadId ? (
                  <Link
                    href={`/dashboard/leads/${log.leadId}`}
                    className="flex items-center gap-1 text-[11px] hover:underline font-mono"
                    style={{ color: '#2563EB' }}
                  >
                    {log.leadId.slice(-6)}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                ) : (
                  <span className="text-[11px]" style={{ color: 'var(--dash-text-faint)' }}>—</span>
                )}
              </div>
              <div className="col-span-2 text-right font-mono text-[11px]" style={{ color: 'var(--dash-text-faint)' }}>
                {new Date(log.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
