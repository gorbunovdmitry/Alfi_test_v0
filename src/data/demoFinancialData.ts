// Demo financial dataset for the AI Financial Coach.
// Derived from the user's real statement (672 operations, 28.11.2025–28.05.2026)
// with EVERY money amount divided by 10 and ALL PII removed (no names, account
// numbers, phone numbers, card numbers or raw descriptions).

import type {
  BucketBreakdownItem,
  DataSignals,
  DemoTransaction,
  FinancialSummary,
  MonthlyAggregate,
  SpendingBucket,
} from '../types/coach'

/** Reference "today" for the demo (end of the statement period). */
export const DEMO_TODAY = '2026-05-28'

export const financialSummary: FinancialSummary = {
  periodStart: '2025-11-28',
  periodEnd: '2026-05-28',
  periodLabel: '28 ноября 2025 — 28 мая 2026',
  operationsCount: 672,
  income: 439221,
  expenses: 465258,
  balance: -26037,
}

export const monthlyAggregates: MonthlyAggregate[] = [
  { month: '2025-11', income: 14945, expenses: 40857, balance: -25912 },
  { month: '2025-12', income: 93019, expenses: 92149, balance: 870 },
  { month: '2026-01', income: 66622, expenses: 67200, balance: -578 },
  { month: '2026-02', income: 82605, expenses: 80622, balance: 1984 },
  { month: '2026-03', income: 49591, expenses: 51652, balance: -2061 },
  { month: '2026-04', income: 60098, expenses: 48632, balance: 11466 },
  { month: '2026-05', income: 72341, expenses: 84146, balance: -11805 },
]

export const MONTH_LABELS: Record<string, string> = {
  '2025-11': 'Ноябрь 2025',
  '2025-12': 'Декабрь 2025',
  '2026-01': 'Январь 2026',
  '2026-02': 'Февраль 2026',
  '2026-03': 'Март 2026',
  '2026-04': 'Апрель 2026',
  '2026-05': 'Май 2026',
}

export const spendingBuckets: SpendingBucket[] = [
  {
    id: 'transfers_cash',
    name: 'Переводы и наличные',
    shortLabel: 'переводы',
    amount: 276828,
    operationsCount: 121,
    insight:
      'Большая часть расходов выглядит как переводы, наличные и перемещения денег. Для точного анализа нужно уточнять, что из этого реальные расходы, а что переводы себе.',
  },
  {
    id: 'other',
    name: 'Другое',
    shortLabel: 'прочие траты',
    amount: 119127,
    operationsCount: 207,
    insight:
      'Много операций попало в широкую категорию. Это зона для уточнения и доразметки.',
  },
  {
    id: 'yandex_ecosystem',
    name: 'Яндекс, доставка и лавка',
    shortLabel: 'Яндекс и доставку',
    amount: 25895,
    operationsCount: 131,
    insight:
      'Частые небольшие траты. Хороший кандидат для мягкого недельного лимита.',
  },
  {
    id: 'marketplaces',
    name: 'Ozon/WB и маркетплейсы',
    shortLabel: 'маркетплейсы',
    amount: 18300,
    operationsCount: 23,
    insight:
      'Категория с заметными покупками. Можно удерживать лимит без полного отказа.',
  },
  {
    id: 'restaurants',
    name: 'Кафе и рестораны',
    shortLabel: 'кафе и рестораны',
    amount: 8957,
    operationsCount: 14,
    insight:
      'Не самая большая зона расходов, но удобная для поведенческой цели.',
  },
  {
    id: 'health',
    name: 'Здоровье и медицина',
    shortLabel: 'здоровье',
    amount: 6678,
    operationsCount: 9,
    insight:
      'Лучше не оптимизировать агрессивно. Можно только проверить вычеты или крупные расходы.',
  },
  {
    id: 'groceries',
    name: 'Продукты',
    shortLabel: 'продукты',
    amount: 5746,
    operationsCount: 31,
    insight: 'Базовая категория. Для демо лучше не резать жёстко.',
  },
  {
    id: 'transport',
    name: 'Транспорт и авто',
    shortLabel: 'транспорт',
    amount: 3727,
    operationsCount: 12,
    insight:
      'Небольшая зона расходов, можно использовать для анализа, но не как первую цель.',
  },
]

