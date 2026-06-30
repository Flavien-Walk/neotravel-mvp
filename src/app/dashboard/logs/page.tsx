'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Log } from '@/types'
import { RefreshCw, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const DOT_BG: Record<string, string> = {
  success: '#22C55E',
  error:   '#EF4444',
  info:    '#3B82F6',
  warning: '#F59E0B',
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
    <div className="p-6 sm:p-8 min-h-full bg-slate-50 dark:bg-[#07111F]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Logs</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Journal d&apos;activité du système</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      <div className="bg-white dark:bg-[#0F1B2D] border border-slate-200 dark:border-white/8 rounded-xl overflow-hidden shadow-sm">
        {/* Header */}
        <div className="grid grid-cols-[28px_1fr_140px_90px_100px] gap-2 px-4 py-2.5 bg-slate-50 dark:bg-[#111827] border-b border-slate-200 dark:border-white/8 text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
          <span></span>
          <span>Message</span>
          <span className="hidden sm:block">Action</span>
          <span className="hidden md:block">Lead</span>
          <span className="text-right">Date</span>
        </div>

        {loading && (
          <div className="px-4 py-16 text-center">
            <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-slate-400" />
            <p className="text-sm text-slate-400">Chargement…</p>
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className="px-4 py-16 text-center">
            <p className="text-sm text-slate-400">Aucun log enregistré.</p>
          </div>
        )}

        {!loading && logs.map((log, i) => (
          <div
            key={log._id}
            className={`grid grid-cols-[28px_1fr_140px_90px_100px] gap-2 px-4 py-3 items-center text-[13px] hover:bg-slate-50 dark:hover:bg-white/3 transition-colors ${
              i < logs.length - 1 ? 'border-b border-slate-100 dark:border-white/5' : ''
            }`}
          >
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full" style={{ background: DOT_BG[log.status] ?? '#94A3B8' }} />
            </div>
            <div className="text-slate-700 dark:text-slate-200 truncate">{log.message}</div>
            <div className="hidden sm:block">
              <span
                className="font-mono text-[11px] font-medium"
                style={{ color: DOT_BG[log.status] ?? '#64748B' }}
              >
                {log.action}
              </span>
            </div>
            <div className="hidden md:block">
              {log.leadId ? (
                <Link
                  href={`/dashboard/leads/${log.leadId}`}
                  className="flex items-center gap-1 text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {log.leadId.slice(-6)}
                  <ExternalLink className="w-2.5 h-2.5" />
                </Link>
              ) : (
                <span className="text-[11px] text-slate-300 dark:text-slate-600">—</span>
              )}
            </div>
            <div className="text-right font-mono text-[11px] text-slate-400 dark:text-slate-500">
              {new Date(log.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
