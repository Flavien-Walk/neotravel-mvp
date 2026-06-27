import { Request, Response, NextFunction } from 'express'
import { supabase } from '../lib/supabase'

export interface AuthRequest extends Request {
  userId?: string
  userRole?: string
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    res.status(401).json({ message: 'Authentification requise.' })
    return
  }

  // Verify the Supabase JWT and look up the user's role from profiles
  supabase.auth.getUser(token).then(async ({ data, error }) => {
    if (error || !data.user) {
      res.status(401).json({ message: 'Token invalide ou expiré.' })
      return
    }

    req.userId = data.user.id

    // Fetch role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    req.userRole = profile?.role ?? 'client'
    next()
  }).catch(() => {
    res.status(401).json({ message: 'Erreur authentification.' })
  })
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ message: 'Accès refusé.' })
      return
    }
    next()
  }
}
