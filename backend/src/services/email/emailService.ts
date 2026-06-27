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
import { supabase } from '../../lib/supabase'

type EmailUser  = { id?: string; nom: string; email: string; role?: string }
type EmailLead  = Record<string, unknown> & { id?: string; nom: string; email: string; depart: string; destination: string; nb_passagers: number }
type EmailQuote = Record<string, unknown>

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
    void Promise.resolve(supabase.from('logs').insert({
      action: 'EMAIL_LOGGED',
      lead_id: leadId ?? null,
      status: 'info',
      message: `[console] Email ${templateName} → ${to.map(t => t.email).join(', ')}`,
      payload: logPayload,
    }))
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

    void Promise.resolve(supabase.from('logs').insert({
      action: 'EMAIL_SENT',
      lead_id: leadId ?? null,
      status: 'success',
      message: `Email ${templateName} envoyé → ${to.map(t => t.email).join(', ')}`,
      payload: logPayload,
    }))
  } catch (err) {
    console.error(`[EMAIL:brevo] FAILED ${templateName}:`, err)
    void Promise.resolve(supabase.from('logs').insert({
      action: 'EMAIL_FAILED',
      lead_id: leadId ?? null,
      status: 'error',
      message: `Échec envoi ${templateName} → ${to.map(t => t.email).join(', ')} : ${String(err)}`,
      payload: logPayload,
    }))
  }
}

// ─── Helpers publics ──────────────────────────────────────────────────────────

export function sendWelcomeEmail(user: EmailUser): Promise<void> {
  const tpl = tplWelcome(user)
  return sendEmail({ to: [{ email: user.email, name: user.nom }], ...tpl, templateName: 'welcome' })
}

export function sendPasswordResetEmail(user: EmailUser, token: string): Promise<void> {
  const tpl = tplPasswordReset(user, token)
  return sendEmail({ to: [{ email: user.email, name: user.nom }], ...tpl, templateName: 'password_reset' })
}

export function sendPasswordChangedEmail(user: EmailUser): Promise<void> {
  const tpl = tplPasswordChanged(user)
  return sendEmail({ to: [{ email: user.email, name: user.nom }], ...tpl, templateName: 'password_changed' })
}

export function sendLeadReceivedEmail(lead: EmailLead): Promise<void> {
  const tpl = tplLeadReceived(lead)
  return sendEmail({ to: [{ email: lead.email, name: lead.nom }], ...tpl, templateName: 'lead_received', leadId: lead.id })
}

export function sendNewLeadInternalEmail(lead: EmailLead): Promise<void> {
  const tpl = tplNewLeadInternal(lead)
  const internalEmail = process.env.BREVO_SENDER_EMAIL ?? 'contact@neotravel.fr'
  return sendEmail({ to: [{ email: internalEmail, name: 'Équipe NeoTravel' }], ...tpl, templateName: 'new_lead_internal', leadId: lead.id })
}

export function sendQuoteEmail(lead: EmailLead, quote: EmailQuote): Promise<void> {
  const tpl = tplQuote(lead, quote)
  return sendEmail({ to: [{ email: lead.email, name: lead.nom }], ...tpl, templateName: 'quote', leadId: lead.id })
}

export function sendQuoteReminderEmail(lead: EmailLead, quote: EmailQuote): Promise<void> {
  const tpl = tplQuoteReminder(lead, quote)
  return sendEmail({ to: [{ email: lead.email, name: lead.nom }], ...tpl, templateName: 'quote_reminder', leadId: lead.id })
}

export function sendComplexCaseEmail(lead: EmailLead, reason: string): Promise<void> {
  const tpl = tplComplexCase(lead, reason)
  const internalEmail = process.env.BREVO_SENDER_EMAIL ?? 'contact@neotravel.fr'
  return sendEmail({ to: [{ email: internalEmail, name: 'Équipe NeoTravel' }], ...tpl, templateName: 'complex_case', leadId: lead.id })
}
