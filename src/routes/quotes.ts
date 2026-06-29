import { Router, Request, Response } from 'express'
import PDFDocument from 'pdfkit'
import { calculer_devis, DevisInput } from '../services/calculer_devis'
import { supabase } from '../lib/supabase'
import { requireAuth, AuthRequest } from '../middleware/requireAuth'
import { sendQuoteEmail, sendComplexCaseEmail, sendQuoteReminderEmail } from '../services/email/emailService'

const router = Router()

// ─── Helper: log ─────────────────────────────────────────────────────────────

async function addLog(action: string, status: string, message: string, leadId?: string, payload?: Record<string, unknown>) {
  try { await supabase.from('logs').insert({ action, status, message, lead_id: leadId ?? null, payload: payload ?? null }) } catch {}
}

// ─── POST /api/quotes/manual ──────────────────────────────────────────────────

router.post('/manual', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest
  if (authReq.userRole === 'client') { res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' }); return }

  try {
    const { client, trajet, lignes, remise_pct, validite_jours, commentaire, conditions, leadId: existingLeadId } = req.body

    if (!client?.nom || !client?.email) { res.status(400).json({ message: 'Nom et email client requis.' }); return }
    if (!Array.isArray(lignes) || lignes.length === 0) { res.status(400).json({ message: 'Au moins une ligne de devis requise.' }); return }

    let leadId = existingLeadId
    if (!leadId) {
      const { data: newLead, error: leadErr } = await supabase.from('leads').insert({
        nom: client.nom, email: (client.email as string).toLowerCase(),
        telephone: client.telephone || 'non renseigné', societe: client.societe || '',
        depart: trajet?.depart || '', destination: trajet?.destination || '',
        date_depart: trajet?.date_depart || new Date().toISOString().split('T')[0],
        date_retour: trajet?.date_retour || null,
        nb_passagers: trajet?.nb_passagers || 1, type_trajet: trajet?.type_trajet || 'aller_simple',
        urgence: trajet?.urgence || 'normal', options: [], commentaire: commentaire || '',
        statut: 'devis_genere', score_completude: 80,
      }).select().single()
      if (leadErr || !newLead) { res.status(500).json({ message: 'Erreur création lead' }); return }
      leadId = newLead.id
    }

    const computed_ht  = (lignes as Array<{ total_ht: unknown; tva_rate: unknown }>).reduce((s, l) => s + (Number(l.total_ht) || 0), 0)
    const computed_tva = (lignes as Array<{ total_ht: unknown; tva_rate: unknown }>).reduce((s, l) => s + (Number(l.total_ht) || 0) * (Number(l.tva_rate) || 20) / 100, 0)
    const remise    = Math.max(0, Math.min(100, Number(remise_pct) || 0))
    const final_ht  = Math.round(computed_ht  * (1 - remise / 100) * 100) / 100
    const final_tva = Math.round(computed_tva * (1 - remise / 100) * 100) / 100
    const final_ttc = Math.round((final_ht + final_tva) * 100) / 100

    const { data: quote, error: quoteErr } = await supabase.from('quotes').insert({
      lead_id: leadId, source: 'manuel_commercial',
      prix_ht: final_ht, tva: final_tva, prix_ttc: final_ttc,
      prix_final_ht: final_ht, prix_final_ttc: final_ttc,
      lignes_calcul: (lignes as Array<{ label?: string; total_ht: unknown; quantity: unknown; unit_price_ht: unknown; unit: unknown; tva_rate: unknown }>).map(l => ({
        label: l.label || '', montant: Number(l.total_ht) || 0,
        formule: `${l.quantity} × ${l.unit_price_ht} ${l.unit}`,
        variables: { quantity: l.quantity, unit: l.unit, unit_price_ht: l.unit_price_ht, tva_rate: l.tva_rate },
        source_type: 'a_definir', justification: commentaire || 'Devis saisi manuellement',
      })),
      coefficients: { remise_pct: remise, validite_jours: Number(validite_jours) || 30 },
      warnings: remise > 0 ? [`Remise commerciale appliquée : ${remise}%`] : [],
      besoin_reprise_humaine: false,
      sources_calcul: [{ label: 'Devis manuel commercial', valeur: final_ttc, source_type: 'a_definir', justification: commentaire || 'Devis saisi manuellement' }],
      explication_calcul: conditions || '', statut_devis: 'genere', ajustement_manuel_ht: 0,
      raison_ajustement: commentaire || '', modified_by: authReq.userId, modified_at: new Date().toISOString(),
      validite_jours: Number(validite_jours) || 30,
    }).select().single()

    if (quoteErr || !quote) { res.status(500).json({ message: 'Erreur création devis' }); return }

    if (!existingLeadId) await supabase.from('leads').update({ statut: 'devis_genere' }).eq('id', leadId)

    await addLog('MANUAL_QUOTE_CREATED', 'info',
      `Devis manuel créé — HT : ${final_ht.toFixed(2)} € — TTC : ${final_ttc.toFixed(2)} €${remise > 0 ? ` (remise ${remise}%)` : ''}`,
      leadId, { lignes: lignes.length, final_ht, final_tva, final_ttc, remise_pct: remise, createdBy: authReq.userId })

    res.status(201).json({ ...quote, leadId })
  } catch (err) {
    res.status(500).json({ message: 'Erreur création devis manuel', error: String(err) })
  }
})

