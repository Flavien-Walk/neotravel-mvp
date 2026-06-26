import Anthropic from '@anthropic-ai/sdk'
import { SYSTEM_PROMPT, buildUserMessage } from './prompts'

let _client: Anthropic | null = null

function getClient(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return _client
}

export interface LLMMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function callAnthropic(
  messages: LLMMessage[],
  currentFields: Record<string, unknown>
): Promise<string> {
  const client = getClient()
  const model = process.env.LLM_MODEL || 'claude-sonnet-4-6'

  // Inject context into last user message
  const enrichedMessages = messages.map((m, i) =>
    i === messages.length - 1 && m.role === 'user'
      ? { ...m, content: buildUserMessage(m.content, currentFields) }
      : m
  )

  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: enrichedMessages,
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type from Anthropic')
  return content.text
}
