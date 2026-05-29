import type { Transaction } from '../types'
import { parseISO } from './dates'

export type Essentiality = 'obligatory' | 'essential' | 'discretionary'

// How compressible a spending category is — drives "where to cut" logic.
export const CATEGORY_ESSENTIALITY: Record<string, Essentiality> = {
  'Коммунальные платежи': 'obligatory',
  Кредит: 'obligatory',
  Супермаркеты: 'essential',
  Транспорт: 'essential',
  'Здоровье и аптеки': 'essential',
  'Связь и интернет': 'essential',
  'Рестораны и кафе': 'discretionary',
  Маркетплейсы: 'discretionary',
  Развлечения: 'discretionary',
  'Одежда и обувь': 'discretionary',
  Прочее: 'discretionary',
}

export function essentialityOf(rawCategory: string): Essentiality {
  return CATEGORY_ESSENTIALITY[rawCategory] ?? 'discretionary'
}

const ESS_LABEL: Record<Essentiality, string> = {
  obligatory: 'обязательное',
  essential: 'важное',
  discretionary: 'необязательное',
}
export const essentialityLabel = (e: Essentiality): string => ESS_LABEL[e]

export type CategorySpend = { category: string; amount: number; essentiality: Essentiality }

export type SpendingProfile = {
  monthLabel: string
  income: number
  salary: number
  totalSpend: number
  obligatoryTotal: number
  essentialTotal: number
  discretionaryTotal: number
  freeCashFlow: number // income − obligatory − essential (upper bound of what could be saved)
  byCategory: CategorySpend[] // consumption expenses, sorted desc
}

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

/** Month-level income/expense picture for the month containing `today`. */
export function buildSpendingProfile(transactions: Transaction[], today: string): SpendingProfile {
  const ref = parseISO(today)
  const y = ref.getUTCFullYear()
  const m = ref.getUTCMonth()
  const inMonth = (iso: string) => {
    const d = parseISO(iso)
    return d.getUTCFullYear() === y && d.getUTCMonth() === m
  }

  let income = 0
  let salary = 0
  const catMap = new Map<string, number>()

  for (const t of transactions) {
    if (t.status !== 'completed' || !inMonth(t.operationDate)) continue
    if (t.direction === 'income') {
      income += t.amount
      if (/зарплат/i.test(t.rawCategory)) salary += t.amount
      continue
    }
    // Expenses only — exclude pure transfers (not consumption).
    if (t.isInternalTransfer || t.isSavingsRelated || t.isGoalRelated) continue
    catMap.set(t.rawCategory, (catMap.get(t.rawCategory) ?? 0) + t.amount)
  }

  const byCategory: CategorySpend[] = [...catMap.entries()]
    .map(([category, amount]) => ({ category, amount, essentiality: essentialityOf(category) }))
    .sort((a, b) => b.amount - a.amount)

  let totalSpend = 0
  let obligatoryTotal = 0
  let essentialTotal = 0
  let discretionaryTotal = 0
  for (const c of byCategory) {
    totalSpend += c.amount
    if (c.essentiality === 'obligatory') obligatoryTotal += c.amount
    else if (c.essentiality === 'essential') essentialTotal += c.amount
    else discretionaryTotal += c.amount
  }

  return {
    monthLabel: `${MONTHS[m]} ${y}`,
    income,
    salary,
    totalSpend,
    obligatoryTotal,
    essentialTotal,
    discretionaryTotal,
    freeCashFlow: Math.max(0, income - obligatoryTotal - essentialTotal),
    byCategory,
  }
}
