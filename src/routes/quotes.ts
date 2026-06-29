// @ts-nocheck
import { Router, Response } from 'express'
import PDFDocument from 'pdfkit'
import { calculer_devis, DevisInput } from '../services/calculer_devis'
import { QuoteDB, LeadDB, LogDB } from '../lib/db'
import { requireAuth, AuthRequest } from '../middleware/requireAuth'
import { sendQuoteEmail, sendComplexCaseEmail, sendQuoteReminderEmail } from '../services/email/emailService'
import { notifyQuoteReadyForReview } from '../services/n8nService'

type LeadStatus =
  | 'nouveau' | 'incomplet' | 'qualifie'
  | 'devis_genere' | 'en_attente_validation' | 'devis_valide'
  | 'devis_envoye' | 'relance_1' | 'relance_2'
  | 'accepte' | 'refuse' | 'cas_complexe' | 'reprise_humaine'
  | 'erreur_envoi' | 'cloture'

const STOP_STATUTS: LeadStatus[] = ['accepte', 'refuse', 'cloture', 'reprise_humaine', 'cas_complexe']

const router = Router()

// GET /api/quotes/reminders/due
router.get('/reminders/due', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' })
    return
  }

  try {
    const now = new Date()
    const H48 = 48 * 60 * 60 * 1000
    const H72 = 72 * 60 * 60 * 1000

    const quotes = await QuoteDB.findDueReminders()
    if (quotes.length === 0) { res.json([]); return }

    const leadIds  = quotes.map(q => q.leadId as string).filter(Boolean)
    const leads    = await QuoteDB.findByLeadIds(leadIds)
    const leadsMap = new Map(leads.map(l => [l.id, l]))

    const FRONTEND_URL = process.env.FRONTEND_URL || 'https://neotravel-mvp.vercel.app'
    const API_URL      = process.env.API_URL      || 'https://neotravel-mvp.onrender.com'

    const results: object[] = []

    for (const quote of quotes) {
      const lead = leadsMap.get(quote.leadId as string)
      if (!lead) continue
      if (STOP_STATUTS.includes(lead.statut as LeadStatus)) continue

      const count = quote.reminder_count ?? 0
      let dueForRelance = false
      let relanceLevel  = 1

      if (count === 0 && lead.statut === 'devis_envoye') {
        if (quote.email_sent_at && now.getTime() - new Date(quote.email_sent_at).getTime() >= H48) {
          dueForRelance = true; relanceLevel = 1
        }
      } else if (count === 1 && lead.statut === 'relance_1') {
        if (quote.lastReminderAt && now.getTime() - new Date(quote.lastReminderAt).getTime() >= H72) {
          dueForRelance = true; relanceLevel = 2
        }
      }

      if (!dueForRelance) continue

      results.push({
        leadId:  lead.id,
        quoteId: quote.id,
        relanceLevel,
        client: { nom: lead.nom, email: lead.email },
        trajet: { depart: lead.depart, destination: lead.destination, date_depart: lead.date_depart },
        quote: {
          prix_ttc:       quote.prix_final_ttc || quote.prix_ttc,
          sentAt:         quote.email_sent_at ?? null,
          lastReminderAt: quote.lastReminderAt ?? null,
        },
        trackingUrl: `${FRONTEND_URL}/suivi/${lead.trackingToken}`,
        pdfUrl:      `${API_URL}/api/quotes/${quote.id}/pdf`,
      })
    }

    res.json(results)
  } catch (err) {
    res.status(500).json({ message: 'Erreur reminders/due', error: String(err) })
  }
})

