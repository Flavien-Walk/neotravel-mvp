import { Router, Request, Response } from 'express'
import { Types } from 'mongoose'
import { Lead } from '../models/Lead'
import { Quote } from '../models/Quote'
import { Log } from '../models/Log'
import { User } from '../models/User'
import { requireAuth, AuthRequest } from '../middleware/requireAuth'
import { sendLeadReceivedEmail, sendNewLeadInternalEmail } from '../services/email/emailService'

const router = Router()

// GET /api/leads/track/:token — public, suivi sans connexion
router.get('/track/:token', async (req: Request, res: Response) => {
  try {
    const lead = await Lead.findOne({ trackingToken: req.params.token })
      .select('nom depart destination date_depart date_retour nb_passagers type_trajet statut updatedAt createdAt')
      .lean()

    if (!lead) {
      res.status(404).json({ message: 'Demande introuvable. Vérifiez le lien reçu par email.' })
      return
    }

    const quote = await Quote.findOne({ leadId: lead._id })
      .select('prix_ttc prix_final_ttc statut_devis createdAt explication_calcul warnings besoin_reprise_humaine')
      .lean()

    const STATUS_LABELS: Record<string, string> = {
      nouveau:      'Demande reçue',
      incomplet:    'En attente d\'informations complémentaires',
      qualifie:     'Dossier qualifié',
      devis_genere: 'Devis en préparation',
      devis_envoye: 'Devis envoyé',
      relance_1:    'Relance envoyée',
      relance_2:    'Deuxième relance envoyée',
      accepte:      'Devis accepté',
      refuse:       'Devis refusé',
      cas_complexe: 'Reprise par un conseiller',
      cloture:      'Dossier clôturé',
    }

    res.json({
      tracking: true,
      statut: lead.statut,
      statut_label: STATUS_LABELS[lead.statut] ?? lead.statut,
      trajet: `${lead.depart} → ${lead.destination}`,
      date_depart: lead.date_depart,
      date_retour: (lead as Record<string, unknown>).date_retour ?? null,
      nb_passagers: lead.nb_passagers,
      type_trajet: lead.type_trajet,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      devis: quote ? {
        statut_devis: quote.statut_devis,
        prix_ttc: quote.prix_final_ttc || quote.prix_ttc,
        warnings: quote.warnings,
        besoin_reprise_humaine: quote.besoin_reprise_humaine,
        createdAt: quote.createdAt,
      } : null,
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur récupération suivi', error: String(err) })
  }
})

// GET /api/leads — protégé
// client : voit uniquement ses propres leads
// commercial / admin : voit tous les leads
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const filter: Record<string, unknown> = {}
    if (req.query.statut) filter.statut = req.query.statut

    if (req.userRole === 'client') {
      filter.userId = new Types.ObjectId(req.userId)
    }

    const leads = await Lead.find(filter).sort({ createdAt: -1 }).lean()
    res.json(leads)
  } catch (err) {
    res.status(500).json({ message: 'Erreur récupération leads', error: String(err) })
  }
})

// GET /api/leads/:id — protégé
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id).lean()
    if (!lead) { res.status(404).json({ message: 'Lead introuvable' }); return }

    // Client ne peut voir que ses propres leads
    if (req.userRole === 'client' && String(lead.userId) !== req.userId) {
      res.status(403).json({ message: 'Accès refusé.' })
      return
    }

    const quote = await Quote.findOne({ leadId: lead._id }).lean()
    res.json({ ...lead, quote: quote || null })
  } catch (err) {
    res.status(500).json({ message: 'Erreur récupération lead', error: String(err) })
  }
})

// POST /api/leads — public (client crée une demande)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const body = { ...req.body }

    // Attacher userId si token présent (sans bloquer si absent)
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const jwt = await import('jsonwebtoken')
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret'
        const payload = jwt.default.verify(authHeader.slice(7), JWT_SECRET) as { sub: string }
        body.userId = payload.sub
      } catch { /* token invalide ou absent — demande anonyme */ }
    }

    const lead = new Lead(body)
    await lead.save()

    await Log.create({
      action: 'LEAD_CREATED',
      leadId: lead._id,
      status: 'success',
      message: `Nouveau lead : ${lead.nom} (${lead.email}) — ${lead.depart} → ${lead.destination} — score ${lead.score_completude}%`,
      payload: { email: lead.email, depart: lead.depart, destination: lead.destination, userId: body.userId ?? null },
    })

    sendLeadReceivedEmail(lead).catch(() => {})
    sendNewLeadInternalEmail(lead).catch(() => {})

    res.status(201).json(lead)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur création lead'
    res.status(400).json({ message })
  }
})

// POST /api/leads/claim-by-email — rattacher les leads anonymes au compte connecté
router.post('/claim-by-email', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole !== 'client') {
    res.status(403).json({ message: 'Réservé aux comptes clients.' })
    return
  }

  try {
    const user = await User.findById(req.userId).lean()
    if (!user) { res.status(404).json({ message: 'Utilisateur introuvable.' }); return }

    const result = await Lead.updateMany(
      { email: user.email, userId: null },
      { $set: { userId: req.userId } }
    )

    if (result.modifiedCount > 0) {
      await Log.create({
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

// PATCH /api/leads/:id/status — protégé commercial/admin
router.patch('/:id/status', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole === 'client') {
      res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' })
      return
    }

    const { statut } = req.body
    if (!statut) { res.status(400).json({ message: 'Champ statut requis' }); return }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { statut },
      { new: true, runValidators: false }
    )
    if (!lead) { res.status(404).json({ message: 'Lead introuvable' }); return }

    await Log.create({
      action: 'STATUS_CHANGED',
      leadId: lead._id,
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
