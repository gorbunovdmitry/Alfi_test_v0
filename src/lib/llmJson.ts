// Shared LLM call + tolerant JSON extraction for the analysis pipeline.
// Reuses the same dev proxy (/api/chat → AITunnel) as the chat, with per-call
// model routing and a graceful model-fallback chain.

import { COACH_MODEL } from './coachSystemPrompt'

export type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }

export type PostChatOpts = {
  messages: ChatMsg[]
  /** Primary model id. Defaults to COACH_MODEL. */
  model?: string
  /** Tried in order if the primary model errors (budget hold / unavailable). */
  fallbackModels?: string[]
  maxTokens?: number
  /** Adds response_format: { type: 'json_object' } (forwarded by the proxy). */
  jsonMode?: boolean
  signal?: AbortSignal
}

async function callOnce(model: string, opts: PostChatOpts): Promise<string> {
  const resp = await fetch(`${import.meta.env.VITE_CHAT_API_BASE ?? ''}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: opts.signal,
    body: JSON.stringify({
      model,
      messages: opts.messages,
      reasoning_effort: 'low',
      max_completion_tokens: opts.maxTokens ?? 1100,
      ...(opts.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  })
  const raw = await resp.text()
  let data: unknown = null
  try {
    data = JSON.parse(raw)
  } catch {
    // non-JSON body
  }
  const rec = (data ?? {}) as Record<string, unknown>
  const err = rec.error as { message?: string } | undefined
  if (!resp.ok || err) throw new Error(err?.message ?? `HTTP ${resp.status}`)
  const choices = rec.choices as Array<{ message?: { content?: string } }> | undefined
  const text = (choices?.[0]?.message?.content ?? '').trim()
  if (!text) throw new Error('EMPTY')
  return text
}

/** Raw model text, or throws after exhausting the model + fallbacks. */
export async function postChat(opts: PostChatOpts): Promise<string> {
  const models = [opts.model ?? COACH_MODEL, ...(opts.fallbackModels ?? [])]
  let lastErr: unknown
  for (let i = 0; i < models.length; i++) {
    try {
      return await callOnce(models[i], opts)
    } catch (e) {
      lastErr = e
      if (i < models.length - 1) {
        console.warn(`[coach] model "${models[i]}" failed (${String(e)}); falling back to "${models[i + 1]}"`)
      }
    }
  }
  throw lastErr ?? new Error('ALL_MODELS_FAILED')
}

/** Belt-and-suspenders: strip ```json fences, then extract the first balanced {...}. */
export function extractJsonObject(raw: string): unknown {
  let s = raw.trim()
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) s = fence[1].trim()
  try {
    return JSON.parse(s)
  } catch {
    // fall through to balanced-scan
  }
  const start = s.indexOf('{')
  if (start === -1) throw new Error('NO_JSON')
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < s.length; i++) {
    const ch = s[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
    } else if (ch === '"') {
      inStr = true
    } else if (ch === '{') {
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0) return JSON.parse(s.slice(start, i + 1))
    }
  }
  throw new Error('UNBALANCED_JSON')
}