// ─── POST /api/quotes/calculate ───────────────────────────────────────────────

router.post('/calculate', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest
  if (authReq.userRole === 'client') { res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' }); return }

  const { leadId } = req.body
  let input: DevisInput

  if (leadId) {
    const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single()
    if (!lead) { res.status(404).json({ message: 'Lead introuvable.' }); return }
    input = {
      depart: lead.depart, destination: lead.destination, date_depart: lead.date_depart,
      date_retour: lead.date_retour, nb_passagers: lead.nb_passagers,
      type_trajet: lead.type_trajet, options: lead.options ?? [], urgence: lead.urgence ?? 'normal',
    }
  } else {
    const { leadId: _skip, ...rest } = req.body
    input = rest as DevisInput
  }

  const result = calculer_devis(input)

  if (!result.success) {
    if (leadId) {
      await addLog('QUOTE_FAILED', 'error', result.error, leadId, { input, besoin_reprise: result.besoin_reprise_humaine, hint: result.hint })
      if (result.besoin_reprise_humaine) {
        await supabase.from('leads').update({ statut: 'cas_complexe' }).eq('id', leadId)
        const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single()
        if (lead) sendComplexCaseEmail(lead, result.raison_reprise_humaine ?? result.error).catch(() => {})
      }
    }
    res.status(422).json({ message: result.error, hint: result.hint, besoin_reprise_humaine: result.besoin_reprise_humaine, raison_reprise_humaine: result.raison_reprise_humaine })
    return
  }

  try {
    if (leadId) await supabase.from('quotes').delete().eq('lead_id', leadId)

    const { data: quote, error: qErr } = await supabase.from('quotes').insert({
      lead_id: leadId || null,
      prix_ht: result.prix_ht, tva: result.tva, prix_ttc: result.prix_ttc,
      prix_final_ht: result.prix_ht, prix_final_ttc: result.prix_ttc,
      lignes_calcul: result.lignes_calcul, coefficients: result.coefficients,
      warnings: result.warnings, besoin_reprise_humaine: result.besoin_reprise_humaine,
      raison_reprise_humaine: result.raison_reprise_humaine ?? null,
      sources_calcul: result.sources_calcul, explication_calcul: result.explication_calcul,
      statut_devis: 'genere', ajustement_manuel_ht: 0, validite_jours: 30,
    }).select().single()
    if (qErr || !quote) { res.status(500).json({ message: 'Erreur sauvegarde devis' }); return }

    if (leadId) {
      await supabase.from('leads').update({ statut: 'devis_genere' }).eq('id', leadId)
      const msgs = [`Devis calculé : ${result.prix_ttc.toFixed(2)} € TTC`]
      if (result.warnings.length) msgs.push(`Warnings : ${result.warnings.join(' | ')}`)
      if (result.besoin_reprise_humaine) msgs.push(`⚠ Reprise humaine : ${result.raison_reprise_humaine}`)
      await addLog('QUOTE_CALCULATED', result.besoin_reprise_humaine ? 'warning' : 'success', msgs.join(' — '), leadId, { prix_ttc: result.prix_ttc, warnings: result.warnings })
    }

    res.status(201).json({ ...quote, distance_km: result.distance_km, duree_estimee: result.duree_estimee, warnings: result.warnings, besoin_reprise_humaine: result.besoin_reprise_humaine, raison_reprise_humaine: result.raison_reprise_humaine, sources_calcul: result.sources_calcul, explication_calcul: result.explication_calcul })
  } catch (err) {
    res.status(500).json({ message: 'Erreur sauvegarde devis', error: String(err) })
  }
})

