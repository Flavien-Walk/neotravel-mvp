import { Router, Response } from 'express'
import PDFDocument from 'pdfkit'
import { calculer_devis, DevisInput } from '../services/calculer_devis'
import { supabase } from '../lib/supabase'
import { requireAuth, AuthRequest } from '../middleware/requireAuth'
import { sendQuoteEmail, sendComplexCaseEmail, sendQuoteReminderEmail } from '../services/email/emailService'

const router = Router()

const TVA_TAUX = 0.10

// ─── Helper: log ─────────────────────────────────────────────────────────────

async function addLog(
  action: string,
  status: string,
  message: string,
  leadId?: string,
  payload?: Record<string, unknown>,
) {
  await supabase.from('logs').insert({
    action, status, message,
    lead_id: leadId ?? null,
    payload: payload ?? null,
  }).catch(() => {})
}

// ─── POST /api/quotes/manual ──────────────────────────────────────────────────

router.post('/manual', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' }); return
  }

  const { client, trajet, lignes, remise_pct, validite_jours, commentaire, conditions, leadId: existingLeadId } = req.body

  if (!client?.nom || !client?.email) {
    res.status(400).json({ message: 'Nom et email client requis.' }); return
  }
  if (!Array.isArray(lignes) || lignes.length === 0) {
    res.status(400).json({ message: 'Au moins une ligne de devis requise.' }); return
  }

  let leadId = existingLeadId
  if (!leadId) {
    const { data: newLead, error: leadError } = await supabase.from('leads').insert({
      nom:          client.nom,
      email:        (client.email as string).toLowerCase(),
      telephone:    client.telephone || 'non renseigné',
      societe:      client.societe || null,
      depart:       trajet?.depart || '',
      destination:  trajet?.destination || '',
      date_depart:  trajet?.date_depart || new Date().toISOString().split('T')[0],
      date_retour:  trajet?.date_retour || null,
      nb_passagers: trajet?.nb_passagers || 1,
      type_trajet:  trajet?.type_trajet || 'aller_simple',
      urgence:      trajet?.urgence || 'normal',
      options:      [],
      commentaire:  commentaire || null,
      statut:       'devis_genere',
      score_completude: 80,
    }).select().single()
    if (leadError || !newLead) { res.status(500).json({ message: leadError?.message ?? 'Erreur création lead' }); return }
    leadId = newLead.id
  }

  type Ligne = { label?: string; total_ht: unknown; quantity: unknown; unit_price_ht: unknown; unit: unknown; tva_rate: unknown }
  const computed_ht  = (lignes as Ligne[]).reduce((s, l) => s + (Number(l.total_ht) || 0), 0)
  const computed_tva = (lignes as Ligne[]).reduce((s, l) =>
    s + (Number(l.total_ht) || 0) * (Number(l.tva_rate) || 10) / 100, 0)
  const remise    = Math.max(0, Math.min(100, Number(remise_pct) || 0))
  const final_ht  = Math.round(computed_ht  * (1 - remise / 100) * 100) / 100
  const final_tva = Math.round(computed_tva * (1 - remise / 100) * 100) / 100
  const final_ttc = Math.round((final_ht + final_tva) * 100) / 100

  const { data: quote, error: quoteError } = await supabase.from('quotes').insert({
    lead_id:  leadId,
    source:   'manuel_commercial',
    prix_ht:  final_ht,
    tva:      final_tva,
    prix_ttc: final_ttc,
    lignes_calcul: (lignes as Ligne[]).map(l => ({
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
    sources_calcul: [{ label: 'Devis manuel commercial', valeur: final_ttc, source_type: 'a_definir', justification: commentaire || 'Devis saisi manuellement' }],
    explication_calcul: conditions || null,
    statut_devis:   'genere',
    ajustement_manuel_ht: 0,
    raison_ajustement: commentaire || null,
    prix_final_ht:  final_ht,
    prix_final_ttc: final_ttc,
    modified_by:    req.userId,
    modified_at:    new Date().toISOString(),
    validite_jours: Number(validite_jours) || 30,
  }).select().single()

  if (quoteError || !quote) { res.status(500).json({ message: quoteError?.message ?? 'Erreur création devis' }); return }

  if (!existingLeadId) {
    await supabase.from('leads').update({ statut: 'devis_genere' }).eq('id', leadId)
  }

  await addLog('MANUAL_QUOTE_CREATED', 'info',
    `Devis manuel créé — HT : ${final_ht.toFixed(2)} € — TTC : ${final_ttc.toFixed(2)} €${remise > 0 ? ` (remise ${remise}%)` : ''}`,
    leadId, { lignes: lignes.length, final_ht, final_tva, final_ttc, remise_pct: remise, createdBy: req.userId })

  res.status(201).json({ ...quote, leadId })
})

// ─── POST /api/quotes/calculate ───────────────────────────────────────────────

router.post('/calculate', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' }); return
  }

  const { leadId } = req.body
  let input: DevisInput

  if (leadId) {
    const { data: lead, error } = await supabase.from('leads').select('*').eq('id', leadId).single()
    if (error || !lead) { res.status(404).json({ message: 'Lead introuvable.' }); return }
    input = {
      depart:       lead.depart,
      destination:  lead.destination,
      date_depart:  lead.date_depart,
      date_retour:  lead.date_retour ?? undefined,
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

  if (!result.success) {
    if (leadId) {
      await addLog('QUOTE_FAILED', 'error', result.error ?? 'Échec calcul', leadId, { input, besoin_reprise: result.besoin_reprise_humaine })
      if (result.besoin_reprise_humaine) {
        const { data: lead } = await supabase.from('leads').update({ statut: 'cas_complexe' }).eq('id', leadId).select().single()
        if (lead) sendComplexCaseEmail(lead as never, result.raison_reprise_humaine ?? result.error ?? '').catch(() => {})
      }
    }
    res.status(422).json({
      message: result.error,
      hint: result.hint,
      besoin_reprise_humaine: result.besoin_reprise_humaine,
      raison_reprise_humaine: result.raison_reprise_humaine,
    }); return
  }

  if (leadId) {
    await supabase.from('quotes').delete().eq('lead_id', leadId)
  }

  const prix_final_ht  = Math.round((result.prix_ht + 0) * 100) / 100
  const prix_final_ttc = Math.round(prix_final_ht * (1 + TVA_TAUX) * 100) / 100

  const { data: quote, error: quoteError } = await supabase.from('quotes').insert({
    lead_id:                leadId ?? null,
    prix_ht:                result.prix_ht,
    tva:                    result.tva,
    prix_ttc:               result.prix_ttc,
    lignes_calcul:          result.lignes_calcul,
    coefficients:           result.coefficients,
    warnings:               result.warnings,
    besoin_reprise_humaine: result.besoin_reprise_humaine,
    raison_reprise_humaine: result.raison_reprise_humaine ?? null,
    sources_calcul:         result.sources_calcul,
    explication_calcul:     result.explication_calcul ?? null,
    statut_devis:           'genere',
    ajustement_manuel_ht:   0,
    prix_final_ht,
    prix_final_ttc,
    validite_jours:         30,
  }).select().single()

  if (quoteError || !quote) { res.status(500).json({ message: quoteError?.message ?? 'Erreur sauvegarde devis' }); return }

  if (leadId) {
    await supabase.from('leads').update({ statut: 'devis_genere' }).eq('id', leadId)
    const msgs = [`Devis calculé : ${result.prix_ttc.toFixed(2)} € TTC`]
    if (result.warnings.length) msgs.push(`Warnings : ${result.warnings.join(' | ')}`)
    await addLog('QUOTE_CALCULATED', result.besoin_reprise_humaine ? 'warning' : 'success', msgs.join(' — '), leadId, { prix_ttc: result.prix_ttc, warnings: result.warnings })
  }

  res.status(201).json({ ...quote, warnings: result.warnings, besoin_reprise_humaine: result.besoin_reprise_humaine, raison_reprise_humaine: result.raison_reprise_humaine, sources_calcul: result.sources_calcul, explication_calcul: result.explication_calcul })
})

// ─── PATCH /api/quotes/:id ────────────────────────────────────────────────────

router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' }); return
  }

  const { data: quote, error } = await supabase.from('quotes').select('*').eq('id', req.params.id).single()
  if (error || !quote) { res.status(404).json({ message: 'Devis introuvable' }); return }

  const { ajustement_manuel_ht, raison_ajustement } = req.body
  if (ajustement_manuel_ht === undefined) { res.status(400).json({ message: 'ajustement_manuel_ht requis.' }); return }

  const prix_final_ht  = Math.round((quote.prix_ht + Number(ajustement_manuel_ht)) * 100) / 100
  const prix_final_ttc = Math.round(prix_final_ht * (1 + TVA_TAUX) * 100) / 100

  const { data: updated, error: updateError } = await supabase
    .from('quotes')
    .update({
      ajustement_manuel_ht: Number(ajustement_manuel_ht),
      raison_ajustement:    raison_ajustement ?? '',
      prix_final_ht,
      prix_final_ttc,
      modified_by: req.userId,
      modified_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .select()
    .single()

  if (updateError || !updated) { res.status(500).json({ message: 'Erreur modification devis' }); return }

  await addLog('QUOTE_UPDATED', 'info',
    `Devis modifié — HT : ${quote.prix_final_ht} → ${prix_final_ht} | TTC : ${quote.prix_final_ttc} → ${prix_final_ttc}`,
    quote.lead_id, { ajustement: ajustement_manuel_ht, raison: raison_ajustement, modifiedBy: req.userId })

  res.json(updated)
})

