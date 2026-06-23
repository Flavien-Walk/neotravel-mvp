'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, LogIn } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Logo from '@/components/brand/Logo'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Remplissez tous les champs.'); return }
    setLoading(true)
    setError('')
    const res = await login(email, password)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    router.replace('/dashboard')
  }

  return (
    <div className="min-h-screen bg-neo-900 flex flex-col items-center justify-center px-4">
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(37,99,235,0.12) 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/"><Logo size="md" /></Link>
        </div>

        {/* Card */}
        <div className="card-premium !p-8">
          <h1 className="text-xl font-bold text-white mb-1">Connexion</h1>
          <p className="text-white/40 text-sm mb-7">
            Accédez à votre espace commercial NeoTravel.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="commercial@neotravel.fr"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label !mb-0">Mot de passe</label>
                <Link href="/forgot-password" className="text-xs text-white/30 hover:text-neo-blue transition-colors">
                  Mot de passe oublié ?
                </Link>
              </div>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              Se connecter
            </button>
          </form>

          <p className="text-center text-white/30 text-xs mt-6">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-neo-blue hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          <Link href="/" className="hover:text-white/40 transition-colors">← Retour à l&apos;accueil</Link>
        </p>
      </div>
    </div>
  )
}