// POST /api/quotes/manual
router.post('/manual', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' })
    return
  }

  try {
    const { client, trajet, lignes, remise_pct, validite_jours, commentaire, conditions, leadId: existingLeadId } = req.body

    if (!client?.nom || !client?.email) {
      res.status(400).json({ message: 'Nom et email client requis.' }); return
    }
    if (!Array.isArray(lignes) || lignes.length === 0) {
      res.status(400).json({ message: 'Au moins une ligne de devis requise.' }); return
    }

    let leadId = existingLeadId
    if (!leadId) {
      const lead = await LeadDB.create({
        nom:          client.nom,
        email:        client.email,
        telephone:    client.telephone || '',
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
      leadId = lead.id
    }

    const computed_ht  = lignes.reduce((s: number, l: { total_ht: unknown }) => s + (Number(l.total_ht) || 0), 0)
    const computed_tva = lignes.reduce((s: number, l: { total_ht: unknown; tva_rate: unknown }) =>
      s + (Number(l.total_ht) || 0) * (Number(l.tva_rate) || 20) / 100, 0)
    const remise    = Math.max(0, Math.min(100, Number(remise_pct) || 0))
    const final_ht  = Math.round(computed_ht  * (1 - remise / 100) * 100) / 100
    const final_tva = Math.round(computed_tva * (1 - remise / 100) * 100) / 100
    const final_ttc = Math.round((final_ht + final_tva) * 100) / 100

    const quote = await QuoteDB.create({
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
      statut_devis:   'genere',
      ajustement_manuel_ht: 0,
      raison_ajustement:   commentaire || '',
      modifiedBy:  req.userId,
      modifiedAt:  new Date(),
    })

    if (!existingLeadId) {
      await LeadDB.findByIdAndUpdate(leadId, { statut: 'devis_genere' })
    }

    await LogDB.create({
      action:  'MANUAL_QUOTE_CREATED',
      leadId,
      status:  'info',
      message: `Devis manuel créé — HT : ${final_ht.toFixed(2)} € — TTC : ${final_ttc.toFixed(2)} €${remise > 0 ? ` (remise ${remise}%)` : ''}`,
      payload: { lignes: lignes.length, final_ht, final_tva, final_ttc, remise_pct: remise, createdBy: req.userId },
    })

    res.status(201).json({ ...quote, leadId })
  } catch (err) {
    res.status(500).json({ message: 'Erreur création devis manuel', error: String(err) })
  }
})

// POST /api/quotes/calculate
router.post('/calculate', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' })
    return
  }

  const { leadId } = req.body
  const lead = leadId ? await LeadDB.findById(leadId) : null
  if (leadId && !lead) { res.status(404).json({ message: 'Lead introuvable.' }); return }

  let input: DevisInput
  if (lead) {
    input = {
      depart:       lead.depart,
      destination:  lead.destination,
      date_depart:  lead.date_depart,
      date_retour:  lead.date_retour,
      nb_passagers: lead.nb_passagers,
      type_trajet:  lead.type_trajet as DevisInput['type_trajet'],
      options:      lead.options ?? [],
      urgence:      (lead.urgence ?? 'normal') as DevisInput['urgence'],
    }
  } else {
    const { leadId: _skip, ...rest } = req.body
    input = rest as DevisInput
  }

  const result = calculer_devis(input)

  if (!result.success) {
    if (leadId) {
      await LeadDB.findByIdAndUpdate(leadId, { statut: 'cas_complexe' }).catch(() => null)
      await LogDB.create({ action: 'QUOTE_FAILED', leadId, status: 'error', message: result.error, payload: { input } }).catch(() => null)
      if (lead) sendComplexCaseEmail(lead, result.raison_reprise_humaine ?? result.error).catch(() => {})
    }
    res.status(422).json({ message: result.error, hint: result.hint, besoin_reprise_humaine: result.besoin_reprise_humaine, raison_reprise_humaine: result.raison_reprise_humaine })
    return
  }

  if (result.besoin_reprise_humaine) {
    if (leadId) {
      await LeadDB.findByIdAndUpdate(leadId, { statut: 'reprise_humaine' }).catch(() => null)
      await LogDB.create({ action: 'QUOTE_NEEDS_HUMAN', leadId, status: 'warning', message: `Reprise humaine : ${result.raison_reprise_humaine}`, payload: { input } }).catch(() => null)
      if (lead) sendComplexCaseEmail(lead, result.raison_reprise_humaine ?? 'Reprise humaine').catch(() => {})
    }
    res.status(422).json({ message: result.raison_reprise_humaine ?? 'Reprise humaine requise.', besoin_reprise_humaine: true, raison_reprise_humaine: result.raison_reprise_humaine })
    return
  }

  try {
    if (leadId) await QuoteDB.deleteByLeadId(leadId)

    const quote = await QuoteDB.create({
      leadId: leadId || null,
      source: 'auto',
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
      ajustement_manuel_ht: 0,
    })

    if (leadId && lead) {
      await LeadDB.findByIdAndUpdate(leadId, { statut: 'en_attente_validation' })

      await LogDB.create({
        action: 'QUOTE_CALCULATED_PENDING_VALIDATION',
        leadId,
        status: 'success',
        message: `Devis calculé : ${result.prix_ttc.toFixed(2)} € TTC — EN ATTENTE VALIDATION`,
        payload: { quoteId: quote.id, prix_ttc: result.prix_ttc, warnings: result.warnings, statut_devis: 'pending_human_validation' },
      })

      const FRONTEND_URL = process.env.FRONTEND_URL || 'https://neotravel-mvp.vercel.app'
      notifyQuoteReadyForReview({
        leadId, quoteId: quote.id,
        client: { nom: lead.nom, email: lead.email, telephone: lead.telephone, societe: lead.societe },
        trajet: { depart: lead.depart, destination: lead.destination, date_depart: lead.date_depart, date_retour: lead.date_retour, nb_passagers: lead.nb_passagers, type_trajet: lead.type_trajet, urgence: lead.urgence },
        quote:  { prix_ht: result.prix_ht, tva: result.tva, prix_ttc: result.prix_ttc, warnings: result.warnings, besoin_reprise_humaine: false, explication_calcul: result.explication_calcul },
        reviewUrl: `${FRONTEND_URL}/dashboard/leads/${leadId}`,
      })
    }

    res.status(201).json({ ...quote, distance_km: result.distance_km, duree_estimee: result.duree_estimee, warnings: result.warnings, sources_calcul: result.sources_calcul, explication_calcul: result.explication_calcul, statut_devis: 'pending_human_validation' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur sauvegarde devis', error: String(err) })
  }
})

