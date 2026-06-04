import type { DemoState } from '../../data/demoStates'

export function ReservedMoneyCard({ state }: { state: DemoState }) {
  return (
    <section className="rounded-[22px] bg-white p-5 shadow-card sm:p-6">
      <h3 className="text-[16px] font-bold tracking-[-0.01em] text-graphite">Уже учтено в плане</h3>
      <ul className="mt-4 space-y-px overflow-hidden rounded-2xl">
        {state.reservedPayments.map((r) => (
          <li
            key={r.label}
            className={`flex items-center justify-between gap-3 px-4 py-3 text-[14px] ${
              r.highlight ? 'bg-bg-light font-semibold text-graphite' : 'bg-bg-light/60 text-gray-dark'
            }`}
          >
            <span>{r.label}</span>
            <span className={`tnum ${r.highlight ? 'text-graphite' : 'font-semibold text-graphite'}`}>
              {r.amount}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13px] leading-relaxed text-gray-mid">{state.reservedNote}</p>
    </section>
  )
}
