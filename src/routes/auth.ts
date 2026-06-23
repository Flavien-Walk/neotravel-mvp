import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { z } from 'zod'
import { User } from '../models/User'
import { Log } from '../models/Log'
import { requireAuth, AuthRequest } from '../middleware/requireAuth'
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from '../services/email/emailService'

const router = Router()

const JWT_SECRET      = process.env.JWT_SECRET || 'fallback-dev-secret'
const JWT_EXPIRES_IN  = process.env.JWT_EXPIRES_IN || '7d'

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

// ─── Schemas de validation ────────────────────────────────────────────────────

const registerSchema = z.object({
  nom:          z.string().min(2).max(80),
  email:        z.string().email(),
  password:     z.string().min(8).max(100),
  role:         z.enum(['admin', 'commercial', 'client']).optional(),
  organisation: z.string().max(120).optional(),
})

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

const forgotSchema = z.object({
  email: z.string().email(),
})

const resetSchema = z.object({
  token:    z.string().min(10),
  password: z.string().min(8).max(100),
})

// ─── POST /api/auth/register ─────────────────────────────────────────────────

router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() })
    return
  }

  const { nom, email, password, role, organisation } = parsed.data

  try {
    const existing = await User.findOne({ email })
    if (existing) {
      res.status(409).json({ message: 'Un compte existe déjà avec cette adresse email.' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ nom, email, passwordHash, role: role ?? 'client', organisation })

    await Log.create({
      action: 'USER_REGISTERED',
      status: 'success',
      message: `Nouveau compte créé : ${nom} (${email}) — rôle ${role ?? 'client'}`,
    })

    // Email de bienvenue (non bloquant)
    sendWelcomeEmail(user).catch(() => {})

    const token = signToken(String(user._id))
    res.status(201).json({
      token,
      user: { id: String(user._id), nom: user.nom, email: user.email, role: user.role, organisation: user.organisation },
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la création du compte', error: String(err) })
  }
})

// ─── POST /api/auth/login ────────────────────────────────────────────────────

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides' })
    return
  }

  const { email, password } = parsed.data

  try {
    const user = await User.findOne({ email })
    if (!user) {
      res.status(401).json({ message: 'Email ou mot de passe incorrect.' })
      return
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      res.status(401).json({ message: 'Email ou mot de passe incorrect.' })
      return
    }

    await Log.create({
      action: 'USER_LOGIN',
      status: 'success',
      message: `Connexion réussie : ${user.email}`,
    })

    const token = signToken(String(user._id))
    res.json({
      token,
      user: { id: String(user._id), nom: user.nom, email: user.email, role: user.role, organisation: user.organisation },
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la connexion', error: String(err) })
  }
})

// ─── POST /api/auth/logout ───────────────────────────────────────────────────

router.post('/logout', (_req: Request, res: Response) => {
  // JWT stateless — le client supprime le token localement
  res.json({ message: 'Déconnexion effectuée.' })
})

// ─── GET /api/auth/me ────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash -resetPasswordToken -resetPasswordExpires')
    if (!user) {
      res.status(404).json({ message: 'Utilisateur introuvable.' })
      return
    }
    res.json({ id: String(user._id), nom: user.nom, email: user.email, role: user.role, organisation: user.organisation })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// ─── POST /api/auth/forgot-password ─────────────────────────────────────────

router.post('/forgot-password', async (req: Request, res: Response) => {
  const parsed = forgotSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Email invalide.' })
    return
  }

  // Réponse identique qu'il y ait un compte ou non (anti-enumeration)
  const RESPONSE = { message: 'Si un compte existe, un email de réinitialisation a été envoyé.' }

  try {
    const user = await User.findOne({ email: parsed.data.email })
    if (!user) { res.json(RESPONSE); return }

    const token = crypto.randomBytes(32).toString('hex')
    user.resetPasswordToken   = token
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000) // 1h
    await user.save()

    await sendPasswordResetEmail(user, token).catch(() => {})

    res.json(RESPONSE)
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// ─── POST /api/auth/reset-password ──────────────────────────────────────────

router.post('/reset-password', async (req: Request, res: Response) => {
  const parsed = resetSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides.', errors: parsed.error.flatten() })
    return
  }

  const { token, password } = parsed.data

  try {
    const user = await User.findOne({
      resetPasswordToken:   token,
      resetPasswordExpires: { $gt: new Date() },
    })
    if (!user) {
      res.status(400).json({ message: 'Lien invalide ou expiré. Veuillez refaire une demande.' })
      return
    }

    user.passwordHash         = await bcrypt.hash(password, 12)
    user.resetPasswordToken   = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    sendPasswordChangedEmail(user).catch(() => {})

    await Log.create({
      action: 'PASSWORD_RESET',
      status: 'success',
      message: `Mot de passe réinitialisé pour ${user.email}`,
    })

    res.json({ message: 'Mot de passe mis à jour avec succès. Vous pouvez maintenant vous connecter.' })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

export default router