// POST /api/quotes/:id/approve
router.post('/:id/approve', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' })
    return
  }

  try {
    const quote = await QuoteDB.findById(req.params.id)
    if (!quote) { res.status(404).json({ message: 'Devis introuvable.' }); return }

    if (!['pending_human_validation', 'needs_revision'].includes(quote.statut_devis)) {
      res.status(409).json({ message: `Ce devis ne peut pas être approuvé (statut actuel : ${quote.statut_devis}).`, statut_devis: quote.statut_devis })
      return
    }

    const lead = await LeadDB.findById(quote.leadId as string)
    if (!lead) { res.status(404).json({ message: 'Lead introuvable.' }); return }

    if (['reprise_humaine', 'cas_complexe'].includes(lead.statut)) {
      res.status(409).json({ message: `Ce lead nécessite une reprise humaine (statut : ${lead.statut}).` })
      return
    }

    const prixFinal = quote.prix_final_ttc || quote.prix_ttc
    if (!prixFinal || prixFinal <= 0) {
      res.status(422).json({ message: 'Prix invalide ou nul, impossible d\'approuver.' }); return
    }

    await QuoteDB.update(quote.id, { statut_devis: 'approved', modifiedBy: req.userId, modifiedAt: new Date() })
    await LeadDB.findByIdAndUpdate(lead.id, { statut: 'devis_valide' })

    await LogDB.create({
      action: 'QUOTE_APPROVED_BY_HUMAN', leadId: lead.id, status: 'success',
      message: `Devis approuvé par ${req.userId} — TTC : ${prixFinal.toFixed(2)} €`,
      payload: { quoteId: quote.id, approvedBy: req.userId, prix_final_ttc: prixFinal },
    })

    res.json({ message: 'Devis approuvé. Envoyez le devis depuis le dashboard.', statut_devis: 'approved', quoteId: quote.id, prix_final_ttc: prixFinal })
  } catch (err) {
    res.status(500).json({ message: 'Erreur approbation devis', error: String(err) })
  }
})

