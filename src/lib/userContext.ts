import type { Transaction, WeekState } from '../types'
import { formatRub, formatSignedRub } from './format'
import { buildSpendingProfile, essentialityLabel } from './spendingProfile'
import { MOCK_TODAY } from '../data/mockData'

/** Compact RU snapshot of the user's statement-derived state, sent to the LLM as context. */
export function buildUserContext(ws: WeekState, transactions: Transaction[]): string {
  const p = buildSpendingProfile(transactions, MOCK_TODAY)

  const topCats = p.byCategory
    .slice(0, 7)
    .map((c) => `${c.category} ${formatRub(c.amount)} [${essentialityLabel(c.essentiality)}]`)
    .join('; ')

  const recent = transactions
    .filter((t) => t.status === 'completed')
    .slice(-10)
    .map((t) => {
      const sign = t.direction === 'expense' ? '−' : '+'
      return `${t.operationDate} · ${t.rawCategory} · ${t.description} · ${sign}${formatRub(t.amount)}`
    })
    .join('\n')

  return [
    'КОНТЕКСТ ИЗ ВЫПИСКИ (используй для ответа; не повторяй эти данные целиком).',
    '',
    `НЕДЕЛЯ ${ws.weekStart}–${ws.weekEnd} (осталось ${ws.daysLeft} дн., под контролем ${ws.weekControlPercent}%):`,
    `— Траты: ${formatRub(ws.actualSpending)} из ${formatRub(ws.spendingTarget)} (остаток ${formatRub(
      ws.spendingRemaining,
    )}); сегодня без риска ${formatRub(ws.safeToSpendToday)}.`,
    `— Накопления: ${formatSignedRub(ws.savingsGrowth)} из ${formatRub(
      ws.savingsTarget,
    )}; шаг к цели «${ws.goal.name}»: ${formatRub(ws.goalContributions)} из ${formatRub(ws.goalStep)}.`,
    '',
    `МЕСЯЦ (${p.monthLabel}):`,
    `— Доход: ${formatRub(p.income)} (зарплата ${formatRub(p.salary)}).`,
    `— Расходы всего: ${formatRub(p.totalSpend)} → обязательное ${formatRub(
      p.obligatoryTotal,
    )}, важное ${formatRub(p.essentialTotal)}, необязательное ${formatRub(p.discretionaryTotal)}.`,
    `— Свободно в месяц ≈ ${formatRub(p.freeCashFlow)} (доход − обязательное − важное).`,
    `— Категории по убыванию: ${topCats}.`,
    `— Цель: накопить ${formatRub(ws.goal.targetAmount)}, уже есть ${formatRub(ws.goal.currentAmount)}.`,
    '',
    'Последние операции:',
    recent,
  ].join('\n')
}
