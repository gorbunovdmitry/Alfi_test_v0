// Maps a raw bank-statement row into the app's Transaction model, deriving the
// normalized category, flags, and account routing the ring math depends on.
import type { Transaction } from '../types'
import type { StatementRow } from './parseStatement'
import { ddmmyyyyToISO } from './dates'

export function normalizeRow(row: StatementRow, index: number): Transaction {
  const direction: 'income' | 'expense' = row.amount >= 0 ? 'income' : 'expense'
  const status: 'completed' | 'pending' = /провед/i.test(row.status) ? 'completed' : 'pending'

  const base: Transaction = {
    id: `tx_${String(index + 1).padStart(3, '0')}`,
    operationDate: ddmmyyyyToISO(row.operationDate),
    postingDate: ddmmyyyyToISO(row.postingDate),
    code: row.code,
    rawCategory: row.category,
    normalizedCategory: 'other',
    description: row.description,
    amount: Math.abs(row.amount),
    direction,
    status,
    accountId: 'debit',
    isInternalTransfer: false,
    isObligatory: false,
    isSavingsRelated: false,
    isGoalRelated: false,
    isDebtPayment: false,
    isRecurring: false,
    confidence: 0.97,
  }

  const cat = row.category.trim()
  const desc = row.description.toLowerCase()

  switch (cat) {
    case 'Зарплата':
      return { ...base, normalizedCategory: 'income', accountId: 'salary', isRecurring: true }
    case 'Пополнения':
      return { ...base, normalizedCategory: 'income' }
    case 'Супермаркеты':
      return { ...base, normalizedCategory: 'groceries' }
    case 'Рестораны и кафе':
      return { ...base, normalizedCategory: 'restaurants' }
    case 'Маркетплейсы':
      return { ...base, normalizedCategory: 'marketplaces' }
    case 'Транспорт':
      return { ...base, normalizedCategory: 'transport' }
    case 'Связь и интернет':
      return { ...base, normalizedCategory: 'subscriptions', isRecurring: true }
    case 'Развлечения':
    case 'Одежда и обувь':
    case 'Здоровье и аптеки':
    case 'Прочее':
      return { ...base, normalizedCategory: 'other' }
    case 'Коммунальные платежи':
      return { ...base, normalizedCategory: 'utilities', isObligatory: true, isRecurring: true }
    case 'Кредит':
      return {
        ...base,
        normalizedCategory: 'credit_payment',
        isObligatory: true,
        isDebtPayment: true,
        isRecurring: true,
        sourceAccountId: 'debit',
        destinationAccountId: 'credit',
      }
    case 'Переводы':
      return {
        ...base,
        normalizedCategory: 'internal_transfer',
        isInternalTransfer: true,
        sourceAccountId: 'salary',
        destinationAccountId: 'debit',
      }
    case 'Накопления': {
      if (desc.includes('цель')) {
        return {
          ...base,
          normalizedCategory: 'goal_contribution',
          isGoalRelated: true,
          sourceAccountId: 'debit',
          destinationAccountId: 'goal_account',
        }
      }
      if (desc.includes('инвест') || desc.includes('брокер')) {
        return {
          ...base,
          normalizedCategory: 'investment',
          isSavingsRelated: true,
          sourceAccountId: 'debit',
          destinationAccountId: 'brokerage',
        }
      }
      return {
        ...base,
        normalizedCategory: 'savings_transfer',
        isSavingsRelated: true,
        sourceAccountId: 'debit',
        destinationAccountId: 'savings',
      }
    }
    default:
      return base
  }
}
