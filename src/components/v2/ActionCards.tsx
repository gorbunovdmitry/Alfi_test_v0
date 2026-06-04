import type { DemoState } from '../../data/demoStates'
import { Button } from '../ui/Button'
import { useToast } from './Toast'

export function ActionCards({ state }: { state: DemoState }) {
  const toast = useToast()
  return (
    <section className="rounded-[22px] bg-white p-5 shadow-card sm:p-6">
      <h3 className="text-[16px] font-bold tracking-[-0.01em] text-graphite">Что можно сделать сейчас</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {state.actions.map((a) => (
          <div key={a.title} className="flex flex-col rounded-2xl border border-[#EEEFF2] p-4">
            <div className="text-[15px] font-semibold tracking-[-0.01em] text-graphite">{a.title}</div>
            <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-gray-mid">{a.text}</p>
            <Button
              variant={a.primary ? 'primary' : 'secondary'}
              className="mt-3.5 w-full"
              onClick={() => toast('Настройка будет доступна в пилоте')}
            >
              {a.cta}
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}
