export type LeadStatus =
  | 'nouveau'
  | 'incomplet'
  | 'qualifie'
  | 'devis_genere'           // legacy / devis manuel
  | 'en_attente_validation'  // calcul auto fait, attente validation humaine
  | 'devis_valide'           // approuvé par commercial, n8n va envoyer
  | 'devis_envoye'
  | 'relance_1'
  | 'relance_2'
  | 'accepte'
  | 'refuse'
  | 'cas_complexe'
  | 'reprise_humaine'
  | 'erreur_envoi'
  | 'cloture'

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  nouveau:               'Nouveau lead',
  incomplet:             'Demande incomplète',
  qualifie:              'Demande qualifiée',
  devis_genere:          'Devis généré (manuel)',
  en_attente_validation: 'En attente validation',
  devis_valide:          'Devis validé — envoi en cours',
  devis_envoye:          'Devis envoyé',
  relance_1:             'Relance 1',
  relance_2:             'Relance 2',
  accepte:               'Accepté',
  refuse:                'Refusé',
  cas_complexe:          'Cas complexe',
  reprise_humaine:       'Reprise humaine',
  erreur_envoi:          'Erreur envoi',
  cloture:               'Clôturé sans réponse',
}

export const LEAD_STATUS_LABELS_CLIENT: Record<LeadStatus, string> = {
  nouveau:               'Demande reçue',
  incomplet:             'En attente d\'informations',
  qualifie:              'Dossier en cours',
  devis_genere:          'Devis en préparation',
  en_attente_validation: 'Devis en cours de validation',
  devis_valide:          'Devis validé',
  devis_envoye:          'Devis envoyé',
  relance_1:             'Rappel envoyé',
  relance_2:             'Second rappel envoyé',
  accepte:               'Devis accepté',
  refuse:                'Devis refusé',
  cas_complexe:          'Suivi par un conseiller',
  reprise_humaine:       'Suivi par un conseiller',
  erreur_envoi:          'En cours de traitement',
  cloture:               'Dossier clôturé',
}

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  nouveau:               'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/12 dark:text-blue-300 dark:border-blue-500/20',
  incomplet:             'bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-500/12 dark:text-yellow-300 dark:border-yellow-500/20',
  qualifie:              'bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/12 dark:text-indigo-300 dark:border-indigo-500/20',
  devis_genere:          'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-purple-500/12 dark:text-purple-300 dark:border-purple-500/20',
  en_attente_validation: 'bg-violet-100 text-violet-700 border border-violet-200 dark:bg-violet-500/12 dark:text-violet-300 dark:border-violet-500/20',
  devis_valide:          'bg-teal-100 text-teal-700 border border-teal-200 dark:bg-teal-500/12 dark:text-teal-300 dark:border-teal-500/20',
  devis_envoye:          'bg-sky-100 text-sky-700 border border-sky-200 dark:bg-cyan-500/12 dark:text-cyan-300 dark:border-cyan-500/20',
  relance_1:             'bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-500/12 dark:text-orange-300 dark:border-orange-500/20',
  relance_2:             'bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/12 dark:text-red-300 dark:border-red-500/20',
  accepte:               'bg-green-100 text-green-700 border border-green-200 dark:bg-green-500/12 dark:text-green-300 dark:border-green-500/20',
  refuse:                'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-white/5 dark:text-white/40 dark:border-white/10',
  cas_complexe:          'bg-pink-100 text-pink-700 border border-pink-200 dark:bg-pink-500/12 dark:text-pink-300 dark:border-pink-500/20',
  reprise_humaine:       'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/12 dark:text-rose-300 dark:border-rose-500/20',
  erreur_envoi:          'bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/25',
  cloture:               'bg-slate-100 text-slate-400 border border-slate-200 dark:bg-white/4 dark:text-white/30 dark:border-white/8',
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

export type SourceType = 'mock_mvp' | 'regle_documentee' | 'hypothese_mvp' | 'a_definir'

export interface QuoteLine {
  label: string
  quantity: number
  unit: string
  unit_price_ht: number
  tva_rate: number
  total_ht: number
}

export interface ManualQuotePayload {
  client: {
    nom: string
    email: string
    telephone?: string
    societe?: string
  }
  trajet: {
    depart: string
    destination: string
    date_depart?: string
    date_retour?: string
    nb_passagers: number
    type_trajet: string
    urgence: string
  }
  lignes: QuoteLine[]
  remise_pct?: number
  validite_jours?: number
  commentaire?: string
  conditions?: string
  total_ht: number
  tva: number
  total_ttc: number
  leadId?: string
}

export interface LigneCalcul {
  label: string
  montant: number
  formule?: string
  variables?: Record<string, number | string>
  source_regle?: string
  source_type?: SourceType
  justification?: string
  detail?: string
}

export interface CalculationSource {
  label: string
  valeur: string | number
  source_type: SourceType
  justification: string
}

export type QuoteStatut =
  | 'pending_human_validation'  // calcul auto, attente validation
  | 'approved'                  // validé par commercial, prêt pour envoi
  | 'sent'                      // envoyé au client
  | 'needs_revision'            // renvoyé pour correction
  | 'email_error'               // échec envoi email
  | 'genere'                    // legacy devis manuel

export interface Quote {
  _id: string
  leadId: string
  prix_ht: number
  tva: number
  prix_ttc: number
  lignes_calcul: LigneCalcul[]
  coefficients: Record<string, number>
  warnings: string[]
  besoin_reprise_humaine: boolean
  raison_reprise_humaine?: string
  sources_calcul: CalculationSource[]
  explication_calcul?: string
  statut_devis: QuoteStatut | string
  ajustement_manuel_ht: number
  raison_ajustement?: string
  prix_final_ht: number
  prix_final_ttc: number
  modifiedBy?: string
  modifiedAt?: string
  createdAt: string
  updatedAt?: string
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
  userId?: string
  trackingToken?: string
  quote?: Quote
  createdAt: string
  updatedAt: string
}

export interface Log {
  _id: string
  action: string
  leadId?: string
  payload?: Record<string, unknown>
  status: 'success' | 'error' | 'info' | 'warning'
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

export interface TrackingData {
  tracking: true
  statut: LeadStatus
  statut_label: string
  trajet: string
  date_depart: string
  date_retour?: string
  nb_passagers: number
  type_trajet: string
  createdAt: string
  updatedAt: string
  devis: {
    statut_devis: string
    prix_ttc: number
    warnings: string[]
    besoin_reprise_humaine: boolean
    createdAt: string
  } | null
}