export const bucketById: Record<string, SpendingBucket> = Object.fromEntries(
  spendingBuckets.map((b) => [b.id, b]),
)

/** Buckets that are reasonable targets for a "cut/limit" goal (not basic/medical). */
export const FLEXIBLE_BUCKET_IDS = ['marketplaces', 'yandex_ecosystem', 'restaurants']

// ——————————————————————————————————————————————————————————————————————
// Description-derived classification of the two ambiguous blocks.
// In the real product a transfer is "to self" when the operation DESCRIPTION
// contains the account holder's own name/phone or the phrase «внутрибанковский
// перевод между своими счетами». The demo models this OUTCOME as a deterministic
// breakdown (exact sums), keyed on description phrases — and stores NO PII.
// The coach reports these as a CONCLUSION; it must not ask the user to classify.
// ——————————————————————————————————————————————————————————————————————

/** «Переводы и наличные» (276 828 ₽, 121 опер.) split by description. Sums to the bucket. */
export const transferBreakdown: BucketBreakdownItem[] = [
  { key: 'self', label: 'Внутрибанковские переводы между своими счетами', amount: 180000, operationsCount: 70, isSpending: false },
  { key: 'external', label: 'Переводы другим людям (СБП и переводы)', amount: 60828, operationsCount: 35, isSpending: true },
  { key: 'cash', label: 'Снятие наличных', amount: 36000, operationsCount: 16, isSpending: true },
]

/** «Другое» (119 127 ₽, 207 опер.) split by description. Sums to the bucket. */
export const otherBreakdown: BucketBreakdownItem[] = [
  { key: 'everyday', label: 'Повседневные покупки', amount: 62000, operationsCount: 130, isSpending: true },
  { key: 'services', label: 'Сервисы и подписки', amount: 18127, operationsCount: 40, isSpending: true },
  { key: 'oneoff', label: 'Разовые крупные покупки', amount: 25000, operationsCount: 12, isSpending: true },
  { key: 'payments', label: 'Прочие платежи', amount: 14000, operationsCount: 25, isSpending: true },
]

/** Signals that gate which goals may be AUTO-suggested (manual catalog is never gated). */
export const dataSignals: DataSignals = {
  hasFlexibleSpend: true, // marketplaces + Яндекс/доставка + кафе
  hasRegularIncome: true, // стабильные поступления
  balanceNegative: financialSummary.balance < 0,
  otherLarge: bucketById.other.amount > 50000,
  hasSubscriptions: otherBreakdown.some((b) => b.key === 'services' && b.amount > 0),
  hasDebt: false, // в данных нет кредитов/долгов
  hasCreditCard: false, // нет операций по кредитке
}

/**
 * ~40 cleaned demo transactions (no PII). Not the full 672 — a representative
 * sample for the chat and the "large purchases" view. Amounts already ÷10.
 */