// ─── POST /api/quotes/:id/send ────────────────────────────────────────────────

router.post('/:id/send', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' }); return
  }

  const { data: quote, error } = await supabase.from('quotes').select('*').eq('id', req.params.id).single()
  if (error || !quote) { res.status(404).json({ message: 'Devis introuvable' }); return }

  const { data: lead, error: leadError } = await supabase.from('leads').select('*').eq('id', quote.lead_id).single()
  if (leadError || !lead) { res.status(404).json({ message: 'Lead introuvable' }); return }

  try {
    await sendQuoteEmail(lead as never, quote as never)
    await supabase.from('quotes').update({ email_sent_at: new Date().toISOString() }).eq('id', quote.id)
    await supabase.from('leads').update({ statut: 'devis_envoye' }).eq('id', lead.id)
    await addLog('QUOTE_SENT', 'success', `Devis envoyé à ${lead.email} — TTC : ${quote.prix_final_ttc || quote.prix_ttc} €`, lead.id)
    res.json({ message: 'Devis envoyé avec succès.', statut: 'devis_envoye' })
  } catch (err) {
    await addLog('EMAIL_FAILED', 'error', `Échec envoi devis : ${String(err)}`)
    res.status(500).json({ message: 'Erreur envoi devis', error: String(err) })
  }
})

