import { FRONTEND_URL } from './brevoClient'
import type { IUser } from '../../models/User'
import type { ILead } from '../../models/Lead'
import type { IQuote } from '../../models/Quote'

const BASE_STYLE = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  max-width: 600px; margin: 0 auto; background: #ffffff; color: #1a1a2e;
`

function layout(title: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="background:#f0f5ff; padding: 32px 16px;">
<div style="${BASE_STYLE}">
  <div style="background:#1e3a8a; padding:20px 28px; border-radius:12px 12px 0 0;">
    <span style="font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.5px;">NeoTravel</span>
    <span style="font-size:11px;color:#93c5fd;margin-left:8px;font-weight:500;">Transport de groupe</span>
  </div>
  <div style="background:#fff;padding:32px 28px;border-radius:0 0 12px 12px;border:1px solid #dbeafe;">
    ${body}
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px;">
    NeoTravel · plateforme d'intermédiation transport de groupe<br>
    Vous recevez cet email car vous avez interagi avec NeoTravel.
  </p>
</div></body></html>`
}

function btn(label: string, url: string): string {
  return `<div style="margin:24px 0;">
    <a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;
      font-weight:700;font-size:15px;padding:13px 28px;border-radius:8px;
      text-decoration:none;">
      ${label}
    </a>
  </div>`
}

function h1(text: string): string {
  return `<h1 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 8px;">${text}</h1>`
}

function p(text: string, color = '#334155'): string {
  return `<p style="font-size:15px;line-height:1.6;color:${color};margin:0 0 12px;">${text}</p>`
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">`
}

// ─── Templates ────────────────────────────────────────────────────────────────

export function tplWelcome(user: IUser): { subject: string; html: string; text: string } {
  const roleLabel = user.role === 'commercial' ? 'Commercial NeoTravel' : user.role === 'admin' ? 'Administrateur' : 'Client'
  const body = `
    ${h1(`Bienvenue sur NeoTravel, ${user.nom} !`)}
    ${p(`Votre compte a été créé avec succès. Vous êtes enregistré en tant que <strong>${roleLabel}</strong>.`)}
    ${p('NeoTravel centralise les demandes de transport de groupe et vous aide à suivre vos leads, générer des devis fiables et relancer automatiquement.')}
    ${btn('Accéder au dashboard', `${FRONTEND_URL}/dashboard`)}
    ${divider()}
    ${p('Si vous n\'avez pas créé ce compte, ignorez cet email ou contactez-nous.', '#94a3b8')}
  `
  return {
    subject: `Bienvenue sur NeoTravel, ${user.nom} !`,
    html: layout('Bienvenue sur NeoTravel', body),
    text: `Bonjour ${user.nom}, votre compte NeoTravel a été créé. Rendez-vous sur ${FRONTEND_URL}/dashboard`,
  }
}

export function tplPasswordReset(user: IUser, token: string): { subject: string; html: string; text: string } {
  const url = `${FRONTEND_URL}/reset-password?token=${token}`
  const body = `
    ${h1('Réinitialisation de votre mot de passe')}
    ${p(`Bonjour ${user.nom},`)}
    ${p('Vous avez demandé à réinitialiser votre mot de passe NeoTravel. Cliquez sur le bouton ci-dessous — ce lien expire dans <strong>1 heure</strong>.')}
    ${btn('Réinitialiser mon mot de passe', url)}
    ${divider()}
    ${p('Si vous n\'avez pas fait cette demande, ignorez cet email. Votre mot de passe reste inchangé.', '#94a3b8')}
    ${p(`Lien direct : <a href="${url}" style="color:#2563eb;">${url}</a>`, '#94a3b8')}
  `
  return {
    subject: 'Réinitialisation de votre mot de passe NeoTravel',
    html: layout('Réinitialisation mot de passe', body),
    text: `Réinitialisez votre mot de passe NeoTravel : ${url} (valable 1h)`,
  }
}

