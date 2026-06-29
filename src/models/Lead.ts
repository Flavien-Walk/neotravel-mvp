import crypto from 'crypto'
import { Schema, model, Document, Types } from 'mongoose'

export type LeadStatus =
  | 'nouveau' | 'incomplet' | 'qualifie'
  | 'devis_genere'           // legacy / devis manuel commercial
  | 'en_attente_validation'  // calcul auto effectué, attente validation humaine
  | 'devis_valide'           // validé par commercial, prêt pour envoi
  | 'devis_envoye'
  | 'relance_1' | 'relance_2'
  | 'accepte' | 'refuse'
  | 'cas_complexe' | 'reprise_humaine'
  | 'erreur_envoi'
  | 'cloture'

export interface ILead extends Document {
  nom: string
  societe?: string
  email: string
  telephone?: string
  depart: string
  destination: string
  date_depart: string
  date_retour?: string
  nb_passagers: number
  type_trajet: 'aller_simple' | 'aller_retour' | 'circuit'
  urgence: 'normal' | 'urgent' | 'tres_urgent'
  options: string[]
  commentaire?: string
  statut: LeadStatus
  score_completude: number
  userId?: Types.ObjectId
  trackingToken: string
  createdAt: Date
  updatedAt: Date
}

const leadSchema = new Schema<ILead>(
  {
    nom:          { type: String, required: true, trim: true },
    societe:      { type: String, trim: true },
    email:        { type: String, required: true, trim: true, lowercase: true },
    telephone:    { type: String, required: false, trim: true, default: '' },
    depart:       { type: String, required: true, trim: true },
    destination:  { type: String, required: true, trim: true },
    date_depart:  { type: String, required: true },
    date_retour:  { type: String },
    nb_passagers: { type: Number, required: true, min: 1, max: 500 },
    type_trajet:  { type: String, enum: ['aller_simple', 'aller_retour', 'circuit'], required: true },
    urgence:      { type: String, enum: ['normal', 'urgent', 'tres_urgent'], default: 'normal' },
    options:      { type: [String], default: [] },
    commentaire:  { type: String },
    statut:       { type: String, default: 'nouveau' },
    score_completude: { type: Number, default: 0 },
    userId:       { type: Schema.Types.ObjectId, ref: 'User', default: null },
    trackingToken: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
)

function computeScore(lead: Partial<ILead>): number {
  const champs = ['nom', 'email', 'depart', 'destination', 'date_depart', 'nb_passagers', 'type_trajet', 'urgence']
  const bonus  = ['societe', 'date_retour', 'commentaire']
  const base  = champs.filter(c => !!(lead as Record<string, unknown>)[c]).length / champs.length * 80
  const extra = bonus.filter(c  => !!(lead as Record<string, unknown>)[c]).length / bonus.length * 20
  return Math.round(base + extra)
}

leadSchema.pre('save', function (next) {
  if (!this.trackingToken) {
    this.trackingToken = crypto.randomBytes(20).toString('hex')
  }
  this.score_completude = computeScore(this)
  if (this.score_completude < 60) this.statut = 'incomplet'
  next()
})

export const Lead = model<ILead>('Lead', leadSchema)
