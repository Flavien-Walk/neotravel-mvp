// @ts-nocheck
import { Router, Request, Response } from 'express'
import { LeadDB } from '../lib/db'
import { QuoteDB } from '../lib/db'
import { LogDB } from '../lib/db'
import { UserDB } from '../lib/db'
import { requireAuth, AuthRequest } from '../middleware/requireAuth'
import { calculer_devis, DevisInput } from '../services/calculer_devis'
import {
  sendLeadReceivedEmail,
  sendNewLeadInternalEmail,
  sendComplexCaseEmail,
} from '../services/email/emailService'

const router = Router()

// GET /api/leads/track/:token — public, suivi sans connexion
router.get('/track/:token', async (req: Request, res: Response) => {
  try {
    const lead = await LeadDB.findOne({ tracking_token: req.params.token })
    if (!lead) {
      res.status(404).json({ message: 'Demande introuvable. Vérifiez le lien reçu par email.' })
      return
    }

    const quote = await QuoteDB.findOne({ lead_id: lead.id })

    const STATUS_LABELS: Record<string, string> = {
      nouveau:                'Demande reçue',
      incomplet:              'En attente d\'informations complémentaires',
      qualifie:               'Dossier qualifié',
      devis_genere:           'Devis en préparation',
      en_attente_validation:  'Devis en cours de validation',
      devis_valide:           'Devis validé',
      devis_envoye:           'Devis envoyé',
      relance_1:              'Relance envoyée',
      relance_2:              'Deuxième relance envoyée',
      accepte:                'Devis accepté',
      refuse:                 'Devis refusé',
      cas_complexe:           'Reprise par un conseiller',
      reprise_humaine:        'Validation conseiller en cours',
      cloture:                'Dossier clôturé',
    }

    res.json({
      tracking: true,
      statut: lead.statut,
      statut_label: STATUS_LABELS[lead.statut] ?? lead.statut,
      trajet: `${lead.depart} → ${lead.destination}`,
      date_depart: lead.date_depart,
      date_retour: lead.date_retour ?? null,
      nb_passagers: lead.nb_passagers,
      type_trajet: lead.type_trajet,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      devis: quote ? {
        statut_devis: quote.statut_devis,
        prix_ttc: quote.prix_final_ttc || quote.prix_ttc,
        warnings: quote.warnings,
        besoin_reprise_humaine: quote.besoin_reprise_humaine,
        email_sent_at: quote.email_sent_at ?? null,
        validite_jours: quote.validite_jours ?? 30,
        createdAt: quote.createdAt,
      } : null,
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur récupération suivi', error: String(err) })
  }
})

// GET /api/leads — protégé
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, unknown> = {}
    if (req.query.statut) filter.statut = req.query.statut
    if (req.userRole === 'client') filter.user_id = req.userId

    const leads = await LeadDB.find(filter, { sort: 'created_at' })
    res.json(leads)
  } catch (err) {
    res.status(500).json({ message: 'Erreur récupération leads', error: String(err) })
  }
})

// GET /api/leads/:id — protégé
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const lead = await LeadDB.findById(req.params.id)
    if (!lead) { res.status(404).json({ message: 'Lead introuvable' }); return }

    if (req.userRole === 'client' && lead.userId !== req.userId) {
      res.status(403).json({ message: 'Accès refusé.' })
      return
    }

    const quote = await QuoteDB.findOne({ lead_id: lead.id })
    res.json({ ...lead, quote: quote || null })
  } catch (err) {
    res.status(500).json({ message: 'Erreur récupération lead', error: String(err) })
  }
})

