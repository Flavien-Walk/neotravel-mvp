import { Router, Response } from 'express'
import PDFDocument from 'pdfkit'
import { calculer_devis, DevisInput } from '../services/calculer_devis'
import { Quote } from '../models/Quote'
import { Lead, ILead, LeadStatus } from '../models/Lead'
import { Log } from '../models/Log'
import { requireAuth, AuthRequest } from '../middleware/requireAuth'
import { sendQuoteEmail, sendComplexCaseEmail, sendQuoteReminderEmail } from '../services/email/emailService'
import { notifyQuoteReadyForReview } from '../services/n8nService'

const STOP_STATUTS: LeadStatus[] = ['accepte', 'refuse', 'cloture', 'reprise_humaine', 'cas_complexe']

const router = Router()

// GET /api/quotes/reminders/due — liste des devis à relancer (utilisé par n8n scheduler)
router.get('/reminders/due', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' })
    return
  }

  try {
    const now  = new Date()
    const H48  = 48 * 60 * 60 * 1000   // 48h en ms
    const H72  = 72 * 60 * 60 * 1000   // 72h en ms

    // Quotes envoyés, pas encore relancés 2 fois
    const quotes = await Quote.find({
      statut_devis: 'sent',
      $or: [
        { reminder_count: { $exists: false } },
        { reminder_count: { $lt: 2 } },
      ],
    }).lean()

    if (quotes.length === 0) {
      res.json([])
      return
    }

    const leadIds  = quotes.map(q => q.leadId)
    const leads    = await Lead.find({ _id: { $in: leadIds } }).lean()
    const leadsMap = new Map(leads.map(l => [String(l._id), l]))

    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://neotravel-mvp.vercel.app'
    const API_URL      = process.env.API_URL      || 'https://neotravel-mvp.onrender.com'

    const results: object[] = []

    for (const quote of quotes) {
      const lead = leadsMap.get(String(quote.leadId))
      if (!lead) continue
      if (STOP_STATUTS.includes(lead.statut)) continue

      const count = quote.reminder_count ?? 0
      let dueForRelance = false
      let relanceLevel  = 1

      if (count === 0 && lead.statut === 'devis_envoye') {
        // Relance 1 : 48h après envoi initial
        if (quote.email_sent_at && now.getTime() - new Date(quote.email_sent_at).getTime() >= H48) {
          dueForRelance = true
          relanceLevel  = 1
        }
      } else if (count === 1 && lead.statut === 'relance_1') {
        // Relance 2 : 72h après relance 1
        const lastRem = (quote as unknown as { lastReminderAt?: Date }).lastReminderAt
        if (lastRem && now.getTime() - new Date(lastRem).getTime() >= H72) {
          dueForRelance = true
          relanceLevel  = 2
        }
      }

      if (!dueForRelance) continue

      results.push({
        leadId:  String(lead._id),
        quoteId: String(quote._id),
        relanceLevel,
        client: { nom: lead.nom, email: lead.email },
        trajet: { depart: lead.depart, destination: lead.destination, date_depart: lead.date_depart },
        quote: {
          prix_ttc:       quote.prix_final_ttc || quote.prix_ttc,
          sentAt:         quote.email_sent_at ?? null,
          lastReminderAt: (quote as unknown as { lastReminderAt?: Date }).lastReminderAt ?? null,
        },
        trackingUrl: `${FRONTEND_URL}/suivi/${lead.trackingToken}`,
        pdfUrl:      `${API_URL}/api/quotes/${String(quote._id)}/pdf`,
      })
    }

    res.json(results)
  } catch (err) {
    res.status(500).json({ message: 'Erreur reminders/due', error: String(err) })
  }
})