export function tplPasswordChanged(user: IUser): { subject: string; html: string; text: string } {
  const body = `
    ${h1('Votre mot de passe a été modifié')}
    ${p(`Bonjour ${user.nom},`)}
    ${p('Votre mot de passe NeoTravel a bien été modifié.')}
    ${p('Si vous n\'êtes pas à l\'origine de cette modification, contactez-nous immédiatement à <a href="mailto:contact@neotravel.fr" style="color:#2563eb;">contact@neotravel.fr</a>.', '#dc2626')}
    ${btn('Se connecter', `${FRONTEND_URL}/login`)}
  `
  return {
    subject: 'Votre mot de passe NeoTravel a été modifié',
    html: layout('Mot de passe modifié', body),
    text: `Votre mot de passe NeoTravel a été modifié. Si ce n'était pas vous, contactez contact@neotravel.fr`,
  }
}

export function tplLeadReceived(lead: ILead): { subject: string; html: string; text: string } {
  const body = `
    ${h1('Votre demande de transport a bien été reçue')}
    ${p(`Bonjour ${lead.nom},`)}
    ${p(`Nous avons bien reçu votre demande de transport de groupe :`)}
    <div style="background:#f0f5ff;border-radius:8px;padding:16px 20px;margin:12px 0 20px;">
      <p style="margin:0 0 6px;font-size:14px;color:#1e3a8a;"><strong>Trajet :</strong> ${lead.depart} → ${lead.destination}</p>
      <p style="margin:0 0 6px;font-size:14px;color:#1e3a8a;"><strong>Date :</strong> ${new Date(lead.date_depart).toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
      <p style="margin:0;font-size:14px;color:#1e3a8a;"><strong>Passagers :</strong> ${lead.nb_passagers} personnes</p>
    </div>
    ${p('Un conseiller NeoTravel va qualifier votre demande et vous enverra un devis dans les <strong>2 heures ouvrées</strong>.')}
    ${p('Ce devis est entièrement <strong>gratuit et sans engagement</strong>.')}
    ${lead.trackingToken ? btn('Suivre ma demande en temps réel', `${FRONTEND_URL}/suivi/${lead.trackingToken}`) : ''}
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin:16px 0;">
      <p style="margin:0;font-size:13px;color:#166534;">
        <strong>Suivi sans compte :</strong> vous pouvez consulter l'avancement de votre dossier à tout moment via le lien ci-dessus, sans créer de compte.
      </p>
    </div>
    ${divider()}
    ${p('En cas de question, répondez directement à cet email ou contactez <a href="mailto:commercial@neotravel.fr" style="color:#2563eb;">commercial@neotravel.fr</a>.', '#64748b')}
  `
  return {
    subject: `Votre demande ${lead.depart} → ${lead.destination} a bien été reçue`,
    html: layout('Demande reçue', body),
    text: `Votre demande NeoTravel (${lead.depart} → ${lead.destination}, ${lead.nb_passagers} pax) est bien enregistrée. Réponse sous 2h ouvrées.${lead.trackingToken ? ` Suivez votre demande : ${FRONTEND_URL}/suivi/${lead.trackingToken}` : ''}`,
  }
}

