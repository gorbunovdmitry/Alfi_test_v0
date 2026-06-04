import { ChevronRight } from 'lucide-react'
import { BottomSheet } from '../ui/BottomSheet'
import {
  GOAL_CATEGORY_LABELS,
  GOAL_CATEGORY_ORDER,
  templatesByCategory,
} from '../../data/goalCatalog'
import { CATEGORY_ACCENT } from '../../lib/goalMechanics'

export function GoalCatalogModal({
  onClose,
  onPick,
}: {
  onClose: () => void
  onPick: (templateId: string) => void
}) {
  return (
    <BottomSheet open onClose={onClose} title="Каталог целей" eyebrow="Выберите цель — подставлю настройки">
      <div className="space-y-5 pb-2">
        {GOAL_CATEGORY_ORDER.map((cat) => (
          <div key={cat}>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_ACCENT[cat] }} />
              <h3 className="text-[13px] font-bold uppercase tracking-[0.04em] text-gray-dark">
                {GOAL_CATEGORY_LABELS[cat]}
              </h3>
            </div>
            <div className="space-y-2">
              {templatesByCategory[cat].map((t) => (
                <button
                  key={t.id}
                  onClick={() => onPick(t.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-[#ECEDF0] px-4 py-3 text-left transition active:scale-[0.99] hover:border-[#dcdee3] hover:bg-bg-light/50 tap-transparent"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] font-semibold text-graphite">{t.title}</span>
                    <span className="block text-[12.5px] text-gray-mid">{t.exampleLabel}</span>
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-gray-mid" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </BottomSheet>
  )
}
