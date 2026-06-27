'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'

export interface AuthUser {
  id: string
  nom: string
  email: string
  role: 'admin' | 'commercial' | 'client'
  organisation?: string
}

interface RegisterData {
  nom: string
  email: string
  password: string
  organisation?: string
}

interface AuthState {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login:      (email: string, password: string) => Promise<{ error?: string }>
  register:   (data: RegisterData)              => Promise<{ error?: string }>
  logout:     () => void
  updateUser: (updates: Partial<AuthUser>)      => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]   = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Listen to Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await hydrateUser(session.user.id, session.user.email ?? '', session.access_token)
      } else {
        setUser(null)
        setToken(null)
      }
      setLoading(false)
    })

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await hydrateUser(session.user.id, session.user.email ?? '', session.access_token)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function hydrateUser(id: string, email: string, accessToken: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('nom, role, organisation')
      .eq('id', id)
      .single()

    const authUser: AuthUser = {
      id,
      email,
      nom:          profile?.nom ?? email,
      role:         (profile?.role as AuthUser['role']) ?? 'client',
      organisation: profile?.organisation ?? undefined,
    }
    setUser(authUser)
    setToken(accessToken)
    localStorage.setItem('neo_token', accessToken)
  }

  async function login(email: string, password: string): Promise<{ error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error || !data.user) return { error: error?.message ?? 'Identifiants incorrects.' }
      if (data.session) {
        await hydrateUser(data.user.id, data.user.email ?? '', data.session.access_token)
        if (user?.role === 'client') {
          try { await api.leads.claimByEmail() } catch {}
        }
      }
      return {}
    } catch {
      return { error: 'Serveur inaccessible. Réessayez dans quelques instants.' }
    }
  }

  async function register(form: RegisterData): Promise<{ error?: string }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email:    form.email,
        password: form.password,
        options:  { data: { nom: form.nom, organisation: form.organisation ?? null, role: 'client' } },
      })
      if (error || !data.user) return { error: error?.message ?? 'Erreur lors de la création du compte.' }

      // Upsert profile (trigger may handle this, but ensure it exists)
      await supabase.from('profiles').upsert({
        id:           data.user.id,
        nom:          form.nom,
        role:         'client',
        organisation: form.organisation ?? null,
      })

      if (data.session) {
        await hydrateUser(data.user.id, data.user.email ?? '', data.session.access_token)
        try { await api.leads.claimByEmail() } catch {}
      }
      return {}
    } catch {
      return { error: 'Serveur inaccessible. Réessayez dans quelques instants.' }
    }
  }

  function updateUser(updates: Partial<AuthUser>) {
    if (!user) return
    const updated = { ...user, ...updates }
    setUser(updated)
  }

  async function logout() {
    await supabase.auth.signOut()
    setUser(null)
    setToken(null)
    localStorage.removeItem('neo_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
