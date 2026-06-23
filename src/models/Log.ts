import { Schema, model, Document, Types } from 'mongoose'

export interface ILog extends Document {
  action: string
  leadId?: Types.ObjectId
  payload?: Record<string, unknown>
  status: 'success' | 'error' | 'info'
  message: string
  timestamp: Date
}

const logSchema = new Schema<ILog>({
  action:    { type: String, required: true },
  leadId:    { type: Schema.Types.ObjectId, ref: 'Lead' },
  payload:   { type: Schema.Types.Mixed },
  status:    { type: String, enum: ['success', 'error', 'info'], default: 'info' },
  message:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
})

export const Log = model<ILog>('Log', logSchema)
