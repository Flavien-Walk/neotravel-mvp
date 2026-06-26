import { BrevoClient, BrevoEnvironment } from '@getbrevo/brevo'

let _client: BrevoClient | null = null

export function getBrevoClient(): BrevoClient {
  if (!_client) {
    _client = new BrevoClient({
      environment: BrevoEnvironment.Default,
      apiKey: process.env.BREVO_API_KEY ?? '',
    })
  }
  return _client
}

export const SENDER = {
  email: process.env.BREVO_SENDER_EMAIL || 'contact@neotravel.fr',
  name:  process.env.BREVO_SENDER_NAME  || 'NeoTravel',
}

export const REPLY_TO   = process.env.BREVO_REPLY_TO  || 'commercial@neotravel.fr'
export const FRONTEND_URL = process.env.FRONTEND_URL  || 'http://localhost:3000'
