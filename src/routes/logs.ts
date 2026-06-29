import { Router, Request, Response } from 'express'
import { supabase } from '../lib/supabase'
import { requireAuth } from '../middleware/requireAuth'

const router = Router()

// GET /api/logs — protégé
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    let query = supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(500)
    if (req.query.leadId) query = query.eq('lead_id', req.query.leadId as string)
    if (req.query.status) query = query.eq('status', req.query.status as string)

    const { data, error } = await query
    if (error) { res.status(500).json({ message: error.message }); return }
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Erreur récupération logs', error: String(err) })
  }
})

// POST /api/logs — protégé (actions dashboard)
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('logs').insert(req.body).select().single()
    if (error) { res.status(400).json({ message: error.message }); return }
    res.status(201).json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur création log'
    res.status(400).json({ message })
  }
})

export default router
