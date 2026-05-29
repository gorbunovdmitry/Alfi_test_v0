import type { Goal } from '../types'
import { monthsBetween } from './dates'
import { pluralRu } from './format'
import { MOCK_TODAY } from '../data/mockData'

/** e.g. "4 месяца" */
export function monthsLabel(goal: Goal): string {
  if (!goal.deadline) return '—'
  const m = monthsBetween(MOCK_TODAY, goal.deadline)
  return `${m} ${pluralRu(m, ['месяц', 'месяца', 'месяцев'])}`
}
