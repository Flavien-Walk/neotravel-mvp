import { z } from 'zod'
import { callAnthropic, LLMMessage } from './anthropicProvider'
import { callOpenAI } from './openaiProvider'

const LLM_PROVIDER = process.env.LLM_PROVIDER ?? 'anthropic'
const FALLBACK     = process.env.LLM_FALLBACK_PROVIDER ?? 'openai'

const LeadFieldsSchema = z.object({
  nom:          z.string().nullable().optional(),
  email:        z.string().nullable().optional(),
  telephone:    z.string().nullable().optional(),
  depart:       z.string().nullable().optional(),
  destination:  z.string().nullable().optional(),
  date_depart:  z.string().nullable().optional(),
  date_retour:  z.string().nullable().optional(),
  nb_passagers: z.number().nullable().optional(),
  type_trajet:  z.enum(['aller_simple', 'aller_retour', 'circuit']).nullable().optional(),
  urgence:      z.enum(['normal', 'urgent', 'tres_urgent']).optional().default('normal'),
  options:      z.array(z.string()).optional().default([]),
  commentaire:  z.string().nullable().optional(),
  societe:      z.string().nullable().optional(),
})

const LLMResponseSchema = z.object({
  message:      z.string(),
  fields:       LeadFieldsSchema,
  is_complete:  z.boolean().default(false),
  needs_human:  z.boolean().default(false),
  human_reason: z.string().nullable().optional(),
})

export type LLMResponse = z.infer<typeof LLMResponseSchema>
export type LeadFields  = z.infer<typeof LeadFieldsSchema>

async function callProvider(
  messages: LLMMessage[],
  currentFields: Record<string, unknown>,
  provider: string
): Promise<string> {
  if (provider === 'openai') return callOpenAI(messages, currentFields)
  return callAnthropic(messages, currentFields)
}

export async function processMessage(
  messages: LLMMessage[],
  currentFields: Record<string, unknown>
): Promise<LLMResponse> {
  let raw: string

  try {
    raw = await callProvider(messages, currentFields, LLM_PROVIDER)
  } catch (primaryErr) {
    console.error(`[LLM] ${LLM_PROVIDER} failed, trying ${FALLBACK}:`, primaryErr)
    try {
      raw = await callProvider(messages, currentFields, FALLBACK)
    } catch (fallbackErr) {
      console.error(`[LLM] ${FALLBACK} also failed:`, fallbackErr)
      // Retour sécurisé si les deux providers échouent
      return {
        message: 'Je rencontre un problème technique momentané. Pouvez-vous réessayer dans quelques instants ou utiliser le formulaire classique ?',
        fields: { urgence: 'normal' as const, options: [] },
        is_complete: false,
        needs_human: false,
        human_reason: null,
      }
    }
  }

  try {
    // Extraire le JSON de la réponse (peut être entouré de backticks)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const jsonStr   = jsonMatch ? jsonMatch[0] : raw
    const parsed    = JSON.parse(jsonStr)
    return LLMResponseSchema.parse(parsed)
  } catch {
    // Si le JSON est invalide, retourner un message d'erreur propre
    return {
      message: raw.length < 500 ? raw : 'Pouvez-vous reformuler votre demande ?',
      fields: { urgence: 'normal' as const, options: [] },
      is_complete: false,
      needs_human: false,
      human_reason: null,
    }
  }
}

export function mergeFields(
  current: Record<string, unknown>,
  incoming: LeadFields
): Record<string, unknown> {
  const result = { ...current }
  for (const [key, value] of Object.entries(incoming)) {
    if (value !== null && value !== undefined) {
      result[key] = value
    }
  }
  return result
}