// POST /api/quotes/manual — devis saisi manuellement par un commercial
router.post('/manual', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' })
    return
  }

  try {
    const { client, trajet, lignes, remise_pct, validite_jours, commentaire, conditions, leadId: existingLeadId } = req.body

    if (!client?.nom || !client?.email) {
      res.status(400).json({ message: 'Nom et email client requis.' })
      return
    }
    if (!Array.isArray(lignes) || lignes.length === 0) {
      res.status(400).json({ message: 'Au moins une ligne de devis requise.' })
      return
    }

    let leadId = existingLeadId
    if (!leadId) {
      const lead = await Lead.create({
        nom:          client.nom,
        email:        client.email,
        telephone:    client.telephone || 'non renseigné',
        societe:      client.societe || '',
        depart:       trajet?.depart || '',
        destination:  trajet?.destination || '',
        date_depart:  trajet?.date_depart || new Date().toISOString().split('T')[0],
        date_retour:  trajet?.date_retour || undefined,
        nb_passagers: trajet?.nb_passagers || 1,
        type_trajet:  trajet?.type_trajet || 'aller_simple',
        urgence:      trajet?.urgence || 'normal',
        options:      [],
        commentaire:  commentaire || '',
        statut:       'devis_genere',
        score_completude: 80,
      })
      leadId = lead._id
    }

    // Recalcul serveur — ne pas faire confiance aux totaux du frontend
    const computed_ht  = lignes.reduce((s: number, l: { total_ht: unknown }) => s + (Number(l.total_ht) || 0), 0)
    const computed_tva = lignes.reduce((s: number, l: { total_ht: unknown; tva_rate: unknown }) =>
      s + (Number(l.total_ht) || 0) * (Number(l.tva_rate) || 20) / 100, 0)
    const remise    = Math.max(0, Math.min(100, Number(remise_pct) || 0))
    const final_ht  = Math.round(computed_ht  * (1 - remise / 100) * 100) / 100
    const final_tva = Math.round(computed_tva * (1 - remise / 100) * 100) / 100
    const final_ttc = Math.round((final_ht + final_tva) * 100) / 100

    const quote = await Quote.create({
      leadId,
      source: 'manuel_commercial',
      prix_ht:  final_ht,
      tva:      final_tva,
      prix_ttc: final_ttc,
      lignes_calcul: (lignes as Array<{ label?: string; total_ht: unknown; quantity: unknown; unit_price_ht: unknown; unit: unknown; tva_rate: unknown }>).map(l => ({
        label:       l.label || '',
        montant:     Number(l.total_ht) || 0,
        formule:     `${l.quantity} × ${l.unit_price_ht} ${l.unit}`,
        variables:   { quantity: l.quantity, unit: l.unit, unit_price_ht: l.unit_price_ht, tva_rate: l.tva_rate },
        source_type: 'a_definir',
        justification: commentaire || 'Devis saisi manuellement',
      })),
      coefficients:  { remise_pct: remise, validite_jours: Number(validite_jours) || 30 },
      warnings:      remise > 0 ? [`Remise commerciale appliquée : ${remise}%`] : [],
      besoin_reprise_humaine: false,
      sources_calcul: [{
        label:       'Devis manuel commercial',
        valeur:      final_ttc,
        source_type: 'a_definir',
        justification: commentaire || 'Devis saisi manuellement',
      }],
      explication_calcul: conditions || '',
      statut_devis:    'genere',
      ajustement_manuel_ht: 0,
      raison_ajustement:   commentaire || '',
      modifiedBy:  req.userId,
      modifiedAt:  new Date(),
    })

    if (!existingLeadId) {
      await Lead.findByIdAndUpdate(leadId, { statut: 'devis_genere' })
    }

    await Log.create({
      action:  'MANUAL_QUOTE_CREATED',
      leadId,
      status:  'info',
      message: `Devis manuel créé — HT : ${final_ht.toFixed(2)} € — TTC : ${final_ttc.toFixed(2)} €${remise > 0 ? ` (remise ${remise}%)` : ''}`,
      payload: { lignes: lignes.length, final_ht, final_tva, final_ttc, remise_pct: remise, createdBy: req.userId },
    })

    res.status(201).json({ ...quote.toObject(), leadId })
  } catch (err) {
    res.status(500).json({ message: 'Erreur création devis manuel', error: String(err) })
  }
})

