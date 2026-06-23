import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: string
  userRole?: string
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret'

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    res.status(401).json({ message: 'Authentification requise.' })
    return
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string; role?: string }
    req.userId   = payload.sub
    req.userRole = payload.role
    next()
  } catch {
    res.status(401).json({ message: 'Token invalide ou expiré.' })
  }
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
