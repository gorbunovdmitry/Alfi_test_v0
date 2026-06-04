// Builds the structured RU context sent to the LLM (no PII).
//   buildAuditContext  — ALL data for the audit (aggregates + description-derived
//     breakdowns of transfers/«Другое» + representative transactions with descriptions).
//   buildCoachContext  — picture + answers + catalog/goals for goal-selection / chat /
//     explanation; accepts an allow-list to restrict auto-suggested goals.

import type { BucketBreakdownItem, FinancialCoachState, UserGoal } from '../types/coach'
import { formatNumber, formatRub, formatSignedRub } from './format'
import {
  financialSummary,
  monthlyAggregates,
  MONTH_LABELS,
  otherBreakdown,
  sampleTransactions,
  spendingBuckets,
  transferBreakdown,
} from '../data/demoFinancialData'
import { GOAL_CATEGORY_LABELS, GOAL_CATEGORY_ORDER, templateById, templatesByCategory } from '../data/goalCatalog'
import { answersToReadable } from '../data/clarifyingQuestions'
import { DIFFICULTY_LABEL, formatDeadline, progressLabel } from './goalMechanics'

const monthsBlock = () =>
  monthlyAggregates
    .map(
      (m) =>
        `— ${MONTH_LABELS[m.month]}: доход ${formatNumber(m.income)} / расход ${formatNumber(
          m.expenses,
        )} / баланс ${formatSignedRub(m.balance)}`,
    )
    .join('\n')

const bucketsBlock = () =>
  spendingBuckets
    .map((b) => `— ${b.name}: ${formatRub(b.amount)}, ${b.operationsCount} опер. — ${b.insight}`)
    .join('\n')

const breakdownBlock = (items: BucketBreakdownItem[]) =>
  items
    .map(
      (b) =>
        `— ${b.label}: ${formatRub(b.amount)}, ${b.operationsCount} опер.${
          b.isSpending ? '' : ' (перемещение между своими счетами — НЕ траты)'
        }`,
    )
    .join('\n')

function answersBlock(state: FinancialCoachState): string {
  const answers = answersToReadable(
    state.userAnswers,
    state.analysisQuestions.length ? state.analysisQuestions : undefined,
  )
  return answers.length ? answers.map((x) => `— ${x.q} → ${x.a}`).join('\n') : '— пока нет ответов'
}

function txSample(): string {
  return sampleTransactions
    .map((t) => {
      const sign = t.direction === 'expense' ? '−' : '+'
      return `— ${t.date} · ${t.merchant} (${t.categoryName}) · ${sign}${formatNumber(
        t.amount,
      )} ₽ · ${t.description}`
    })
    .join('\n')
}

/** ALL-data context for the audit (gpt-5.5): aggregates cover every operation;
 * transfers/«Другое» are already classified by description. */
export function buildAuditContext(state: FinancialCoachState): string {
  return [
    'ДАННЫЕ ДЛЯ ПЕРВИЧНОГО АУДИТА (демо, без персональных данных).',
    `Агрегаты охватывают ВСЕ ${financialSummary.operationsCount} операций за период ${financialSummary.periodLabel}.`,
    `ИТОГИ: поступления ${formatRub(financialSummary.income)}; расходы ${formatRub(
      financialSummary.expenses,
    )}; баланс ${formatSignedRub(financialSummary.balance)}.`,
    '',
    'ПО МЕСЯЦАМ:',
    monthsBlock(),
    '',
    'КАТЕГОРИИ РАСХОДОВ (по убыванию):',
    bucketsBlock(),
    '',
    `КЛАССИФИКАЦИЯ ПО ОПИСАНИЯМ — «Переводы и наличные» (${formatRub(spendingBuckets[0].amount)}) уже разложены:`,
    breakdownBlock(transferBreakdown),
    '',
    `КЛАССИФИКАЦИЯ ПО ОПИСАНИЯМ — «Другое» (${formatRub(spendingBuckets[1].amount)}) уже разложено:`,
    breakdownBlock(otherBreakdown),
    '',
    'ЭТО ГОТОВЫЙ ВЫВОД: переводы и «Другое» уже расклассифицированы по описаниям — не спрашивай клиента, что это за операции, а сообщи вывод.',
    '',
    'ПРЕДСТАВИТЕЛЬНАЯ ВЫБОРКА ОПЕРАЦИЙ С ОПИСАНИЯМИ:',
    txSample(),
    '',
    'ЧТО КЛИЕНТ УЖЕ УТОЧНИЛ:',
    answersBlock(state),
  ].join('\n')
}

function goalLine(g: UserGoal): string {
  const reason = g.recommendedReason ? ` Почему: ${g.recommendedReason}` : ''
  return `— ${g.title} [${DIFFICULTY_LABEL[g.difficulty]}]: ${progressLabel(g)}, ${formatDeadline(
    g.deadline,
  )}.${reason}`
}

/** Picture + answers + goals/catalog context for goal-selection, chat and explanation.
 * `allowedGoalIds` restricts which goals may be auto-suggested. */
export function buildCoachContext(state: FinancialCoachState, opts?: { allowedGoalIds?: string[] }): string {
  const catalog = GOAL_CATEGORY_ORDER.map(
    (cat) =>
      `${GOAL_CATEGORY_LABELS[cat]}: ${templatesByCategory[cat].map((t) => t.title).join('; ')}`,
  ).join('\n')

  const cards = state.summaryCards.length
    ? state.summaryCards.map((c) => `— ${c.title}: ${c.body}`).join('\n')
    : '— пока не собрана'

  const suggested = state.suggestedGoals.length
    ? state.suggestedGoals.map(goalLine).join('\n')
    : '— пока не собраны'

  const active = state.activeGoals.length
    ? state.activeGoals.map((g) => `— ${g.title}: ${progressLabel(g)} (${g.status})`).join('\n')
    : '— пока нет'

  const allowed = opts?.allowedGoalIds?.length
    ? opts.allowedGoalIds
        .map((id) => templateById[id])
        .filter(Boolean)
        .map((t) => `— ${t.id} — «${t.title}» (${GOAL_CATEGORY_LABELS[t.category]})`)
        .join('\n')
    : ''

  const lines = [
    'КОНТЕКСТ AI FINANCIAL COACH (демо, без персональных данных). Не повторяй целиком.',
    '',
    `ИТОГИ ПЕРИОДА: поступления ${formatRub(financialSummary.income)}; расходы ${formatRub(
      financialSummary.expenses,
    )}; баланс ${formatSignedRub(financialSummary.balance)}.`,
    '',
    'ЧТО КЛИЕНТ УЖЕ УТОЧНИЛ (учитывайте; не поднимайте как нерешённое):',
    answersBlock(state),
    '',
    'КАТЕГОРИИ РАСХОДОВ:',
    bucketsBlock(),
    '',
    'КЛАССИФИКАЦИЯ ПЕРЕВОДОВ (по описаниям):',
    breakdownBlock(transferBreakdown),
    '',
    'ФИНАНСОВАЯ КАРТИНА (выводы аудита):',
    cards,
    '',
    'КАТАЛОГ ЦЕЛЕЙ (общий список):',
    catalog,
  ]
  if (allowed) {
    lines.push('', 'ДОСТУПНЫЕ ДЛЯ ПОДБОРА ЦЕЛИ (используй ТОЛЬКО эти templateId, из разных категорий):', allowed)
  }
  lines.push('', 'ПРЕДЛОЖЕННЫЕ ЦЕЛИ:', suggested, '', 'АКТИВНЫЕ ЦЕЛИ:', active)
  return lines.join('\n')
}