// ─── PATCH /api/quotes/:id ────────────────────────────────────────────────────

router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest
  if (authReq.userRole === 'client') { res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' }); return }

  try {
    const { data: existing } = await supabase.from('quotes').select('*').eq('id', req.params.id).single()
    if (!existing) { res.status(404).json({ message: 'Devis introuvable' }); return }

    const { ajustement_manuel_ht, raison_ajustement } = req.body
    if (ajustement_manuel_ht === undefined) { res.status(400).json({ message: 'ajustement_manuel_ht requis.' }); return }

    const adj      = Number(ajustement_manuel_ht)
    const newFinalHt  = Math.round((existing.prix_ht  + adj) * 100) / 100
    const tvaPct      = existing.prix_ht > 0 ? existing.tva / existing.prix_ht : 0.10
    const newFinalTva = Math.round(newFinalHt * tvaPct * 100) / 100
    const newFinalTtc = Math.round((newFinalHt + newFinalTva) * 100) / 100

    const oldHt  = existing.prix_final_ht  || existing.prix_ht
    const oldTtc = existing.prix_final_ttc || existing.prix_ttc

    const { data: quote, error } = await supabase.from('quotes').update({
      ajustement_manuel_ht: adj, raison_ajustement: raison_ajustement ?? '',
      prix_final_ht: newFinalHt, prix_final_ttc: newFinalTtc,
      modified_by: authReq.userId, modified_at: new Date().toISOString(),
    }).eq('id', req.params.id).select().single()
    if (error || !quote) { res.status(500).json({ message: 'Erreur modification devis' }); return }

    await addLog('QUOTE_UPDATED', 'info',
      `Devis modifié — HT : ${oldHt} → ${newFinalHt} | TTC : ${oldTtc} → ${newFinalTtc}`,
      existing.lead_id, { oldHt, oldTtc, newHt: newFinalHt, newTtc: newFinalTtc, ajustement: adj, raison: raison_ajustement, modifiedBy: authReq.userId })

    res.json(quote)
  } catch (err) {
    res.status(500).json({ message: 'Erreur modification devis', error: String(err) })
  }
})

// ─── POST /api/quotes/:id/send ────────────────────────────────────────────────

router.post('/:id/send', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest
  if (authReq.userRole === 'client') { res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' }); return }

  try {
    const { data: quote } = await supabase.from('quotes').select('*').eq('id', req.params.id).single()
    if (!quote) { res.status(404).json({ message: 'Devis introuvable' }); return }

    const { data: lead } = await supabase.from('leads').select('*').eq('id', quote.lead_id).single()
    if (!lead) { res.status(404).json({ message: 'Lead introuvable' }); return }

    await sendQuoteEmail(lead, quote)
    await supabase.from('leads').update({ statut: 'devis_envoye' }).eq('id', lead.id)
    await addLog('QUOTE_SENT', 'success', `Devis envoyé par email à ${lead.email} — TTC : ${quote.prix_final_ttc || quote.prix_ttc} €`, lead.id)

    res.json({ message: 'Devis envoyé avec succès.', statut: 'devis_envoye' })
  } catch (err) {
    await addLog('EMAIL_FAILED', 'error', `Échec envoi devis : ${String(err)}`)
    res.status(500).json({ message: 'Erreur envoi devis', error: String(err) })
  }
})

// ─── GET /api/quotes/:id/pdf ──────────────────────────────────────────────────

