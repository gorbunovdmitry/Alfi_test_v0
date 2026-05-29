import { Pencil } from 'lucide-react'
import type { Goal } from '../types'
import { formatRub, pluralRu } from '../lib/format'
import { monthsBetween } from '../lib/dates'
import { MOCK_TODAY } from '../data/mockData'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-bg-light px-3 py-2.5">
      <div className="text-[12px] text-gray-mid">{label}</div>
      <div className="mt-0.5 text-[15px] font-semibold tracking-[-0.01em] text-graphite tnum">
        {value}
      </div>
    </div>
  )
}

export function GoalCard({ goal, onEdit }: { goal: Goal; onEdit: () => void }) {
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount)
  const progress = Math.min(1, goal.currentAmount / goal.targetAmount)
  const monthsLeft = goal.deadline ? monthsBetween(MOCK_TODAY, goal.deadline) : null

  return (
    <section className="rounded-[22px] bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-mid">
            Цель
          </div>
          <h3 className="mt-1 text-[19px] font-bold tracking-[-0.02em] text-graphite">
            {goal.name}
          </h3>
          {monthsLeft && (
            <div className="mt-0.5 text-[13px] text-gray-mid">
              Накопить за {monthsLeft} {pluralRu(monthsLeft, ['месяц', 'месяца', 'месяцев'])}
            </div>
          )}
        </div>
        <button
          onClick={onEdit}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-bg-light px-3.5 py-2 text-[13px] font-medium text-alfa-red transition active:scale-95 tap-transparent"
        >
          <Pencil size={14} strokeWidth={2.3} />
          Изменить
        </button>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-bg-light">
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${progress * 100}%`, backgroundColor: '#EF3124' }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Нужно" value={formatRub(goal.targetAmount)} />
        <Stat label="Уже есть" value={formatRub(goal.currentAmount)} />
        <Stat label="Осталось" value={formatRub(remaining)} />
      </div>

      <div className="mt-2.5 flex items-center gap-2 rounded-2xl bg-bg-light px-4 py-3">
        <span className="text-[13px] text-gray-dark">Чтобы успеть</span>
        <span className="ml-auto text-[15px] font-semibold text-graphite tnum">
          {formatRub(goal.weeklyRequiredStep)} в неделю
        </span>
      </div>
    </section>
  )
}
