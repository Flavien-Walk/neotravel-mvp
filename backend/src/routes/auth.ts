import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { supabase } from '../lib/supabase'
import { requireAuth, requireRole, AuthRequest } from '../middleware/requireAuth'
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from '../services/email/emailService'

const router = Router()

// ─── Schemas ─────────────────────────────────────────────────────────────────

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

// ─── Helper: log ─────────────────────────────────────────────────────────────

async function addLog(action: string, status: string, message: string, payload?: Record<string, unknown>) {
  await supabase.from('logs').insert({ action, status, message, payload: payload ?? null }).catch(() => {})
}

// ─── POST /api/auth/bootstrap ─────────────────────────────────────────────────

router.post('/bootstrap', async (req: Request, res: Response) => {
  const schema = z.object({
    nom:      z.string().min(2).max(80),
    email:    z.string().email(),
    password: z.string().min(8).max(100),
    secret:   z.string(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Données invalides' }); return }

  const bootstrapSecret = process.env.BOOTSTRAP_SECRET
  if (!bootstrapSecret || parsed.data.secret !== bootstrapSecret) {
    res.status(403).json({ message: 'Secret invalide.' }); return
  }

  const { data: existing } = await supabase.from('profiles').select('id').in('role', ['admin', 'commercial']).limit(1)
  if (existing && existing.length > 0) {
    res.status(409).json({ message: 'Un compte staff existe déjà. Endpoint désactivé.' }); return
  }

  const { nom, email, password } = parsed.data
  const { data: authData, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nom, role: 'admin', organisation: 'NeoTravel' },
  })
  if (error || !authData.user) {
    res.status(500).json({ message: error?.message ?? 'Erreur bootstrap' }); return
  }

  // Upsert profile with admin role
  await supabase.from('profiles').upsert({ id: authData.user.id, nom, role: 'admin', organisation: 'NeoTravel' })
  await addLog('ADMIN_BOOTSTRAP', 'success', `Premier compte admin créé : ${nom} (${email})`)

  // Sign in to get a session token
  const { data: session } = await supabase.auth.signInWithPassword({ email, password })
  res.status(201).json({
    message: "Compte admin créé. Retirez BOOTSTRAP_SECRET de vos variables d'environnement.",
    token: session?.session?.access_token,
    user: { id: authData.user.id, nom, email, role: 'admin' },
  })
})

// ─── POST /api/auth/register — client only ────────────────────────────────────

router.post('/register', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() }); return }

  const { nom, email, password, organisation } = parsed.data

  const { data: authData, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nom, role: 'client', organisation: organisation ?? null },
  })
  if (error) {
    const status = error.message.includes('already') ? 409 : 500
    res.status(status).json({ message: error.message }); return
  }

  await supabase.from('profiles').upsert({ id: authData.user!.id, nom, role: 'client', organisation: organisation ?? null })
  await addLog('USER_REGISTERED', 'success', `Nouveau compte client créé : ${nom} (${email})`)

  const { data: session } = await supabase.auth.signInWithPassword({ email, password })
  sendWelcomeEmail({ nom, email } as never).catch(() => {})

  res.status(201).json({
    token: session?.session?.access_token,
    user: { id: authData.user!.id, nom, email, role: 'client', organisation: organisation ?? null },
  })
})

// ─── POST /api/auth/staff — admin only ────────────────────────────────────────

router.post('/staff', requireAuth, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  const parsed = staffSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Données invalides', errors: parsed.error.flatten() }); return }

  const { nom, email, password, role, organisation } = parsed.data

  const { data: authData, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nom, role, organisation: organisation ?? null },
  })
  if (error) {
    const status = error.message.includes('already') ? 409 : 500
    res.status(status).json({ message: error.message }); return
  }

  await supabase.from('profiles').upsert({ id: authData.user!.id, nom, role, organisation: organisation ?? null })
  await addLog('STAFF_CREATED', 'success', `Compte NeoTravel créé : ${nom} (${email}) — rôle ${role}`, { createdBy: req.userId })

  res.status(201).json({
    user: { id: authData.user!.id, nom, email, role, organisation: organisation ?? null },
  })
})

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Données invalides' }); return }

  const { email, password } = parsed.data

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    res.status(401).json({ message: 'Email ou mot de passe incorrect.' }); return
  }

  const { data: profile } = await supabase.from('profiles').select('nom, role, organisation').eq('id', data.user.id).single()
  await addLog('USER_LOGIN', 'success', `Connexion réussie : ${email}`)

  res.json({
    token: data.session.access_token,
    user: {
      id:           data.user.id,
      nom:          profile?.nom ?? data.user.email,
      email:        data.user.email,
      role:         profile?.role ?? 'client',
      organisation: profile?.organisation ?? null,
    },
  })
})

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

