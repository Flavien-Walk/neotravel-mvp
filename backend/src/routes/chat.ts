import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { processMessage, mergeFields } from '../services/llm/llmService'
import type { LLMMessage } from '../services/llm/anthropicProvider'

const router = Router()

const MessageSchema = z.object({
  messages:      z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })),
  currentFields: z.record(z.string(), z.unknown()).optional().default({}),
})

// POST /api/chat/message
router.post('/message', async (req: Request, res: Response) => {
  const parsed = MessageSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Format invalide', errors: parsed.error.flatten() })
    return
  }

  const { messages, currentFields } = parsed.data

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    res.status(400).json({ message: 'Le dernier message doit être de rôle "user".' })
    return
  }

  try {
    const response = await processMessage(messages as LLMMessage[], currentFields)
    const updatedFields = mergeFields(currentFields, response.fields)

    res.json({
      message:      response.message,
      fields:       updatedFields,
      is_complete:  response.is_complete,
      needs_human:  response.needs_human,
      human_reason: response.human_reason ?? null,
    })
  } catch (err) {
    console.error('[/api/chat/message]', err)
    res.status(500).json({ message: 'Erreur lors du traitement du message.' })
  }
})

export default router