// PATCH /api/quotes/:id
router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' })
    return
  }

  try {
    const quote = await QuoteDB.findById(req.params.id)
    if (!quote) { res.status(404).json({ message: 'Devis introuvable' }); return }

    const { ajustement_manuel_ht, raison_ajustement, lignes_calcul } = req.body

    const oldHt  = quote.prix_final_ht || quote.prix_ht
    const oldTtc = quote.prix_final_ttc || quote.prix_ttc

    const updates: Record<string, unknown> = {
      raison_ajustement: raison_ajustement ?? quote.raison_ajustement ?? '',
      modifiedBy: req.userId,
      modifiedAt: new Date(),
    }

    if (Array.isArray(lignes_calcul) && lignes_calcul.length > 0) {
      const taux_tva = 0.20
      const nouveauHt = Math.round(lignes_calcul.reduce((s: number, l: { montant: number }) => s + (Number(l.montant) || 0), 0) * 100) / 100
      updates.lignes_calcul = lignes_calcul
      updates.prix_ht  = nouveauHt
      updates.tva      = Math.round(nouveauHt * taux_tva * 100) / 100
      updates.prix_ttc = Math.round(nouveauHt * (1 + taux_tva) * 100) / 100
    }

    if (ajustement_manuel_ht !== undefined) {
      updates.ajustement_manuel_ht = Number(ajustement_manuel_ht)
    }

    const updated = await QuoteDB.update(quote.id, updates)

    await LogDB.create({
      action: 'QUOTE_UPDATED', leadId: quote.leadId as string, status: 'info',
      message: `Devis modifié — HT : ${oldHt} → ${updated?.prix_final_ht} | TTC : ${oldTtc} → ${updated?.prix_final_ttc}`,
      payload: { oldHt, oldTtc, newHt: updated?.prix_final_ht, newTtc: updated?.prix_final_ttc, ajustement: ajustement_manuel_ht, raison: raison_ajustement, modifiedBy: req.userId },
    })

    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: 'Erreur modification devis', error: String(err) })
  }
})

// POST /api/quotes/:id/send
router.post('/:id/send', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' })
    return
  }

  try {
    const quote = await QuoteDB.findById(req.params.id)
    if (!quote) { res.status(404).json({ message: 'Devis introuvable.' }); return }

    if (quote.statut_devis !== 'approved') {
      res.status(409).json({ message: `Envoi refusé : le devis doit être approuvé (statut actuel : ${quote.statut_devis}).`, statut_devis: quote.statut_devis })
      return
    }

    const lead = await LeadDB.findById(quote.leadId as string)
    if (!lead) { res.status(404).json({ message: 'Lead introuvable.' }); return }

    if (['reprise_humaine', 'cas_complexe'].includes(lead.statut)) {
      res.status(409).json({ message: `Envoi refusé : lead en statut "${lead.statut}".` }); return
    }

    const prixFinal = quote.prix_final_ttc || quote.prix_ttc
    if (!prixFinal || prixFinal <= 0) {
      res.status(422).json({ message: 'Envoi refusé : prix invalide ou nul.' }); return
    }

    try {
      await sendQuoteEmail(lead, quote)
    } catch (emailErr) {
      await QuoteDB.update(quote.id, { statut_devis: 'email_error' })
      await LeadDB.findByIdAndUpdate(lead.id, { statut: 'erreur_envoi' })
      await LogDB.create({ action: 'EMAIL_FAILED', leadId: lead.id, status: 'error', message: `Échec envoi devis à ${lead.email} : ${String(emailErr)}`, payload: { quoteId: quote.id } }).catch(() => {})
      res.status(500).json({ message: 'Erreur envoi email devis', error: String(emailErr) })
      return
    }

    await QuoteDB.update(quote.id, { statut_devis: 'sent', email_sent_at: new Date() })
    await LeadDB.findByIdAndUpdate(lead.id, { statut: 'devis_envoye' })

    await LogDB.create({
      action: 'QUOTE_EMAIL_SENT', leadId: lead.id, status: 'success',
      message: `Devis envoyé à ${lead.email} — TTC : ${prixFinal.toFixed(2)} € — déclenché par : ${req.userId}`,
      payload: { quoteId: quote.id, prix_final_ttc: prixFinal, sentBy: req.userId },
    })

    res.json({ message: 'Devis envoyé avec succès.', statut: 'devis_envoye', statut_devis: 'sent' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur envoi devis', error: String(err) })
  }
})

