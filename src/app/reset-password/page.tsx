'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import Logo from '@/components/brand/Logo'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

function ResetForm() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token') ?? ''

  const [password,  setPassword]  = useState('')
  const [password2, setPassword2] = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== password2) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (!token) {
      setError('Lien invalide. Veuillez refaire une demande de réinitialisation.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message ?? 'Lien invalide ou expiré.')
      } else {
        setDone(true)
        setTimeout(() => router.push('/login'), 3000)
      }
    } catch {
      setError('Serveur inaccessible. Veuillez réessayer.')
    }
    setLoading(false)
  }

  if (!token) {
    return (
      <div className="card-neo text-center space-y-4">
        <p className="text-red-400 text-sm">Lien invalide ou expiré.</p>
        <Link href="/forgot-password" className="btn-ghost w-full block">
          Refaire une demande
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="card-neo text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-green-400/10 flex items-center justify-center mx-auto">
          <CheckCircle className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h2 className="text-white font-bold text-lg">Mot de passe mis à jour</h2>
          <p className="text-white/40 text-sm mt-1">Redirection vers la connexion…</p>
        </div>
        <Link href="/login" className="btn-primary w-full block">
          Se connecter maintenant
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card-neo space-y-4">
      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 rounded-lg px-4 py-3 border border-red-500/20">
          {error}
        </div>
      )}

      <div>
        <label className="label">Nouveau mot de passe</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            type={showPwd ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input pl-10 pr-10"
            placeholder="8 caractères minimum"
            required
            minLength={8}
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPwd(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60"
          >
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div>
        <label className="label">Confirmer le mot de passe</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          <input
            type={showPwd ? 'text' : 'password'}
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            className="input pl-10"
            placeholder="Répétez le mot de passe"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-neo-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-6"><Logo size="md" /></div>
          <h1 className="text-2xl font-bold text-white mb-2">Nouveau mot de passe</h1>
          <p className="text-white/40 text-sm">Choisissez un mot de passe sécurisé (8 caractères minimum).</p>
        </div>
        <Suspense fallback={<div className="card-neo h-40 animate-pulse" />}>
          <ResetForm />
        </Suspense>
        <div className="mt-5 text-center">
          <Link href="/login" className="text-sm text-white/35 hover:text-white transition-colors">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}
