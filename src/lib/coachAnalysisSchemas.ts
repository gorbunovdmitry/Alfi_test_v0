// Validators / normalizers that turn raw LLM JSON into trusted domain objects.
// Catalog-only, distinct-category, amount-clamp and relevance rules are enforced HERE.

import type {
  CardTone,
  ClarifyingQuestion,
  GoalCategory,
  GoalDifficulty,
  SummaryCard,
  UserGoal,
} from '../types/coach'
import { GOAL_CATEGORY_ORDER, templateById, templatesByCategory } from '../data/goalCatalog'
import {
  bucketById,
  FLEXIBLE_BUCKET_IDS,
  financialSummary,
  monthlyAggregates,
  transferBreakdown,
} from '../data/demoFinancialData'
import { instantiateGoal } from './goalMechanics'
import { buildSuggestedGoals } from './suggestGoals'
import { formatRub, formatSignedRub } from './format'

// ——— guards ———
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}
const asArray = (x: unknown): unknown[] => (Array.isArray(x) ? x : [])
const str = (x: unknown): string => (typeof x === 'string' ? x.trim() : '')
function num(x: unknown): number {
  const n = typeof x === 'number' ? x : typeof x === 'string' ? parseFloat(x.replace(/\s/g, '')) : NaN
  return Number.isFinite(n) ? n : 0
}

const DIFFS: GoalDifficulty[] = ['soft', 'normal', 'ambitious']
const TONES: CardTone[] = ['good', 'neutral', 'watch']

const round500 = (n: number) => Math.max(500, Math.round(n / 500) * 500)
export const clampMoney = (n: number) => round500(Math.min(20000, Math.max(1000, n)))
export const clampLimit = (n: number) => round500(Math.min(12000, Math.max(500, n)))
export const clampSteps = (n: number) => Math.min(5, Math.max(1, Math.round(n)))

// ——————————————————————————————————————————————————————————
// Audit payload — { cards, gapQuestions }
// ——————————————————————————————————————————————————————————
function parseCards(parsed: unknown): SummaryCard[] {
  const root = isRecord(parsed) ? parsed : {}
  const out: SummaryCard[] = []
  asArray(root.cards).forEach((raw, i) => {
    if (!isRecord(raw)) return
    const title = str(raw.title)
    const body = str(raw.body)
    if (!title || !body) return
    const toneRaw = str(raw.tone) as CardTone
    const tone: CardTone = TONES.includes(toneRaw) ? toneRaw : 'neutral'
    out.push({ id: str(raw.id) || `card_${i + 1}`, title, body: body.slice(0, 240), tone })
  })
  if (out.length < 3) throw new Error('TOO_FEW_CARDS')
  return out.slice(0, 7)
}

/** 0–2 genuine gap-questions (empty is valid). */
function parseGapQuestions(parsed: unknown): ClarifyingQuestion[] {
  const root = isRecord(parsed) ? parsed : {}
  const out: ClarifyingQuestion[] = []
  asArray(root.gapQuestions).forEach((raw, i) => {
    if (!isRecord(raw)) return
    const question = str(raw.question)
    if (!question) return
    const options = asArray(raw.options)
      .map((o) => (isRecord(o) ? { value: str(o.value), label: str(o.label) } : { value: '', label: '' }))
      .filter((o) => o.value && o.label)
    if (options.length < 2) return
    const hint = str(raw.hint)
    out.push({ id: str(raw.id) || `q_gap_${i + 1}`, question, ...(hint ? { hint } : {}), options })
  })
  return out.slice(0, 2)
}

export function parseAuditPayload(parsed: unknown): { cards: SummaryCard[]; gapQuestions: ClarifyingQuestion[] } {
  return { cards: parseCards(parsed), gapQuestions: parseGapQuestions(parsed) }
}

