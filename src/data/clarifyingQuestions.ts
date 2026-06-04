// Always-asked preference questions (goal + pace). Data-classification questions
// (transfers / «Другое») are gone — the audit classifies those automatically.
// Any extra questions come from the audit as genuine "gap" questions.

import type { ClarifyingQuestion } from '../types/coach'

export const GOAL_QUESTION: ClarifyingQuestion = {
  id: 'q_priority',
  question: 'Какая у Вас сейчас финансовая цель?',
  options: [
    { value: 'save_more', label: 'Больше откладывать' },
    { value: 'cut_spending', label: 'Снизить лишние траты' },
    { value: 'understand', label: 'Разобраться, куда уходят деньги' },
    { value: 'cushion', label: 'Собрать подушку безопасности' },
    { value: 'vacation', label: 'Накопить на поездку или покупку' },
  ],
}

export const PACE_QUESTION: ClarifyingQuestion = {
  id: 'q_difficulty',
  question: 'Какой темп изменений на ближайшую неделю Вам комфортнее?',
  hint: 'Темп можно поменять для каждой цели позже.',
  options: [
    { value: 'soft', label: 'Мягкий — небольшие шаги без жёсткой экономии' },
    { value: 'normal', label: 'Умеренный — ощутимо, но реально' },
    { value: 'ambitious', label: 'Активный — хочу быстрее улучшить ситуацию' },
  ],
}

/** Always-asked preference questions, appended after any audit gap-questions. */
export const PREFERENCE_QUESTIONS: ClarifyingQuestion[] = [GOAL_QUESTION, PACE_QUESTION]

/** Default question set used by answersToReadable when no dynamic set is given. */
export const clarifyingQuestions: ClarifyingQuestion[] = PREFERENCE_QUESTIONS

/** Readable "question → chosen option" map. Accepts a dynamic question set. */
export function answersToReadable(
  answers: Record<string, string>,
  questions: ClarifyingQuestion[] = clarifyingQuestions,
): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = []
  const known = new Set<string>()
  for (const q of questions) {
    const v = answers[q.id]
    if (!v) continue
    known.add(q.id)
    const opt = q.options.find((o) => o.value === v)
    out.push({ q: q.question, a: opt ? opt.label : v })
  }
  for (const [id, v] of Object.entries(answers)) {
    if (v && !known.has(id)) out.push({ q: id, a: v })
  }
  return out
}
