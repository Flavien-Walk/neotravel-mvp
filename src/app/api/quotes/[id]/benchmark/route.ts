import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

const BACKEND_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

// ─── Auth guard ───────────────────────────────────────────────────────────────
// Valide le token JWT via le backend Express et vérifie le rôle
async function requireStaff(req: NextRequest): Promise<{ id: string; nom: string; role: string } | null> {
  const auth = req.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: auth },
    })
    if (!res.ok) return null
    const user = await res.json()
    if (user.role !== 'admin' && user.role !== 'commercial') return null
    return user
  } catch {
    return null
  }
}

// ─── GET /api/quotes/[id]/benchmark ──────────────────────────────────────────
// Retourne le dernier benchmark calculé pour ce devis
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireStaff(req)
    if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

    const { data, error } = await getSupabaseAdmin()
      .from('market_benchmarks')
      .select('*')
      .eq('quote_id', params.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[benchmark:GET]', error)
      return NextResponse.json({ message: 'Erreur base de données' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur serveur'
    console.error('[benchmark:GET] uncaught:', msg)
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}

// ─── POST /api/quotes/[id]/benchmark ─────────────────────────────────────────
// Déclenche le calcul d'un benchmark marché à partir de l'historique interne
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
  const user = await requireStaff(req)
  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 })

  // Récupère le devis et son lead pour connaître le trajet
  const { data: quote, error: qErr } = await getSupabaseAdmin()
    .from('quotes')
    .select('id, lead_id, prix_ht, prix_ttc, statut_devis, leads(depart, destination, type_trajet, nb_passagers)')
    .eq('id', params.id)
    .single()

  if (qErr || !quote) {
    return NextResponse.json({ message: 'Devis introuvable' }, { status: 404 })
  }

  const leadsRaw = quote.leads as unknown
  const leadArr  = Array.isArray(leadsRaw) ? leadsRaw : leadsRaw ? [leadsRaw] : []
  const lead     = (leadArr[0] ?? null) as { depart: string; destination: string; type_trajet: string; nb_passagers: number } | null
  if (!lead) {
    return NextResponse.json({ message: 'Lead associé introuvable' }, { status: 404 })
  }

  const { depart, destination, type_trajet, nb_passagers } = lead

  // ── Requête historique interne ─────────────────────────────────────────────
  // Cherche les devis approuvés/envoyés sur un trajet similaire (même OD, même type)
  // dans les 12 derniers mois, avec ±30 % de passagers pour plus de pertinence
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  const passengerMin = Math.floor(nb_passagers * 0.7)
  const passengerMax = Math.ceil(nb_passagers * 1.3)

  const { data: historique, error: hErr } = await getSupabaseAdmin()
    .from('quotes')
    .select('prix_final_ht, prix_ht, leads!inner(depart, destination, type_trajet, nb_passagers)')
    .in('statut_devis', ['approved', 'sent'])
    .neq('id', params.id)
    .gte('created_at', twelveMonthsAgo.toISOString())
    .filter('leads.depart', 'ilike', `%${depart.split(' ')[0]}%`)
    .filter('leads.destination', 'ilike', `%${destination.split(' ')[0]}%`)
    .filter('leads.type_trajet', 'eq', type_trajet)
    .filter('leads.nb_passagers', 'gte', passengerMin)
    .filter('leads.nb_passagers', 'lte', passengerMax)
    .order('created_at', { ascending: false })
    .limit(50)

  if (hErr) console.warn('[benchmark:POST] historique query warning:', hErr)

  const prices: number[] = (historique ?? [])
    .map((q: { prix_final_ht?: number; prix_ht?: number }) =>
      typeof q.prix_final_ht === 'number' && q.prix_final_ht > 0 ? q.prix_final_ht : q.prix_ht
    )
    .filter((p): p is number => typeof p === 'number' && p > 0)
    .sort((a, b) => a - b)

  const nbTrajets = prices.length

  let status: 'ready' | 'insufficient_data' = 'insufficient_data'
  let prix_bas: number | null = null
  let prix_median: number | null = null
  let prix_haut: number | null = null
  let justification: string
  let sources: string[]

  if (nbTrajets >= 3) {
    prix_bas    = Math.round(prices[0])
    prix_haut   = Math.round(prices[prices.length - 1])
    const mid   = Math.floor(prices.length / 2)
    prix_median = prices.length % 2 === 0
      ? Math.round((prices[mid - 1] + prices[mid]) / 2)
      : Math.round(prices[mid])
    status      = 'ready'
    sources     = ['Historique interne NeoTravel']
    justification = `Basé sur ${nbTrajets} devis validé${nbTrajets > 1 ? 's' : ''} pour un trajet similaire (${depart} → ${destination}, ${type_trajet}, ±30 % passagers) sur les 12 derniers mois.`
  } else {
    sources     = ['Historique interne insuffisant']
    justification = `Seulement ${nbTrajets} devis similaire${nbTrajets > 1 ? 's' : ''} trouvé${nbTrajets > 1 ? 's' : ''} (minimum 3 requis). Élargissez la recherche manuellement ou attendez plus d'historique.`
  }

  // ── Upsert du benchmark ────────────────────────────────────────────────────
  const { data: saved, error: saveErr } = await getSupabaseAdmin()
    .from('market_benchmarks')
    .insert({
      quote_id:              params.id,
      lead_id:               quote.lead_id,
      depart,
      destination,
      type_trajet,
      nb_passagers,
      prix_bas,
      prix_median,
      prix_haut,
      sources,
      justification,
      nb_trajets_similaires: nbTrajets,
      status,
      requested_by:          user.nom,
    })
    .select()
    .single()

  if (saveErr || !saved) {
    console.error('[benchmark:POST] save error:', saveErr)
    return NextResponse.json({ message: 'Erreur lors de la sauvegarde du benchmark' }, { status: 500 })
  }

  // Log de l'action pour l'audit trail
  await getSupabaseAdmin().from('logs').insert({
    action:  'benchmark_requested',
    lead_id: quote.lead_id,
    status:  'info',
    message: `Benchmark marché demandé par ${user.nom} pour le devis ${params.id} — ${nbTrajets} trajets similaires trouvés`,
    payload: { quote_id: params.id, nb_trajets_similaires: nbTrajets, status, requested_by: user.nom },
  })

  return NextResponse.json(saved, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur serveur'
    console.error('[benchmark:POST] uncaught:', msg)
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
