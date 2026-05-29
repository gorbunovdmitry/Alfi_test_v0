import { Check } from 'lucide-react'
import type { WeekState } from '../types'
import { formatRub, pluralRu } from '../lib/format'
import { monthsBetween } from '../lib/dates'
import { MOCK_TODAY } from '../data/mockData'

export function CalculationDetailsCard({ ws }: { ws: WeekState }) {
  const months = ws.goal.deadline ? monthsBetween(MOCK_TODAY, ws.goal.deadline) : null
  const goalLine = months
    ? `цель: ${ws.goal.name.toLowerCase()} за ${months} ${pluralRu(months, ['месяц', 'месяца', 'месяцев'])}`
    : `цель: ${ws.goal.name.toLowerCase()}`

  const items = [
    `регулярные платежи: ${formatRub(ws.obligatoryTotal)}`,
    `ожидаемые траты недели: ${formatRub(ws.spendingTarget)}`,
    goalLine,
    'внутренние переводы исключены',
    'всплеск трат перед выходными учтён',
  ]

  return (
    <section className="rounded-[22px] bg-white p-5 shadow-card">
      <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-graphite">Учтено в расчёте</h3>
      <ul className="mt-3 space-y-2.5">
        {items.map((text) => (
          <li key={text} className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#FDEAE8]">
              <Check size={12} strokeWidth={3} className="text-alfa-red" />
            </span>
            <span className="text-[14px] leading-snug text-gray-dark">{text}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
