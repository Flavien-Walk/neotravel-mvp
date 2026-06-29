import { getBrevoClient, SENDER, REPLY_TO } from './brevoClient'
import {
  tplWelcome,
  tplPasswordReset,
  tplPasswordChanged,
  tplLeadReceived,
  tplNewLeadInternal,
  tplQuote,
  tplQuoteReminder,
  tplComplexCase,
} from './templates'
import { Log } from '../../models/Log'
import type { IUser } from '../../models/User'
import type { ILead } from '../../models/Lead'
import type { IQuote } from '../../models/Quote'

const PROVIDER = process.env.EMAIL_PROVIDER ?? 'brevo'

async function sendEmail({
  to,
  subject,
  html,
  text,
  templateName,
  leadId,
}: {
  to: { email: string; name?: string }[]
  subject: string
  html: string
  text: string
  templateName: string
  leadId?: string
}): Promise<void> {
  const logPayload = { templateName, to: to.map(t => t.email), subject }

  if (PROVIDER === 'console' || !process.env.BREVO_API_KEY) {
    console.log(`[EMAIL:console] ${templateName} → ${to.map(t => t.email).join(', ')} — "${subject}"`)
    await Log.create({
      action: 'EMAIL_LOGGED',
      leadId: leadId ?? undefined,
      status: 'info',
      message: `[console] Email ${templateName} → ${to.map(t => t.email).join(', ')}`,
      payload: logPayload,
    }).catch(() => {})
    return
  }

  try {
    const client = getBrevoClient()
    await client.transactionalEmails.sendTransacEmail({
      sender: SENDER,
      to,
      replyTo: { email: REPLY_TO },
      subject,
      htmlContent: html,
      textContent: text,
    })

    await Log.create({
      action: 'EMAIL_SENT',
      leadId: leadId ?? undefined,
      status: 'success',
      message: `Email ${templateName} envoyé → ${to.map(t => t.email).join(', ')}`,
      payload: logPayload,
    }).catch(() => {})
  } catch (err) {
    console.error(`[EMAIL:brevo] FAILED ${templateName}:`, err)
    await Log.create({
      action: 'EMAIL_FAILED',
      leadId: leadId ?? undefined,
      status: 'error',
      message: `Échec envoi ${templateName} → ${to.map(t => t.email).join(', ')} : ${String(err)}`,
      payload: logPayload,
    }).catch(() => {})
  }
}

// ─── Helpers publics ──────────────────────────────────────────────────────────

export function sendWelcomeEmail(user: IUser): Promise<void> {
  const tpl = tplWelcome(user)
  return sendEmail({ to: [{ email: user.email, name: user.nom }], ...tpl, templateName: 'welcome' })
}

export function sendPasswordResetEmail(user: IUser, token: string): Promise<void> {
  const tpl = tplPasswordReset(user, token)
  return sendEmail({ to: [{ email: user.email, name: user.nom }], ...tpl, templateName: 'password_reset' })
}

export function sendPasswordChangedEmail(user: IUser): Promise<void> {
  const tpl = tplPasswordChanged(user)
  return sendEmail({ to: [{ email: user.email, name: user.nom }], ...tpl, templateName: 'password_changed' })
}

export function sendLeadReceivedEmail(lead: ILead): Promise<void> {
  const tpl = tplLeadReceived(lead)
  return sendEmail({ to: [{ email: lead.email, name: lead.nom }], ...tpl, templateName: 'lead_received', leadId: String(lead._id) })
}

export function sendNewLeadInternalEmail(lead: ILead): Promise<void> {
  const tpl = tplNewLeadInternal(lead)
  const internalEmail = process.env.BREVO_SENDER_EMAIL ?? 'contact@neotravel.fr'
  return sendEmail({ to: [{ email: internalEmail, name: 'Équipe NeoTravel' }], ...tpl, templateName: 'new_lead_internal', leadId: String(lead._id) })
}

export function sendQuoteEmail(lead: ILead, quote: IQuote): Promise<void> {
  const tpl = tplQuote(lead, quote)
  return sendEmail({ to: [{ email: lead.email, name: lead.nom }], ...tpl, templateName: 'quote', leadId: String(lead._id) })
}

export function sendQuoteReminderEmail(lead: ILead, quote: IQuote, relanceLevel = 1): Promise<void> {
  const tpl = tplQuoteReminder(lead, quote, relanceLevel)
  return sendEmail({ to: [{ email: lead.email, name: lead.nom }], ...tpl, templateName: `quote_reminder_${relanceLevel}`, leadId: String(lead._id) })
}

export function sendComplexCaseEmail(lead: ILead, reason: string): Promise<void> {
  const tpl = tplComplexCase(lead, reason)
  const internalEmail = process.env.BREVO_SENDER_EMAIL ?? 'contact@neotravel.fr'
  return sendEmail({ to: [{ email: internalEmail, name: 'Équipe NeoTravel' }], ...tpl, templateName: 'complex_case', leadId: String(lead._id) })
}
