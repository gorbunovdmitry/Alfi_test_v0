// Pure helpers that turn goal templates into concrete UserGoals and apply the
// "make easier / harder / change category / nudge progress" mechanics.

import type {
  Confidence,
  GoalDifficulty,
  GoalProgressType,
  GoalTemplate,
  UserGoal,
} from '../types/coach'
import { formatNumber } from './format'
import { bucketById, DEMO_TODAY } from '../data/demoFinancialData'
import { templateById } from '../data/goalCatalog'

const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** "до 4 июня" */
export function formatDeadline(iso?: string): string {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00:00Z`)
  return `до ${d.getUTCDate()} ${MONTHS_GEN[d.getUTCMonth()]}`
}

const round500 = (n: number) => Math.max(500, Math.round(n / 500) * 500)

export const DIFFICULTY_LABEL: Record<GoalDifficulty, string> = {
  soft: 'мягкая',
  normal: 'обычная',
  ambitious: 'амбициозная',
}

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  low: 'низкая',
  medium: 'средняя',
  high: 'высокая',
}

const DIFF_ORDER: GoalDifficulty[] = ['soft', 'normal', 'ambitious']

export function shiftDifficulty(d: GoalDifficulty, dir: 'easier' | 'harder'): GoalDifficulty {
  const i = DIFF_ORDER.indexOf(d)
  const next = dir === 'easier' ? i - 1 : i + 1
  return DIFF_ORDER[Math.min(DIFF_ORDER.length - 1, Math.max(0, next))]
}

/** Amount for a money_saved goal at a given difficulty (soft halves, ambitious ×1.5). */
function moneyAmount(base: number, d: GoalDifficulty): number {
  const mult = d === 'soft' ? 0.5 : d === 'ambitious' ? 1.5 : 1
  return round500(base * mult)
}

/** Limit for a spend_limit goal (soft = looser/higher, ambitious = tighter/lower). */
function limitAmount(base: number, d: GoalDifficulty): number {
  const mult = d === 'soft' ? 1.4 : d === 'ambitious' ? 0.7 : 1
  return round500(base * mult)
}

function stepsAmount(base: number, d: GoalDifficulty): number {
  if (d === 'soft') return Math.max(1, base - 1)
  if (d === 'ambitious') return base + 1
  return base
}

function shortLabelFor(categoryId?: string): string {
  return (categoryId && bucketById[categoryId]?.shortLabel) || 'категорию'
}

/** Default title that embeds the changing number/category, so it stays in sync. */
function defaultTitle(template: GoalTemplate, g: Partial<UserGoal>): string {
  switch (template.id) {
    case 'spend_limit_category':
      return `Удержать ${shortLabelFor(g.relatedCategoryId)} в лимите`
    case 'reduce_category_spend':
      return `Снизить траты на ${shortLabelFor(g.relatedCategoryId)}`
    case 'save_fixed_amount':
    case 'save_income_percent':
      return `Отложить ${formatNumber(g.targetAmount ?? 0)} ₽`
    case 'build_emergency_fund':
      return `Отложить ${formatNumber(g.targetAmount ?? 0)} ₽ в подушку`
    case 'make_extra_debt_payment':
      return `Внести ${formatNumber(g.targetAmount ?? 0)} ₽ по кредиту`
    case 'move_idle_money':
      return `Переложить ${formatNumber(g.targetAmount ?? 0)} ₽ в накопления`
    default:
      return template.title
  }
}

function initProgressFields(type: GoalProgressType): Partial<UserGoal> {
  switch (type) {
    case 'money_saved':
      return { currentAmount: 0 }
    case 'spend_limit':
      return { spentAmount: 0 }
    case 'steps':
      return { stepsCompleted: 0 }
    case 'binary':
      return { done: false }
  }
}

type InstantiateOpts = {
  id: string
  difficulty?: GoalDifficulty
  relatedCategoryId?: string
  titleOverride?: string
  descriptionOverride?: string
  recommendedReason?: string
  confidence?: Confidence
  aiExplanation?: string
}

/** Build a concrete UserGoal from a template + recommended defaults. */
export function instantiateGoal(template: GoalTemplate, opts: InstantiateOpts): UserGoal {
  const difficulty = opts.difficulty ?? 'normal'
  const relatedCategoryId = opts.relatedCategoryId ?? template.defaults.relatedCategoryId

  const amounts: Partial<UserGoal> = {}
  if (template.progressType === 'money_saved' && template.defaults.targetAmount != null) {
    amounts.targetAmount = moneyAmount(template.defaults.targetAmount, difficulty)
  }
  if (template.progressType === 'spend_limit' && template.defaults.limitAmount != null) {
    amounts.limitAmount = limitAmount(template.defaults.limitAmount, difficulty)
  }
  if (template.progressType === 'steps') {
    amounts.stepsTotal = stepsAmount(template.defaults.stepsTotal ?? 3, difficulty)
  }

  const base: Partial<UserGoal> = { relatedCategoryId, ...amounts }
  const title = opts.titleOverride ?? defaultTitle(template, base)

  return {
    id: opts.id,
    templateId: template.id,
    title,
    description: opts.descriptionOverride ?? template.description,
    category: template.category,
    progressType: template.progressType,
    difficulty,
    status: 'suggested',
    period: template.defaultPeriod,
    deadline: addDaysISO(DEMO_TODAY, template.defaults.deadlineDays ?? 7),
    relatedCategoryId,
    recommendedReason: opts.recommendedReason ?? '',
    confidence: opts.confidence ?? 'medium',
    aiExplanation: opts.aiExplanation ?? '',
    ...initProgressFields(template.progressType),
    ...amounts,
  }
}

/** Make a goal easier or harder by one difficulty step; keeps progress, recomputes target. */
export function adjustGoalDifficulty(goal: UserGoal, dir: 'easier' | 'harder'): UserGoal {
  const template = templateById[goal.templateId]
  if (!template) return goal
  const difficulty = shiftDifficulty(goal.difficulty, dir)
  const next: UserGoal = { ...goal, difficulty }

  if (goal.progressType === 'money_saved' && template.defaults.targetAmount != null) {
    next.targetAmount = moneyAmount(template.defaults.targetAmount, difficulty)
    next.currentAmount = Math.min(goal.currentAmount ?? 0, next.targetAmount)
    next.title = defaultTitle(template, next)
  } else if (goal.progressType === 'spend_limit' && template.defaults.limitAmount != null) {
    next.limitAmount = limitAmount(template.defaults.limitAmount, difficulty)
    next.spentAmount = Math.min(goal.spentAmount ?? 0, next.limitAmount)
  } else if (goal.progressType === 'steps') {
    next.stepsTotal = stepsAmount(template.defaults.stepsTotal ?? 3, difficulty)
    next.stepsCompleted = Math.min(goal.stepsCompleted ?? 0, next.stepsTotal)
  }
  return next
}

/** Re-point a spend-limit goal to a different spending bucket. */
export function changeGoalCategory(goal: UserGoal, categoryId: string): UserGoal {
  const template = templateById[goal.templateId]
  if (!template) return goal
  const next: UserGoal = { ...goal, relatedCategoryId: categoryId }
  next.title = defaultTitle(template, next)
  const bucket = bucketById[categoryId]
  if (bucket) next.description = `Удержать понятный лимит в категории «${bucket.name}» за период.`
  return next
}

/** Demo progress step for a goal (used by the progress-screen action buttons). */
export function nudgeStep(goal: UserGoal): number {
  if (goal.progressType === 'money_saved') return round500((goal.targetAmount ?? 4000) * 0.25)
  if (goal.progressType === 'spend_limit') return round500((goal.limitAmount ?? 5000) * 0.2)
  return 1
}

export function nudgeGoal(goal: UserGoal): UserGoal {
  const step = nudgeStep(goal)
  switch (goal.progressType) {
    case 'money_saved':
      return { ...goal, currentAmount: Math.min(goal.targetAmount ?? 0, (goal.currentAmount ?? 0) + step) }
    case 'spend_limit':
      return { ...goal, spentAmount: Math.min(goal.limitAmount ?? 0, (goal.spentAmount ?? 0) + step) }
    case 'steps':
      return { ...goal, stepsCompleted: Math.min(goal.stepsTotal ?? 0, (goal.stepsCompleted ?? 0) + 1) }
    case 'binary':
      return { ...goal, done: true }
  }
}

export function nudgeLabel(goal: UserGoal): string {
  switch (goal.progressType) {
    case 'money_saved':
      return `Отложить ${formatNumber(nudgeStep(goal))} ₽`
    case 'spend_limit':
      return `Записать трату ${formatNumber(nudgeStep(goal))} ₽`
    case 'steps':
      return 'Отметить шаг'
    case 'binary':
      return 'Отметить выполненной'
  }
}

/** 0..1 progress fraction. For spend_limit this is "share of the limit used". */
export function progressFraction(goal: UserGoal): number {
  switch (goal.progressType) {
    case 'money_saved':
      return goal.targetAmount ? Math.min(1, (goal.currentAmount ?? 0) / goal.targetAmount) : 0
    case 'spend_limit':
      return goal.limitAmount ? Math.min(1, (goal.spentAmount ?? 0) / goal.limitAmount) : 0
    case 'steps':
      return goal.stepsTotal ? Math.min(1, (goal.stepsCompleted ?? 0) / goal.stepsTotal) : 0
    case 'binary':
      return goal.done ? 1 : 0
  }
}

export function progressLabel(goal: UserGoal): string {
  switch (goal.progressType) {
    case 'money_saved':
      return `${formatNumber(goal.currentAmount ?? 0)} / ${formatNumber(goal.targetAmount ?? 0)} ₽`
    case 'spend_limit':
      return `${formatNumber(goal.spentAmount ?? 0)} / ${formatNumber(goal.limitAmount ?? 0)} ₽`
    case 'steps':
      return `${goal.stepsCompleted ?? 0} из ${goal.stepsTotal ?? 0} шагов`
    case 'binary':
      return goal.done ? 'Выполнено' : 'Не начато'
  }
}

/** Short human label for the goal's headline parameter (shown on the goal card). */
export function paramLabel(goal: UserGoal): string {
  switch (goal.progressType) {
    case 'money_saved':
      return `Цель: ${formatNumber(goal.targetAmount ?? 0)} ₽`
    case 'spend_limit':
      return `Лимит: ${formatNumber(goal.limitAmount ?? 0)} ₽`
    case 'steps':
      return `${goal.stepsTotal ?? 0} шага`
    case 'binary':
      return 'Действие на неделю'
  }
}

export function isGoalComplete(goal: UserGoal): boolean {
  return progressFraction(goal) >= 1
}

/** Progress-bar colour. Savings/steps/binary are positive (green); a spend limit
 * warms up (green → amber → red) as it gets used. */
export function goalProgressColor(goal: UserGoal): string {
  if (goal.progressType === 'spend_limit') {
    const f = progressFraction(goal)
    return f >= 1 ? '#EF3124' : f >= 0.75 ? '#FF8A00' : '#1E854A'
  }
  return '#1E854A'
}

export const CATEGORY_ACCENT: Record<UserGoal['category'], string> = {
  spending_control: '#EF3124',
  savings: '#1E854A',
  debt: '#111111',
  financial_hygiene: '#3D6FF2',
  benefits_income: '#FF8A00',
}
