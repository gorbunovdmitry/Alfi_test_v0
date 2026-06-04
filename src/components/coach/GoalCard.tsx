import { Check, ChevronRight, SlidersHorizontal, Sparkles } from 'lucide-react'
import type { UserGoal } from '../../types/coach'
import { GOAL_CATEGORY_LABELS } from '../../data/goalCatalog'
import {
  CATEGORY_ACCENT,
  DIFFICULTY_LABEL,
  formatDeadline,
  goalProgressColor,
  isGoalComplete,
  nudgeLabel,
  paramLabel,
  progressFraction,
  progressLabel,
} from '../../lib/goalMechanics'
import { ProgressBar } from './ProgressBar'

function Header({ goal }: { goal: UserGoal }) {
  const accent = CATEGORY_ACCENT[goal.category]
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
      <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-gray-mid">
        {GOAL_CATEGORY_LABELS[goal.category]}
      </span>
      <span className="ml-auto rounded-full bg-bg-light px-2 py-0.5 text-[11px] font-semibold text-gray-dark">
        {DIFFICULTY_LABEL[goal.difficulty]}
      </span>
    </div>
  )
}

type Props = {
  goal: UserGoal
  mode: 'suggested' | 'active'
  accepted?: boolean
  onAccept?: () => void
  onSettings?: () => void
  onNudge?: () => void
}

export function GoalCard({ goal, mode, accepted, onAccept, onSettings, onNudge }: Props) {
  const accent = CATEGORY_ACCENT[goal.category]

  if (mode === 'suggested') {
    return (
      <div className="overflow-hidden rounded-[22px] bg-white shadow-card">
        <div className="h-1" style={{ backgroundColor: accent }} />
        <div className="p-4 sm:p-5">
          <Header goal={goal} />
          <h3 className="mt-2 text-[19px] font-bold leading-tight tracking-[-0.01em] text-graphite">
            {goal.title}
          </h3>

          {/* hero metric */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className="rounded-xl px-3 py-1.5 text-[15px] font-bold tnum"
              style={{ backgroundColor: `${accent}14`, color: accent }}
            >
              {paramLabel(goal)}
            </span>
            <span className="rounded-xl bg-bg-light px-3 py-1.5 text-[12.5px] font-medium text-gray-dark">
              срок {formatDeadline(goal.deadline)}
            </span>
          </div>

          {/* single data-grounded thesis */}
          {goal.recommendedReason && (
            <div className="mt-3 flex gap-2">
              <Sparkles size={15} className="mt-0.5 shrink-0" style={{ color: accent }} strokeWidth={2.2} />
              <p className="text-[13px] leading-relaxed text-gray-dark">{goal.recommendedReason}</p>
            </div>
          )}

          {/* actions */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={onAccept}
              disabled={accepted}
              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[15px] font-semibold transition active:scale-[0.99] tap-transparent ${
                accepted
                  ? 'bg-[#E8F5EC] text-[#1E854A]'
                  : 'bg-alfa-red text-white shadow-[0_8px_22px_rgba(239,49,36,0.28)] hover:bg-[#e0271b]'
              }`}
            >
              {accepted ? (
                <>
                  <Check size={17} strokeWidth={2.6} /> В плане
                </>
              ) : (
                'Принять'
              )}
            </button>
            <button
              onClick={onSettings}
              aria-label="Настроить цель"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-bg-light text-gray-dark transition active:scale-95 hover:bg-[#eceef1] tap-transparent"
            >
              <SlidersHorizontal size={18} strokeWidth={2.1} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // active mode
  const complete = isGoalComplete(goal)
  return (
    <div className="rounded-[22px] bg-white p-4 shadow-card sm:p-5">
      <Header goal={goal} />
      <h3 className="mt-2 text-[17px] font-bold leading-tight tracking-[-0.01em] text-graphite">
        {goal.title}
      </h3>
      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
          <span className="font-medium text-gray-dark">{paramLabel(goal)}</span>
          <span className="font-semibold tnum" style={{ color: goalProgressColor(goal) }}>
            {progressLabel(goal)}
          </span>
        </div>
        <ProgressBar fraction={progressFraction(goal)} color={goalProgressColor(goal)} />
      </div>
      <div className="mt-4">
        {complete ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#E8F5EC] px-4 py-3 text-[14px] font-semibold text-[#1E854A]">
            <Check size={16} strokeWidth={2.6} /> Цель выполнена
          </div>
        ) : (
          <button
            onClick={onNudge}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-graphite px-4 py-3 text-[14px] font-semibold text-white transition active:scale-[0.99] hover:bg-black tap-transparent"
          >
            {nudgeLabel(goal)}
            <ChevronRight size={16} strokeWidth={2.4} />
          </button>
        )}
      </div>
    </div>
  )
}
