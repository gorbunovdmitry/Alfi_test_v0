import type { DemoState } from '../../data/demoStates'
import { StatusBadge } from './StatusBadge'

export function HeroSummary({ state }: { state: DemoState }) {
  return (
    <section>
      <div className="text-[12px] font-semibold uppercase tracking-[0.1em] text-gray-mid">
        Главный ответ недели
      </div>
      <h1 className="mt-2.5 text-[28px] font-bold leading-[1.12] tracking-[-0.02em] text-graphite sm:text-[34px]">
        {state.hero.headline}
      </h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-gray-dark">{state.hero.subtitle}</p>
      <div className="mt-4">
        <StatusBadge status={state.status} label={state.statusLabel} />
      </div>
    </section>
  )
}