export function tplNewLeadInternal(lead: ILead): { subject: string; html: string; text: string } {
  const urgenceLabel: Record<string, string> = { normal: 'Normal', urgent: '⚠️ Urgent', tres_urgent: '🔴 Très urgent' }
  const dashUrl = `${FRONTEND_URL}/dashboard/leads/${lead._id}`
  const body = `
    ${h1('Nouveau lead à qualifier')}
    <div style="background:#fefce8;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:16px 20px;margin:16px 0;">
      <p style="margin:0 0 4px;font-weight:700;color:#92400e;">Urgence : ${urgenceLabel[lead.urgence] ?? lead.urgence}</p>
      <p style="margin:0;font-size:13px;color:#78350f;">Score de complétude : ${lead.score_completude}%</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:12px 0 20px;">
      ${[
        ['Nom', lead.nom], ['Email', lead.email], ['Téléphone', lead.telephone],
        ['Trajet', `${lead.depart} → ${lead.destination}`],
        ['Date', lead.date_depart], ['Passagers', `${lead.nb_passagers}`],
        ['Type', lead.type_trajet.replace('_', ' ')],
        ...(lead.commentaire ? [['Commentaire', lead.commentaire]] : []),
      ].map(([k, v]) => `
        <tr>
          <td style="padding:6px 12px 6px 0;color:#64748b;white-space:nowrap;">${k}</td>
          <td style="padding:6px 0;font-weight:500;color:#0f172a;">${v}</td>
        </tr>
      `).join('')}
    </table>
    ${btn('Ouvrir dans le dashboard', dashUrl)}
  `
  return {
    subject: `🆕 Nouveau lead : ${lead.nom} — ${lead.depart} → ${lead.destination}`,
    html: layout('Nouveau lead', body),
    text: `Nouveau lead NeoTravel : ${lead.nom} (${lead.email}) — ${lead.depart} → ${lead.destination} — ${lead.nb_passagers} pax — ${FRONTEND_URL}/dashboard`,
  }
}

export function tplQuote(lead: ILead, quote: IQuote): { subject: string; html: string; text: string } {
  const fmt = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
  const rows = (quote.lignes_calcul ?? []).map((l: { label: string; montant: number; detail?: string }) => `
    <tr>
      <td style="padding:8px 0;color:#334155;font-size:14px;">
        ${l.label}
        ${l.detail ? `<br><span style="color:#94a3b8;font-size:12px;">${l.detail}</span>` : ''}
      </td>
      <td style="padding:8px 0;text-align:right;font-weight:600;color:#1e3a8a;white-space:nowrap;font-size:14px;">${fmt(l.montant)}</td>
    </tr>
  `).join('')

  const body = `
    ${h1('Votre devis NeoTravel est prêt')}
    ${p(`Bonjour ${lead.nom},`)}
    ${p(`Voici votre devis pour le trajet <strong>${lead.depart} → ${lead.destination}</strong> (${lead.nb_passagers} passagers) :`)}

    <div style="background:#f0f5ff;border-radius:12px;padding:20px 24px;margin:16px 0;">
      <div style="font-size:32px;font-weight:800;color:#1e3a8a;">${fmt(quote.prix_final_ttc || quote.prix_ttc)}</div>
      <div style="color:#64748b;font-size:13px;">TTC · dont ${fmt(quote.prix_final_ht || quote.prix_ht)} HT + ${fmt(quote.tva)} TVA (10%)</div>
      ${quote.ajustement_manuel_ht && quote.ajustement_manuel_ht !== 0 ? `<div style="color:#92400e;font-size:12px;margin-top:6px;">Dont ajustement commercial : ${fmt(quote.ajustement_manuel_ht)} HT${quote.raison_ajustement ? ` (${quote.raison_ajustement})` : ''}</div>` : ''}
    </div>

    <table style="width:100%;border-collapse:collapse;border-top:1px solid #e2e8f0;">
      ${rows}
    </table>

    ${divider()}
    ${p('<strong>Note de calcul :</strong> Ce devis est calculé par un moteur déterministe basé sur des règles métier explicites, et non par une IA. Il est vérifiable et traçable.', '#64748b')}
    ${p('Ce devis est <strong>gratuit et sans engagement</strong>. Pour l\'accepter ou demander des précisions, répondez directement à cet email.')}
    ${lead.trackingToken ? btn('Suivre mon dossier en ligne', `${FRONTEND_URL}/suivi/${lead.trackingToken}`) : btn('Contacter un conseiller', 'mailto:commercial@neotravel.fr')}
    ${p('Un conseiller NeoTravel prend en charge les demandes spéciales ou les groupes de grande taille.', '#64748b')}
  `
  return {
    subject: `Votre devis NeoTravel — ${lead.depart} → ${lead.destination} — ${fmt(quote.prix_final_ttc || quote.prix_ttc)} TTC`,
    html: layout('Votre devis', body),
    text: `Votre devis NeoTravel pour ${lead.depart} → ${lead.destination} : ${fmt(quote.prix_final_ttc || quote.prix_ttc)} TTC. Gratuit et sans engagement.${lead.trackingToken ? ` Suivez votre dossier : ${FRONTEND_URL}/suivi/${lead.trackingToken}` : ''}`,
  }
}

