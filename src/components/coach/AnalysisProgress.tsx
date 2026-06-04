import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { AlfiAvatar } from '../AlfiAvatar'
import { financialSummary, spendingBuckets } from '../../data/demoFinancialData'
import { formatRub } from '../../lib/format'

type Phase = 'audit' | 'goals'

// Real aggregates from the demo data — shown during analysis so it feels grounded.
const STEPS: Record<Phase, string[]> = {
  audit: [
    `Поступления за период: ${formatRub(financialSummary.income)}`,
    `Классифицирую «${spendingBuckets[0].name}» по описаниям: ${formatRub(spendingBuckets[0].amount)}`,
    `Категория «${spendingBuckets[1].name}»: ${spendingBuckets[1].operationsCount} операций`,
    'Собираю финансовую картину',
  ],
  goals: [
    'Сверяю цели с Вашими данными',
    'Оставляю только релевантные направления',
    'Подбираю 3 цели под Ваши ответы',
    'Готовлю разбор плана',
  ],
}

const HEADER: Record<Phase, { eyebrow: string; title: string }> = {
  audit: { eyebrow: 'Первичный аудит', title: 'Анализирую все операции' },
  goals: { eyebrow: 'Подбор целей', title: 'Готовлю план под Ваши данные' },
}

/** Looping analysis indicator. Runs until the parent unmounts it (when the LLM
 * call resolves) — the last step keeps spinning so the screen never flashes. */
export function AnalysisProgress({ phase }: { phase: Phase }) {
  const steps = STEPS[phase]
  const [done, setDone] = useState(0)

  useEffect(() => {
    const total = STEPS[phase].length
    const timers: number[] = []
    let i = 0
    const tick = () => {
      if (i < total - 1) {
        i += 1
        setDone(i)
        timers.push(window.setTimeout(tick, 700))
      }
    }
    timers.push(window.setTimeout(tick, 700))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [phase])

  return (
    <div className="rounded-[26px] bg-white p-6 shadow-card sm:p-8">
      <div className="flex items-center gap-3">
        <AlfiAvatar size={40} />
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-gray-mid">
            {HEADER[phase].eyebrow}
          </div>
          <div className="text-[17px] font-bold tracking-[-0.01em] text-graphite">{HEADER[phase].title}</div>
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {steps.map((s, idx) => {
          const state = idx < done ? 'done' : idx === done ? 'active' : 'pending'
          return (
            <li key={s} className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${
                  state === 'done' ? 'bg-[#E8F5EC]' : 'bg-bg-light'
                }`}
              >
                {state === 'done' ? (
                  <Check size={15} className="text-[#1E854A]" strokeWidth={2.6} />
                ) : state === 'active' ? (
                  <Loader2 size={15} className="animate-spin text-alfa-red" strokeWidth={2.4} />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-[#D4D7DD]" />
                )}
              </span>
              <span
                className={`text-[14px] transition ${
                  state === 'pending' ? 'text-gray-mid' : 'font-medium text-graphite'
                }`}
              >
                {s}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