// ─── GET /api/quotes/:id/pdf ──────────────────────────────────────────────────

router.get('/:id/pdf', requireAuth, async (req: AuthRequest, res: Response) => {
  const { data: quote, error } = await supabase.from('quotes').select('*').eq('id', req.params.id).single()
  if (error || !quote) { res.status(404).json({ message: 'Devis introuvable' }); return }

  const { data: lead, error: leadError } = await supabase.from('leads').select('*').eq('id', quote.lead_id).single()
  if (leadError || !lead) { res.status(404).json({ message: 'Lead introuvable' }); return }

  if (req.userRole === 'client' && lead.user_id !== req.userId) {
    res.status(403).json({ message: 'Accès refusé.' }); return
  }

  const ht  = quote.prix_final_ht  || quote.prix_ht
  const ttc = quote.prix_final_ttc || quote.prix_ttc
  const tva = Math.round((ttc - ht) * 100) / 100
  const tvaPct = Math.round(TVA_TAUX * 100)
  const validite    = (quote.coefficients as Record<string, number>)?.validite_jours || 30
  const isManual    = quote.source === 'manuel_commercial'
  const devisNum    = `DEV-${String(quote.id).slice(-8).toUpperCase()}`
  const dateStr     = new Date(quote.created_at).toLocaleDateString('fr-FR')
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
     .text(`${lead.nb_passagers} passager(s) — ${lead.type_trajet.replace('_', ' ')}`, 300)

  doc.y = Math.max(doc.y, 220) + 20
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#E2E8F0').lineWidth(0.5).stroke()
  doc.y += 15

  const colLabel = 50, colFormule = 260, colMontant = 450
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748B')
  doc.text('PRESTATION', colLabel, doc.y).text('DÉTAIL', colFormule, doc.y - 9).text('MONTANT HT', colMontant, doc.y - 9, { align: 'right', width: 95 })
  doc.y += 4
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#CBD5E1').lineWidth(0.5).stroke()
  doc.y += 8

  for (const ligne of (quote.lignes_calcul as Array<{ label: string; formule?: string; montant: number }>)) {
    const yStart = doc.y
    doc.fontSize(9).font('Helvetica').fillColor('#0F172A').text(ligne.label, colLabel, yStart, { width: 200 })
    if (ligne.formule) doc.fontSize(8).font('Helvetica').fillColor('#94A3B8').text(ligne.formule, colFormule, yStart, { width: 180 })
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#0F172A').text(`${ligne.montant.toFixed(2)} €`, colMontant, yStart, { align: 'right', width: 95 })
    doc.y = Math.max(doc.y, yStart + 18)
  }

  doc.y += 10
  doc.moveTo(300, doc.y).lineTo(545, doc.y).strokeColor('#CBD5E1').lineWidth(0.5).stroke()
  doc.y += 8

  const remise = (quote.coefficients as Record<string, number>)?.remise_pct || 0
  function totalRow(label: string, value: string, bold = false, highlight = false) {
    doc.fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor(highlight ? '#1E3A5F' : '#475569')
       .text(label, 300, doc.y, { width: 140 }).text(value, 440, doc.y - 9, { align: 'right', width: 105 })
    doc.y += 16
  }
  totalRow('Total HT', `${ht.toFixed(2)} €`)
  if (remise > 0) totalRow(`Remise (${remise}%)`, 'incluse')
  totalRow(`TVA (${tvaPct}%)`, `${tva.toFixed(2)} €`)
  doc.y += 4
  doc.moveTo(300, doc.y).lineTo(545, doc.y).strokeColor('#1E3A5F').lineWidth(1).stroke()
  doc.y += 8
  totalRow('TOTAL TTC', `${ttc.toFixed(2)} €`, true, true)

  if ((quote.warnings as string[])?.length) {
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

  await addLog('PDF_DOWNLOADED', 'info', `PDF téléchargé pour devis ${devisNum}`, lead.id, { quoteId: quote.id, downloadedBy: req.userId })
  doc.end()
})

// ─── POST /api/quotes/:id/remind ──────────────────────────────────────────────

router.post('/:id/remind', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.userRole === 'client') {
    res.status(403).json({ message: 'Action réservée aux commerciaux NeoTravel.' }); return
  }

  const { data: quote, error } = await supabase.from('quotes').select('*').eq('id', req.params.id).single()
  if (error || !quote) { res.status(404).json({ message: 'Devis introuvable' }); return }

  const { data: lead, error: leadError } = await supabase.from('leads').select('*').eq('id', quote.lead_id).single()
  if (leadError || !lead) { res.status(404).json({ message: 'Lead introuvable' }); return }

  const nextStatut = lead.statut === 'relance_1' ? 'relance_2' : 'relance_1'

  await sendQuoteReminderEmail(lead as never, quote as never)
  await supabase.from('leads').update({ statut: nextStatut }).eq('id', lead.id)
  await addLog('REMINDER_SENT', 'success', `Relance envoyée à ${lead.email} — statut → ${nextStatut}`, lead.id)

  res.json({ message: 'Relance envoyée.', statut: nextStatut })
})

export default router
