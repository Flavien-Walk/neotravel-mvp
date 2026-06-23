import { Schema, model, Document, Types } from 'mongoose'

export interface ILigneCalcul {
  label: string
  montant: number
  detail?: string
}

export interface IQuote extends Document {
  leadId: Types.ObjectId
  prix_ht: number
  tva: number
  prix_ttc: number
  lignes_calcul: ILigneCalcul[]
  coefficients: Map<string, number>
  statut_devis: string
  createdAt: Date
}

const quoteSchema = new Schema<IQuote>(
  {
    leadId:      { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    prix_ht:     { type: Number, required: true },
    tva:         { type: Number, required: true },
    prix_ttc:    { type: Number, required: true },
    lignes_calcul: [
      {
        label:   { type: String, required: true },
        montant: { type: Number, required: true },
        detail:  { type: String },
      },
    ],
    coefficients: { type: Map, of: Number, default: {} },
    statut_devis: { type: String, default: 'genere' },
  },
  { timestamps: true }
)

export const Quote = model<IQuote>('Quote', quoteSchema)