export function tplQuoteReminder(lead: ILead, quote: IQuote): { subject: string; html: string; text: string } {
  const fmt = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
  const body = `
    ${h1('Votre devis NeoTravel est toujours disponible')}
    ${p(`Bonjour ${lead.nom},`)}
    ${p(`Nous souhaitions revenir vers vous concernant votre demande de transport <strong>${lead.depart} → ${lead.destination}</strong>.`)}
    <div style="background:#f0f5ff;border-radius:8px;padding:16px 20px;margin:12px 0 20px;">
      <p style="margin:0 0 4px;font-size:14px;color:#1e3a8a;"><strong>Trajet :</strong> ${lead.depart} → ${lead.destination}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#1e3a8a;"><strong>Passagers :</strong> ${lead.nb_passagers}</p>
      <p style="margin:0;font-size:22px;font-weight:800;color:#1e3a8a;">${fmt(quote.prix_ttc)} TTC</p>
    </div>
    ${p('Si vous avez des questions ou souhaitez modifier certains aspects, un conseiller NeoTravel peut vous aider.')}
    ${btn('Contacter un conseiller', `mailto:commercial@neotravel.fr`)}
    ${divider()}
    ${p('Si votre projet est annulé, vous pouvez ignorer cet email. Aucun engagement de votre part.', '#94a3b8')}
  `
  return {
    subject: `Rappel : votre devis NeoTravel ${lead.depart} → ${lead.destination}`,
    html: layout('Rappel devis', body),
    text: `Rappel NeoTravel : votre devis ${lead.depart} → ${lead.destination} (${fmt(quote.prix_ttc)} TTC) est toujours disponible. Contactez commercial@neotravel.fr`,
  }
}

export function tplComplexCase(lead: ILead, reason: string): { subject: string; html: string; text: string } {
  const dashUrl = `${FRONTEND_URL}/dashboard/leads/${lead._id}`
  const body = `
    ${h1('Cas complexe — Reprise humaine nécessaire')}
    <div style="background:#fef2f2;border-left:4px solid #ef4444;border-radius:0 8px 8px 0;padding:16px 20px;margin:16px 0;">
      <p style="margin:0;font-weight:700;color:#991b1b;">Raison : ${reason}</p>
    </div>
    ${p(`<strong>Lead :</strong> ${lead.nom} (${lead.email})`)}
    ${p(`<strong>Trajet :</strong> ${lead.depart} → ${lead.destination} — ${lead.nb_passagers} pax`)}
    ${p(`<strong>Score complétude :</strong> ${lead.score_completude}%`)}
    ${lead.commentaire ? p(`<strong>Commentaire client :</strong> ${lead.commentaire}`) : ''}
    ${btn('Ouvrir le lead dans le dashboard', dashUrl)}
  `
  return {
    subject: `⚠️ Cas complexe à reprendre : ${lead.nom} — ${lead.depart} → ${lead.destination}`,
    html: layout('Cas complexe', body),
    text: `Cas complexe NeoTravel : ${lead.nom} — ${lead.depart} → ${lead.destination}. Raison : ${reason}. Dashboard : ${dashUrl}`,
  }
}
