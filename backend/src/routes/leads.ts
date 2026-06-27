import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import { supabase } from '../lib/supabase'
import { requireAuth, AuthRequest } from '../middleware/requireAuth'
import { calculer_devis, DevisInput } from '../services/calculer_devis'
import {
  sendQuoteEmail,
  sendLeadReceivedEmail,
  sendNewLeadInternalEmail,
  sendComplexCaseEmail,
} from '../services/email/emailService'

const router = Router()

// ─── Helper: log ─────────────────────────────────────────────────────────────

async function addLog(
  action: string,
  status: string,
  message: string,
  leadId?: string,
  payload?: Record<string, unknown>,
) {
  await supabase.from('logs').insert({
    action,
    status,
    message,
    lead_id: leadId ?? null,
    payload: payload ?? null,
  }).catch(() => {})
}

// ─── Helper: compute completeness score ──────────────────────────────────────

function computeScore(lead: Record<string, unknown>): number {
  const champs = ['nom', 'email', 'telephone', 'depart', 'destination', 'date_depart', 'nb_passagers', 'type_trajet', 'urgence']
  const bonus  = ['societe', 'date_retour', 'commentaire']
  const base   = champs.filter(c => !!lead[c]).length / champs.length * 80
  const extra  = bonus.filter(c  => !!lead[c]).length / bonus.length  * 20
  return Math.round(base + extra)
}

// ─── GET /api/leads/track/:token — public ────────────────────────────────────

router.get('/track/:token', async (req: Request, res: Response) => {
  const { data: lead, error } = await supabase
    .from('leads')
    .select('id, nom, depart, destination, date_depart, date_retour, nb_passagers, type_trajet, statut, created_at, updated_at')
    .eq('tracking_token', req.params.token)
    .single()

  if (error || !lead) {
    res.status(404).json({ message: 'Demande introuvable. Vérifiez le lien reçu par email.' }); return
  }

  const { data: quote } = await supabase
    .from('quotes')
    .select('prix_ttc, prix_final_ttc, statut_devis, created_at, explication_calcul, warnings, besoin_reprise_humaine, email_sent_at, validite_jours')
    .eq('lead_id', lead.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const STATUS_LABELS: Record<string, string> = {
    nouveau: 'Demande reçue', incomplet: "En attente d'informations complémentaires",
    qualifie: 'Dossier qualifié', devis_genere: 'Devis en préparation',
    devis_envoye: 'Devis envoyé', relance_1: 'Relance envoyée',
    relance_2: 'Deuxième relance envoyée', accepte: 'Devis accepté',
    refuse: 'Devis refusé', cas_complexe: 'Reprise par un conseiller',
    reprise_humaine: 'Validation conseiller en cours', cloture: 'Dossier clôturé',
  }

  res.json({
    tracking:     true,
    statut:       lead.statut,
    statut_label: STATUS_LABELS[lead.statut] ?? lead.statut,
    trajet:       `${lead.depart} → ${lead.destination}`,
    date_depart:  lead.date_depart,
    date_retour:  lead.date_retour ?? null,
    nb_passagers: lead.nb_passagers,
    type_trajet:  lead.type_trajet,
    createdAt:    lead.created_at,
    updatedAt:    lead.updated_at,
    devis: quote ? {
      statut_devis:          quote.statut_devis,
      prix_ttc:              quote.prix_final_ttc || quote.prix_ttc,
      warnings:              quote.warnings,
      besoin_reprise_humaine: quote.besoin_reprise_humaine,
      email_sent_at:         quote.email_sent_at ?? null,
      validite_jours:        quote.validite_jours ?? 30,
      createdAt:             quote.created_at,
    } : null,
  })
})

// ─── GET /api/leads ───────────────────────────────────────────────────────────

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  let query = supabase.from('leads').select('*').order('created_at', { ascending: false })

  if (req.userRole === 'client') {
    query = query.eq('user_id', req.userId)
  }
  if (req.query.statut) {
    query = query.eq('statut', req.query.statut as string)
  }

  const { data, error } = await query
  if (error) { res.status(500).json({ message: error.message }); return }

  res.json(data)
})

// ─── GET /api/leads/:id ───────────────────────────────────────────────────────

router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { data: lead, error } = await supabase.from('leads').select('*').eq('id', req.params.id).single()
  if (error || !lead) { res.status(404).json({ message: 'Lead introuvable' }); return }

  if (req.userRole === 'client' && lead.user_id !== req.userId) {
    res.status(403).json({ message: 'Accès refusé.' }); return
  }

  const { data: quote } = await supabase.from('quotes').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false }).limit(1).single()
  res.json({ ...lead, quote: quote ?? null })
})

// ─── POST /api/leads ──────────────────────────────────────────────────────────

