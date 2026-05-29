import type {
  Account,
  CategorySlice,
  Goal,
  ProductGrowth,
  RingState,
  RingStatus,
  Transaction,
  WeeklyPlan,
  WeekState,
} from '../types'
import { savingsAccountTypes } from '../data/mockData'
import { differenceInCalendarDays, isWithin, parseISO } from './dates'
import { formatRub, formatSignedRub } from './format'

export const RING_COLORS = {
  spending: '#EF3124', // внешнее — Альфа-красный
  savings: '#266FFF', // среднее — синий
  goal: '#9933FF', // внутреннее — фиолетовый
} as const

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))

const median = (values: number[]): number => {
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

// ---- Spending ring ----

/** A transaction that belongs to the controllable (non-obligatory) spending budget. */
export function isManageableSpend(t: Transaction, weekStart: string, weekEnd: string): boolean {
  return (
    t.direction === 'expense' &&
    t.status === 'completed' &&
    isWithin(t.operationDate, weekStart, weekEnd) &&
    !t.isInternalTransfer &&
    !t.isSavingsRelated &&
    !t.isGoalRelated &&
    !t.isDebtPayment &&
    !t.isObligatory
  )
}

export type SpendBucket = 'marketplaces' | 'groceries' | 'restaurants' | 'transport' | 'other'

const CATEGORY_LABELS: Record<SpendBucket, string> = {
  marketplaces: 'Маркетплейсы',
  groceries: 'Продукты',
  restaurants: 'Кафе',
  transport: 'Транспорт',
  other: 'Другое',
}

/** Maps a transaction to a display bucket for the spending breakdown. */
export function classifyTransaction(t: Transaction): SpendBucket {
  switch (t.normalizedCategory) {
    case 'marketplaces':
      return 'marketplaces'
    case 'groceries':
      return 'groceries'
    case 'restaurants':
      return 'restaurants'
    case 'transport':
      return 'transport'
    default:
      return 'other'
  }
}

export function calculateActualSpending(
  transactions: Transaction[],
  weekStart: string,
  weekEnd: string,
): number {
  return transactions
    .filter((t) => isManageableSpend(t, weekStart, weekEnd))
    .reduce((sum, t) => sum + t.amount, 0)
}

export function calculateSpendingByCategory(
  transactions: Transaction[],
  weekStart: string,
  weekEnd: string,
): CategorySlice[] {
  const totals = new Map<SpendBucket, number>()
  for (const t of transactions) {
    if (!isManageableSpend(t, weekStart, weekEnd)) continue
    const bucket = classifyTransaction(t)
    totals.set(bucket, (totals.get(bucket) ?? 0) + t.amount)
  }
  const named: SpendBucket[] = ['marketplaces', 'groceries', 'restaurants', 'transport']
  const slices: CategorySlice[] = named
    .filter((b) => totals.has(b))
    .map((b) => ({ key: b, label: CATEGORY_LABELS[b], amount: totals.get(b) ?? 0 }))
    .sort((a, b) => b.amount - a.amount)
  const other = totals.get('other') ?? 0
  if (other > 0) slices.push({ key: 'other', label: CATEGORY_LABELS.other, amount: other })
  return slices
}

function monthPhaseFactor(weekStartISO: string): number {
  // End-of-month weeks run a little higher (monthly purchases cluster pre/post payday).
  const day = parseISO(weekStartISO).getUTCDate()
  if (day >= 22) return 1.09
  if (day <= 7) return 0.98
  return 1.0
}

/**
 * Derives a comfortable weekly spending limit from the median of prior weeks'
 * controllable spend, nudged by the phase of the month. Falls back to 14 500 ₽
 * when there isn't enough history.
 */
export function calculateSpendingTarget(
  transactions: Transaction[],
  weekStart: string,
  fallback = 14500,
): number {
  const buckets = new Map<number, number>()
  for (const t of transactions) {
    if (t.direction !== 'expense' || t.status !== 'completed') continue
    if (
      t.isInternalTransfer ||
      t.isSavingsRelated ||
      t.isGoalRelated ||
      t.isDebtPayment ||
      t.isObligatory
    )
      continue
    const daysBefore = differenceInCalendarDays(weekStart, t.operationDate)
    if (daysBefore <= 0) continue // current/future week
    const weekIdx = Math.floor((daysBefore - 1) / 7)
    buckets.set(weekIdx, (buckets.get(weekIdx) ?? 0) + t.amount)
  }
  const weeklyTotals = [...buckets.values()]
  if (weeklyTotals.length < 3) return fallback
  const baseline = median(weeklyTotals)
  return Math.round((baseline * monthPhaseFactor(weekStart)) / 100) * 100
}

// ---- Savings ring ----

export function calculateMonthlyIncome(transactions: Transaction[], today: string): number {
  const ref = parseISO(today)
  const sum = transactions
    .filter((t) => {
      if (t.direction !== 'income' || t.status !== 'completed') return false
      const d = parseISO(t.operationDate)
      return d.getUTCFullYear() === ref.getUTCFullYear() && d.getUTCMonth() === ref.getUTCMonth()
    })
    .reduce((s, t) => s + t.amount, 0)
  return sum > 0 ? sum : 120000
}

/** Default weekly savings target: 10% of monthly income, split across 4 weeks. */
export function calculateWeeklySavingsTarget(monthlyIncome: number): number {
  return Math.round(((monthlyIncome * 0.1) / 4) / 100) * 100
}

/**
 * Natural growth of savings products this week: inflows into savings-type
 * accounts from non-savings sources, minus outflows back out. Transfers
 * between two savings products are ignored (total savings didn't change).
 */
export function calculateSavingsGrowth(
  transactions: Transaction[],
  accounts: Account[],
  weekStart: string,
  weekEnd: string,
): { total: number; byProduct: ProductGrowth[] } {
  const typeById = new Map(accounts.map((a) => [a.id, a.type]))
  const savingsTypes = savingsAccountTypes as readonly string[]
  const isSavings = (id?: string) => !!id && savingsTypes.includes(typeById.get(id) ?? '')

  const perAccount = new Map<string, number>()
  let total = 0

  for (const t of transactions) {
    if (t.status !== 'completed') continue
    if (!isWithin(t.operationDate, weekStart, weekEnd)) continue
    const dest = t.destinationAccountId
    const src = t.sourceAccountId
    if (isSavings(dest) && !isSavings(src)) {
      perAccount.set(dest as string, (perAccount.get(dest as string) ?? 0) + t.amount)
      total += t.amount
    } else if (isSavings(src) && !isSavings(dest)) {
      perAccount.set(src as string, (perAccount.get(src as string) ?? 0) - t.amount)
      total -= t.amount
    }
  }

  const byProduct: ProductGrowth[] = accounts
    .filter((a) => savingsTypes.includes(a.type))
    .map((a) => ({ accountId: a.id, name: a.name, amount: perAccount.get(a.id) ?? 0 }))
    .sort((x, y) => y.amount - x.amount)

  return { total, byProduct }
}

// ---- Goal ring ----

export function calculateGoalContributions(
  transactions: Transaction[],
  goal: Goal,
  weekStart: string,
  weekEnd: string,
): number {
  const linked = new Set(goal.linkedAccountIds)
  return transactions
    .filter(
      (t) =>
        t.status === 'completed' &&
        t.isGoalRelated &&
        isWithin(t.operationDate, weekStart, weekEnd) &&
        (t.destinationAccountId ? linked.has(t.destinationAccountId) : true),
    )
    .reduce((s, t) => s + t.amount, 0)
}

/** Weekly step needed to reach `remaining` within `weeksRemaining` weeks. */
export function calculateWeeklyGoalStep(remaining: number, weeksRemaining: number): number {
  if (weeksRemaining <= 0) return Math.max(0, remaining)
  return Math.max(0, remaining / weeksRemaining)
}

// ---- Safe to spend & overall score ----

export function calculateSafeToSpendToday(
  spendingTarget: number,
  actualSpending: number,
  daysLeft: number,
): number {
  const remaining = spendingTarget - actualSpending
  if (remaining <= 0) return 0
  return remaining / Math.max(1, daysLeft)
}

export function calculateWeekControlScore(
  spendingScore: number,
  savingsProgress: number,
  goalProgress: number,
): number {
  return spendingScore * 0.4 + savingsProgress * 0.3 + goalProgress * 0.3
}

// ---- Status helpers ----

function spendingStatus(
  actual: number,
  target: number,
): { status: RingStatus; statusLabel: string } {
  if (actual > target) return { status: 'tense', statusLabel: 'напряжённо' }
  if (actual / target <= 0.85) return { status: 'norm', statusLabel: 'в норме' }
  return { status: 'attention', statusLabel: 'внимание' }
}

function progressStatus(progress: number): { status: RingStatus; statusLabel: string } {
  if (progress >= 0.999) return { status: 'closed', statusLabel: 'закрыто' }
  if (progress >= 0.6) return { status: 'norm', statusLabel: 'в норме' }
  if (progress >= 0.34) return { status: 'attention', statusLabel: 'внимание' }
  return { status: 'tense', statusLabel: 'напряжённо' }
}

// ---- Single source of truth ----

export function computeWeekState(
  transactions: Transaction[],
  accounts: Account[],
  goal: Goal,
  plan: WeeklyPlan,
  today: string,
): WeekState {
  const { weekStart, weekEnd } = plan
  const daysLeft = Math.max(0, differenceInCalendarDays(weekEnd, today))

  // Spending — the plan target is generated by calculateSpendingTarget (≈14 500).
  const actualSpending = calculateActualSpending(transactions, weekStart, weekEnd)
  const spendingTarget = plan.spendingTarget
  const spendingRemaining = spendingTarget - actualSpending
  const spendingCompliance = actualSpending <= spendingTarget ? 1 : spendingTarget / actualSpending
  const spendingByCategory = calculateSpendingByCategory(transactions, weekStart, weekEnd)

  // Savings
  const monthlyIncome = calculateMonthlyIncome(transactions, today)
  const savingsTarget = plan.savingsTarget
  const savings = calculateSavingsGrowth(transactions, accounts, weekStart, weekEnd)
  const savingsGrowth = savings.total
  const savingsProgress = clamp(savingsTarget > 0 ? savingsGrowth / savingsTarget : 1)
  const savingsRemaining = Math.max(0, savingsTarget - savingsGrowth)

  // Goal
  const goalContributions = calculateGoalContributions(transactions, goal, weekStart, weekEnd)
  const goalStep = plan.goalStepTarget
  const goalProgress = clamp(goalStep > 0 ? goalContributions / goalStep : 1)
  const goalRemainingStep = Math.max(0, goalStep - goalContributions)

  // Overall — honest blend, spending dimension uses compliance.
  const spendingScore = clamp(spendingCompliance)
  const weekControlScore = calculateWeekControlScore(spendingScore, savingsProgress, goalProgress)
  const weekControlPercent = Math.round(weekControlScore * 100)

  // Safe to spend today
  const safeToSpendToday = calculateSafeToSpendToday(spendingTarget, actualSpending, daysLeft)
  const safeToSpendPositive = spendingRemaining > 0

  // Obligatory / regular payments
  const obligatoryTotal = transactions
    .filter(
      (t) =>
        t.status === 'completed' && t.isObligatory && isWithin(t.operationDate, weekStart, weekEnd),
    )
    .reduce((s, t) => s + t.amount, 0)

  const rings: RingState[] = [
    {
      id: 'spending',
      label: 'Управление тратами',
      color: RING_COLORS.spending,
      progress: clamp(spendingCompliance),
      ...spendingStatus(actualSpending, spendingTarget),
      valueText: `${formatRub(actualSpending)} из ${formatRub(spendingTarget)}`,
      hintText:
        spendingRemaining >= 0
          ? `Не выходи за ${formatRub(spendingRemaining)} до воскресенья`
          : `Неделя выше плана на ${formatRub(-spendingRemaining)}. Можно закрыть мягче — пересчитать план`,
    },
    {
      id: 'savings',
      label: 'Накопления',
      color: RING_COLORS.savings,
      progress: savingsProgress,
      ...progressStatus(savingsProgress),
      valueText: `${formatSignedRub(savingsGrowth)} из ${formatRub(savingsTarget)}`,
      hintText:
        savingsRemaining > 0
          ? `Увеличь сбережения ещё на ${formatRub(savingsRemaining)}`
          : 'Цель недели по сбережениям закрыта',
    },
    {
      id: 'goal',
      label: 'Шаг к цели',
      color: RING_COLORS.goal,
      progress: goalProgress,
      ...progressStatus(goalProgress),
      valueText: `${formatRub(goalContributions)} из ${formatRub(goalStep)}`,
      hintText:
        goalRemainingStep > 0
          ? `Внеси ещё ${formatRub(goalRemainingStep)} в цель`
          : 'Шаг к цели сделан',
    },
  ]

  return {
    weekStart,
    weekEnd,
    daysLeft,
    actualSpending,
    spendingTarget,
    spendingRemaining,
    spendingCompliance,
    spendingByCategory,
    savingsGrowth,
    savingsTarget,
    savingsRemaining,
    savingsProgress,
    savingsByProduct: savings.byProduct,
    goal,
    goalContributions,
    goalStep,
    goalRemainingStep,
    goalProgress,
    weekControlScore,
    weekControlPercent,
    safeToSpendToday,
    safeToSpendPositive,
    obligatoryTotal,
    monthlyIncome,
    rings,
  }
}
