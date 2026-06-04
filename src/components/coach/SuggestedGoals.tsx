import { ArrowRight, LayoutGrid, MessageCircle } from 'lucide-react'
import type { UserGoal } from '../../types/coach'
import { AlfiAvatar } from '../AlfiAvatar'
import { GoalCard } from './GoalCard'

type Props = {
  goals: UserGoal[]
  activeGoalIds: string[]
  planExplanation?: string
  onAccept: (id: string) => void
  onAcceptAll: () => void
  onOpenSettings: (goal: UserGoal) => void
  onOpenCatalog: () => void
  onOpenChat: () => void
}

export function SuggestedGoals({
  goals,
  activeGoalIds,
  planExplanation,
  onAccept,
  onAcceptAll,
  onOpenSettings,
  onOpenCatalog,
  onOpenChat,
}: Props) {
  const activeSet = new Set(activeGoalIds)

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] bg-white p-5 shadow-card sm:p-6">
        <div className="flex items-start gap-3">
          <AlfiAvatar size={36} />
          <div>
            <div className="text-[17px] font-bold tracking-[-0.01em] text-graphite">
              3 действия из разных направлений
            </div>
            <p className="mt-1 text-[14px] leading-relaxed text-gray-dark">
              {planExplanation?.trim()
                ? planExplanation
                : 'Можно принять весь план или настроить любую цель: сделать легче, амбициознее или заменить.'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {goals.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            mode="suggested"
            accepted={activeSet.has(g.id)}
            onAccept={() => onAccept(g.id)}
            onSettings={() => onOpenSettings(g)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <button
          onClick={onAcceptAll}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-alfa-red px-5 py-4 text-[16px] font-semibold text-white shadow-[0_10px_26px_rgba(239,49,36,0.3)] transition active:scale-[0.99] hover:bg-[#e0271b] tap-transparent"
        >
          Принять цели
          <ArrowRight size={18} strokeWidth={2.4} />
        </button>
        <button
          onClick={onOpenCatalog}
          className="flex items-center justify-center gap-2 rounded-2xl bg-bg-light px-5 py-4 text-[15px] font-semibold text-graphite transition active:scale-[0.99] hover:bg-[#eceef1] tap-transparent"
        >
          <LayoutGrid size={17} strokeWidth={2.2} />
          Каталог
        </button>
      </div>

      <button
        onClick={onOpenChat}
        className="flex w-full items-center justify-center gap-2 py-1 text-[14px] font-medium text-gray-mid transition hover:text-graphite"
      >
        <MessageCircle size={15} strokeWidth={2.2} />
        Спросить, почему именно эти цели
      </button>
    </div>
  )
}