export const sampleTransactions: DemoTransaction[] = [
  // ——— Income ———
  { id: 'tx_in_01', date: '2026-05-05', direction: 'income', amount: 41200, categoryId: 'income', categoryName: 'Поступления', merchant: 'Поступление', description: 'Регулярное поступление', isRecurring: true },
  { id: 'tx_in_02', date: '2026-05-20', direction: 'income', amount: 18600, categoryId: 'income', categoryName: 'Поступления', merchant: 'Поступление', description: 'Дополнительное поступление' },
  { id: 'tx_in_03', date: '2026-04-05', direction: 'income', amount: 39800, categoryId: 'income', categoryName: 'Поступления', merchant: 'Поступление', description: 'Регулярное поступление', isRecurring: true },
  { id: 'tx_in_04', date: '2026-03-06', direction: 'income', amount: 32100, categoryId: 'income', categoryName: 'Поступления', merchant: 'Поступление', description: 'Регулярное поступление', isRecurring: true },
  { id: 'tx_in_05', date: '2026-05-12', direction: 'income', amount: 5400, categoryId: 'income', categoryName: 'Поступления', merchant: 'Возврат', description: 'Возврат за покупку' },

  // ——— Transfers / cash (largest, mostly needs clarification) ———
  { id: 'tx_001', date: '2026-05-15', direction: 'expense', amount: 10100, categoryId: 'transfers_cash', categoryName: 'Переводы и наличные', merchant: 'Перевод в другой банк', description: 'Похоже на регулярный обязательный перевод', isRecurring: true, isNeedsClarification: true },
  { id: 'tx_002', date: '2026-05-22', direction: 'expense', amount: 25000, categoryId: 'transfers_cash', categoryName: 'Переводы и наличные', merchant: 'Внутренний перевод', description: 'Внутрибанковский перевод между своими счетами', isPotentialTransferToSelf: true },
  { id: 'tx_009', date: '2026-05-03', direction: 'expense', amount: 9000, categoryId: 'transfers_cash', categoryName: 'Переводы и наличные', merchant: 'Перевод по номеру', description: 'Перевод другому человеку по СБП' },
  { id: 'tx_010', date: '2026-05-08', direction: 'expense', amount: 6000, categoryId: 'transfers_cash', categoryName: 'Переводы и наличные', merchant: 'Снятие наличных', description: 'Снятие наличных в банкомате' },
  { id: 'tx_011', date: '2026-04-15', direction: 'expense', amount: 10100, categoryId: 'transfers_cash', categoryName: 'Переводы и наличные', merchant: 'Перевод в другой банк', description: 'Похоже на регулярный обязательный перевод', isRecurring: true, isNeedsClarification: true },
  { id: 'tx_012', date: '2026-04-22', direction: 'expense', amount: 15000, categoryId: 'transfers_cash', categoryName: 'Переводы и наличные', merchant: 'Внутренний перевод', description: 'Перевод между своими счетами', isPotentialTransferToSelf: true },
  { id: 'tx_013', date: '2026-03-15', direction: 'expense', amount: 10100, categoryId: 'transfers_cash', categoryName: 'Переводы и наличные', merchant: 'Перевод в другой банк', description: 'Похоже на регулярный обязательный перевод', isRecurring: true, isNeedsClarification: true },

  // ——— Marketplaces ———
  { id: 'tx_003', date: '2026-05-01', direction: 'expense', amount: 8199, categoryId: 'marketplaces', categoryName: 'Ozon/WB и маркетплейсы', merchant: 'Маркетплейс', description: 'Крупная покупка в маркетплейсе' },
  { id: 'tx_004', date: '2026-05-01', direction: 'expense', amount: 7319, categoryId: 'marketplaces', categoryName: 'Ozon/WB и маркетплейсы', merchant: 'Маркетплейс', description: 'Крупная покупка в маркетплейсе' },
  { id: 'tx_014', date: '2026-05-18', direction: 'expense', amount: 2480, categoryId: 'marketplaces', categoryName: 'Ozon/WB и маркетплейсы', merchant: 'Маркетплейс', description: 'Покупка товаров для дома' },
  { id: 'tx_015', date: '2026-04-12', direction: 'expense', amount: 3650, categoryId: 'marketplaces', categoryName: 'Ozon/WB и маркетплейсы', merchant: 'Маркетплейс', description: 'Покупка в маркетплейсе' },
  { id: 'tx_016', date: '2026-03-20', direction: 'expense', amount: 2900, categoryId: 'marketplaces', categoryName: 'Ozon/WB и маркетплейсы', merchant: 'Маркетплейс', description: 'Покупка в маркетплейсе' },

  // ——— Yandex / delivery / lavka (frequent small) ———
  { id: 'tx_005', date: '2026-05-10', direction: 'expense', amount: 1240, categoryId: 'yandex_ecosystem', categoryName: 'Яндекс, доставка и лавка', merchant: 'Яндекс', description: 'Доставка/экосистемная покупка' },
  { id: 'tx_017', date: '2026-05-13', direction: 'expense', amount: 760, categoryId: 'yandex_ecosystem', categoryName: 'Яндекс, доставка и лавка', merchant: 'Лавка', description: 'Доставка продуктов' },
  { id: 'tx_018', date: '2026-05-17', direction: 'expense', amount: 540, categoryId: 'yandex_ecosystem', categoryName: 'Яндекс, доставка и лавка', merchant: 'Яндекс', description: 'Поездка' },
  { id: 'tx_019', date: '2026-05-24', direction: 'expense', amount: 1180, categoryId: 'yandex_ecosystem', categoryName: 'Яндекс, доставка и лавка', merchant: 'Доставка', description: 'Доставка еды' },
  { id: 'tx_020', date: '2026-04-26', direction: 'expense', amount: 690, categoryId: 'yandex_ecosystem', categoryName: 'Яндекс, доставка и лавка', merchant: 'Яндекс', description: 'Подписка на сервис', isRecurring: true },
  { id: 'tx_021', date: '2026-05-28', direction: 'expense', amount: 399, categoryId: 'yandex_ecosystem', categoryName: 'Яндекс, доставка и лавка', merchant: 'Сервис', description: 'Регулярная подписка', isRecurring: true },

  // ——— Restaurants / cafe ———
  { id: 'tx_006', date: '2026-05-11', direction: 'expense', amount: 890, categoryId: 'restaurants', categoryName: 'Кафе и рестораны', merchant: 'Кафе', description: 'Кафе или еда вне дома' },
  { id: 'tx_022', date: '2026-05-16', direction: 'expense', amount: 1450, categoryId: 'restaurants', categoryName: 'Кафе и рестораны', merchant: 'Ресторан', description: 'Ужин в ресторане' },
  { id: 'tx_023', date: '2026-05-23', direction: 'expense', amount: 620, categoryId: 'restaurants', categoryName: 'Кафе и рестораны', merchant: 'Кофейня', description: 'Кофе' },
  { id: 'tx_024', date: '2026-04-19', direction: 'expense', amount: 1180, categoryId: 'restaurants', categoryName: 'Кафе и рестораны', merchant: 'Кафе', description: 'Обед вне дома' },

  // ——— Groceries ———
  { id: 'tx_007', date: '2026-05-12', direction: 'expense', amount: 650, categoryId: 'groceries', categoryName: 'Продукты', merchant: 'Продуктовый магазин', description: 'Покупка продуктов' },
  { id: 'tx_025', date: '2026-05-14', direction: 'expense', amount: 1320, categoryId: 'groceries', categoryName: 'Продукты', merchant: 'Супермаркет', description: 'Покупка продуктов' },
  { id: 'tx_026', date: '2026-05-21', direction: 'expense', amount: 980, categoryId: 'groceries', categoryName: 'Продукты', merchant: 'Супермаркет', description: 'Покупка продуктов' },
  { id: 'tx_027', date: '2026-05-27', direction: 'expense', amount: 740, categoryId: 'groceries', categoryName: 'Продукты', merchant: 'Продуктовый магазин', description: 'Покупка продуктов' },

  // ——— Health ———
  { id: 'tx_008', date: '2026-05-13', direction: 'expense', amount: 2100, categoryId: 'health', categoryName: 'Здоровье и медицина', merchant: 'Клиника/аптека', description: 'Медицинские расходы' },
  { id: 'tx_028', date: '2026-04-09', direction: 'expense', amount: 1850, categoryId: 'health', categoryName: 'Здоровье и медицина', merchant: 'Аптека', description: 'Лекарства' },
  { id: 'tx_029', date: '2026-03-28', direction: 'expense', amount: 2300, categoryId: 'health', categoryName: 'Здоровье и медицина', merchant: 'Клиника', description: 'Приём врача' },

  // ——— Transport ———
  { id: 'tx_030', date: '2026-05-09', direction: 'expense', amount: 520, categoryId: 'transport', categoryName: 'Транспорт и авто', merchant: 'Транспорт', description: 'Проезд' },
  { id: 'tx_031', date: '2026-05-19', direction: 'expense', amount: 1400, categoryId: 'transport', categoryName: 'Транспорт и авто', merchant: 'АЗС', description: 'Заправка' },
  { id: 'tx_032', date: '2026-04-23', direction: 'expense', amount: 430, categoryId: 'transport', categoryName: 'Транспорт и авто', merchant: 'Транспорт', description: 'Проезд' },

  // ——— Other (broad) ———
  { id: 'tx_033', date: '2026-05-06', direction: 'expense', amount: 1990, categoryId: 'other', categoryName: 'Другое', merchant: 'Магазин', description: 'Покупка, требует доразметки', isNeedsClarification: true },
  { id: 'tx_034', date: '2026-05-25', direction: 'expense', amount: 760, categoryId: 'other', categoryName: 'Другое', merchant: 'Сервис', description: 'Платёж, требует доразметки', isNeedsClarification: true },
  { id: 'tx_035', date: '2026-04-17', direction: 'expense', amount: 3100, categoryId: 'other', categoryName: 'Другое', merchant: 'Магазин', description: 'Покупка, требует доразметки', isNeedsClarification: true },
]