// GET /api/quotes/:id/pdf
router.get('/:id/pdf', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const quote = await QuoteDB.findById(req.params.id)
    if (!quote) { res.status(404).json({ message: 'Devis introuvable' }); return }

    const lead = await LeadDB.findById(quote.leadId as string)
    if (!lead) { res.status(404).json({ message: 'Lead introuvable' }); return }

    if (req.userRole === 'client' && lead.userId !== req.userId) {
      res.status(403).json({ message: 'Accès refusé.' }); return
    }

    const ht  = quote.prix_final_ht  || quote.prix_ht
    const ttc = quote.prix_final_ttc || quote.prix_ttc
    const tva = Math.round((ttc - ht) * 100) / 100
    const coeffs      = (quote.coefficients ?? {}) as Record<string, number>
    const validite    = coeffs.validite_jours || 30
    const distanceKm  = coeffs.distance_km || null
    const tvaTaux     = coeffs.tva ?? 0.10
    const isManual    = quote.source === 'manuel_commercial'
    const devisNum    = `DEV-${quote.id.slice(-8).toUpperCase()}`
    const dateStr     = new Date(quote.createdAt).toLocaleDateString('fr-FR')
    const validiteDate = new Date(quote.createdAt)
    validiteDate.setDate(validiteDate.getDate() + validite)

    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="devis-${devisNum}.pdf"`)
    doc.pipe(res)

    doc.fontSize(22).font('Helvetica-Bold').fillColor('#1E3A5F').text('NeoTravel', 50, 50)
    doc.fontSize(9).font('Helvetica').fillColor('#64748B').text('Transport de groupe — Solutions sur mesure', 50, 76)
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E3A5F').text(devisNum, 400, 50, { align: 'right' })
    doc.fontSize(9).font('Helvetica').fillColor('#64748B')
       .text(`Date : ${dateStr}`, 400, 65, { align: 'right' })
       .text(`Valide jusqu'au : ${validiteDate.toLocaleDateString('fr-FR')}`, 400, 80, { align: 'right' })
    doc.moveTo(50, 105).lineTo(545, 105).strokeColor('#E2E8F0').lineWidth(1).stroke()

    doc.y = 120
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B').text('CLIENT', 50)
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0F172A').text(lead.nom, 50, doc.y + 4)
    if (lead.societe) doc.fontSize(9).font('Helvetica').fillColor('#475569').text(lead.societe)
    doc.fontSize(9).font('Helvetica').fillColor('#475569').text(lead.email).text(lead.telephone || '')

    doc.y = 120
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B').text('TRAJET', 300)
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0F172A').text(`${lead.depart} → ${lead.destination}`, 300, doc.y + 4)
    doc.fontSize(9).font('Helvetica').fillColor('#475569')
       .text(`Départ : ${lead.date_depart}${lead.date_retour ? `  •  Retour : ${lead.date_retour}` : ''}`, 300)
       .text(`${lead.nb_passagers} passager(s) — ${lead.type_trajet.replace('_', ' ')}${distanceKm ? ` — ${distanceKm} km` : ''}`, 300)

    doc.y = Math.max(doc.y, 220) + 20
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E2E8F0').lineWidth(0.5).stroke()
    doc.y += 15

    const colLabel = 50, colFormule = 260, colMontant = 450
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B')
    doc.text('PRESTATION', colLabel, doc.y).text('DÉTAIL', colFormule, doc.y - 9).text('MONTANT HT', colMontant, doc.y - 9, { align: 'right', width: 95 })
    doc.y += 4
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#CBD5E1').lineWidth(0.5).stroke()
    doc.y += 8

    const lignes = (quote.lignes_calcul ?? []) as Array<{ label: string; montant: number; formule?: string }>
    for (const ligne of lignes) {
      const yStart = doc.y
      doc.fontSize(9).font('Helvetica').fillColor('#0F172A').text(ligne.label, colLabel, yStart, { width: 200 })
      if (ligne.formule) doc.fontSize(8).font('Helvetica').fillColor('#94A3B8').text(ligne.formule, colFormule, yStart, { width: 180 })
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#0F172A').text(`${ligne.montant.toFixed(2)} €`, colMontant, yStart, { align: 'right', width: 95 })
      doc.y = Math.max(doc.y, yStart + 18)
    }

    doc.y += 10
    doc.moveTo(300, doc.y).lineTo(545, doc.y).strokeColor('#CBD5E1').lineWidth(0.5).stroke()
    doc.y += 8

    const remise = coeffs.remise_pct || 0
    function totalRow(label: string, value: string, bold = false, highlight = false) {
      doc.fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(highlight ? '#1E3A5F' : '#475569')
         .text(label, 300, doc.y, { width: 140 }).text(value, 440, doc.y - 9, { align: 'right', width: 105 })
      doc.y += 16
    }

    totalRow('Total HT', `${ht.toFixed(2)} €`)
    if (remise > 0) totalRow(`Remise (${remise}%)`, 'incluse', false)
    totalRow(`TVA (${Math.round(tvaTaux * 100)} %)`, `${tva.toFixed(2)} €`)
    doc.y += 4
    doc.moveTo(300, doc.y).lineTo(545, doc.y).strokeColor('#1E3A5F').lineWidth(1).stroke()
    doc.y += 8
    totalRow('TOTAL TTC', `${ttc.toFixed(2)} €`, true, true)

    if ((quote.warnings as string[])?.length) {
      doc.y += 10
      doc.fontSize(8).font('Helvetica').fillColor('#92400E').text('Notes :', 50, doc.y)
      for (const w of (quote.warnings as string[])) doc.text(`• ${w}`, 60, doc.y + 4)
    }

    if (quote.explication_calcul) {
      doc.y += 15
      doc.fontSize(8).font('Helvetica').fillColor('#64748B').text(quote.explication_calcul, 50, doc.y, { width: 495 })
    }

    const pageBottom = doc.page.height - 60
    doc.fontSize(8).font('Helvetica').fillColor('#94A3B8')
       .text(isManual ? 'Devis établi manuellement par un commercial NeoTravel' : 'Devis calculé automatiquement — source et coefficients traçables', 50, pageBottom, { align: 'center', width: 495 })
       .text('NeoTravel — contact@neotravel.fr — www.neotravel.fr', 50, pageBottom + 12, { align: 'center', width: 495 })

    await LogDB.create({ action: 'PDF_DOWNLOADED', leadId: lead.id, status: 'info', message: `PDF téléchargé pour devis ${devisNum}`, payload: { quoteId: quote.id, downloadedBy: req.userId } }).catch(() => {})

    doc.end()
  } catch (err) {
    res.status(500).json({ message: 'Erreur génération PDF', error: String(err) })
  }
})