// POST /api/quotes/calculate — protégé (commercial/admin)
// Calcule le devis et le place en attente de validation humaine. Ne jamais envoyer au client ici.
router.post('/calculate', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' })
    return
  }

  const { leadId } = req.body

  const lead = leadId ? await Lead.findById(leadId).lean() : null
  if (leadId && !lead) {
    res.status(404).json({ message: 'Lead introuvable.' })
    return
  }

  let input: DevisInput
  if (lead) {
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
    const { leadId: _skip, ...rest } = req.body
    input = rest as DevisInput
  }

  const result = calculer_devis(input)

  // Cas erreur de calcul (ville manquante, données invalides, etc.)
  if (!result.success) {
    if (leadId) {
      await Lead.findByIdAndUpdate(leadId, { statut: 'cas_complexe' }).catch(() => null)
      await Log.create({
        action: 'QUOTE_FAILED',
        leadId,
        status: 'error',
        message: result.error,
        payload: { input, besoin_reprise: result.besoin_reprise_humaine, hint: result.hint },
      }).catch(() => null)
      if (lead) sendComplexCaseEmail(lead as unknown as ILead, result.raison_reprise_humaine ?? result.error).catch(() => {})
    }
    res.status(422).json({
      message: result.error,
      hint: result.hint,
      besoin_reprise_humaine: result.besoin_reprise_humaine,
      raison_reprise_humaine: result.raison_reprise_humaine,
    })
    return
  }

  // Cas reprise humaine obligatoire (succès mais nécessite intervention)
  if (result.besoin_reprise_humaine) {
    if (leadId) {
      await Lead.findByIdAndUpdate(leadId, { statut: 'reprise_humaine' }).catch(() => null)
      await Log.create({
        action: 'QUOTE_NEEDS_HUMAN',
        leadId,
        status: 'warning',
        message: `Reprise humaine requise : ${result.raison_reprise_humaine}`,
        payload: { input, raison: result.raison_reprise_humaine },
      }).catch(() => null)
      if (lead) sendComplexCaseEmail(lead as unknown as ILead, result.raison_reprise_humaine ?? 'Reprise humaine').catch(() => {})
    }
    res.status(422).json({
      message: result.raison_reprise_humaine ?? 'Reprise humaine requise.',
      besoin_reprise_humaine: true,
      raison_reprise_humaine: result.raison_reprise_humaine,
    })
    return
  }

  try {
    if (leadId) await Quote.deleteMany({ leadId })

    const quote = await Quote.create({
      leadId:       leadId || null,
      source:       'auto',
      prix_ht:      result.prix_ht,
      tva:          result.tva,
      prix_ttc:     result.prix_ttc,
      lignes_calcul: result.lignes_calcul,
      coefficients:  result.coefficients,
      warnings:      result.warnings,
      besoin_reprise_humaine: false,
      sources_calcul: result.sources_calcul,
      explication_calcul: result.explication_calcul,
      statut_devis:  'pending_human_validation',
      ajustement_manuel_ht: 0,
    })

    if (leadId && lead) {
      await Lead.findByIdAndUpdate(leadId, { statut: 'en_attente_validation' })

      const msgs = [`Devis calculé : ${result.prix_ttc.toFixed(2)} € TTC — EN ATTENTE VALIDATION HUMAINE`]
      if (result.warnings.length) msgs.push(`Warnings : ${result.warnings.join(' | ')}`)

      await Log.create({
        action: 'QUOTE_CALCULATED_PENDING_VALIDATION',
        leadId,
        status: 'success',
        message: msgs.join(' — '),
        payload: {
          quoteId:    String(quote._id),
          prix_ttc:   result.prix_ttc,
          warnings:   result.warnings,
          statut_devis: 'pending_human_validation',
        },
      })

      const FRONTEND_URL = process.env.FRONTEND_URL || 'https://neotravel-mvp.vercel.app'
      notifyQuoteReadyForReview({
        leadId:  String(leadId),
        quoteId: String(quote._id),
        client: {
          nom:       lead.nom,
          email:     lead.email,
          telephone: lead.telephone,
          societe:   lead.societe,
        },
        trajet: {
          depart:       lead.depart,
          destination:  lead.destination,
          date_depart:  lead.date_depart,
          date_retour:  lead.date_retour,
          nb_passagers: lead.nb_passagers,
          type_trajet:  lead.type_trajet,
          urgence:      lead.urgence,
        },
        quote: {
          prix_ht:               result.prix_ht,
          tva:                   result.tva,
          prix_ttc:              result.prix_ttc,
          warnings:              result.warnings,
          besoin_reprise_humaine: false,
          explication_calcul:    result.explication_calcul,
        },
        reviewUrl: `${FRONTEND_URL}/dashboard/leads/${leadId}`,
      })
    }

    res.status(201).json({
      ...quote.toObject(),
      distance_km:       result.distance_km,
      duree_estimee:     result.duree_estimee,
      warnings:          result.warnings,
      sources_calcul:    result.sources_calcul,
      explication_calcul: result.explication_calcul,
      statut_devis:      'pending_human_validation',
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur sauvegarde devis', error: String(err) })
  }
})

