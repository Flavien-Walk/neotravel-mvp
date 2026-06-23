import { Schema, model, Document } from 'mongoose'

export type UserRole = 'admin' | 'commercial' | 'client'

export interface IUser extends Document {
  nom: string
  email: string
  passwordHash: string
  role: UserRole
  organisation?: string
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    nom:          { type: String, required: true, trim: true },
    email:        { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role:         { type: String, enum: ['admin', 'commercial', 'client'], default: 'client' },
    organisation: { type: String, trim: true },
    resetPasswordToken:   { type: String },
    resetPasswordExpires: { type: Date },
    emailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
)

userSchema.index({ email: 1 }, { unique: true })

export const User = model<IUser>('User', userSchema)
