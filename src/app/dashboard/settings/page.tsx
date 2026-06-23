'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { User, Shield, Bell, LogOut, Activity, CheckCircle2, XCircle, Loader2, Mail, Bot } from 'lucide-react'
import { api } from '@/lib/api'

type TestStatus = 'idle' | 'loading' | 'success' | 'error'

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ok ? 'bg-green-400' : 'bg-red-400'}`} />
  )
}

export default function DashboardSettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [emailStatus, setEmailStatus] = useState<TestStatus>('idle')
  const [emailMsg, setEmailMsg]       = useState('')
  const [llmStatus, setLlmStatus]     = useState<TestStatus>('idle')
  const [llmMsg, setLlmMsg]           = useState('')
  const [healthStatus, setHealthStatus] = useState<TestStatus>('idle')
  const [health, setHealth]             = useState<Record<string, unknown> | null>(null)

  async function testHealth() {
    setHealthStatus('loading')
    try {
      const res = await api.health() as Record<string, unknown>
      setHealth(res)
      setHealthStatus('success')
    } catch {
      setHealth(null)
      setHealthStatus('error')
    }
  }

  async function testEmail() {
    setEmailStatus('loading')
    setEmailMsg('')
    try {
      await api.admin.testEmail()
      setEmailStatus('success')
      setEmailMsg('Email de test envoyé avec succès.')
    } catch (e: unknown) {
      setEmailStatus('error')
      setEmailMsg(e instanceof Error ? e.message : 'Échec de l\'envoi.')
    }
  }

  async function testLlm() {
    setLlmStatus('loading')
    setLlmMsg('')
    try {
      const res = await api.chat.message('ping — réponds juste "ok"', {}) as { reply?: string }
      setLlmStatus('success')
      setLlmMsg(`Réponse LLM reçue : "${res?.reply?.slice(0, 80) ?? 'ok'}"`)
    } catch (e: unknown) {
      setLlmStatus('error')
      setLlmMsg(e instanceof Error ? e.message : 'Échec de la connexion LLM.')
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">Paramètres</h1>
        <p className="text-white/35 text-sm mt-0.5">Compte, sécurité et diagnostic système</p>
      </div>

      {/* Profil */}
      <div className="card-neo mb-5">
        <div className="flex items-center gap-3 mb-5">
          <User className="w-4 h-4 text-neo-blue" />
          <h2 className="font-semibold text-white">Profil utilisateur</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Nom</label>
            <div className="input bg-white/3 cursor-not-allowed text-white/60">{user?.nom ?? '—'}</div>
          </div>
          <div>
            <label className="label">Email</label>
            <div className="input bg-white/3 cursor-not-allowed text-white/60">{user?.email ?? '—'}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Rôle</label>
              <div className="input bg-white/3 cursor-not-allowed text-white/60 capitalize">{user?.role ?? '—'}</div>
            </div>
            <div>
              <label className="label">Organisation</label>
              <div className="input bg-white/3 cursor-not-allowed text-white/60">{user?.organisation ?? 'NeoTravel'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sécurité */}
      <div className="card-neo mb-5">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-4 h-4 text-green-400" />
          <h2 className="font-semibold text-white">Sécurité</h2>
        </div>
        <div className="space-y-3 text-sm text-white/45">
          <div className="flex items-center justify-between py-2 border-b border-white/6">
            <span>Mot de passe</span>
            <span className="text-white/25">••••••••</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-white/6">
            <span>Authentification</span>
            <span className="text-green-400 text-xs">JWT — Bearer token</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>Session</span>
            <span className="text-white/30 text-xs font-mono">
              {user?.id?.slice(-8) ?? '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Santé système */}
      <div className="card-neo mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-neo-blue" />
            <h2 className="font-semibold text-white">Santé du système</h2>
          </div>
          <button
            onClick={testHealth}
            disabled={healthStatus === 'loading'}
            className="btn-ghost !px-3 !py-1.5 text-xs gap-1.5"
          >
            {healthStatus === 'loading'
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Vérification…</>
              : 'Vérifier'}
          </button>
        </div>

        {health && healthStatus === 'success' && (
          <div className="space-y-2 mb-3">
            {[
              { label: 'Backend API', ok: true },
              { label: `Email (${String(health.email_provider ?? 'brevo')})`, ok: health.email_provider != null },
              { label: `LLM (${String(health.llm_provider ?? 'anthropic')})`, ok: health.llm_provider != null },
              { label: 'Base de données MongoDB', ok: true },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center justify-between text-sm py-1.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2.5 text-white/60">
                  <StatusDot ok={ok} />
                  {label}
                </div>
                {ok
                  ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  : <XCircle className="w-3.5 h-3.5 text-red-400" />}
              </div>
            ))}
          </div>
        )}

        {healthStatus === 'error' && (
          <p className="text-red-400 text-xs mb-3">Backend inaccessible. Vérifiez la variable NEXT_PUBLIC_API_URL.</p>
        )}

        {healthStatus === 'idle' && (
          <p className="text-white/30 text-xs">Cliquez sur &quot;Vérifier&quot; pour tester la connexion avec le backend.</p>
        )}
      </div>

      {/* Tests */}
      <div className="card-neo mb-5">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-4 h-4 text-amber-400" />
          <h2 className="font-semibold text-white">Tests de configuration</h2>
        </div>

        <div className="space-y-4">
          {/* Test email Brevo */}
          <div className="rounded-xl border border-white/8 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">Email Brevo</span>
              </div>
              <button
                onClick={testEmail}
                disabled={emailStatus === 'loading'}
                className="btn-ghost !px-3 !py-1.5 text-xs gap-1.5"
              >
                {emailStatus === 'loading'
                  ? <><Loader2 className="w-3 h-3 animate-spin" /> Envoi…</>
                  : 'Tester'}
              </button>
            </div>
            {emailStatus === 'success' && <p className="text-green-400 text-xs">{emailMsg}</p>}
            {emailStatus === 'error'   && <p className="text-red-400 text-xs">{emailMsg}</p>}
            {emailStatus === 'idle'    && <p className="text-white/30 text-xs">Envoie un email de test au destinataire configuré dans Brevo.</p>}
          </div>

          {/* Test LLM */}
          <div className="rounded-xl border border-white/8 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-white">LLM (Claude / OpenAI fallback)</span>
              </div>
              <button
                onClick={testLlm}
                disabled={llmStatus === 'loading'}
                className="btn-ghost !px-3 !py-1.5 text-xs gap-1.5"
              >
                {llmStatus === 'loading'
                  ? <><Loader2 className="w-3 h-3 animate-spin" /> Test…</>
                  : 'Tester'}
              </button>
            </div>
            {llmStatus === 'success' && <p className="text-green-400 text-xs">{llmMsg}</p>}
            {llmStatus === 'error'   && <p className="text-red-400 text-xs">{llmMsg}</p>}
            {llmStatus === 'idle'    && <p className="text-white/30 text-xs">Envoie un ping au LLM configuré et vérifie la réponse.</p>}
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={() => { logout(); router.push('/') }}
        className="btn-danger flex items-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Se déconnecter
      </button>
    </div>
  )
}
