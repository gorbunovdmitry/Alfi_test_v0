// Catalog of allowed goals (the only goals the coach may use).
// Redesigned around the real spending zones. Relevance predicates gate which goals
// may be AUTO-suggested for the current data; the manual catalog shows ALL goals
// (the user may have a debt elsewhere / to a person that isn't in this dataset).

import type { GoalCategory, GoalTemplate } from '../types/coach'

export const GOAL_CATEGORY_LABELS: Record<GoalCategory, string> = {
  spending_control: 'Контроль трат',
  savings: 'Накопления',
  debt: 'Кредиты и обязательства',
  financial_hygiene: 'Финансовая гигиена',
  benefits_income: 'Выгода и доходы',
}

// Display order (benefits_income removed — no matching data / weak goals).
export const GOAL_CATEGORY_ORDER: GoalCategory[] = [
  'spending_control',
  'savings',
  'financial_hygiene',
  'debt',
]

export const goalCatalog: GoalTemplate[] = [
  // ——— Контроль трат ———
  {
    id: 'spend_limit_category',
    category: 'spending_control',
    title: 'Удержать лимит по категории',
    description: 'Не запрещать покупки, а удержать понятный лимит в выбранной гибкой категории.',
    progressType: 'spend_limit',
    defaultPeriod: 'week',
    configurableFields: ['categoryId', 'limitAmount', 'period', 'difficulty'],
    examples: ['Потратить на маркетплейсы не больше 7 000 ₽ за неделю'],
    exampleLabel: 'Маркетплейсы не больше 7 000 ₽ за неделю',
    defaults: { limitAmount: 7000, relatedCategoryId: 'marketplaces', deadlineDays: 7 },
    relevance: (s) => s.hasFlexibleSpend,
  },
  {
    id: 'reduce_category_spend',
    category: 'spending_control',
    title: 'Снизить траты в категории',
    description: 'Плавно уменьшить расходы в выбранной гибкой категории относительно привычного уровня.',
    progressType: 'spend_limit',
    defaultPeriod: 'week',
    configurableFields: ['categoryId', 'reductionPercent', 'period'],
    examples: ['Снизить траты на Яндекс/доставку на 15%'],
    exampleLabel: 'Снизить траты на Яндекс и доставку на 15%',
    defaults: { limitAmount: 5000, relatedCategoryId: 'yandex_ecosystem', deadlineDays: 7 },
    relevance: (s) => s.hasFlexibleSpend,
  },
  {
    id: 'pause_large_optional_purchases',
    category: 'spending_control',
    title: 'Пауза на крупные необязательные покупки',
    description: 'Договориться с собой не делать крупные необязательные покупки несколько дней.',
    progressType: 'binary',
    defaultPeriod: 'week',
    configurableFields: ['thresholdAmount', 'days'],
    examples: ['7 дней не покупать необязательные товары дороже 5 000 ₽'],
    exampleLabel: '7 дней без необязательных покупок дороже 5 000 ₽',
    defaults: { deadlineDays: 7 },
    relevance: (s) => s.hasFlexibleSpend,
  },

  // ——— Накопления ———
  {
    id: 'save_fixed_amount',
    category: 'savings',
    title: 'Отложить фиксированную сумму',
    description: 'Отложить понятную сумму до конца периода и закрепить привычку откладывать.',
    progressType: 'money_saved',
    defaultPeriod: 'week',
    configurableFields: ['targetAmount', 'deadline'],
    examples: ['Отложить 8 000 ₽ до воскресенья'],
    exampleLabel: 'Отложить 8 000 ₽ до воскресенья',
    defaults: { targetAmount: 8000, deadlineDays: 7 },
    relevance: (s) => s.hasRegularIncome,
  },
  {
    id: 'save_income_percent',
    category: 'savings',
    title: 'Отложить процент от поступления',
    description: 'Отложить часть ближайшего поступления, как только оно придёт.',
    progressType: 'money_saved',
    defaultPeriod: 'month',
    configurableFields: ['percent', 'incomeEvent'],
    examples: ['Отложить 10% от ближайшего поступления'],
    exampleLabel: 'Отложить 10% от ближайшего поступления',
    defaults: { targetAmount: 4000, deadlineDays: 14 },
    relevance: (s) => s.hasRegularIncome,
  },
  {
    id: 'build_emergency_fund',
    category: 'savings',
    title: 'Пополнить подушку',
    description: 'Перевести часть денег в резерв, чтобы постепенно собрать подушку безопасности.',
    progressType: 'money_saved',
    defaultPeriod: 'week',
    configurableFields: ['targetAmount', 'deadline'],
    examples: ['Перевести 5 000 ₽ в резерв'],
    exampleLabel: 'Перевести 5 000 ₽ в резерв',
    defaults: { targetAmount: 5000, deadlineDays: 7 },
    relevance: () => true,
  },
  {
    id: 'setup_auto_saving',
    category: 'savings',
    title: 'Настроить автопополнение',
    description: 'Включить регулярный автоперевод на накопительный счёт.',
    progressType: 'binary',
    defaultPeriod: 'week',
    configurableFields: ['amount', 'frequency'],
    examples: ['Включить автоперевод 2 000 ₽ раз в неделю'],
    exampleLabel: 'Автоперевод 2 000 ₽ раз в неделю',
    defaults: { deadlineDays: 7 },
    relevance: (s) => s.hasRegularIncome,
  },

  // ——— Финансовая гигиена ———
  {
    id: 'label_other_spending',
    category: 'financial_hygiene',
    title: 'Разметить категорию «Другое»',
    description: 'Разобрать крупную категорию «Другое», чтобы видеть, куда реально уходят деньги.',
    progressType: 'steps',
    defaultPeriod: 'week',
    configurableFields: ['transactionsToLabel', 'stepsTotal'],
    examples: ['Разметить 10–15 операций из «Другое»'],
    exampleLabel: 'Разметить операции из «Другое»',
    defaults: { stepsTotal: 3, deadlineDays: 7 },
    relevance: (s) => s.otherLarge,
  },
  {
    id: 'set_month_budget',
    category: 'financial_hygiene',
    title: 'Собрать бюджет месяца',
    description: 'Выделить обязательные расходы и свободные деньги на месяц.',
    progressType: 'steps',
    defaultPeriod: 'month',
    configurableFields: ['month', 'mandatoryPayments', 'freeMoney'],
    examples: ['Выделить обязательные расходы и свободные деньги'],
    exampleLabel: 'Выделить обязательное и свободные деньги',
    defaults: { stepsTotal: 3, deadlineDays: 14 },
    relevance: () => true,
  },
  {
    id: 'review_subscriptions',
    category: 'financial_hygiene',
    title: 'Проверить регулярные списания и подписки',
    description: 'Найти регулярные платежи и подписки, которые можно отключить или перенести.',
    progressType: 'steps',
    defaultPeriod: 'week',
    configurableFields: ['stepsTotal', 'detectedRecurringPaymentsCount'],
    examples: ['Найти 1–2 регулярных списания, которые можно отключить'],
    exampleLabel: 'Найти 1–2 списания, которые можно отключить',
    defaults: { stepsTotal: 3, deadlineDays: 7 },
    relevance: (s) => s.hasSubscriptions,
  },

  // ——— Кредиты и обязательства (только ручной выбор: данных по долгу нет) ———
  {
    id: 'make_extra_debt_payment',
    category: 'debt',
    title: 'Внести досрочный платёж по долгу',
    description: 'Внести дополнительный платёж по кредиту или долгу, чтобы быстрее его закрыть.',
    progressType: 'money_saved',
    defaultPeriod: 'month',
    configurableFields: ['amount', 'productType', 'deadline'],
    examples: ['Внести 10 000 ₽ досрочно по кредиту'],
    exampleLabel: 'Внести 10 000 ₽ досрочно по долгу',
    defaults: { targetAmount: 10000, deadlineDays: 14 },
    relevance: (s) => s.hasDebt,
  },
  {
    id: 'avoid_credit_card_usage',
    category: 'debt',
    title: 'Не пользоваться кредиткой',
    description: 'Несколько дней не пользоваться кредитной картой.',
    progressType: 'binary',
    defaultPeriod: 'week',
    configurableFields: ['days'],
    examples: ['Не использовать кредитку до конца недели'],
    exampleLabel: 'Не использовать кредитку до конца недели',
    defaults: { deadlineDays: 7 },
    relevance: (s) => s.hasCreditCard,
  },
]

export const templateById: Record<string, GoalTemplate> = Object.fromEntries(
  goalCatalog.map((t) => [t.id, t]),
)

export const templatesByCategory = GOAL_CATEGORY_ORDER.reduce(
  (acc, cat) => {
    acc[cat] = goalCatalog.filter((t) => t.category === cat)
    return acc
  },
  {} as Record<GoalCategory, GoalTemplate[]>,
)

/** Templates eligible for AUTO-suggestion given the data signals (manual is never gated). */
export function relevantTemplates(signals: import('../types/coach').DataSignals): GoalTemplate[] {
  return goalCatalog.filter((t) => (t.relevance ? t.relevance(signals) : true))
}
