import { Heart } from 'lucide-react'
import type { DemoState } from '../../data/demoStates'
import { Button } from '../ui/Button'
import { useToast } from './Toast'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-bg-light px-3.5 py-3">
      <div className="text-[12px] leading-snug text-gray-mid">{label}</div>
      <div className="mt-0.5 text-[16px] font-bold text-graphite tnum">{value}</div>
    </div>
  )
}

export function PassionCard({ state }: { state: DemoState }) {
  const toast = useToast()
  const p = state.passionCategory
  return (
    <section className="rounded-[22px] bg-white p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF2E0]">
          <Heart size={18} className="text-[#FF8A00]" strokeWidth={2.2} />
        </span>
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-mid">
            Твоя категория удовольствия
          </div>
          <div className="text-[16px] font-bold tracking-[-0.01em] text-graphite">{p.name}</div>
        </div>
      </div>
      <p className="mt-3 text-[14px] leading-relaxed text-gray-dark">{p.intro}</p>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Stat label="В этом месяце" value={p.monthSpent} />
        <Stat label="Безопасно до конца недели" value={p.safeThisWeek} />
      </div>
      <p className="mt-3 rounded-2xl bg-bg-light px-4 py-3 text-[13px] leading-relaxed text-gray-dark">
        {p.warning}
      </p>
      <Button
        variant="secondary"
        className="mt-4 w-full sm:w-auto"
        onClick={() => toast('Настройка безопасного лимита будет доступна в пилоте')}
      >
        Настроить безопасный лимит
      </Button>
    </section>
  )
}
