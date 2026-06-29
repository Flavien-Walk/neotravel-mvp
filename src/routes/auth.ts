import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { requireAuth, requireRole, AuthRequest } from '../middleware/requireAuth'
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from '../services/email/emailService'

const router = Router()

// ─── Helper: log to Supabase ─────────────────────────────────────────────────

async function addLog(action: string, status: string, message: string, payload?: Record<string, unknown>) {
  try { await supabase.from('logs').insert({ action, status, message, payload: payload ?? null }) } catch {}
}

// ─── Schemas de validation ────────────────────────────────────────────────────

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

// ─── POST /api/auth/bootstrap — premier admin (auto-désactive) ───────────────

router.post('/bootstrap', async (req: Request, res: Response) => {
  const schema = z.object({
    nom: z.string().min(2).max(80), email: z.string().email(),
    password: z.string().min(8).max(100), secret: z.string(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Données invalides' }); return }

  const bootstrapSecret = process.env.BOOTSTRAP_SECRET
  if (!bootstrapSecret || parsed.data.secret !== bootstrapSecret) {
    res.status(403).json({ message: 'Secret invalide.' }); return
  }

  try {
    const { data: staffCheck } = await supabase.from('profiles').select('id').in('role', ['admin', 'commercial']).limit(1)
    if (staffCheck && staffCheck.length > 0) {
      res.status(409).json({ message: 'Un compte staff existe déjà. Endpoint désactivé.' }); return
    }

    const { nom, email, password } = parsed.data
    const { data, error } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { nom, role: 'admin', organisation: 'NeoTravel' },
    })
    if (error || !data.user) { res.status(500).json({ message: error?.message ?? 'Erreur création admin' }); return }

    await supabase.from('profiles').upsert({ id: data.user.id, nom, role: 'admin', organisation: 'NeoTravel' })
    await addLog('ADMIN_BOOTSTRAP', 'success', `Premier compte admin créé : ${nom} (${email})`)

    res.status(201).json({
      message: "Compte admin créé. Retirez BOOTSTRAP_SECRET de vos variables d'environnement.",
      user: { id: data.user.id, nom, email, role: 'admin' },
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur bootstrap', error: String(err) })
  }
})

// ─── POST /api/auth/register — client uniquement ─────────────────────────────

router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() }); return }

  const { nom, email, password, organisation } = parsed.data

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(), password, email_confirm: true,
      user_metadata: { nom, role: 'client', organisation: organisation ?? null },
    })
    if (error) {
      const msg = error.message.includes('already') ? 'Un compte existe déjà avec cette adresse email.' : error.message
      res.status(409).json({ message: msg }); return
    }
    if (!data.user) { res.status(500).json({ message: 'Erreur création compte' }); return }

    await supabase.from('profiles').upsert({ id: data.user.id, nom, role: 'client', organisation: organisation ?? null })
    await addLog('USER_REGISTERED', 'success', `Nouveau compte client : ${nom} (${email})`)
    sendWelcomeEmail({ id: data.user.id, nom, email, role: 'client' }).catch(() => {})

    // Sign in to get token
    const { data: session } = await supabase.auth.signInWithPassword({ email: email.toLowerCase(), password })
    res.status(201).json({
      token: session?.session?.access_token ?? '',
      user: { id: data.user.id, nom, email: email.toLowerCase(), role: 'client', organisation: organisation ?? null },
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la création du compte', error: String(err) })
  }
})

// ─── POST /api/auth/staff — compte NeoTravel (admin uniquement) ──────────────

router.post('/staff', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  const authReq = req as AuthRequest
  const parsed = staffSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() }); return }

  const { nom, email, password, role, organisation } = parsed.data

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(), password, email_confirm: true,
      user_metadata: { nom, role, organisation: organisation ?? null },
    })
    if (error) {
      const msg = error.message.includes('already') ? 'Un compte existe déjà avec cette adresse email.' : error.message
      res.status(409).json({ message: msg }); return
    }
    if (!data.user) { res.status(500).json({ message: 'Erreur création compte' }); return }

    await supabase.from('profiles').upsert({ id: data.user.id, nom, role, organisation: organisation ?? null })
    await addLog('STAFF_CREATED', 'success', `Compte NeoTravel créé : ${nom} (${email}) — ${role}`, { createdBy: authReq.userId })

    res.status(201).json({ user: { id: data.user.id, nom, email: email.toLowerCase(), role, organisation: organisation ?? null } })
  } catch (err) {
    res.status(500).json({ message: 'Erreur création compte NeoTravel', error: String(err) })
  }
})