// POST /api/leads — public
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const body = { ...req.body }

    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const jwt = await import('jsonwebtoken')
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret'
        const payload = jwt.default.verify(authHeader.slice(7), JWT_SECRET) as { sub: string }
        body.userId = payload.sub
      } catch { /* token invalide ou absent */ }
    }

    const lead = await LeadDB.create(body)

    await LogDB.create({
      action: 'LEAD_CREATED',
      leadId: lead.id,
      status: 'success',
      message: `Nouveau lead : ${lead.nom} (${lead.email}) — ${lead.depart} → ${lead.destination} — score ${lead.score_completude}%`,
      payload: { email: lead.email, depart: lead.depart, destination: lead.destination, userId: body.userId ?? null },
    })

    sendNewLeadInternalEmail(lead).catch(() => {})
    void autoQuote(lead)

    res.status(201).json(lead)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur création lead'
    res.status(400).json({ message })
  }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function autoQuote(lead: any): Promise<void> {
  const input: DevisInput = {
    depart:       lead.depart,
    destination:  lead.destination,
    date_depart:  lead.date_depart,
    date_retour:  lead.date_retour,
    nb_passagers: lead.nb_passagers,
    type_trajet:  lead.type_trajet,
    options:      lead.options ?? [],
    urgence:      lead.urgence ?? 'normal',
  }

  try {
    const result = calculer_devis(input)

    if (!result.success || result.besoin_reprise_humaine) {
      const raison = result.success
        ? (result.raison_reprise_humaine ?? 'Reprise humaine requise')
        : result.error

      await LeadDB.findByIdAndUpdate(lead.id, { statut: 'cas_complexe' })
      await LogDB.create({
        action:  'AUTO_QUOTE_COMPLEX',
        leadId:  lead.id,
        status:  'warning',
        message: `Devis auto impossible — cas complexe : ${raison}`,
        payload: { input, raison },
      })
      sendLeadReceivedEmail(lead).catch(() => {})
      sendComplexCaseEmail(lead, raison).catch(() => {})
      return
    }

    const quote = await QuoteDB.create({
      leadId:   lead.id,
      source:   'auto',
      prix_ht:  result.prix_ht,
      tva:      result.tva,
      prix_ttc: result.prix_ttc,
      lignes_calcul:      result.lignes_calcul,
      coefficients:       result.coefficients,
      warnings:           result.warnings,
      besoin_reprise_humaine: false,
      sources_calcul:     result.sources_calcul,
      explication_calcul: result.explication_calcul,
      statut_devis:       'pending_human_validation',
      validite_jours:     30,
    })

    await LeadDB.findByIdAndUpdate(lead.id, { statut: 'en_attente_validation' })
    await QuoteDB.findByIdAndUpdate(quote.id, { statut_devis: 'pending_human_validation' })

    await LogDB.create({
      action:  'AUTO_QUOTE_CALCULATED',
      leadId:  lead.id,
      status:  'success',
      message: `Devis auto calculé — en attente validation humaine — ${result.prix_ttc.toFixed(2)} € TTC`,
      payload: { prix_ttc: result.prix_ttc, warnings: result.warnings },
    })
  } catch (err) {
    await LogDB.create({
      action:  'AUTO_QUOTE_ERROR',
      leadId:  lead.id,
      status:  'error',
      message: `Erreur inattendue calcul auto devis : ${String(err)}`,
    }).catch(() => {})
  }
}

// POST /api/leads/claim-by-email
router.post('/claim-by-email', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole !== 'client') {
    res.status(403).json({ message: 'Réservé aux comptes clients.' })
    return
  }

  try {
    const user = await UserDB.findById(req.userId!)
    if (!user) { res.status(404).json({ message: 'Utilisateur introuvable.' }); return }

    const result = await LeadDB.updateMany(
      { email: user.email, user_id: null },
      { $set: { userId: req.userId } }
    )

    if (result.modifiedCount > 0) {
      await LogDB.create({
        action: 'LEADS_CLAIMED',
        status: 'success',
        message: `${result.modifiedCount} demande(s) rattachée(s) au compte ${user.email}`,
        payload: { userId: req.userId, email: user.email, count: result.modifiedCount },
      })
    }

    res.json({ claimed: result.modifiedCount })
  } catch (err) {
    res.status(500).json({ message: 'Erreur rattachement leads', error: String(err) })
  }
})

// PATCH /api/leads/:id/status
router.patch('/:id/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole === 'client') {
      res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' })
      return
    }

    const { statut } = req.body
    if (!statut) { res.status(400).json({ message: 'Champ statut requis' }); return }

    const lead = await LeadDB.findByIdAndUpdate(req.params.id, { statut })
    if (!lead) { res.status(404).json({ message: 'Lead introuvable' }); return }

    await LogDB.create({
      action: 'STATUS_CHANGED',
      leadId: lead.id,
      status: 'info',
      message: `Statut mis à jour → ${statut}`,
      payload: { statut, modifiedBy: req.userId },
    })

    res.json(lead)
  } catch (err) {
    res.status(500).json({ message: 'Erreur mise à jour statut', error: String(err) })
  }
})

export default router
