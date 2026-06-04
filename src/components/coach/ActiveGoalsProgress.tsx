import type { UserGoal } from '../../types/coach'
import {
  CATEGORY_ACCENT,
  goalProgressColor,
  isGoalComplete,
  progressFraction,
  progressLabel,
} from '../../lib/goalMechanics'
import { ProgressBar } from './ProgressBar'
import { GoalCard } from './GoalCard'

function GoalBar({ goal }: { goal: UserGoal }) {
  const isLimit = goal.progressType === 'spend_limit'
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_ACCENT[goal.category] }} />
        <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-graphite">
          {goal.title}
        </span>
        {isLimit && <span className="shrink-0 text-[11px] font-medium text-gray-mid">лимит</span>}
        <span className="shrink-0 text-[12.5px] font-semibold tnum" style={{ color: goalProgressColor(goal) }}>
          {progressLabel(goal)}
        </span>
      </div>
      <ProgressBar fraction={progressFraction(goal)} color={goalProgressColor(goal)} height={12} />
    </div>
  )
}

export function ActiveGoalsProgress({
  goals,
  onNudge,
}: {
  goals: UserGoal[]
  onNudge: (id: string) => void
}) {
  const done = goals.filter(isGoalComplete).length

  return (
    <div className="space-y-4">
      {/* all goal progress, together at the top */}
      <div className="rounded-[24px] bg-white p-5 shadow-card sm:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[17px] font-bold tracking-[-0.01em] text-graphite">Финансовый прогресс недели</h2>
          <span className="shrink-0 text-[13px] font-semibold text-gray-mid tnum">
            {done} из {goals.length}
          </span>
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-gray-mid">
          Отмечайте шаги по мере выполнения — полоски обновятся.
        </p>
        <div className="mt-4 space-y-3.5">
          {goals.map((g) => (
            <GoalBar key={g.id} goal={g} />
          ))}
        </div>
      </div>

      <div className="text-[13px] font-semibold uppercase tracking-[0.04em] text-gray-mid">Цели в работе</div>
      <div className="space-y-3">
        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} mode="active" onNudge={() => onNudge(g.id)} />
        ))}
      </div>
    </div>
  )
}