// ─── POST /api/auth/login ────────────────────────────────────────────────────

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Données invalides' }); return }

  const { email, password } = parsed.data

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user || !data.session) {
      res.status(401).json({ message: 'Email ou mot de passe incorrect.' }); return
    }

    const { data: profile } = await supabase.from('profiles').select('nom, role, organisation').eq('id', data.user.id).single()
    await addLog('USER_LOGIN', 'success', `Connexion : ${email}`)

    res.json({
      token: data.session.access_token,
      user: {
        id:           data.user.id,
        nom:          profile?.nom ?? email,
        email:        data.user.email,
        role:         profile?.role ?? 'client',
        organisation: profile?.organisation ?? null,
      },
    })
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la connexion', error: String(err) })
  }
})

// ─── POST /api/auth/logout ───────────────────────────────────────────────────

router.post('/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Déconnexion effectuée.' })
})

// ─── GET /api/auth/me ────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { data: profile } = await supabase.from('profiles').select('nom, role, organisation').eq('id', req.userId).single()
    const { data: { user } } = await supabase.auth.admin.getUserById(req.userId!)
    if (!user) { res.status(404).json({ message: 'Utilisateur introuvable.' }); return }
    res.json({ id: user.id, nom: profile?.nom ?? user.email, email: user.email, role: profile?.role ?? 'client', organisation: profile?.organisation ?? null })
  } catch {
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

// ─── POST /api/auth/forgot-password ─────────────────────────────────────────
// Supabase handles the reset email natively — we just trigger it.

router.post('/forgot-password', async (req: Request, res: Response) => {
  const parsed = z.object({ email: z.string().email() }).safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Email invalide.' }); return }

  const RESPONSE = { message: 'Si un compte existe, un email de réinitialisation a été envoyé.' }

  try {
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
    await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: `${FRONTEND_URL}/reset-password` })
    res.json(RESPONSE)
  } catch {
    res.json(RESPONSE)
  }
})

// ─── POST /api/auth/reset-password ──────────────────────────────────────────
// With Supabase the client handles token exchange via the SDK directly.
// This endpoint is kept for backward-compat but is a no-op redirect.

router.post('/reset-password', async (_req: Request, res: Response) => {
  res.json({ message: 'Utilisez le lien envoyé par email pour réinitialiser votre mot de passe.' })
})

// ─── PATCH /api/auth/me ──────────────────────────────────────────────────────

router.patch('/me', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest
  const schema = z.object({
    nom:          z.string().min(2).max(80).optional(),
    email:        z.string().email().optional(),
    organisation: z.string().max(120).optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Données invalides.', errors: parsed.error.flatten() }); return }

  try {
    const updates: Record<string, string> = {}
    if (parsed.data.nom)          updates.nom = parsed.data.nom
    if (parsed.data.organisation) updates.organisation = parsed.data.organisation

    const { data: profile, error } = await supabase.from('profiles').update(updates).eq('id', authReq.userId).select().single()
    if (error || !profile) { res.status(500).json({ message: 'Erreur mise à jour profil' }); return }

    if (parsed.data.email) {
      await supabase.auth.admin.updateUserById(authReq.userId!, { email: parsed.data.email })
    }

    await addLog('USER_PROFILE_UPDATED', 'success', `Profil mis à jour`, { userId: authReq.userId, updates })

    res.json({ id: authReq.userId, nom: profile.nom, email: parsed.data.email ?? undefined, role: profile.role, organisation: profile.organisation })
  } catch (err) {
    res.status(500).json({ message: 'Erreur mise à jour profil', error: String(err) })
  }
})

// ─── PATCH /api/auth/password ────────────────────────────────────────────────

router.patch('/password', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest
  const schema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(100) })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Données invalides.' }); return }

  try {
    // Verify current password via sign-in
    const { data: { user } } = await supabase.auth.admin.getUserById(authReq.userId!)
    if (!user?.email) { res.status(404).json({ message: 'Utilisateur introuvable.' }); return }

    const { error: verifyErr } = await supabase.auth.signInWithPassword({ email: user.email, password: parsed.data.currentPassword })
    if (verifyErr) { res.status(401).json({ message: 'Mot de passe actuel incorrect.' }); return }

    await supabase.auth.admin.updateUserById(authReq.userId!, { password: parsed.data.newPassword })
    await addLog('USER_PASSWORD_UPDATED', 'success', `Mot de passe modifié`, { userId: authReq.userId })
    sendPasswordChangedEmail({ nom: user.email, email: user.email }).catch(() => {})

    res.json({ message: 'Mot de passe modifié avec succès.' })
  } catch (err) {
    res.status(500).json({ message: 'Erreur changement mot de passe', error: String(err) })
  }
})

export default router
