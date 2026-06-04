// Chat hook for the Financial Coach. Reuses the existing dev proxy (/api/chat →
// AITunnel gpt-5.4-nano). Messages live in the coach reducer; this hook only builds
// the request and resolves the answer.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Dispatch } from 'react'
import type { FinancialCoachState } from '../types/coach'
import type { CoachAction } from '../hooks/useFinancialCoach'
import { COACH_SYSTEM_PROMPT } from './coachSystemPrompt'
import { buildCoachContext } from './coachContext'
import { postChat } from './llmJson'
import { classifyIntent } from './coachIntent'
import { MODEL_CHAT, MODEL_EXPLAIN, MODEL_FALLBACKS } from './coachModels'
import { financialSummary, spendingBuckets } from '../data/demoFinancialData'
import { formatRub } from './format'

/** Offline fallback when the API key isn't set or the request fails. */
function scriptedFallback(prompt: string): string {
  const q = prompt.toLowerCase()
  if (q.includes('почему') && q.includes('цел'))
    return 'Цели подобраны под Ваши данные: удержать гибкую зону (маркетплейсы), мягко начать откладывать и разобрать регулярные списания. Их можно сделать легче, заменить или открыть полный каталог.'
  if (q.includes('куда') || q.includes('уход') || q.includes('трат') || q.includes('расход')) {
    const top = spendingBuckets[0]
    const second = spendingBuckets[2]
    return `Больше всего проходит через «${top.name}» (${formatRub(top.amount)}) и широкую категорию «Другое». Из гибких зон заметны маркетплейсы и «${second.name}» — по ним удобно поставить мягкий лимит.`
  }
  if (q.includes('крупн'))
    return 'Самые крупные операции — это переводы и наличные (часть может быть переводами себе) и пара покупок в маркетплейсах. Их стоит разметить, прежде чем делать выводы.'
  if (q.includes('доход') || q.includes('поступлен'))
    return `За период поступления ${formatRub(financialSummary.income)}, расходы ${formatRub(
      financialSummary.expenses,
    )}. Свободный остаток проседает в основном из-за крупных переводов.`
  return 'Я на связи, но сейчас не получилось обратиться к модели. Спросите ещё раз или уточните вопрос про траты, доходы или цели.'
}

export function useCoachChat(state: FinancialCoachState, dispatch: Dispatch<CoachAction>) {
  const [busy, setBusy] = useState(false)
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim()
      if (!text || busy) return
      const cur = stateRef.current

      const history = cur.chatMessages
        .filter((m) => m.id !== 0 && !m.loading && m.text)
        .map((m) => ({ role: m.role, content: m.text }))

      dispatch({ type: 'CHAT_SEND', text })
      setBusy(true)

      const apiMessages = [
        { role: 'system' as const, content: COACH_SYSTEM_PROMPT },
        { role: 'system' as const, content: buildCoachContext(cur) },
        ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: text },
      ]

      // Explanation intents ("почему эти цели", "объясни") → strong model; otherwise mini.
      const intent = classifyIntent(text)
      const model = intent === 'ask_why_goal' || intent === 'explain_summary' ? MODEL_EXPLAIN : MODEL_CHAT

      let answer: string
      try {
        answer = await postChat({
          model,
          fallbackModels: MODEL_FALLBACKS,
          messages: apiMessages,
          maxTokens: 1000,
        })
      } catch {
        answer = scriptedFallback(text)
      }

      dispatch({ type: 'CHAT_RESOLVE', text: answer })
      setBusy(false)
    },
    [busy, dispatch],
  )

  return { send, busy }
}
