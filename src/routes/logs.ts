import { Router, Request, Response } from 'express'
import { Log } from '../models/Log'

const router = Router()

// GET /api/logs
router.get('/', async (req: Request, res: Response) => {
  try {
    const filter: Record<string, unknown> = {}
    if (req.query.leadId) filter.leadId = req.query.leadId
    const logs = await Log.find(filter).sort({ timestamp: -1 }).limit(200).lean()
    res.json(logs)
  } catch (err) {
    res.status(500).json({ message: 'Erreur récupération logs', error: String(err) })
  }
})

// POST /api/logs
router.post('/', async (req: Request, res: Response) => {
  try {
    const log = await Log.create(req.body)
    res.status(201).json(log)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur création log'
    res.status(400).json({ message })
  }
})

export default router
