'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Log } from '@/types'
import { RefreshCw, ScrollText, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const DOT: Record<string, string> = {
  success: 'bg-green-400',
  error:   'bg-red-400',
  info:    'bg-blue-400',
  warning: 'bg-amber-400',
}
const TEXT: Record<string, string> = {
  success: 'text-green-400',
  error:   'text-red-400',
  info:    'text-blue-400',
  warning: 'text-amber-400',
}

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
    <div className="p-6 sm:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">Logs système</h1>
          <p className="text-white/35 text-sm mt-0.5">Historique complet de toutes les actions</p>
        </div>
        <button onClick={fetchLogs} disabled={loading} className="btn-ghost !px-3 !py-2 gap-2 text-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div
          className="grid grid-cols-12 gap-2 px-5 py-3 text-[11px] text-white/30 uppercase tracking-wider"
          style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="col-span-1">Status</span>
          <span className="col-span-4">Message</span>
          <span className="col-span-3 hidden sm:block">Action</span>
          <span className="col-span-2 hidden md:block">Lead ID</span>
          <span className="col-span-2 text-right">Horodatage</span>
        </div>

        {loading && (
          <div className="px-5 py-12 text-center">
            <RefreshCw className="w-5 h-5 animate-spin text-white/30 mx-auto mb-2" />
            <p className="text-white/30 text-sm">Chargement des logs…</p>
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className="px-5 py-12 text-center">
            <ScrollText className="w-8 h-8 text-white/15 mx-auto mb-3" />
            <p className="text-white/30 text-sm">Aucun log enregistré.</p>
          </div>
        )}

        {!loading && logs.map((log, i) => (
          <div
            key={log._id}
            className="grid grid-cols-12 gap-2 px-5 py-3 items-start text-sm"
            style={{ borderBottom: i < logs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined }}
          >
            <div className="col-span-1 flex items-center pt-0.5">
              <div className={`w-2 h-2 rounded-full ${DOT[log.status] ?? 'bg-white/20'}`} />
            </div>
            <div className="col-span-4 text-white/70 text-[12px] leading-relaxed">{log.message}</div>
            <div className="col-span-3 hidden sm:block">
              <span className={`font-mono text-[11px] ${TEXT[log.status] ?? 'text-white/30'}`}>{log.action}</span>
            </div>
            <div className="col-span-2 hidden md:block">
              {log.leadId ? (
                <Link
                  href={`/dashboard/leads/${log.leadId}`}
                  className="flex items-center gap-1 text-[11px] text-neo-blue hover:underline font-mono"
                >
                  {log.leadId.slice(-6)}
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              ) : (
                <span className="text-white/20 text-[11px]">—</span>
              )}
            </div>
            <div className="col-span-2 text-right text-white/25 font-mono text-[11px]">
              {new Date(log.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
