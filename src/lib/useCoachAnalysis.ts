// Drives the LLM pipeline:
//   runAudit   — gpt-5.5, ALL data → picture cards + (only genuine) gap-questions.
//   buildGoals — gpt-5.4-mini → 3 goals from the relevant subset, then gpt-5.5 plan explanation.
// Each step has a minimum on-screen time and a full deterministic fallback.

import { useCallback, useEffect, useRef } from 'react'
import type { Dispatch } from 'react'
import type { ClarifyingQuestion, SummaryCard, FinancialCoachState, UserGoal } from '../types/coach'
import type { CoachAction } from '../hooks/useFinancialCoach'
import { extractJsonObject, postChat } from './llmJson'
import { AUDIT_PROMPT, EXPLAIN_PROMPT, GOALS_PROMPT } from './coachAnalysisPrompts'
import { buildAuditContext, buildCoachContext } from './coachContext'
import { buildFallbackCards, parseAuditPayload, parseGoalsPayload } from './coachAnalysisSchemas'
import { dataSignals } from '../data/demoFinancialData'
import { relevantTemplates } from '../data/goalCatalog'
import { MODEL_AUDIT, MODEL_EXPLAIN, MODEL_FALLBACKS, MODEL_GOALS } from './coachModels'

const MIN_MS = 2200
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
const ALLOWED_IDS = relevantTemplates(dataSignals).map((t) => t.id)

export function useCoachAnalysis(state: FinancialCoachState, dispatch: Dispatch<CoachAction>) {
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Primary audit (gpt-5.5) over ALL data → cards + gap-questions.
  const runAudit = useCallback(async () => {
    dispatch({ type: 'START_ANALYSIS' })
    const start = performance.now()
    let cards: SummaryCard[]
    let gapQuestions: ClarifyingQuestion[]
    let fromLLM = true
    try {
      const text = await postChat({
        model: MODEL_AUDIT,
        fallbackModels: MODEL_FALLBACKS,
        messages: [
          { role: 'system', content: AUDIT_PROMPT },
          { role: 'system', content: buildAuditContext(stateRef.current) },
        ],
        jsonMode: true,
        maxTokens: 2500,
      })
      const parsed = parseAuditPayload(extractJsonObject(text))
      cards = parsed.cards
      gapQuestions = parsed.gapQuestions
    } catch {
      cards = buildFallbackCards()
      gapQuestions = []
      fromLLM = false
    }
    const elapsed = performance.now() - start
    if (elapsed < MIN_MS) await sleep(MIN_MS - elapsed)
    dispatch({ type: 'AUDIT_RESOLVE', cards, gapQuestions, fromLLM })
  }, [dispatch])

  // Goal selection (gpt-5.4-mini, relevant subset) + plan explanation (gpt-5.5).
  const buildGoals = useCallback(async () => {
    dispatch({ type: 'REQUEST_GOALS' })
    const start = performance.now()
    const cur = stateRef.current
    let goals: UserGoal[]
    let fromLLM = true
    try {
      const text = await postChat({
        model: MODEL_GOALS,
        fallbackModels: MODEL_FALLBACKS,
        messages: [
          { role: 'system', content: GOALS_PROMPT },
          { role: 'system', content: buildCoachContext(cur, { allowedGoalIds: ALLOWED_IDS }) },
        ],
        jsonMode: true,
        maxTokens: 1400,
      })
      goals = parseGoalsPayload(extractJsonObject(text), cur.userAnswers, ALLOWED_IDS)
    } catch {
      goals = parseGoalsPayload({}, cur.userAnswers, ALLOWED_IDS)
      fromLLM = false
    }

    // Plan explanation (gpt-5.5) — uses the freshly chosen goals.
    let planExplanation: string
    try {
      planExplanation = await postChat({
        model: MODEL_EXPLAIN,
        fallbackModels: MODEL_FALLBACKS,
        messages: [
          { role: 'system', content: EXPLAIN_PROMPT },
          { role: 'system', content: buildCoachContext({ ...cur, suggestedGoals: goals }) },
        ],
        maxTokens: 500,
      })
    } catch {
      planExplanation = ''
    }

    const elapsed = performance.now() - start
    if (elapsed < MIN_MS) await sleep(MIN_MS - elapsed)
    dispatch({ type: 'GOALS_RESOLVE', goals, planExplanation, fromLLM })
  }, [dispatch])

  return { runAudit, buildGoals }
}
