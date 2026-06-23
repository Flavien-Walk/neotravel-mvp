'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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
  role: 'commercial' | 'client'
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
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]   = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const storedUser  = localStorage.getItem('neo_user')
      const storedToken = localStorage.getItem('neo_token')
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser))
        setToken(storedToken)
      }
    } catch {}
    setLoading(false)
  }, [])

  function persist(u: AuthUser, t: string) {
    setUser(u)
    setToken(t)
    localStorage.setItem('neo_user', JSON.stringify(u))
    localStorage.setItem('neo_token', t)
  }

  async function login(email: string, password: string): Promise<{ error?: string }> {
    try {
      const res  = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { error: data.message ?? 'Identifiants incorrects.' }
      persist(data.user, data.token)
      return {}
    } catch {
      return { error: 'Serveur inaccessible. Réessayez dans quelques instants.' }
    }
  }

  async function register(form: RegisterData): Promise<{ error?: string }> {
    try {
      const res  = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) return { error: data.message ?? 'Erreur lors de la création du compte.' }
      persist(data.user, data.token)
      return {}
    } catch {
      return { error: 'Serveur inaccessible. Réessayez dans quelques instants.' }
    }
  }

  function updateUser(updates: Partial<AuthUser>) {
    if (!user) return
    const updated = { ...user, ...updates }
    setUser(updated)
    localStorage.setItem('neo_user', JSON.stringify(updated))
  }

  function logout() {
    setUser(null)
    setToken(null)
    localStorage.removeItem('neo_user')
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