// POST /api/quotes/:id/approve — validation humaine obligatoire avant envoi
router.post('/:id/approve', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' })
    return
  }

  try {
    const quote = await Quote.findById(req.params.id)
    if (!quote) { res.status(404).json({ message: 'Devis introuvable.' }); return }

    if (!['pending_human_validation', 'needs_revision'].includes(quote.statut_devis)) {
      res.status(409).json({
        message: `Ce devis ne peut pas être approuvé (statut actuel : ${quote.statut_devis}).`,
        statut_devis: quote.statut_devis,
      })
      return
    }

    const lead = await Lead.findById(quote.leadId)
    if (!lead) { res.status(404).json({ message: 'Lead introuvable.' }); return }

    if (['reprise_humaine', 'cas_complexe'].includes(lead.statut)) {
      res.status(409).json({
        message: `Ce lead nécessite une reprise humaine manuelle (statut : ${lead.statut}). Résolvez le cas avant d'approuver.`,
      })
      return
    }

    const prixFinal = quote.prix_final_ttc || quote.prix_ttc
    if (!prixFinal || prixFinal <= 0) {
      res.status(422).json({ message: 'Prix invalide ou nul, impossible d\'approuver.' })
      return
    }

    quote.statut_devis = 'approved'
    quote.modifiedBy   = req.userId
    quote.modifiedAt   = new Date()
    await quote.save()

    await Lead.findByIdAndUpdate(lead._id, { statut: 'devis_valide' })

    await Log.create({
      action:  'QUOTE_APPROVED_BY_HUMAN',
      leadId:  lead._id,
      status:  'success',
      message: `Devis approuvé par ${req.userId} — TTC : ${prixFinal.toFixed(2)} € — prêt pour envoi client`,
      payload: { quoteId: String(quote._id), approvedBy: req.userId, prix_final_ttc: prixFinal },
    })

    res.json({
      message:     'Devis approuvé. Envoyez le devis depuis le dashboard.',
      statut_devis: 'approved',
      quoteId:     String(quote._id),
      prix_final_ttc: prixFinal,
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur approbation devis', error: String(err) })
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

    const { ajustement_manuel_ht, raison_ajustement, lignes_calcul } = req.body

    const oldHt  = quote.prix_final_ht || quote.prix_ht
    const oldTtc = quote.prix_final_ttc || quote.prix_ttc

    // Mise à jour des lignes individuelles — recalcul prix_ht depuis la somme
    if (Array.isArray(lignes_calcul) && lignes_calcul.length > 0) {
      quote.lignes_calcul = lignes_calcul
      const taux_tva = 0.20
      const nouveauHt = Math.round(lignes_calcul.reduce((s: number, l: { montant: number }) => s + (Number(l.montant) || 0), 0) * 100) / 100
      quote.prix_ht  = nouveauHt
      quote.tva      = Math.round(nouveauHt * taux_tva * 100) / 100
      quote.prix_ttc = Math.round(nouveauHt * (1 + taux_tva) * 100) / 100
    }

    if (ajustement_manuel_ht !== undefined) {
      quote.ajustement_manuel_ht = Number(ajustement_manuel_ht)
    }
    quote.raison_ajustement = raison_ajustement ?? quote.raison_ajustement ?? ''
    quote.modifiedBy        = req.userId
    quote.modifiedAt        = new Date()
    // prix_final recalculé par le pre-save hook (prix_ht + ajustement_manuel_ht)
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

// POST /api/quotes/:id/send — envoi client UNIQUEMENT après validation humaine
// Appelé par n8n (via N8N_INTERNAL_TOKEN) ou par le commercial depuis le dashboard.
// Le backend reste le garde-fou : vérifie statut_devis === 'approved' avant d'envoyer.
router.post('/:id/send', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' })
    return
  }

  try {
    const quote = await Quote.findById(req.params.id)
    if (!quote) { res.status(404).json({ message: 'Devis introuvable.' }); return }

    // Garde-fou 1 — le devis doit être approuvé par un humain
    if (quote.statut_devis !== 'approved') {
      res.status(409).json({
        message: `Envoi refusé : le devis doit être approuvé avant d'être envoyé au client (statut actuel : ${quote.statut_devis}).`,
        statut_devis: quote.statut_devis,
      })
      return
    }

    const lead = await Lead.findById(quote.leadId)
    if (!lead) { res.status(404).json({ message: 'Lead introuvable.' }); return }

    // Garde-fou 2 — pas d'envoi si cas complexe ou reprise humaine
    if (['reprise_humaine', 'cas_complexe'].includes(lead.statut)) {
      res.status(409).json({
        message: `Envoi refusé : ce lead est en statut "${lead.statut}" et nécessite une intervention manuelle.`,
      })
      return
    }

    // Garde-fou 3 — prix valide
    const prixFinal = quote.prix_final_ttc || quote.prix_ttc
    if (!prixFinal || prixFinal <= 0) {
      res.status(422).json({ message: 'Envoi refusé : prix invalide ou nul.' })
      return
    }

    try {
      await sendQuoteEmail(lead, quote)
    } catch (emailErr) {
      quote.statut_devis = 'email_error'
      await quote.save()
      await Lead.findByIdAndUpdate(lead._id, { statut: 'erreur_envoi' })
      await Log.create({
        action:  'EMAIL_FAILED',
        leadId:  lead._id,
        status:  'error',
        message: `Échec envoi devis à ${lead.email} : ${String(emailErr)}`,
        payload: { quoteId: String(quote._id) },
      }).catch(() => {})
      res.status(500).json({ message: 'Erreur envoi email devis', error: String(emailErr) })
      return
    }

    quote.statut_devis  = 'sent'
    quote.email_sent_at = new Date()
    await quote.save()
    await Lead.findByIdAndUpdate(lead._id, { statut: 'devis_envoye' })

    await Log.create({
      action:  'QUOTE_EMAIL_SENT',
      leadId:  lead._id,
      status:  'success',
      message: `Devis envoyé à ${lead.email} — TTC : ${prixFinal.toFixed(2)} € — déclenché par : ${req.userId}`,
      payload: { quoteId: String(quote._id), prix_final_ttc: prixFinal, sentBy: req.userId },
    })

    res.json({ message: 'Devis envoyé avec succès.', statut: 'devis_envoye', statut_devis: 'sent' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur envoi devis', error: String(err) })
  }
})

// GET /api/quotes/:id/pdf — générer le PDF du devis
router.get('/:id/pdf', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const quote = await Quote.findById(req.params.id).lean()
    if (!quote) { res.status(404).json({ message: 'Devis introuvable' }); return }

    const lead = await Lead.findById(quote.leadId).lean()
    if (!lead) { res.status(404).json({ message: 'Lead introuvable' }); return }

    // Client ne peut télécharger que ses propres devis
    if (req.userRole === 'client' && String(lead.userId) !== req.userId) {
      res.status(403).json({ message: 'Accès refusé.' })
      return
    }

    const ht  = quote.prix_final_ht  || quote.prix_ht
    const ttc = quote.prix_final_ttc || quote.prix_ttc
    const tva = Math.round((ttc - ht) * 100) / 100
    const coeffs = quote.coefficients as unknown as Record<string, number>
    const validite    = coeffs?.validite_jours || 30
    const distanceKm  = coeffs?.distance_km || null
    const tvaTaux     = coeffs?.tva ?? 0.10
    const isManual = quote.source === 'manuel_commercial'
    const devisNum = `DEV-${String(quote._id).slice(-8).toUpperCase()}`
    const dateStr  = new Date(quote.createdAt).toLocaleDateString('fr-FR')
    const validiteDate = new Date(quote.createdAt)
    validiteDate.setDate(validiteDate.getDate() + validite)

    const doc = new PDFDocument({ margin: 50, size: 'A4' })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="devis-${devisNum}.pdf"`)
    doc.pipe(res)

    // ── En-tête ──────────────────────────────────────────────────────────────
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#1E3A5F').text('NeoTravel', 50, 50)
    doc.fontSize(9).font('Helvetica').fillColor('#64748B')
       .text('Transport de groupe — Solutions sur mesure', 50, 76)

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E3A5F')
       .text(devisNum, 400, 50, { align: 'right' })
    doc.fontSize(9).font('Helvetica').fillColor('#64748B')
       .text(`Date : ${dateStr}`, 400, 65, { align: 'right' })
       .text(`Valide jusqu'au : ${validiteDate.toLocaleDateString('fr-FR')}`, 400, 80, { align: 'right' })

    doc.moveTo(50, 105).lineTo(545, 105).strokeColor('#E2E8F0').lineWidth(1).stroke()

    // ── Client ───────────────────────────────────────────────────────────────
    doc.y = 120
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B').text('CLIENT', 50)
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0F172A').text(lead.nom, 50, doc.y + 4)
    if (lead.societe) doc.fontSize(9).font('Helvetica').fillColor('#475569').text(lead.societe)
    doc.fontSize(9).font('Helvetica').fillColor('#475569')
       .text(lead.email)
       .text(lead.telephone || '')

    // ── Trajet ───────────────────────────────────────────────────────────────
    doc.y = 120
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B').text('TRAJET', 300)
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0F172A')
       .text(`${lead.depart} → ${lead.destination}`, 300, doc.y + 4)
    doc.fontSize(9).font('Helvetica').fillColor('#475569')
       .text(`Départ : ${lead.date_depart}${lead.date_retour ? `  •  Retour : ${lead.date_retour}` : ''}`, 300)
       .text(`${lead.nb_passagers} passager(s) — ${lead.type_trajet.replace('_', ' ')}${distanceKm ? ` — ${distanceKm} km` : ''}`, 300)

    doc.y = Math.max(doc.y, 220) + 20
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E2E8F0').lineWidth(0.5).stroke()
    doc.y += 15

    // ── Lignes devis ─────────────────────────────────────────────────────────
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B')
    const colLabel = 50, colFormule = 260, colMontant = 450
    doc.text('PRESTATION', colLabel, doc.y)
       .text('DÉTAIL', colFormule, doc.y - 9)
       .text('MONTANT HT', colMontant, doc.y - 9, { align: 'right', width: 95 })
    doc.y += 4
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#CBD5E1').lineWidth(0.5).stroke()
    doc.y += 8

    for (const ligne of quote.lignes_calcul) {
      const yStart = doc.y
      doc.fontSize(9).font('Helvetica').fillColor('#0F172A').text(ligne.label, colLabel, yStart, { width: 200 })
      if (ligne.formule) {
        doc.fontSize(8).font('Helvetica').fillColor('#94A3B8').text(ligne.formule, colFormule, yStart, { width: 180 })
      }
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#0F172A')
         .text(`${ligne.montant.toFixed(2)} €`, colMontant, yStart, { align: 'right', width: 95 })
      doc.y = Math.max(doc.y, yStart + 18)
    }

    // ── Totaux ───────────────────────────────────────────────────────────────
    doc.y += 10
    doc.moveTo(300, doc.y).lineTo(545, doc.y).strokeColor('#CBD5E1').lineWidth(0.5).stroke()
    doc.y += 8

    const remise = coeffs?.remise_pct || 0

    function totalRow(label: string, value: string, bold = false, highlight = false) {
      doc.fontSize(9)
         .font(bold ? 'Helvetica-Bold' : 'Helvetica')
         .fillColor(highlight ? '#1E3A5F' : '#475569')
         .text(label, 300, doc.y, { width: 140 })
         .text(value, 440, doc.y - 9, { align: 'right', width: 105 })
      doc.y += 16
    }

    totalRow('Total HT', `${ht.toFixed(2)} €`)
    if (remise > 0) totalRow(`Remise (${remise}%)`, `incluse`, false)
    totalRow(`TVA (${Math.round(tvaTaux * 100)} %)`, `${tva.toFixed(2)} €`)
    doc.y += 4
    doc.moveTo(300, doc.y).lineTo(545, doc.y).strokeColor('#1E3A5F').lineWidth(1).stroke()
    doc.y += 8
    totalRow('TOTAL TTC', `${ttc.toFixed(2)} €`, true, true)

    // ── Warnings ─────────────────────────────────────────────────────────────
    if (quote.warnings?.length) {
      doc.y += 10
      doc.fontSize(8).font('Helvetica').fillColor('#92400E')
         .text('Notes :', 50, doc.y)
      for (const w of quote.warnings) {
        doc.text(`• ${w}`, 60, doc.y + 4)
      }
    }

    // ── Conditions / explications ─────────────────────────────────────────────
    if (quote.explication_calcul) {
      doc.y += 15
      doc.fontSize(8).font('Helvetica').fillColor('#64748B')
         .text(quote.explication_calcul, 50, doc.y, { width: 495 })
    }

    // ── Pied de page ─────────────────────────────────────────────────────────
    const pageBottom = doc.page.height - 60
    doc.fontSize(8).font('Helvetica').fillColor('#94A3B8')
       .text(isManual ? 'Devis établi manuellement par un commercial NeoTravel' : 'Devis calculé automatiquement — source et coefficients traçables', 50, pageBottom, { align: 'center', width: 495 })
    doc.text('NeoTravel — contact@neotravel.fr — www.neotravel.fr', 50, pageBottom + 12, { align: 'center', width: 495 })

    await Log.create({
      action:  'PDF_DOWNLOADED',
      leadId:  lead._id,
      status:  'info',
      message: `PDF téléchargé pour devis ${devisNum}`,
      payload: { quoteId: quote._id, downloadedBy: req.userId },
    }).catch(() => {})

    doc.end()
  } catch (err) {
    res.status(500).json({ message: 'Erreur génération PDF', error: String(err) })
  }
})

// POST /api/quotes/:id/remind — envoyer une relance (appelable par n8n ou commercial)
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

    // Garde-fou 1 — le devis doit être envoyé
    if (quote.statut_devis !== 'sent') {
      res.status(409).json({
        message: `Relance impossible : le devis n'est pas encore envoyé (statut actuel : ${quote.statut_devis}).`,
        statut_devis: quote.statut_devis,
      })
      return
    }

    // Garde-fou 2 — pas de relance si lead accepté/refusé/clôturé/reprise
    if (STOP_STATUTS.includes(lead.statut)) {
      res.status(409).json({
        message: `Relance impossible : lead en statut "${lead.statut}".`,
        statut: lead.statut,
      })
      return
    }

    // Garde-fou 3 — max 2 relances automatiques
    const currentCount = quote.reminder_count ?? 0
    if (currentCount >= 2) {
      res.status(409).json({
        message: 'Relance impossible : le maximum de 2 relances automatiques est atteint pour ce devis.',
        reminder_count: currentCount,
      })
      return
    }

    const relanceLevel: 1 | 2  = currentCount === 0 ? 1 : 2
    const nextStatut: LeadStatus = relanceLevel === 1 ? 'relance_1' : 'relance_2'
    const logAction = relanceLevel === 1 ? 'QUOTE_REMINDER_1_SENT' : 'QUOTE_REMINDER_2_SENT'

    try {
      await sendQuoteReminderEmail(lead, quote, relanceLevel)
    } catch (emailErr) {
      await Log.create({
        action:  'QUOTE_REMINDER_ERROR',
        leadId:  lead._id,
        status:  'error',
        message: `Échec relance ${relanceLevel} à ${lead.email} : ${String(emailErr)}`,
        payload: { quoteId: String(quote._id), relanceLevel, triggeredBy: req.userId },
      }).catch(() => {})
      res.status(500).json({ message: `Erreur envoi relance ${relanceLevel}`, error: String(emailErr) })
      return
    }

    quote.reminder_count  = relanceLevel
    quote.lastReminderAt  = new Date()
    await quote.save()

    await Lead.findByIdAndUpdate(lead._id, { statut: nextStatut })

    await Log.create({
      action:  logAction,
      leadId:  lead._id,
      status:  'success',
      message: `Relance ${relanceLevel} envoyée à ${lead.email} — statut → ${nextStatut} — par : ${req.userId}`,
      payload: { quoteId: String(quote._id), relanceLevel, triggeredBy: req.userId },
    })

    res.json({ message: `Relance ${relanceLevel} envoyée.`, statut: nextStatut, relanceLevel, reminder_count: relanceLevel })
  } catch (err) {
    res.status(500).json({ message: 'Erreur relance', error: String(err) })
  }
})

export default router
