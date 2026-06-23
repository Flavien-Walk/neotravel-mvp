const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erreur réseau' }))
    throw new Error(err.message || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
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
  },

  logs: {
    list: (leadId?: string) => {
      const qs = leadId ? `?leadId=${leadId}` : ''
      return request(`/api/logs${qs}`)
    },

    create: (data: unknown) =>
      request('/api/logs', { method: 'POST', body: JSON.stringify(data) }),
  },

  health: () => request('/health'),
}
