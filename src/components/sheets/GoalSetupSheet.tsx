import { useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, ShoppingBag, TrendingUp, Umbrella, Wallet } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Goal, GoalType, WeekState } from '../../types'
import { calculateWeeklyGoalStep } from '../../lib/calculations'
import { addDays, monthsBetween } from '../../lib/dates'
import { formatNumber, formatRub, pluralRu } from '../../lib/format'
import { MOCK_TODAY } from '../../data/mockData'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'

type Props = {
  open: boolean
  onClose: () => void
  ws: WeekState
  onApply: (goal: Goal, weeklyStep: number) => void
}

type Focus = Extract<GoalType, 'increase_savings' | 'emergency_fund' | 'large_purchase' | 'repay_debt'>

const FOCUS_OPTIONS: { type: Focus; title: string; desc: string; Icon: LucideIcon }[] = [
  { type: 'increase_savings', title: 'Больше откладывать', desc: 'Стабильный процент дохода каждую неделю', Icon: TrendingUp },
  { type: 'emergency_fund', title: 'Собрать подушку', desc: 'Запас на 3–6 месяцев расходов', Icon: Umbrella },
  { type: 'large_purchase', title: 'Накопить на покупку', desc: 'Собрать сумму к нужному сроку', Icon: ShoppingBag },
  { type: 'repay_debt', title: 'Закрыть долг быстрее', desc: 'Гасить досрочно каждую неделю', Icon: Wallet },
]

