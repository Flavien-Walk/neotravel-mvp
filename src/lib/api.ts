const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('neo_token')
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string> ?? {}),
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erreur réseau' }))
    throw new Error(err.message || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  auth: {
    me: () => request<{ id: string; nom: string; email: string; role: string }>('/api/auth/me'),
    updateProfile: (data: { nom?: string; email?: string; organisation?: string }) =>
      request('/api/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      request('/api/auth/password', { method: 'PATCH', body: JSON.stringify(data) }),
    forgotPassword: (email: string) =>
      request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token: string, password: string) =>
      request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
  },

  leads: {
    create: (data: unknown) =>
      request('/api/leads', { method: 'POST', body: JSON.stringify(data) }),

    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request(`/api/leads${qs}`)
    },

    get: (id: string) => request(`/api/leads/${id}`),

    updateStatus: (id: string, statut: string) =>
      request(`/api/leads/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ statut }),
      }),
  },

  quotes: {
    calculate: (data: unknown) =>
      request('/api/quotes/calculate', { method: 'POST', body: JSON.stringify(data) }),

    send: (id: string) =>
      request(`/api/quotes/${id}/send`, { method: 'POST' }),

    remind: (id: string) =>
      request(`/api/quotes/${id}/remind`, { method: 'POST' }),
  },

  chat: {
    message: (message: string, currentFields: Record<string, unknown> = {}) =>
      request('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({ message, currentFields }),
      }),
  },

  logs: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request(`/api/logs${qs}`)
    },

    create: (data: unknown) =>
      request('/api/logs', { method: 'POST', body: JSON.stringify(data) }),
  },

  health: () => request('/health'),

  admin: {
    testEmail: () => request('/api/admin/test-email', { method: 'POST' }),
  },
}
