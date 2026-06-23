import { Router, Response } from 'express'
import { calculer_devis, DevisInput } from '../services/calculer_devis'
import { Quote } from '../models/Quote'
import { Lead } from '../models/Lead'
import { Log } from '../models/Log'
import { requireAuth, AuthRequest } from '../middleware/requireAuth'
import { sendQuoteEmail, sendComplexCaseEmail, sendQuoteReminderEmail } from '../services/email/emailService'

const router = Router()

// POST /api/quotes/calculate — protégé (commercial/admin)
router.post('/calculate', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' })
    return
  }

  const { leadId } = req.body

  // Toujours récupérer les données depuis la DB pour garantir la cohérence.
  // Cela évite l'erreur "ville manquante" quand le frontend n'envoie pas tous les champs.
  let input: DevisInput
  if (leadId) {
    const lead = await Lead.findById(leadId).lean()
    if (!lead) {
      res.status(404).json({ message: 'Lead introuvable.' })
      return
    }
    input = {
      depart:       lead.depart,
      destination:  lead.destination,
      date_depart:  lead.date_depart,
      date_retour:  lead.date_retour,
      nb_passagers: lead.nb_passagers,
      type_trajet:  lead.type_trajet,
      options:      lead.options ?? [],
      urgence:      lead.urgence ?? 'normal',
    }
  } else {
    // Calcul direct sans leadId (usage interne/test)
    const { leadId: _skip, ...rest } = req.body
    input = rest as DevisInput
  }

  const result = calculer_devis(input)

  if (!result.success) {
    if (leadId) {
      await Log.create({
        action: 'QUOTE_FAILED',
        leadId,
        status: 'error',
        message: result.error,
        payload: { input, besoin_reprise: result.besoin_reprise_humaine, hint: result.hint },
      }).catch(() => null)

      if (result.besoin_reprise_humaine) {
        const lead = await Lead.findByIdAndUpdate(leadId, { statut: 'cas_complexe' }, { new: true }).catch(() => null)
        if (lead) sendComplexCaseEmail(lead, result.raison_reprise_humaine ?? result.error).catch(() => {})
      }
    }
    res.status(422).json({
      message: result.error,
      hint: result.hint,
      besoin_reprise_humaine: result.besoin_reprise_humaine,
      raison_reprise_humaine: result.raison_reprise_humaine,
    })
    return
  }

  try {
    if (leadId) await Quote.deleteMany({ leadId })

    const quote = await Quote.create({
      leadId:       leadId || null,
      prix_ht:      result.prix_ht,
      tva:          result.tva,
      prix_ttc:     result.prix_ttc,
      lignes_calcul: result.lignes_calcul,
      coefficients:  result.coefficients,
      warnings:      result.warnings,
      besoin_reprise_humaine: result.besoin_reprise_humaine,
      raison_reprise_humaine: result.raison_reprise_humaine ?? undefined,
      sources_calcul: result.sources_calcul,
      explication_calcul: result.explication_calcul,
      statut_devis:  'genere',
      ajustement_manuel_ht: 0,
    })

    if (leadId) {
      await Lead.findByIdAndUpdate(leadId, { statut: 'devis_genere' })

      const msgs = [`Devis calculé : ${result.prix_ttc.toFixed(2)} € TTC`]
      if (result.warnings.length) msgs.push(`Warnings : ${result.warnings.join(' | ')}`)
      if (result.besoin_reprise_humaine) msgs.push(`⚠ Reprise humaine : ${result.raison_reprise_humaine}`)

      await Log.create({
        action: 'QUOTE_CALCULATED',
        leadId,
        status: result.besoin_reprise_humaine ? 'warning' : 'success',
        message: msgs.join(' — '),
        payload: { prix_ttc: result.prix_ttc, warnings: result.warnings },
      })
    }

    res.status(201).json({
      ...quote.toObject(),
      warnings: result.warnings,
      besoin_reprise_humaine: result.besoin_reprise_humaine,
      raison_reprise_humaine: result.raison_reprise_humaine,
      sources_calcul: result.sources_calcul,
      explication_calcul: result.explication_calcul,
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur sauvegarde devis', error: String(err) })
  }
})

// PATCH /api/quotes/:id — modification manuelle du devis (commercial)
router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' })
    return
  }

  try {
    const quote = await Quote.findById(req.params.id)
    if (!quote) { res.status(404).json({ message: 'Devis introuvable' }); return }

    const { ajustement_manuel_ht, raison_ajustement } = req.body
    if (ajustement_manuel_ht === undefined) {
      res.status(400).json({ message: 'ajustement_manuel_ht requis.' })
      return
    }

    const oldHt  = quote.prix_final_ht || quote.prix_ht
    const oldTtc = quote.prix_final_ttc || quote.prix_ttc

    quote.ajustement_manuel_ht = Number(ajustement_manuel_ht)
    quote.raison_ajustement    = raison_ajustement ?? ''
    quote.modifiedBy           = req.userId
    quote.modifiedAt           = new Date()
    // prix_final recalculé par le pre-save hook
    await quote.save()

    await Log.create({
      action: 'QUOTE_UPDATED',
      leadId: quote.leadId,
      status: 'info',
      message: `Devis modifié par commercial — HT : ${oldHt} → ${quote.prix_final_ht} | TTC : ${oldTtc} → ${quote.prix_final_ttc}`,
      payload: {
        oldHt, oldTtc,
        newHt: quote.prix_final_ht, newTtc: quote.prix_final_ttc,
        ajustement: ajustement_manuel_ht, raison: raison_ajustement,
        modifiedBy: req.userId,
      },
    })

    res.json(quote.toObject())
  } catch (err) {
    res.status(500).json({ message: 'Erreur modification devis', error: String(err) })
  }
})

// POST /api/quotes/:id/send — envoyer le devis par email
router.post('/:id/send', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' })
    return
  }

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
      message: `Devis envoyé par email à ${lead.email} — TTC : ${quote.prix_final_ttc || quote.prix_ttc} €`,
    })

    res.json({ message: 'Devis envoyé avec succès.', statut: 'devis_envoye' })
  } catch (err) {
    await Log.create({
      action: 'EMAIL_FAILED',
      status: 'error',
      message: `Échec envoi devis : ${String(err)}`,
    }).catch(() => {})
    res.status(500).json({ message: 'Erreur envoi devis', error: String(err) })
  }
})

// POST /api/quotes/:id/remind — envoyer une relance
router.post('/:id/remind', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' })
    return
  }

  try {
    const quote = await Quote.findById(req.params.id)
    if (!quote) { res.status(404).json({ message: 'Devis introuvable' }); return }

    const lead = await Lead.findById(quote.leadId)
    if (!lead) { res.status(404).json({ message: 'Lead introuvable' }); return }

    const nextStatut = lead.statut === 'relance_1' ? 'relance_2' : 'relance_1'

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