function NumberField({
  label,
  value,
  onChange,
  suffix = '₽',
}: {
  label: string
  value: number
  onChange: (n: number) => void
  suffix?: string
}) {
  return (
    <label className="block">
      <span className="text-[13px] text-gray-mid">{label}</span>
      <div className="mt-1.5 flex items-center rounded-2xl bg-bg-light px-4 py-3 focus-within:ring-2 focus-within:ring-alfa-red/25">
        <input
          type="text"
          inputMode="numeric"
          value={formatNumber(value)}
          onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')) || 0)}
          className="w-full bg-transparent text-[16px] font-semibold text-graphite outline-none tnum"
        />
        <span className="ml-2 shrink-0 text-[14px] text-gray-mid">{suffix}</span>
      </div>
    </label>
  )
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (s: string) => void
}) {
  return (
    <label className="block">
      <span className="text-[13px] text-gray-mid">{label}</span>
      <div className="mt-1.5 flex items-center rounded-2xl bg-bg-light px-4 py-3 focus-within:ring-2 focus-within:ring-alfa-red/25">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-[16px] font-semibold text-graphite outline-none"
        />
      </div>
    </label>
  )
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-2xl bg-bg-light p-1">
      {options.map((o) => (
        <button
          key={String(o.value)}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-xl py-2 text-[13px] font-medium transition tap-transparent ${
            value === o.value ? 'bg-white text-graphite shadow-card-sm' : 'text-gray-mid'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function ResultPanel({ step, explanation }: { step: number; explanation: string }) {
  return (
    <div className="rounded-2xl bg-[#FDEAE8] px-4 py-4">
      <div className="text-[13px] font-medium text-alfa-red">Нужно откладывать</div>
      <div className="mt-0.5 text-[26px] font-bold leading-none tracking-[-0.02em] text-graphite tnum">
        {formatRub(step)} <span className="text-[15px] font-medium text-gray-mid">в неделю</span>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-gray-dark">{explanation}</p>
    </div>
  )
}

const roundTo = (n: number, to: number) => Math.round(n / to) * to

export function GoalSetupSheet({ open, onClose, ws, onApply }: Props) {
  const income = ws.monthlyIncome
  const cur = ws.goal

  const [focus, setFocus] = useState<Focus | null>(null)

  // large_purchase
  const [lpName, setLpName] = useState(cur.type === 'large_purchase' ? cur.name : 'Ноутбук')
  const [lpTarget, setLpTarget] = useState(cur.type === 'large_purchase' ? cur.targetAmount : 160000)
  const [lpCurrent, setLpCurrent] = useState(cur.type === 'large_purchase' ? cur.currentAmount : 48000)
  const [lpMonths, setLpMonths] = useState(cur.deadline ? monthsBetween(MOCK_TODAY, cur.deadline) : 4)

  // emergency_fund
  const [efTarget, setEfTarget] = useState(300000)
  const [efCurrent, setEfCurrent] = useState(60000)
  const [efPace, setEfPace] = useState<'soft' | 'normal' | 'strict'>('normal')

  // increase_savings
  const [isPct, setIsPct] = useState<5 | 10 | 15>(10)

  // repay_debt
  const [debt, setDebt] = useState(38000)
  const [minPay, setMinPay] = useState(4000)
  const [debtMonths, setDebtMonths] = useState(6)

  const goBack = () => setFocus(null)

  let title = 'На чём сфокусируемся?'
  let body: ReactNode = null
  let footer: ReactNode = null

  if (!focus) {
    body = (
      <div className="space-y-2.5 pb-2">
        {FOCUS_OPTIONS.map(({ type, title: t, desc, Icon }) => (
          <button
            key={type}
            onClick={() => setFocus(type)}
            className="flex w-full items-center gap-3.5 rounded-2xl border border-[#EEEFF2] bg-white p-4 text-left transition active:scale-[0.99] hover:border-[#e0e1e6] tap-transparent"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bg-light">
              <Icon size={20} strokeWidth={2.1} className="text-alfa-red" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-semibold tracking-[-0.01em] text-graphite">
                {t}
              </span>
              <span className="block text-[13px] leading-snug text-gray-mid">{desc}</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-[#C3C6CD]" />
          </button>
        ))}
      </div>
    )
  } else {
    const focusMeta = FOCUS_OPTIONS.find((f) => f.type === focus)!
    title = focusMeta.title

    let step = 0
    let explanation = ''
    let apply: () => void = () => {}
    let fields: ReactNode = null
    let soften: (() => void) | null = null

    if (focus === 'large_purchase') {
      const weeks = lpMonths * 4.345
      const remaining = Math.max(0, lpTarget - lpCurrent)
      step = roundTo(calculateWeeklyGoalStep(remaining, weeks), 100)
      explanation = `Чтобы успеть за ${lpMonths} ${pluralRu(lpMonths, ['месяц', 'месяца', 'месяцев'])}, откладывай около ${formatRub(step)} в неделю.`
      soften = () => setLpMonths((m) => m + 2)
      fields = (
        <div className="space-y-3.5">
          <TextField label="Что покупаем" value={lpName} onChange={setLpName} />
          <NumberField label="Сумма" value={lpTarget} onChange={setLpTarget} />
          <NumberField label="Уже накоплено" value={lpCurrent} onChange={setLpCurrent} />
          <NumberField label="Срок, месяцев" value={lpMonths} onChange={(n) => setLpMonths(Math.max(1, n))} suffix="мес." />
        </div>
      )
      apply = () => {
        const deadline = addDays(MOCK_TODAY, Math.round(weeks * 7))
        onApply(
          {
            id: 'goal_laptop',
            type: 'large_purchase',
            name: lpName || 'Покупка',
            targetAmount: lpTarget,
            currentAmount: lpCurrent,
            deadline,
            weeklyRequiredStep: step,
            linkedAccountIds: ['goal_account'],
            status: 'active',
          },
          step,
        )
      }
    }

    if (focus === 'emergency_fund') {
      const pct = efPace === 'soft' ? 5 : efPace === 'normal' ? 10 : 15
      step = roundTo((income * pct) / 100 / 4, 100)
      const paceWord = efPace === 'soft' ? 'Мягкий' : efPace === 'normal' ? 'Нормальный' : 'Интенсивный'
      explanation = `${paceWord} темп — ${pct}% дохода, примерно ${formatRub(step)} в неделю.`
      soften = () => setEfPace('soft')
      fields = (
        <div className="space-y-3.5">
          <NumberField label="Желаемая сумма подушки" value={efTarget} onChange={setEfTarget} />
          <NumberField label="Уже есть" value={efCurrent} onChange={setEfCurrent} />
          <div>
            <span className="text-[13px] text-gray-mid">Комфортный темп</span>
            <div className="mt-1.5">
              <Segmented
                value={efPace}
                onChange={setEfPace}
                options={[
                  { value: 'soft', label: 'Мягкий' },
                  { value: 'normal', label: 'Нормальный' },
                  { value: 'strict', label: 'Интенсивный' },
                ]}
              />
            </div>
          </div>
        </div>
      )
      apply = () => {
        const remaining = Math.max(0, efTarget - efCurrent)
        const deadline = step > 0 ? addDays(MOCK_TODAY, Math.round((remaining / step) * 7)) : undefined
        onApply(
          {
            id: 'goal_safety',
            type: 'emergency_fund',
            name: 'Подушка безопасности',
            targetAmount: efTarget,
            currentAmount: efCurrent,
            deadline,
            weeklyRequiredStep: step,
            linkedAccountIds: ['savings'],
            status: 'active',
          },
          step,
        )
      }
    }

    if (focus === 'increase_savings') {
      step = roundTo((income * isPct) / 100 / 4, 100)
      explanation = `${formatRub(step)} в неделю — это около ${isPct}% дохода в месяц.`
      soften = () => setIsPct(5)
      fields = (
        <div className="space-y-3.5">
          <div>
            <span className="text-[13px] text-gray-mid">Доля дохода в месяц</span>
            <div className="mt-1.5">
              <Segmented
                value={isPct}
                onChange={setIsPct}
                options={[
                  { value: 5, label: '5%' },
                  { value: 10, label: '10%' },
                  { value: 15, label: '15%' },
                ]}
              />
            </div>
          </div>
          <p className="text-[13px] leading-relaxed text-gray-mid">
            Доход за месяц — {formatRub(income)}. Откладываем выбранную долю равными частями по неделям.
          </p>
        </div>
      )
      apply = () => {
        onApply(
          {
            id: 'goal_save_more',
            type: 'increase_savings',
            name: 'Больше откладывать',
            targetAmount: step * 12,
            currentAmount: 0,
            weeklyRequiredStep: step,
            linkedAccountIds: ['savings'],
            status: 'active',
          },
          step,
        )
      }
    }

    if (focus === 'repay_debt') {
      const weeks = debtMonths * 4.345
      const requiredWeekly = debt / weeks
      const minWeekly = minPay / 4.345
      step = roundTo(Math.max(0, requiredWeekly - minWeekly), 100)
      explanation = `Чтобы закрыть за ${debtMonths} ${pluralRu(debtMonths, ['месяц', 'месяца', 'месяцев'])}, вноси около ${formatRub(step)} дополнительно в неделю сверх минимального платежа.`
      soften = () => setDebtMonths((m) => m + 2)
      fields = (
        <div className="space-y-3.5">
          <NumberField label="Сумма долга" value={debt} onChange={setDebt} />
          <NumberField label="Минимальный платёж в месяц" value={minPay} onChange={setMinPay} />
          <NumberField label="Желаемый срок, месяцев" value={debtMonths} onChange={(n) => setDebtMonths(Math.max(1, n))} suffix="мес." />
        </div>
      )
      apply = () => {
        onApply(
          {
            id: 'goal_debt',
            type: 'repay_debt',
            name: 'Досрочное погашение',
            targetAmount: debt,
            currentAmount: 0,
            weeklyRequiredStep: step,
            linkedAccountIds: ['credit'],
            status: 'active',
          },
          step,
        )
      }
    }

    body = (
      <div className="space-y-4 pb-1">
        <button
          onClick={goBack}
          className="-ml-1 flex items-center gap-1 text-[14px] font-medium text-gray-mid transition active:opacity-60 tap-transparent"
        >
          <ChevronLeft size={16} /> Назад
        </button>
        {fields}
        <ResultPanel step={step} explanation={explanation} />
      </div>
    )

    footer = (
      <div className="flex gap-2.5">
        {soften && (
          <Button variant="secondary" className="flex-1" onClick={soften}>
            Сделать мягче
          </Button>
        )}
        <Button className="flex-1" onClick={apply}>
          Сохранить цель
        </Button>
      </div>
    )
  }

  return (
    <BottomSheet open={open} onClose={onClose} title={title} eyebrow="Цель">
      {body}
      {footer && <div className="mt-5">{footer}</div>}
    </BottomSheet>
  )
}
