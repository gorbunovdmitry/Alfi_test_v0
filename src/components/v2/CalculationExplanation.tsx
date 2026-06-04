import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { DemoState } from '../../data/demoStates'
import { Chip } from '../ui/Chip'
import { useToast } from './Toast'

const MICRO_ACTIONS = ['Всё верно', 'Исправить платежи', 'Не учитывать операцию', 'Убрать переводы из расчёта']

export function CalculationExplanation({ state }: { state: DemoState }) {
  const [open, setOpen] = useState(false)
  const toast = useToast()

  return (
    <section className="rounded-[22px] bg-white shadow-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 p-5 text-left sm:p-6"
        aria-expanded={open}
      >
        <span className="text-[16px] font-bold tracking-[-0.01em] text-graphite">Почему мы так посчитали?</span>
        <ChevronDown size={20} className={`shrink-0 text-gray-mid transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="overflow-hidden rounded-2xl border border-[#EEEFF2]">
            {state.explanationRows.map((row, i) => (
              <div
                key={row.label}
                className={`flex items-center justify-between gap-3 px-4 py-3 text-[14px] ${
                  row.kind === 'total' ? 'bg-bg-light font-bold text-graphite' : 'text-gray-dark'
                } ${i > 0 ? 'border-t border-[#F1F2F5]' : ''}`}
              >
                <span>{row.label}</span>
                <span
                  className={`tnum font-semibold ${row.kind === 'income' ? 'text-[#1E854A]' : 'text-graphite'}`}
                >
                  {row.amount}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {MICRO_ACTIONS.map((m) => (
              <Chip key={m} onClick={() => toast('Настройка будет доступна в пилоте')}>
                {m}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
