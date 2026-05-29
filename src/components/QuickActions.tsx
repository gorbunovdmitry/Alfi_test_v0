import { PiggyBank, Target, Wallet, SlidersHorizontal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Chip } from './ui/Chip'
import type { RingId } from '../types'

export function QuickActions({
  onOpenRing,
  onOpenGoalSetup,
}: {
  onOpenRing: (id: RingId) => void
  onOpenGoalSetup: () => void
}) {
  const actions: { label: string; Icon: LucideIcon; onClick: () => void }[] = [
    { label: 'Отложить', Icon: PiggyBank, onClick: () => onOpenRing('savings') },
    { label: 'Внести в цель', Icon: Target, onClick: () => onOpenRing('goal') },
    { label: 'Проверить траты', Icon: Wallet, onClick: () => onOpenRing('spending') },
    { label: 'Изменить цель', Icon: SlidersHorizontal, onClick: onOpenGoalSetup },
  ]

  return (
    <section>
      <h3 className="mb-2.5 px-1 text-[15px] font-semibold tracking-[-0.01em] text-graphite">
        Быстрые действия
      </h3>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {actions.map(({ label, Icon, onClick }) => (
          <Chip
            key={label}
            onClick={onClick}
            leftIcon={<Icon size={16} strokeWidth={2.2} className="text-alfa-red" />}
          >
            {label}
          </Chip>
        ))}
      </div>
    </section>
  )
}
