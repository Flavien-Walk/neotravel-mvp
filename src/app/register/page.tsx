'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, UserPlus } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import Logo from '@/components/brand/Logo'

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ nom: '', email: '', password: '', organisation: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string, val: string) {
    setForm(f => ({ ...f, [field]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom || !form.email || !form.password) {
      setError('Remplissez les champs obligatoires.')
      return
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit comporter au moins 8 caractères.')
      return
    }
    setLoading(true)
    setError('')
    const res = await register(form)
    setLoading(false)
    if (res.error) { setError(res.error); return }
    router.replace('/client')
  }

  return (
    <div className="min-h-screen bg-neo-900 flex flex-col items-center justify-center px-4 py-12">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(37,99,235,0.12) 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <Link href="/"><Logo size="md" /></Link>
        </div>

        <div className="card-premium !p-8">
          <h1 className="text-xl font-bold text-white mb-1">Créer un compte client</h1>
          <p className="text-white/40 text-sm mb-7">
            Suivez vos demandes de devis transport de groupe.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Nom complet *</label>
                <input type="text" className="input" placeholder="Jean Dupont"
                  value={form.nom} onChange={e => set('nom', e.target.value)} />
              </div>
              <div>
                <label className="label">Organisation</label>
                <input type="text" className="input" placeholder="Mairie de Lyon…"
                  value={form.organisation} onChange={e => set('organisation', e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" placeholder="vous@organisation.fr"
                value={form.email} onChange={e => set('email', e.target.value)} autoComplete="email" />
            </div>

            <div>
              <label className="label">Mot de passe * (8 caractères min.)</label>
              <input type="password" className="input" placeholder="••••••••"
                value={form.password} onChange={e => set('password', e.target.value)} autoComplete="new-password" />
            </div>

            {error && (
              <p className="text-red-400 text-sm flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Créer mon compte
            </button>
          </form>

          <p className="text-center text-white/30 text-xs mt-6">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-neo-blue hover:underline">Se connecter</Link>
          </p>

          <p className="text-center text-white/20 text-[11px] mt-4">
            Compte commercial NeoTravel ?{' '}
            <Link href="/login" className="text-white/30 hover:text-white/50">Contactez votre administrateur</Link>
          </p>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          <Link href="/" className="hover:text-white/40 transition-colors">← Retour à l&apos;accueil</Link>
        </p>
      </div>
    </div>
  )
}