// POST /api/quotes/:id/remind
router.post('/:id/remind', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' })
    return
  }

  try {
    const quote = await QuoteDB.findById(req.params.id)
    if (!quote) { res.status(404).json({ message: 'Devis introuvable' }); return }

    const lead = await LeadDB.findById(quote.leadId as string)
    if (!lead) { res.status(404).json({ message: 'Lead introuvable' }); return }

    if (quote.statut_devis !== 'sent') {
      res.status(409).json({ message: `Relance impossible : devis non envoyé (statut : ${quote.statut_devis}).`, statut_devis: quote.statut_devis })
      return
    }

    if (STOP_STATUTS.includes(lead.statut as LeadStatus)) {
      res.status(409).json({ message: `Relance impossible : lead en statut "${lead.statut}".`, statut: lead.statut })
      return
    }

    const currentCount = quote.reminder_count ?? 0
    if (currentCount >= 2) {
      res.status(409).json({ message: 'Relance impossible : maximum 2 relances atteint.', reminder_count: currentCount })
      return
    }

    const relanceLevel: 1 | 2 = currentCount === 0 ? 1 : 2
    const nextStatut: LeadStatus = relanceLevel === 1 ? 'relance_1' : 'relance_2'
    const logAction = relanceLevel === 1 ? 'QUOTE_REMINDER_1_SENT' : 'QUOTE_REMINDER_2_SENT'

    try {
      await sendQuoteReminderEmail(lead, quote, relanceLevel)
    } catch (emailErr) {
      await LogDB.create({ action: 'QUOTE_REMINDER_ERROR', leadId: lead.id, status: 'error', message: `Échec relance ${relanceLevel} à ${lead.email} : ${String(emailErr)}`, payload: { quoteId: quote.id, relanceLevel, triggeredBy: req.userId } }).catch(() => {})
      res.status(500).json({ message: `Erreur envoi relance ${relanceLevel}`, error: String(emailErr) })
      return
    }

    await QuoteDB.update(quote.id, { reminder_count: relanceLevel, lastReminderAt: new Date() })
    await LeadDB.findByIdAndUpdate(lead.id, { statut: nextStatut })

    await LogDB.create({
      action: logAction, leadId: lead.id, status: 'success',
      message: `Relance ${relanceLevel} envoyée à ${lead.email} — statut → ${nextStatut}`,
      payload: { quoteId: quote.id, relanceLevel, triggeredBy: req.userId },
    })

    res.json({ message: `Relance ${relanceLevel} envoyée.`, statut: nextStatut, relanceLevel, reminder_count: relanceLevel })
  } catch (err) {
    res.status(500).json({ message: 'Erreur relance', error: String(err) })
  }
})

export default router