router.post('/', async (req: AuthRequest, res: Response) => {
  const body = { ...req.body }

  // Attach userId if token present
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    const { data } = await supabase.auth.getUser(authHeader.slice(7))
    if (data?.user) body.userId = data.user.id
  }

  const score = computeScore(body)
  const statut = score < 60 ? 'incomplet' : 'nouveau'

  const leadPayload = {
    nom:             body.nom,
    societe:         body.societe ?? null,
    email:           (body.email as string).toLowerCase(),
    telephone:       body.telephone ?? '',
    depart:          body.depart,
    destination:     body.destination,
    date_depart:     body.date_depart,
    date_retour:     body.date_retour ?? null,
    nb_passagers:    Number(body.nb_passagers),
    type_trajet:     body.type_trajet,
    urgence:         body.urgence ?? 'normal',
    options:         Array.isArray(body.options) ? body.options : [],
    commentaire:     body.commentaire ?? null,
    statut,
    score_completude: score,
    user_id:         body.userId ?? null,
    tracking_token:  crypto.randomBytes(20).toString('hex'),
  }

  const { data: lead, error } = await supabase.from('leads').insert(leadPayload).select().single()
  if (error || !lead) { res.status(400).json({ message: error?.message ?? 'Erreur création lead' }); return }

  await addLog('LEAD_CREATED', 'success',
    `Nouveau lead : ${lead.nom} (${lead.email}) — ${lead.depart} → ${lead.destination} — score ${score}%`,
    lead.id, { email: lead.email, depart: lead.depart, destination: lead.destination, userId: body.userId ?? null })

  sendNewLeadInternalEmail(lead as never).catch(() => {})
  void autoQuote(lead)

  res.status(201).json(lead)
})

// ─── POST /api/leads/claim-by-email ──────────────────────────────────────────

router.post('/claim-by-email', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole !== 'client') {
    res.status(403).json({ message: 'Réservé aux comptes clients.' }); return
  }

  const { data: user } = await supabase.auth.admin.getUserById(req.userId!)
  if (!user?.user?.email) { res.status(404).json({ message: 'Utilisateur introuvable.' }); return }

  // Update leads matching email that have no user_id
  const { data: claimed } = await supabase
    .from('leads')
    .update({ user_id: req.userId })
    .eq('email', user.user.email)
    .is('user_id', null)
    .select('id')

  const count = claimed?.length ?? 0
  if (count > 0) {
    await addLog('LEADS_CLAIMED', 'success',
      `${count} demande(s) rattachée(s) au compte ${user.user.email}`,
      undefined, { userId: req.userId, email: user.user.email, count })
  }

  res.json({ claimed: count })
})

// ─── PATCH /api/leads/:id/status ─────────────────────────────────────────────

router.patch('/:id/status', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' }); return
  }

  const { statut } = req.body
  if (!statut) { res.status(400).json({ message: 'Champ statut requis' }); return }

  const { data: lead, error } = await supabase
    .from('leads')
    .update({ statut })
    .eq('id', req.params.id)
    .select()
    .single()

  if (error || !lead) { res.status(404).json({ message: 'Lead introuvable' }); return }

  await addLog('STATUS_CHANGED', 'info', `Statut mis à jour → ${statut}`, lead.id, { statut, modifiedBy: req.userId })
  res.json(lead)
})

// ─── Auto-quote helper ────────────────────────────────────────────────────────

async function autoQuote(lead: Record<string, unknown>): Promise<void> {
  const input: DevisInput = {
    depart:       lead.depart as string,
    destination:  lead.destination as string,
    date_depart:  lead.date_depart as string,
    date_retour:  lead.date_retour as string | undefined,
    nb_passagers: lead.nb_passagers as number,
    type_trajet:  lead.type_trajet as DevisInput['type_trajet'],
    options:      (lead.options as string[]) ?? [],
    urgence:      (lead.urgence as DevisInput['urgence']) ?? 'normal',
  }

  try {
    const result = calculer_devis(input)

    if (!result.success || result.besoin_reprise_humaine) {
      const raison = result.success ? (result.raison_reprise_humaine ?? 'Reprise humaine requise') : result.error
      await supabase.from('leads').update({ statut: 'cas_complexe' }).eq('id', lead.id)
      await addLog('AUTO_QUOTE_COMPLEX', 'warning', `Devis auto impossible — cas complexe : ${raison}`, lead.id as string, { input, raison })
      sendLeadReceivedEmail(lead as never).catch(() => {})
      sendComplexCaseEmail(lead as never, raison as string).catch(() => {})
      return
    }

    const quotePayload = {
      lead_id:                lead.id,
      source:                 'auto',
      prix_ht:                result.prix_ht,
      tva:                    result.tva,
      prix_ttc:               result.prix_ttc,
      lignes_calcul:          result.lignes_calcul,
      coefficients:           result.coefficients,
      warnings:               result.warnings,
      besoin_reprise_humaine: false,
      sources_calcul:         result.sources_calcul,
      explication_calcul:     result.explication_calcul,
      statut_devis:           'genere',
      validite_jours:         30,
      prix_final_ht:          result.prix_ht,
      prix_final_ttc:         result.prix_ttc,
    }

    const { data: quote } = await supabase.from('quotes').insert(quotePayload).select().single()
    await supabase.from('leads').update({ statut: 'devis_genere' }).eq('id', lead.id)

    try {
      await sendQuoteEmail(lead as never, quote as never)
      await supabase.from('quotes').update({ email_sent_at: new Date().toISOString() }).eq('id', quote!.id)
      await supabase.from('leads').update({ statut: 'devis_envoye' }).eq('id', lead.id)
      await addLog('AUTO_QUOTE_SENT', 'success',
        `Devis auto calculé et envoyé à ${lead.email} — ${result.prix_ttc.toFixed(2)} € TTC`,
        lead.id as string, { prix_ttc: result.prix_ttc, warnings: result.warnings })
    } catch (emailErr) {
      await addLog('AUTO_QUOTE_EMAIL_FAILED', 'error',
        `Devis calculé mais email non envoyé : ${String(emailErr)}`,
        lead.id as string, { prix_ttc: result.prix_ttc })
    }
  } catch (err) {
    await addLog('AUTO_QUOTE_ERROR', 'error', `Erreur inattendue calcul auto devis : ${String(err)}`, lead.id as string)
  }
}

export default router