// ——————————————————————————————————————————————————————————
// Goals payload — restricted to the allowed (relevant) template ids
// ——————————————————————————————————————————————————————————
function materializeOne(raw: unknown, id: string, allowed: Set<string>): UserGoal | null {
  if (!isRecord(raw)) return null
  const templateId = str(raw.templateId)
  if (!allowed.has(templateId)) return null
  const template = templateById[templateId]
  if (!template) return null

  const diffRaw = str(raw.difficulty) as GoalDifficulty
  const difficulty: GoalDifficulty = DIFFS.includes(diffRaw) ? diffRaw : 'normal'

  let relatedCategoryId = str(raw.relatedCategoryId) || template.defaults.relatedCategoryId
  if (template.progressType === 'spend_limit') {
    if (!relatedCategoryId || !FLEXIBLE_BUCKET_IDS.includes(relatedCategoryId) || !bucketById[relatedCategoryId]) {
      relatedCategoryId = template.defaults.relatedCategoryId ?? 'marketplaces'
    }
  }

  const title = str(raw.title)
  const reason = str(raw.reason)
  const goal = instantiateGoal(template, {
    id,
    difficulty,
    relatedCategoryId,
    titleOverride: title || undefined,
    recommendedReason: reason,
    aiExplanation: reason,
    confidence: 'medium',
  })

  if (template.progressType === 'money_saved') {
    const a = num(raw.targetAmount)
    if (a > 0) goal.targetAmount = clampMoney(a)
  } else if (template.progressType === 'spend_limit') {
    const a = num(raw.limitAmount)
    if (a > 0) goal.limitAmount = clampLimit(a)
  } else if (template.progressType === 'steps') {
    const a = num(raw.stepsTotal)
    if (a > 0) goal.stepsTotal = clampSteps(a)
  }
  return goal
}

/** 3 goals, distinct categories, only from the allowed (relevant) set; backfilled deterministically. */
export function parseGoalsPayload(
  parsed: unknown,
  answers: Record<string, string>,
  allowedIds: string[],
): UserGoal[] {
  const allowed = new Set(allowedIds)
  const root = isRecord(parsed) ? parsed : {}
  const used = new Set<GoalCategory>()
  const picked: UserGoal[] = []

  for (const raw of asArray(root.goals)) {
    if (picked.length >= 3) break
    const g = materializeOne(raw, `tmp_${picked.length}`, allowed)
    if (!g || used.has(g.category)) continue
    used.add(g.category)
    picked.push(g)
  }
  // Backfill from the deterministic builder (allowed + distinct category).
  if (picked.length < 3) {
    for (const g of buildSuggestedGoals(answers)) {
      if (picked.length >= 3) break
      if (!allowed.has(g.templateId) || used.has(g.category)) continue
      used.add(g.category)
      picked.push(g)
    }
  }
  // Last resort: any allowed template from an unused category.
  if (picked.length < 3) {
    for (const cat of GOAL_CATEGORY_ORDER) {
      if (picked.length >= 3) break
      if (used.has(cat)) continue
      const t = templatesByCategory[cat]?.find((x) => allowed.has(x.id))
      if (!t) continue
      used.add(cat)
      picked.push(instantiateGoal(t, { id: `tmp_${picked.length}`, difficulty: 'normal', confidence: 'medium' }))
    }
  }
  return picked.slice(0, 3).map((g, i) => ({ ...g, id: `sg_${i + 1}`, status: 'suggested' as const }))
}

// ——————————————————————————————————————————————————————————
// Deterministic fallbacks (no LLM)
// ——————————————————————————————————————————————————————————
export function buildFallbackCards(): SummaryCard[] {
  const monthsPlus = monthlyAggregates.filter((m) => m.balance > 0).length
  const self = transferBreakdown.find((b) => b.key === 'self')
  const cards: SummaryCard[] = [
    {
      id: 'fc_income',
      title: 'Стабильные поступления',
      body: `За период поступления ${formatRub(financialSummary.income)} — доход регулярный, это хорошая опора.`,
      tone: 'good',
    },
    {
      id: 'fc_months',
      title: 'Есть месяцы в плюсе',
      body: `В ${monthsPlus} из ${monthlyAggregates.length} месяцев расходы не превысили доход — основа уже есть.`,
      tone: 'good',
    },
    {
      id: 'fc_transfers',
      title: 'Переводы — в основном себе',
      body: self
        ? `Из «Переводы и наличные» ~${formatRub(self.amount)} — внутрибанковские переводы между своими счетами, это не траты.`
        : 'Значительная часть «Переводы и наличные» — переводы между своими счетами, это не траты.',
      tone: 'neutral',
    },
    {
      id: 'fc_other',
      title: '«Другое» — зона для разметки',
      body: `Категория «Другое» — ${formatRub(bucketById.other.amount)}, много операций. Разметка покажет, куда уходят деньги.`,
      tone: 'watch',
    },
    {
      id: 'fc_flex',
      title: 'Где можно высвободить',
      body: 'Маркетплейсы и Яндекс/доставку можно удержать в мягком лимите — без отказа от покупок.',
      tone: 'watch',
    },
    {
      id: 'fc_balance',
      title: 'Баланс периода в минусе',
      body: `Период закрылся на ${formatSignedRub(financialSummary.balance)}. Это поправимо небольшими шагами.`,
      tone: 'watch',
    },
  ]
  return cards.slice(0, 6)
}
