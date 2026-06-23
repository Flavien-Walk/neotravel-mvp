import { Request, Response, NextFunction } from 'express'

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.ADMIN_SECRET
  if (!secret) { next(); return }  // Pas de protection si pas de secret configuré

  const provided =
    req.headers['x-admin-secret'] ||
    req.query.admin_secret

  if (provided === secret) { next(); return }

  res.status(401).json({ message: 'Non autorisé. Header x-admin-secret requis.' })
}
