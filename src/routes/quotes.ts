import { Router, Request, Response } from 'express'
import { calculer_devis } from '../services/calculer_devis'
import { Quote } from '../models/Quote'
import { Lead } from '../models/Lead'
import { Log } from '../models/Log'
import { requireAuth } from '../middleware/requireAuth'
import { sendQuoteEmail, sendComplexCaseEmail, sendQuoteReminderEmail } from '../services/email/emailService'

const router = Router()

// POST /api/quotes/calculate — protégé (commercial)
router.post('/calculate', requireAuth, async (req: Request, res: Response) => {
  const { leadId, ...input } = req.body

  const result = calculer_devis(input)

  if (!result.success) {
    if (leadId) {
      await Log.create({
        action: 'QUOTE_FAILED',
        leadId,
        status: 'error',
        message: result.error,
        payload: { ...input, besoin_reprise: result.besoin_reprise_humaine },
      }).catch(() => null)

      if (result.besoin_reprise_humaine) {
        const lead = await Lead.findByIdAndUpdate(leadId, { statut: 'cas_complexe' }, { new: true }).catch(() => null)
        if (lead) {
          sendComplexCaseEmail(lead, result.raison_reprise_humaine ?? result.error).catch(() => {})
        }
      }
    }
    res.status(422).json({
      message: result.error,
      besoin_reprise_humaine: result.besoin_reprise_humaine,
      raison_reprise_humaine: result.raison_reprise_humaine,
    })
    return
  }

  try {
    if (leadId) await Quote.deleteMany({ leadId })

    const quote = await Quote.create({
      leadId: leadId || null,
      prix_ht:      result.prix_ht,
      tva:          result.tva,
      prix_ttc:     result.prix_ttc,
      lignes_calcul: result.lignes_calcul,
      coefficients:  result.coefficients,
      statut_devis:  'genere',
    })

    if (leadId) {
      await Lead.findByIdAndUpdate(leadId, { statut: 'devis_genere' })

      const logMessages = [`Devis calculé : ${result.prix_ttc.toFixed(2)} € TTC`]
      if (result.warnings.length) logMessages.push(`Warnings : ${result.warnings.join(' | ')}`)
      if (result.besoin_reprise_humaine) logMessages.push(`⚠️ Reprise humaine : ${result.raison_reprise_humaine}`)

      await Log.create({
        action: 'QUOTE_CALCULATED',
        leadId,
        status: result.besoin_reprise_humaine ? 'warning' : 'success',
        message: logMessages.join(' — '),
        payload: { prix_ttc: result.prix_ttc, warnings: result.warnings, besoin_reprise: result.besoin_reprise_humaine },
      })
    }

    res.status(201).json({
      ...quote.toObject(),
      warnings: result.warnings,
      besoin_reprise_humaine: result.besoin_reprise_humaine,
      raison_reprise_humaine: result.raison_reprise_humaine,
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur sauvegarde devis', error: String(err) })
  }
})

// POST /api/quotes/:id/send — envoyer le devis par email
router.post('/:id/send', requireAuth, async (req: Request, res: Response) => {
  try {
    const quote = await Quote.findById(req.params.id)
    if (!quote) { res.status(404).json({ message: 'Devis introuvable' }); return }

    const lead = await Lead.findById(quote.leadId)
    if (!lead) { res.status(404).json({ message: 'Lead introuvable' }); return }

    await sendQuoteEmail(lead, quote)
    await Lead.findByIdAndUpdate(lead._id, { statut: 'devis_envoye' })
    await Log.create({
      action: 'QUOTE_SENT',
      leadId: lead._id,
      status: 'success',
      message: `Devis envoyé par email à ${lead.email}`,
    })

    res.json({ message: 'Devis envoyé avec succès.' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur envoi devis', error: String(err) })
  }
})

// POST /api/quotes/:id/remind — envoyer une relance
router.post('/:id/remind', requireAuth, async (req: Request, res: Response) => {
  try {
    const quote = await Quote.findById(req.params.id)
    if (!quote) { res.status(404).json({ message: 'Devis introuvable' }); return }

    const lead = await Lead.findById(quote.leadId)
    if (!lead) { res.status(404).json({ message: 'Lead introuvable' }); return }

    const currentStatut = lead.statut
    const nextStatut = currentStatut === 'relance_1' ? 'relance_2' : 'relance_1'

    await sendQuoteReminderEmail(lead, quote)
    await Lead.findByIdAndUpdate(lead._id, { statut: nextStatut })
    await Log.create({
      action: 'REMINDER_SENT',
      leadId: lead._id,
      status: 'success',
      message: `Relance envoyée à ${lead.email} — statut → ${nextStatut}`,
    })

    res.json({ message: 'Relance envoyée.', statut: nextStatut })
  } catch (err) {
    res.status(500).json({ message: 'Erreur relance', error: String(err) })
  }
})

export default router
