import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { z } from 'zod'
import { User } from '../models/User'
import { Log } from '../models/Log'
import { requireAuth, requireRole, AuthRequest } from '../middleware/requireAuth'
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from '../services/email/emailService'

const router = Router()

const JWT_SECRET      = process.env.JWT_SECRET || 'fallback-dev-secret'
const JWT_EXPIRES_IN  = process.env.JWT_EXPIRES_IN || '7d'

function signToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

// ─── Schemas de validation ────────────────────────────────────────────────────

// Le rôle n'est jamais accepté du frontend — toujours forcé à 'client'
const registerSchema = z.object({
  nom:          z.string().min(2).max(80),
  email:        z.string().email(),
  password:     z.string().min(8).max(100),
  organisation: z.string().max(120).optional(),
})

const staffSchema = z.object({
  nom:          z.string().min(2).max(80),
  email:        z.string().email(),
  password:     z.string().min(8).max(100),
  role:         z.enum(['commercial', 'admin']),
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

// ─── POST /api/auth/bootstrap — premier admin uniquement (auto-désactive) ────
// Crée le premier compte admin si aucun admin n'existe en base.
// Inaccessible dès qu'un admin existe — pas de risque de réutilisation.

router.post('/bootstrap', async (req: Request, res: Response) => {
  const schema = z.object({
    nom:      z.string().min(2).max(80),
    email:    z.string().email(),
    password: z.string().min(8).max(100),
    secret:   z.string(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() })
    return
  }

  // Secret d'amorçage depuis env — si absent, endpoint bloqué
  const bootstrapSecret = process.env.BOOTSTRAP_SECRET
  if (!bootstrapSecret || parsed.data.secret !== bootstrapSecret) {
    res.status(403).json({ message: 'Secret invalide.' })
    return
  }

  try {
    const adminExists = await User.findOne({ role: { $in: ['admin', 'commercial'] } })
    if (adminExists) {
      res.status(409).json({ message: 'Un compte staff existe déjà. Endpoint désactivé.' })
      return
    }

    const { nom, email, password } = parsed.data
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({
      nom,
      email: email.toLowerCase(),
      passwordHash,
      role: 'admin',
      organisation: 'NeoTravel',
      emailVerified: true,
    })

    await Log.create({
      action: 'ADMIN_BOOTSTRAP',
      status: 'success',
      message: `Premier compte admin créé via bootstrap : ${nom} (${email})`,
    })

    const token = signToken(String(user._id), user.role)
    res.status(201).json({
      message: 'Compte admin créé. Retirez BOOTSTRAP_SECRET de vos variables d\'environnement.',
      token,
      user: { id: String(user._id), nom: user.nom, email: user.email, role: user.role },
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur bootstrap', error: String(err) })
  }
})

// ─── POST /api/auth/register — création compte client uniquement ─────────────

router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() })
    return
  }

  // Le rôle est TOUJOURS 'client' — jamais accepté du payload
  const { nom, email, organisation } = parsed.data
  const password = parsed.data.password

  try {
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      res.status(409).json({ message: 'Un compte existe déjà avec cette adresse email.' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ nom, email: email.toLowerCase(), passwordHash, role: 'client', organisation })

    await Log.create({
      action: 'USER_REGISTERED',
      status: 'success',
      message: `Nouveau compte client créé : ${nom} (${email})`,
    })

    sendWelcomeEmail(user).catch(() => {})

    const token = signToken(String(user._id), user.role)
    res.status(201).json({
      token,
      user: { id: String(user._id), nom: user.nom, email: user.email, role: user.role, organisation: user.organisation },
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la création du compte', error: String(err) })
  }
})

// ─── POST /api/auth/staff — création compte NeoTravel (admin uniquement) ─────

router.post('/staff', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const parsed = staffSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() })
    return
  }

  const { nom, email, password, role, organisation } = parsed.data

  try {
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      res.status(409).json({ message: 'Un compte existe déjà avec cette adresse email.' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ nom, email: email.toLowerCase(), passwordHash, role, organisation })

    await Log.create({
      action: 'STAFF_CREATED',
      status: 'success',
      message: `Compte NeoTravel créé par admin : ${nom} (${email}) — rôle ${role}`,
      payload: { createdBy: req.userId },
    })

    res.status(201).json({
      user: { id: String(user._id), nom: user.nom, email: user.email, role: user.role, organisation: user.organisation },
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur création compte NeoTravel', error: String(err) })
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

    const token = signToken(String(user._id), user.role)
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

// ─── PATCH /api/auth/me ──────────────────────────────────────────────────────

router.patch('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    nom:          z.string().min(2).max(80).optional(),
    email:        z.string().email().optional(),
    organisation: z.string().max(120).optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides.', errors: parsed.error.flatten() })
    return
  }

  try {
    const updates = parsed.data
    if (updates.email) {
      const exists = await User.findOne({ email: updates.email, _id: { $ne: req.userId } })
      if (exists) { res.status(409).json({ message: 'Cette adresse email est déjà utilisée.' }); return }
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-passwordHash -resetPasswordToken -resetPasswordExpires')

    if (!user) { res.status(404).json({ message: 'Utilisateur introuvable.' }); return }

    await Log.create({
      action: 'USER_PROFILE_UPDATED',
      status: 'success',
      message: `Profil mis à jour : ${user.email}`,
      payload: updates,
    }).catch(() => {})

    res.json({ id: String(user._id), nom: user.nom, email: user.email, role: user.role, organisation: user.organisation })
  } catch (err) {
    res.status(500).json({ message: 'Erreur mise à jour profil', error: String(err) })
  }
})

// ─── PATCH /api/auth/password ────────────────────────────────────────────────

router.patch('/password', requireAuth, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword:     z.string().min(8).max(100),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Données invalides.', errors: parsed.error.flatten() })
    return
  }

  try {
    const user = await User.findById(req.userId)
    if (!user) { res.status(404).json({ message: 'Utilisateur introuvable.' }); return }

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash)
    if (!valid) { res.status(401).json({ message: 'Mot de passe actuel incorrect.' }); return }

    user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12)
    await user.save()

    await Log.create({
      action: 'USER_PASSWORD_UPDATED',
      status: 'success',
      message: `Mot de passe modifié : ${user.email}`,
    }).catch(() => {})

    sendPasswordChangedEmail(user).catch(() => {})

    res.json({ message: 'Mot de passe modifié avec succès.' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur changement mot de passe', error: String(err) })
  }
})

export default router