router.post('/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Déconnexion effectuée.' })
})

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('nom, role, organisation')
    .eq('id', req.userId)
    .single()

  if (!profile) { res.status(404).json({ message: 'Utilisateur introuvable.' }); return }

  const { data: user } = await supabase.auth.admin.getUserById(req.userId!)
  res.json({
    id:           req.userId,
    nom:          profile.nom,
    email:        user?.user?.email,
    role:         profile.role,
    organisation: profile.organisation ?? null,
  })
})

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────

router.post('/forgot-password', async (req: Request, res: Response) => {
  const parsed = z.object({ email: z.string().email() }).safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Email invalide.' }); return }

  const RESPONSE = { message: 'Si un compte existe, un email de réinitialisation a été envoyé.' }

  const { data: user } = await supabase.auth.admin.listUsers()
  const match = user?.users?.find(u => u.email === parsed.data.email)
  if (!match) { res.json(RESPONSE); return }

  const token = crypto.randomUUID()
  // Store token in profiles temporarily (simple approach — no extra table needed)
  await supabase.from('profiles').update({
    // Use a JSONB payload field if you extend the schema, or use Supabase's built-in reset
  } as never).eq('id', match.id)

  // Use Supabase built-in password reset email
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
  })

  sendPasswordResetEmail({ email: parsed.data.email, nom: '' } as never, token).catch(() => {})
  res.json(RESPONSE)
})

// ─── POST /api/auth/reset-password ───────────────────────────────────────────

router.post('/reset-password', async (req: Request, res: Response) => {
  const parsed = z.object({ token: z.string().min(10), password: z.string().min(8).max(100) }).safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Données invalides.' }); return }

  // Supabase handles token-based reset via its own flow; this endpoint is for
  // the exchange flow where the frontend passes the access_token from the reset link
  const { error } = await supabase.auth.admin.updateUserById(parsed.data.token, {
    password: parsed.data.password,
  })
  if (error) { res.status(400).json({ message: 'Lien invalide ou expiré.' }); return }

  await addLog('PASSWORD_RESET', 'success', 'Mot de passe réinitialisé')
  res.json({ message: 'Mot de passe mis à jour avec succès.' })
})

// ─── PATCH /api/auth/me ───────────────────────────────────────────────────────

router.patch('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    nom:          z.string().min(2).max(80).optional(),
    email:        z.string().email().optional(),
    organisation: z.string().max(120).optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Données invalides.' }); return }

  const { nom, email, organisation } = parsed.data

  if (email) {
    await supabase.auth.admin.updateUserById(req.userId!, { email })
  }

  const profileUpdate: Record<string, unknown> = {}
  if (nom)          profileUpdate.nom          = nom
  if (organisation) profileUpdate.organisation = organisation

  if (Object.keys(profileUpdate).length > 0) {
    await supabase.from('profiles').update(profileUpdate).eq('id', req.userId)
  }

  await addLog('USER_PROFILE_UPDATED', 'success', `Profil mis à jour`, parsed.data)

  const { data: profile } = await supabase.from('profiles').select('nom, role, organisation').eq('id', req.userId).single()
  const { data: user }    = await supabase.auth.admin.getUserById(req.userId!)

  res.json({
    id:           req.userId,
    nom:          profile?.nom,
    email:        user?.user?.email,
    role:         profile?.role,
    organisation: profile?.organisation ?? null,
  })
})

// ─── PATCH /api/auth/password ─────────────────────────────────────────────────

router.patch('/password', requireAuth, async (req: AuthRequest, res: Response) => {
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword:     z.string().min(8).max(100),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ message: 'Données invalides.' }); return }

  // Re-verify current password by attempting sign-in
  const { data: user } = await supabase.auth.admin.getUserById(req.userId!)
  if (!user?.user?.email) { res.status(404).json({ message: 'Utilisateur introuvable.' }); return }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email:    user.user.email,
    password: parsed.data.currentPassword,
  })
  if (signInError) { res.status(401).json({ message: 'Mot de passe actuel incorrect.' }); return }

  await supabase.auth.admin.updateUserById(req.userId!, { password: parsed.data.newPassword })
  await addLog('USER_PASSWORD_UPDATED', 'success', `Mot de passe modifié : ${user.user.email}`)
  sendPasswordChangedEmail({ email: user.user.email, nom: '' } as never).catch(() => {})

  res.json({ message: 'Mot de passe modifié avec succès.' })
})

export default router
