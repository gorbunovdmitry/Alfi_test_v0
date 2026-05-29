import type { Account, Goal, Transaction, WeeklyPlan } from '../types'
import { parseStatement } from '../lib/parseStatement'
import { normalizeRow } from '../lib/classify'
import statementCsv from './transactions.may2026.csv?raw'

// Fixed "now" so the demo is deterministic. To weekEnd (2026-06-01) is 3 days.
export const MOCK_TODAY = '2026-05-29'

export const weeklyPlan: WeeklyPlan = {
  weekStart: '2026-05-26',
  weekEnd: '2026-06-01',
  spendingTarget: 14500,
  savingsTarget: 3000,
  goalStepTarget: 7000,
  goalId: 'goal_laptop',
  mode: 'normal',
}

export const defaultGoal: Goal = {
  id: 'goal_laptop',
  type: 'large_purchase',
  name: 'Ноутбук',
  targetAmount: 160000,
  currentAmount: 48000,
  deadline: '2026-09-30',
  weeklyRequiredStep: 7000,
  linkedAccountIds: ['goal_account'],
  status: 'active',
}

export const accounts: Account[] = [
  { id: 'salary', name: 'Зарплатный счёт', type: 'salary', balance: 84200, currency: 'RUB' },
  { id: 'debit', name: 'Текущий счёт', type: 'debit', balance: 31500, currency: 'RUB' },
  { id: 'savings', name: 'Накопительный счёт', type: 'savings', balance: 61000, currency: 'RUB' },
  { id: 'deposit', name: 'Вклад «Альфа·Вклад»', type: 'deposit', balance: 150000, currency: 'RUB' },
  { id: 'brokerage', name: 'Инвесткопилка', type: 'brokerage', balance: 47800, currency: 'RUB' },
  { id: 'goal_account', name: 'Цель «Ноутбук»', type: 'goal', balance: 48000, currency: 'RUB' },
  { id: 'credit', name: 'Кредитная карта', type: 'credit', balance: -38000, currency: 'RUB' },
]

// Account types whose natural balance growth counts toward the savings ring.
export const savingsAccountTypes = ['savings', 'deposit', 'brokerage', 'investment'] as const

// ---- Single source of truth: transactions are derived from the bank-statement CSV ----
// (same 7-column format as the user's spreadsheet; see scripts/generate-statement.mjs)
export const transactions: Transaction[] = parseStatement(statementCsv).map(normalizeRow)
