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
  nouveau:      'bg-blue-500/12 text-blue-300 border border-blue-500/20',
  incomplet:    'bg-yellow-500/12 text-yellow-300 border border-yellow-500/20',
  qualifie:     'bg-indigo-500/12 text-indigo-300 border border-indigo-500/20',
  devis_genere: 'bg-purple-500/12 text-purple-300 border border-purple-500/20',
  devis_envoye: 'bg-cyan-500/12 text-cyan-300 border border-cyan-500/20',
  relance_1:    'bg-orange-500/12 text-orange-300 border border-orange-500/20',
  relance_2:    'bg-red-500/12 text-red-300 border border-red-500/20',
  accepte:      'bg-green-500/12 text-green-300 border border-green-500/20',
  refuse:       'bg-white/5 text-white/40 border border-white/10',
  cas_complexe: 'bg-pink-500/12 text-pink-300 border border-pink-500/20',
  cloture:      'bg-white/4 text-white/30 border border-white/8',
}

export type UrgenceLevel = 'normal' | 'urgent' | 'tres_urgent'

export const URGENCE_LABELS: Record<UrgenceLevel, string> = {
  normal:      'Normal',
  urgent:      'Urgent',
  tres_urgent: 'Très urgent',
}

export const URGENCE_COLORS: Record<UrgenceLevel, string> = {
  normal:      'bg-white/5 text-white/40 border border-white/10',
  urgent:      'bg-orange-500/12 text-orange-300 border border-orange-500/20',
  tres_urgent: 'bg-red-500/12 text-red-300 border border-red-500/20',
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
