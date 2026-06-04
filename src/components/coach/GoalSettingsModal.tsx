import { useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronRight, Minus, Plus, RefreshCw, Tag } from 'lucide-react'
import type { UserGoal } from '../../types/coach'
import { BottomSheet } from '../ui/BottomSheet'
import { bucketById, FLEXIBLE_BUCKET_IDS } from '../../data/demoFinancialData'
import { DIFFICULTY_LABEL, paramLabel, progressLabel } from '../../lib/goalMechanics'

function easierHint(goal: UserGoal): string {
  switch (goal.progressType) {
    case 'money_saved':
      return 'меньше сумма'
    case 'spend_limit':
      return 'выше лимит'
    case 'steps':
      return 'меньше шагов'
    default:
      return 'мягче условие'
  }
}
function harderHint(goal: UserGoal): string {
  switch (goal.progressType) {
    case 'money_saved':
      return 'больше сумма'
    case 'spend_limit':
      return 'ниже лимит'
    case 'steps':
      return 'больше шагов'
    default:
      return 'жёстче условие'
  }
}

function Row({
  icon,
  title,
  sub,
  onClick,
}: {
  icon: ReactNode
  title: string
  sub?: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-bg-light px-4 py-3.5 text-left transition active:scale-[0.99] hover:bg-[#eceef1] tap-transparent"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-graphite shadow-card-sm">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-semibold text-graphite">{title}</span>
        {sub && <span className="block text-[12.5px] text-gray-mid">{sub}</span>}
      </span>
      <ChevronRight size={16} className="shrink-0 text-gray-mid" />
    </button>
  )
}

type Props = {
  goal: UserGoal
  onClose: () => void
  onEasier: () => void
  onHarder: () => void
  onChangeCategory: (categoryId: string) => void
  onReplace: () => void
}

export function GoalSettingsModal({ goal, onClose, onEasier, onHarder, onChangeCategory, onReplace }: Props) {
  const [catOpen, setCatOpen] = useState(false)
  const isLimit = goal.progressType === 'spend_limit'

  return (
    <BottomSheet open onClose={onClose} title="Настроить цель" eyebrow="Цель можно подстроить под себя">
      <div className="space-y-4 pb-1">
        {/* preview */}
        <div className="rounded-2xl border border-[#ECEDF0] p-4">
          <div className="text-[15px] font-bold text-graphite">{goal.title}</div>
          <div className="mt-1 flex flex-wrap gap-x-3 text-[12.5px] text-gray-mid">
            <span className="font-semibold text-graphite tnum">{paramLabel(goal)}</span>
            <span>·</span>
            <span>сложность: {DIFFICULTY_LABEL[goal.difficulty]}</span>
            <span>·</span>
            <span className="tnum">{progressLabel(goal)}</span>
          </div>
        </div>

        <div className="space-y-2.5">
          <Row
            icon={<Minus size={16} strokeWidth={2.4} />}
            title="Сделать легче"
            sub={easierHint(goal)}
            onClick={onEasier}
          />
          <Row
            icon={<Plus size={16} strokeWidth={2.4} />}
            title="Сделать амбициознее"
            sub={harderHint(goal)}
            onClick={onHarder}
          />
          {isLimit && (
            <>
              <Row
                icon={<Tag size={16} strokeWidth={2.2} />}
                title="Поменять категорию"
                sub={catOpen ? 'выбери категорию ниже' : 'привязать лимит к другой зоне трат'}
                onClick={() => setCatOpen((v) => !v)}
              />
              {catOpen && (
                <div className="grid grid-cols-1 gap-2 pl-1 sm:grid-cols-3">
                  {FLEXIBLE_BUCKET_IDS.map((id) => {
                    const b = bucketById[id]
                    const isCur = goal.relatedCategoryId === id
                    return (
                      <button
                        key={id}
                        onClick={() => {
                          onChangeCategory(id)
                          setCatOpen(false)
                        }}
                        className={`rounded-2xl border px-3 py-2.5 text-left text-[13px] font-medium transition tap-transparent ${
                          isCur
                            ? 'border-alfa-red bg-alfa-red/[0.06] text-graphite'
                            : 'border-[#ECEDF0] text-gray-dark hover:border-[#dcdee3]'
                        }`}
                      >
                        {b.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
          <Row
            icon={<RefreshCw size={15} strokeWidth={2.2} />}
            title="Заменить цель"
            sub="выбрать другую из каталога"
            onClick={onReplace}
          />
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-2xl bg-graphite px-5 py-3.5 text-[15px] font-semibold text-white transition active:scale-[0.99] hover:bg-black tap-transparent"
        >
          Оставить как есть
        </button>
      </div>
    </BottomSheet>
  )
}
