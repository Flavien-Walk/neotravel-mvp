import OpenAI from 'openai'
import { SYSTEM_PROMPT, buildUserMessage } from './prompts'
import type { LLMMessage } from './anthropicProvider'

let _client: OpenAI | null = null

function getClient(): OpenAI {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _client
}

export async function callOpenAI(
  messages: LLMMessage[],
  currentFields: Record<string, unknown>
): Promise<string> {
  const client = getClient()
  const model = process.env.LLM_MODEL || 'gpt-4o-mini'

  const enrichedMessages = messages.map((m, i) =>
    i === messages.length - 1 && m.role === 'user'
      ? { ...m, content: buildUserMessage(m.content, currentFields) }
      : m
  )

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...enrichedMessages,
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1024,
  })

  return response.choices[0]?.message?.content ?? '{}'
}
