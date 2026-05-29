export type NormalizedCategory =
  | 'income'
  | 'groceries'
  | 'restaurants'
  | 'marketplaces'
  | 'transport'
  | 'subscriptions'
  | 'utilities'
  | 'credit_payment'
  | 'internal_transfer'
  | 'savings_transfer'
  | 'investment'
  | 'goal_contribution'
  | 'other'

export type Transaction = {
  id: string
  operationDate: string // ISO date, e.g. "2026-05-26"
  postingDate: string // ISO date
  code: string
  rawCategory: string
  normalizedCategory: NormalizedCategory
  description: string
  amount: number // positive number
  direction: 'income' | 'expense'
  status: 'completed' | 'pending'
  accountId: string
  sourceAccountId?: string
  destinationAccountId?: string
  isInternalTransfer: boolean
  isObligatory: boolean
  isSavingsRelated: boolean
  isGoalRelated: boolean
  isDebtPayment: boolean
  isRecurring: boolean
  confidence: number // 0-1
}

export type AccountType =
  | 'salary'
  | 'debit'
  | 'credit'
  | 'savings'
  | 'deposit'
  | 'brokerage'
  | 'investment'
  | 'goal'
  | 'loan'

export type Account = {
  id: string
  name: string
  type: AccountType
  balance: number
  currency: 'RUB'
}

export type GoalType =
  | 'large_purchase'
  | 'emergency_fund'
  | 'repay_debt'
  | 'increase_savings'
  | 'free_cashflow'

export type Goal = {
  id: string
  type: GoalType
  name: string
  targetAmount: number
  currentAmount: number
  deadline?: string // ISO date
  weeklyRequiredStep: number
  linkedAccountIds: string[]
  status: 'active' | 'paused' | 'completed'
}

export type WeeklyPlan = {
  weekStart: string
  weekEnd: string
  spendingTarget: number
  savingsTarget: number
  goalStepTarget: number
  goalId: string
  mode: 'soft' | 'normal' | 'strict'
}

// ---- Derived view-model (single source of truth for the UI) ----

export type RingId = 'spending' | 'savings' | 'goal'

export type RingStatus = 'norm' | 'attention' | 'tense' | 'closed'

export type RingState = {
  id: RingId
  label: string
  color: string
  progress: number // 0..1 visual fill
  status: RingStatus
  statusLabel: string // "в норме" | "внимание" | "напряжённо" | "закрыто"
  valueText: string // e.g. "10 300 ₽ из 14 500 ₽"
  hintText: string // next-step nudge under the legend row
}

export type CategorySlice = {
  key: string
  label: string
  amount: number
}

export type ProductGrowth = {
  accountId: string
  name: string
  amount: number
}

export type WeekState = {
  weekStart: string
  weekEnd: string
  daysLeft: number

  // Ring 1 — spending control
  actualSpending: number
  spendingTarget: number
  spendingRemaining: number // target - actual (can be negative)
  spendingCompliance: number // 0..1
  spendingByCategory: CategorySlice[]

  // Ring 2 — savings
  savingsGrowth: number
  savingsTarget: number
  savingsRemaining: number // max(target - growth, 0)
  savingsProgress: number // 0..1
  savingsByProduct: ProductGrowth[]

  // Ring 3 — goal
  goal: Goal
  goalContributions: number
  goalStep: number
  goalRemainingStep: number // max(step - contributions, 0)
  goalProgress: number // 0..1

  // Overall
  weekControlScore: number // 0..1
  weekControlPercent: number // rounded integer

  // Safe to spend today
  safeToSpendToday: number
  safeToSpendPositive: boolean

  // Calculation details
  obligatoryTotal: number
  monthlyIncome: number

  rings: RingState[]
}
