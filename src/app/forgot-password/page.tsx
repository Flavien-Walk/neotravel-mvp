'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import Logo from '@/components/brand/Logo'

const API = process.env.NEXT_PUBLIC_API_URL ?? ''

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setSent(true)
      } else {
        const data = await res.json()
        setError(data.message ?? 'Une erreur est survenue.')
      }
    } catch {
      // Même réponse que succès pour éviter l'énumération
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-neo-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-6"><Logo size="md" /></div>
          {!sent ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Mot de passe oublié</h1>
              <p className="text-white/40 text-sm">
                Entrez votre adresse email. Si un compte existe, vous recevrez un lien de réinitialisation.
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-green-400/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Email envoyé</h1>
              <p className="text-white/40 text-sm">
                Si un compte existe pour <strong className="text-white/60">{email}</strong>,
                vous recevrez un email avec les instructions dans quelques minutes.
              </p>
            </>
          )}
        </div>

        {!sent && (
          <form onSubmit={handleSubmit} className="card-neo space-y-4">
            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 rounded-lg px-4 py-3 border border-red-500/20">
                {error}
              </div>
            )}
            <div>
              <label className="label">Adresse email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="vous@exemple.fr"
                  required
                  autoFocus
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
            </button>
          </form>
        )}

        {sent && (
          <div className="card-neo text-center">
            <Link href="/login" className="btn-ghost w-full">
              Retour à la connexion
            </Link>
          </div>
        )}

        <div className="mt-5 text-center">
          <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-white/35 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}
