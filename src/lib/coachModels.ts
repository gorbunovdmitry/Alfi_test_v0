// LLM routing per request type (owner's table):
//   Первичный аудит        → gpt-5.5        (all data, strong model)
//   Финальное объяснение   → gpt-5.5        (plan explanation + "почему" chat turns)
//   Обычный чат            → gpt-5.4-mini
//   Выбор цели из каталога → gpt-5.4-mini   (+ rules-side relevance gating)
//   Классификация интентов → rules          (coachIntent, no model)
// IDs are overridable via VITE_MODEL_* env vars. gpt-5.5 needs the AITunnel key
// budget raised (~400 ₽+ hold); until then postChat falls back down MODEL_FALLBACKS.

const env = import.meta.env

export const MODEL_AUDIT = env.VITE_MODEL_AUDIT ?? 'gpt-5.5'
export const MODEL_EXPLAIN = env.VITE_MODEL_EXPLAIN ?? 'gpt-5.5'
export const MODEL_CHAT = env.VITE_MODEL_CHAT ?? 'gpt-5.4-mini'
export const MODEL_GOALS = env.VITE_MODEL_GOALS ?? 'gpt-5.4-mini'

/** Fallback chain used when the requested model errors (e.g. budget hold not met). */
export const MODEL_FALLBACKS = ['gpt-5.4-mini', 'gpt-5.4-nano']