router.get('/:id/pdf', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest
  try {
    const { data: quote } = await supabase.from('quotes').select('*').eq('id', req.params.id).single()
    if (!quote) { res.status(404).json({ message: 'Devis introuvable' }); return }

    const { data: lead } = await supabase.from('leads').select('*').eq('id', quote.lead_id).single()
    if (!lead) { res.status(404).json({ message: 'Lead introuvable' }); return }

    if (authReq.userRole === 'client' && lead.user_id !== authReq.userId) {
      res.status(403).json({ message: 'Accès refusé.' }); return
    }

    const ht  = Number(quote.prix_final_ht)  || Number(quote.prix_ht)
    const ttc = Number(quote.prix_final_ttc) || Number(quote.prix_ttc)
    const tva = Math.round((ttc - ht) * 100) / 100
    const coeffs       = (quote.coefficients as Record<string, number>) ?? {}
    const validite     = coeffs.validite_jours || quote.validite_jours || 30
    const distanceKm   = coeffs.distance_km || null
    const tvaTaux      = coeffs.tva ?? 0.10
    const isManual     = quote.source === 'manuel_commercial'
    const devisNum     = `DEV-${String(quote.id).slice(-8).toUpperCase()}`
    const dateStr      = new Date(quote.created_at).toLocaleDateString('fr-FR')
    const validiteDate = new Date(quote.created_at)
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
    doc.fontSize(9).font('Helvetica').fillColor('#475569').text(lead.email).text(lead.telephone)

    doc.y = 120
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B').text('TRAJET', 300)
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#0F172A').text(`${lead.depart} → ${lead.destination}`, 300, doc.y + 4)
    doc.fontSize(9).font('Helvetica').fillColor('#475569')
       .text(`Départ : ${lead.date_depart}${lead.date_retour ? `  •  Retour : ${lead.date_retour}` : ''}`, 300)
       .text(`${lead.nb_passagers} passager(s) — ${(lead.type_trajet as string).replace('_', ' ')}${distanceKm ? ` — ${distanceKm} km` : ''}`, 300)

    doc.y = Math.max(doc.y, 220) + 20
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E2E8F0').lineWidth(0.5).stroke()
    doc.y += 15

    const colLabel = 50, colFormule = 260, colMontant = 450
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B')
       .text('PRESTATION', colLabel, doc.y)
       .text('DÉTAIL', colFormule, doc.y - 9)
       .text('MONTANT HT', colMontant, doc.y - 9, { align: 'right', width: 95 })
    doc.y += 4
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#CBD5E1').lineWidth(0.5).stroke()
    doc.y += 8

    for (const ligne of (quote.lignes_calcul as Array<{ label: string; montant: number; formule?: string }>) ?? []) {
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
    if (remise > 0) totalRow(`Remise (${remise}%)`, 'incluse')
    totalRow(`TVA (${Math.round(tvaTaux * 100)} %)`, `${tva.toFixed(2)} €`)
    doc.y += 4
    doc.moveTo(300, doc.y).lineTo(545, doc.y).strokeColor('#1E3A5F').lineWidth(1).stroke()
    doc.y += 8
    totalRow('TOTAL TTC', `${ttc.toFixed(2)} €`, true, true)

    if ((quote.warnings as string[] | null)?.length) {
      doc.y += 10
      doc.fontSize(8).font('Helvetica').fillColor('#92400E').text('Notes :', 50, doc.y)
      for (const w of quote.warnings as string[]) doc.text(`• ${w}`, 60, doc.y + 4)
    }

    if (quote.explication_calcul) {
      doc.y += 15
      doc.fontSize(8).font('Helvetica').fillColor('#64748B').text(quote.explication_calcul as string, 50, doc.y, { width: 495 })
    }

    const pageBottom = doc.page.height - 60
    doc.fontSize(8).font('Helvetica').fillColor('#94A3B8')
       .text(isManual ? 'Devis établi manuellement par un commercial NeoTravel' : 'Devis calculé automatiquement — source et coefficients traçables', 50, pageBottom, { align: 'center', width: 495 })
       .text('NeoTravel — contact@neotravel.fr — www.neotravel.fr', 50, pageBottom + 12, { align: 'center', width: 495 })

    await addLog('PDF_DOWNLOADED', 'info', `PDF téléchargé pour devis ${devisNum}`, lead.id, { quoteId: quote.id, downloadedBy: authReq.userId })
    doc.end()
  } catch (err) {
    res.status(500).json({ message: 'Erreur génération PDF', error: String(err) })
  }
})

// ─── POST /api/quotes/:id/remind ─────────────────────────────────────────────

router.post('/:id/remind', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest
  if (authReq.userRole === 'client') { res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' }); return }

  try {
    const { data: quote } = await supabase.from('quotes').select('*').eq('id', req.params.id).single()
    if (!quote) { res.status(404).json({ message: 'Devis introuvable' }); return }

    const { data: lead } = await supabase.from('leads').select('*').eq('id', quote.lead_id).single()
    if (!lead) { res.status(404).json({ message: 'Lead introuvable' }); return }

    const nextStatut = lead.statut === 'relance_1' ? 'relance_2' : 'relance_1'

    await sendQuoteReminderEmail(lead, quote)
    await supabase.from('leads').update({ statut: nextStatut }).eq('id', lead.id)
    await addLog('REMINDER_SENT', 'success', `Relance envoyée à ${lead.email} — statut → ${nextStatut}`, lead.id)

    res.json({ message: 'Relance envoyée.', statut: nextStatut })
  } catch (err) {
    res.status(500).json({ message: 'Erreur relance', error: String(err) })
  }
})

export default router
