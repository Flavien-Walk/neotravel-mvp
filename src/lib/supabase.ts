import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

// Lazy init — évite l'erreur "supabaseUrl is required" au moment du build
// quand les env vars ne sont pas encore chargées
export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client

  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

  if (!url || !key) {
    throw new Error('[Supabase] SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis')
  }

  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return _client
}
