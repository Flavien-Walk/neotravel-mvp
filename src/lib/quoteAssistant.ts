import { z } from 'zod'
import { findCity } from './cities'

// ─── ZOD SCHEMA ────────────────────────────────────────────────────────────────

export const ExtractedFieldsSchema = z.object({
  nom:          z.string().nullable().optional(),
  email:        z.string().nullable().optional(),
  telephone:    z.string().nullable().optional(),
  societe:      z.string().nullable().optional(),
  depart:       z.string().nullable().optional(),
  destination:  z.string().nullable().optional(),
  date_depart:  z.string().nullable().optional(),
  date_retour:  z.string().nullable().optional(),
  nb_passagers: z.number().int().min(1).nullable().optional(),
  type_trajet:  z.enum(['aller_simple', 'aller_retour', 'circuit']).nullable().optional(),
  urgence:      z.enum(['normal', 'urgent', 'prioritaire']).nullable().optional(),
  options:      z.array(z.string()).optional(),
  commentaire:  z.string().nullable().optional(),
})

export const VillesSchema = z.object({
  depart_status:          z.enum(['ok', 'ambigu', 'inconnu', 'null']).optional(),
  destination_status:     z.enum(['ok', 'ambigu', 'inconnu', 'null']).optional(),
  depart_canonical:       z.string().nullable().optional(),
  destination_canonical:  z.string().nullable().optional(),
  depart_zone:            z.string().nullable().optional(),
  destination_zone:       z.string().nullable().optional(),
})

export const NEXT_ACTIONS = [
  'ask_missing_field',
  'validate_city',
  'create_lead',
  'calculate_quote',
  'escalate_human',
] as const

export type NextAction = typeof NEXT_ACTIONS[number]

export const QuoteAssistantSchema = z.object({
  message:                z.string().min(1),
  extractedFields:        ExtractedFieldsSchema.optional(),
  missingFields:          z.array(z.string()).optional(),
  confidence:             z.number().min(0).max(1).optional(),
  isComplete:             z.boolean().optional(),
  besoin_reprise_humaine: z.boolean().optional(),
  raison_reprise:         z.string().nullable().optional(),
  villes:                 VillesSchema.optional(),
  nextAction:             z.enum(NEXT_ACTIONS).optional(),
})

export type QuoteAssistantOutput = z.infer<typeof QuoteAssistantSchema>
export type ExtractedFields      = z.infer<typeof ExtractedFieldsSchema>

// ─── CITY VALIDATION ───────────────────────────────────────────────────────────

export type CityStatus = 'ok' | 'ambigu' | 'inconnu' | 'null'

export interface CityValidationResult {
  status:     CityStatus
  canonical:  string | null
  zone:       string | null
  confidence: number
}

const AMBIGUOUS: Set<string> = new Set([
  'saint-martin', 'saint martin', 'montrouge', 'vincennes', 'boulogne',
  'saint-denis', 'saint denis', 'neuilly', 'montmorency', 'la defense',
  'saint germain', 'saint-germain',
])

function normalizeStr(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function validateCity(input: string | null | undefined): CityValidationResult {
  if (!input || input.trim() === '') {
    return { status: 'null', canonical: null, zone: null, confidence: 0 }
  }
  const n = normalizeStr(input)
  if (AMBIGUOUS.has(n)) {
    return { status: 'ambigu', canonical: input.trim(), zone: null, confidence: 0.4 }
  }
  const city = findCity(input)
  if (city) {
    return { status: 'ok', canonical: city.nom, zone: city.zone, confidence: 1 }
  }
  return { status: 'inconnu', canonical: null, zone: null, confidence: 0 }
}

// ─── AI CALL LOG ───────────────────────────────────────────────────────────────

export interface AICallLog {
  timestamp:              string
  latency_ms:             number
  model:                  string
  input_tokens:           number
  output_tokens:          number
  nextAction:             string
  isComplete:             boolean
  besoin_reprise_humaine: boolean
  confidence:             number
  parse_error?:           string
  zod_error?:             string
}
