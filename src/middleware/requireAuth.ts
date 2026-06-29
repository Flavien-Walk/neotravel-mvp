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

  // Jeton interne n8n — permet à n8n d'appeler les routes protégées
  const N8N_INTERNAL_TOKEN = process.env.N8N_INTERNAL_TOKEN
  if (N8N_INTERNAL_TOKEN && token === N8N_INTERNAL_TOKEN) {
    req.userId   = 'n8n-service'
    req.userRole = 'commercial'
    next()
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
