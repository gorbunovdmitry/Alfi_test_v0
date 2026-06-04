// Picks 3 goals from the catalog based on the user's clarifying answers.
// Goals are always instantiated from real templates (never free-generated).

import type { Confidence, GoalDifficulty, UserGoal } from '../types/coach'
import { templateById } from '../data/goalCatalog'
import { instantiateGoal } from './goalMechanics'

type Spec = {
  templateId: string
  relatedCategoryId?: string
  title?: string
  description?: string
  reason: string
  confidence: Confidence
  explanation: string
}

// The canonical 3 goals from the master prompt (§2.5) — used as the default plan.
const MARKETPLACE_LIMIT: Spec = {
  templateId: 'spend_limit_category',
  relatedCategoryId: 'marketplaces',
  title: 'Удержать маркетплейсы в лимите',
  description:
    'За последние месяцы Ozon/WB и похожие покупки стали одной из заметных зон расходов. На этой неделе попробуем не запрещать покупки, а удержать понятный лимит.',
  reason:
    'Маркетплейсы — заметная гибкая зона расходов (≈18 300 ₽ за период). Лимит удержит траты без полного отказа.',
  confidence: 'high',
  explanation:
    'Возьмите недельный лимит как ориентир. Если приближаетесь к нему — отложите необязательную покупку на потом.',
}

const SAVE_8000: Spec = {
  templateId: 'save_fixed_amount',
  title: 'Отложить 8 000 ₽',
  description:
    'Это мягкая сумма, которая не выглядит слишком жёсткой с учётом поступлений и обязательных платежей. Цель — закрепить привычку откладывать регулярно.',
  reason:
    'Поступления стабильные, поэтому небольшую сумму реально отложить, не урезая базовое.',
  confidence: 'medium',
  explanation: 'Удобнее отложить сразу после ближайшего поступления, пока деньги не разошлись.',
}

const REVIEW_SUBSCRIPTIONS: Spec = {
  templateId: 'review_subscriptions',
  title: 'Разобрать регулярные списания',
  description:
    'В данных есть регулярные платежи и подписки. На этой неделе достаточно найти 1–2 списания, которые можно отключить или перенести.',
  reason: 'В тратах видны регулярные списания и подписки — пара из них может оказаться лишней.',
  confidence: 'medium',
  explanation: 'Начните с подписок, которыми давно не пользуетесь.',
}

const EMERGENCY_FUND: Spec = {
  templateId: 'build_emergency_fund',
  title: 'Отложить 5 000 ₽ в подушку',
  description:
    'Небольшой резерв добавит запас прочности — особенно когда баланс периода уходит в минус.',
  reason: 'Баланс периода в небольшом минусе — подушка снизит зависимость от кредитки.',
  confidence: 'medium',
  explanation: 'Заведите отдельный накопительный счёт, чтобы резерв не смешивался с тратами.',
}

const REDUCE_YANDEX: Spec = {
  templateId: 'reduce_category_spend',
  relatedCategoryId: 'yandex_ecosystem',
  reason:
    'Яндекс, доставка и лавка — частые небольшие траты (≈25 900 ₽, 131 операция). Их легко мягко снизить.',
  confidence: 'medium',
  explanation: 'Достаточно сократить пару доставок в неделю — резать жёстко не нужно.',
}

const LABEL_OTHER: Spec = {
  templateId: 'label_other_spending',
  reason:
    'Категория «Другое» — большая (≈119 100 ₽, 207 операций). Разметка покажет, куда реально уходят деньги.',
  confidence: 'high',
  explanation: 'Разметьте 10–15 операций из «Другое» — картина станет точнее.',
}

const MONTH_BUDGET: Spec = {
  templateId: 'set_month_budget',
  reason: 'Бюджет на месяц поможет отделить обязательное от свободных денег.',
  confidence: 'medium',
  explanation: 'Сначала выпишите обязательные платежи, остаток и будет свободными деньгами.',
}

// Which 3 specs to use for each "main priority" answer (q_priority).
const PLANS: Record<string, Spec[]> = {
  save_more: [SAVE_8000, EMERGENCY_FUND, MARKETPLACE_LIMIT],
  cut_spending: [MARKETPLACE_LIMIT, REDUCE_YANDEX, REVIEW_SUBSCRIPTIONS],
  understand: [LABEL_OTHER, MONTH_BUDGET, MARKETPLACE_LIMIT],
  vacation: [SAVE_8000, MARKETPLACE_LIMIT, REVIEW_SUBSCRIPTIONS],
  cushion: [EMERGENCY_FUND, SAVE_8000, REVIEW_SUBSCRIPTIONS],
}

const DEFAULT_PLAN: Spec[] = [MARKETPLACE_LIMIT, SAVE_8000, REVIEW_SUBSCRIPTIONS]

function specToGoal(spec: Spec, idx: number, difficulty: GoalDifficulty): UserGoal {
  const template = templateById[spec.templateId]
  // When the difficulty differs from normal, drop the amount-bearing title override
  // so the title re-generates with the adjusted number.
  const keepTitle = difficulty === 'normal'
  return instantiateGoal(template, {
    id: `sg_${idx + 1}`,
    difficulty,
    relatedCategoryId: spec.relatedCategoryId,
    titleOverride: keepTitle ? spec.title : undefined,
    descriptionOverride: spec.description,
    recommendedReason: spec.reason,
    confidence: spec.confidence,
    aiExplanation: spec.explanation,
  })
}

/** Build the 3 AI-recommended goals from the user's answers. */
export function buildSuggestedGoals(answers: Record<string, string>): UserGoal[] {
  const difficulty = (answers['q_difficulty'] as GoalDifficulty) || 'normal'
  const plan = PLANS[answers['q_priority']] ?? DEFAULT_PLAN
  return plan.map((spec, i) => specToGoal(spec, i, difficulty))
}
