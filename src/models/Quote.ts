import { Schema, model, Document, Types } from 'mongoose'

export interface ILigneCalcul {
  label: string
  montant: number
  formule?: string
  variables?: Record<string, number | string>
  source_regle?: string
  source_type?: string
  justification?: string
  detail?: string
}

export interface ICalculationSource {
  label: string
  valeur: string | number
  source_type: string
  justification: string
}

export interface IQuote extends Document {
  leadId: Types.ObjectId
  prix_ht: number
  tva: number
  prix_ttc: number
  lignes_calcul: ILigneCalcul[]
  coefficients: Map<string, number>
  warnings: string[]
  besoin_reprise_humaine: boolean
  raison_reprise_humaine?: string
  sources_calcul: ICalculationSource[]
  explication_calcul?: string
  statut_devis: string
  // Ajustement humain
  ajustement_manuel_ht: number
  raison_ajustement?: string
  prix_final_ht: number
  prix_final_ttc: number
  modifiedBy?: string
  modifiedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const ligneSchema = new Schema({
  label:       { type: String, required: true },
  montant:     { type: Number, required: true },
  formule:     { type: String },
  variables:   { type: Schema.Types.Mixed },
  source_regle: { type: String },
  source_type:  { type: String },
  justification: { type: String },
  detail:       { type: String },
}, { _id: false })

const sourceSchema = new Schema({
  label:         { type: String, required: true },
  valeur:        { type: Schema.Types.Mixed, required: true },
  source_type:   { type: String, required: true },
  justification: { type: String, required: true },
}, { _id: false })

const quoteSchema = new Schema<IQuote>(
  {
    leadId:      { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    prix_ht:     { type: Number, required: true },
    tva:         { type: Number, required: true },
    prix_ttc:    { type: Number, required: true },
    lignes_calcul: { type: [ligneSchema], default: [] },
    coefficients:  { type: Map, of: Number, default: {} },
    warnings:      { type: [String], default: [] },
    besoin_reprise_humaine: { type: Boolean, default: false },
    raison_reprise_humaine: { type: String },
    sources_calcul:   { type: [sourceSchema], default: [] },
    explication_calcul: { type: String },
    statut_devis:     { type: String, default: 'genere' },
    // Ajustement humain
    ajustement_manuel_ht: { type: Number, default: 0 },
    raison_ajustement:    { type: String },
    prix_final_ht:    { type: Number, default: 0 },
    prix_final_ttc:   { type: Number, default: 0 },
    modifiedBy:       { type: String },
    modifiedAt:       { type: Date },
  },
  { timestamps: true }
)

// prix_final = prix calculé + ajustement
quoteSchema.pre('save', function (next) {
  const taux_tva = 0.10
  this.prix_final_ht  = Math.round((this.prix_ht + this.ajustement_manuel_ht) * 100) / 100
  this.prix_final_ttc = Math.round(this.prix_final_ht * (1 + taux_tva) * 100) / 100
  next()
})

export const Quote = model<IQuote>('Quote', quoteSchema)
