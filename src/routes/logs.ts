import { Router, Request, Response } from 'express'
import { LogDB } from '../lib/db'
import { requireAuth } from '../middleware/requireAuth'

const router = Router()

// GET /api/logs
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const filter: Record<string, unknown> = {}
    if (req.query.leadId) filter.lead_id = req.query.leadId
    if (req.query.status) filter.status  = req.query.status
    const logs = await LogDB.find(filter, { sort: 'timestamp', limit: 500 })
    res.json(logs)
  } catch (err) {
    res.status(500).json({ message: 'Erreur récupération logs', error: String(err) })
  }
})

// POST /api/logs
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const log = await LogDB.create(req.body)
    res.status(201).json(log)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur création log'
    res.status(400).json({ message })
  }
})

export default router
