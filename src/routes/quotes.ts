import { Router, Request, Response } from 'express'
import { calculer_devis } from '../services/calculer_devis'
import { Quote } from '../models/Quote'
import { Lead } from '../models/Lead'
import { Log } from '../models/Log'

const router = Router()

// POST /api/quotes/calculate
router.post('/calculate', async (req: Request, res: Response) => {
  const { leadId, ...input } = req.body

  const result = calculer_devis(input)

  if (!result.success) {
    if (leadId) {
      await Log.create({
        action: 'DEVIS_ECHEC',
        leadId,
        status: 'error',
        message: result.error,
        payload: input,
      }).catch(() => null)

      if (result.needs_human_review) {
        await Lead.findByIdAndUpdate(leadId, { statut: 'cas_complexe' }).catch(() => null)
      }
    }
    res.status(422).json({ message: result.error, needs_human_review: result.needs_human_review ?? false })
    return
  }

  try {
    // Remplace l'éventuel devis existant pour ce lead
    if (leadId) {
      await Quote.deleteMany({ leadId })
    }

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
      await Log.create({
        action: 'DEVIS_CALCULE',
        leadId,
        status: 'success',
        message: `Devis calculé : ${result.prix_ttc.toFixed(2)} € TTC`,
        payload: { prix_ttc: result.prix_ttc, prix_ht: result.prix_ht },
      })
    }

    res.status(201).json(quote)
  } catch (err) {
    res.status(500).json({ message: 'Erreur sauvegarde devis', error: String(err) })
  }
})

export default router
