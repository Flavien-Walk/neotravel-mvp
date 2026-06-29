import { Log } from '../models/Log'

const N8N_WEBHOOK_QUOTE_REVIEW = process.env.N8N_WEBHOOK_QUOTE_REVIEW
const N8N_WEBHOOK_QUOTE_SEND   = process.env.N8N_WEBHOOK_QUOTE_SEND

interface QuoteReviewPayload {
  leadId:  string
  quoteId: string
  client: { nom: string; email: string; telephone?: string; societe?: string }
  trajet: {
    depart: string
    destination: string
    date_depart: string
    date_retour?: string
    nb_passagers: number
    type_trajet: string
    urgence: string
  }
  quote: {
    prix_ht: number
    tva: number
    prix_ttc: number
    warnings: string[]
    besoin_reprise_humaine: boolean
    raison_reprise_humaine?: string
    explication_calcul?: string
  }
  reviewUrl: string
}

interface QuoteSendPayload {
  leadId:  string
  quoteId: string
  client: { nom: string; email: string }
  quote: {
    prix_final_ht:  number
    prix_final_ttc: number
  }
  approvedBy: string
  approvedAt: string
  sendUrl: string
}

async function postWebhook(url: string, payload: unknown, action: string, leadId?: string): Promise<void> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    })
    await Log.create({
      action,
      leadId: leadId ?? undefined,
      status: res.ok ? 'success' : 'warning',
      message: `n8n webhook ${action} → ${res.status}`,
      payload: { url, status: res.status },
    }).catch(() => {})
  } catch (err) {
    await Log.create({
      action,
      leadId: leadId ?? undefined,
      status: 'error',
      message: `n8n webhook ${action} échoué : ${String(err)}`,
      payload: { url },
    }).catch(() => {})
  }
}

export function notifyQuoteReadyForReview(payload: QuoteReviewPayload): void {
  if (!N8N_WEBHOOK_QUOTE_REVIEW) return
  void postWebhook(N8N_WEBHOOK_QUOTE_REVIEW, payload, 'N8N_QUOTE_REVIEW', payload.leadId)
}

export function notifyQuoteApprovedForSend(payload: QuoteSendPayload): void {
  if (!N8N_WEBHOOK_QUOTE_SEND) return
  void postWebhook(N8N_WEBHOOK_QUOTE_SEND, payload, 'N8N_QUOTE_SEND', payload.leadId)
}
