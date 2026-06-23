export type LeadStatus =
  | 'nouveau'
  | 'incomplet'
  | 'qualifie'
  | 'devis_genere'
  | 'devis_envoye'
  | 'relance_1'
  | 'relance_2'
  | 'accepte'
  | 'refuse'
  | 'cas_complexe'
  | 'cloture'

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  nouveau:         'Nouveau lead',
  incomplet:       'Demande incomplète',
  qualifie:        'Demande qualifiée',
  devis_genere:    'Devis généré',
  devis_envoye:    'Devis envoyé',
  relance_1:       'Relance 1',
  relance_2:       'Relance 2',
  accepte:         'Accepté',
  refuse:          'Refusé',
  cas_complexe:    'Cas complexe transmis',
  cloture:         'Clôturé sans réponse',
}

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  nouveau:      'bg-blue-100 text-blue-800',
  incomplet:    'bg-yellow-100 text-yellow-800',
  qualifie:     'bg-indigo-100 text-indigo-800',
  devis_genere: 'bg-purple-100 text-purple-800',
  devis_envoye: 'bg-cyan-100 text-cyan-800',
  relance_1:    'bg-orange-100 text-orange-800',
  relance_2:    'bg-red-100 text-red-800',
  accepte:      'bg-green-100 text-green-800',
  refuse:       'bg-gray-100 text-gray-800',
  cas_complexe: 'bg-pink-100 text-pink-800',
  cloture:      'bg-slate-100 text-slate-600',
}

export type UrgenceLevel = 'normal' | 'urgent' | 'tres_urgent'

export const URGENCE_LABELS: Record<UrgenceLevel, string> = {
  normal:      'Normal',
  urgent:      'Urgent',
  tres_urgent: 'Très urgent',
}

export const URGENCE_COLORS: Record<UrgenceLevel, string> = {
  normal:      'bg-gray-100 text-gray-700',
  urgent:      'bg-orange-100 text-orange-700',
  tres_urgent: 'bg-red-100 text-red-700',
}

export interface LigneCalcul {
  label: string
  montant: number
  detail?: string
}

export interface Quote {
  _id: string
  leadId: string
  prix_ht: number
  tva: number
  prix_ttc: number
  lignes_calcul: LigneCalcul[]
  coefficients: Record<string, number>
  statut_devis: string
  createdAt: string
}

export interface Lead {
  _id: string
  nom: string
  societe?: string
  email: string
  telephone: string
  depart: string
  destination: string
  date_depart: string
  date_retour?: string
  nb_passagers: number
  type_trajet: 'aller_simple' | 'aller_retour' | 'circuit'
  urgence: UrgenceLevel
  options: string[]
  commentaire?: string
  statut: LeadStatus
  score_completude: number
  quote?: Quote
  createdAt: string
  updatedAt: string
}

export interface Log {
  _id: string
  action: string
  leadId?: string
  payload?: Record<string, unknown>
  status: 'success' | 'error' | 'info'
  message: string
  timestamp: string
}

export interface ChatStep {
  id: string
  question: string
  field: keyof LeadFormData
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'multiselect'
  options?: { value: string; label: string }[]
  placeholder?: string
  optional?: boolean
  validate?: (value: string) => string | null
}

export interface LeadFormData {
  nom: string
  societe: string
  email: string
  telephone: string
  depart: string
  destination: string
  date_depart: string
  date_retour: string
  nb_passagers: string
  type_trajet: string
  urgence: string
  options: string[]
  commentaire: string
}
