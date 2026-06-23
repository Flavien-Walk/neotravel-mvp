import { Router, Request, Response } from 'express'
import { Lead } from '../models/Lead'
import { Quote } from '../models/Quote'
import { Log } from '../models/Log'
import { requireAuth } from '../middleware/requireAuth'
import { sendLeadReceivedEmail, sendNewLeadInternalEmail } from '../services/email/emailService'

const router = Router()

// GET /api/leads — protégé (dashboard commercial)
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const filter: Record<string, unknown> = {}
    if (req.query.statut) filter.statut = req.query.statut
    const leads = await Lead.find(filter).sort({ createdAt: -1 }).lean()
    res.json(leads)
  } catch (err) {
    res.status(500).json({ message: 'Erreur récupération leads', error: String(err) })
  }
})

// GET /api/leads/:id — protégé
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const lead = await Lead.findById(req.params.id).lean()
    if (!lead) {
      res.status(404).json({ message: 'Lead introuvable' })
      return
    }
    const quote = await Quote.findOne({ leadId: lead._id }).lean()
    res.json({ ...lead, quote: quote || null })
  } catch (err) {
    res.status(500).json({ message: 'Erreur récupération lead', error: String(err) })
  }
})

// POST /api/leads — public (client crée sa demande)
router.post('/', async (req: Request, res: Response) => {
  try {
    const lead = new Lead(req.body)
    await lead.save()

    await Log.create({
      action: 'LEAD_CREATED',
      leadId: lead._id,
      status: 'success',
      message: `Nouveau lead : ${lead.nom} (${lead.email}) — ${lead.depart} → ${lead.destination} — score ${lead.score_completude}%`,
      payload: { email: lead.email, depart: lead.depart, destination: lead.destination },
    })

    // Emails non bloquants
    sendLeadReceivedEmail(lead).catch(() => {})
    sendNewLeadInternalEmail(lead).catch(() => {})

    res.status(201).json(lead)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur création lead'
    res.status(400).json({ message })
  }
})

// PATCH /api/leads/:id/status — protégé
router.patch('/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { statut } = req.body
    if (!statut) {
      res.status(400).json({ message: 'Champ statut requis' })
      return
    }
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { statut },
      { new: true, runValidators: false }
    )
    if (!lead) {
      res.status(404).json({ message: 'Lead introuvable' })
      return
    }

    await Log.create({
      action: 'STATUS_CHANGED',
      leadId: lead._id,
      status: 'info',
      message: `Statut mis à jour → ${statut}`,
      payload: { statut },
    })

    res.json(lead)
  } catch (err) {
    res.status(500).json({ message: 'Erreur mise à jour statut', error: String(err) })
  }
})

export default router
