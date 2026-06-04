import { useState } from 'react'
import { ScanSearch } from 'lucide-react'
import type { DemoState } from '../../data/demoStates'
import { Button } from '../ui/Button'
import { formatRub } from '../../lib/format'
import { useToast } from './Toast'

export function PurchaseChecker({ state }: { state: DemoState }) {
  const sc = state.purchaseCheckScenario
  const [amount, setAmount] = useState<number>(sc.amount)
  const [name, setName] = useState<string>(sc.name)
  const toast = useToast()

  // Note: parent passes key={state.id}, so this remounts (and re-prefills) on state switch.
  const isDefault = amount === sc.amount
  const newRemainder = state.freeRemainder - (amount || 0)
  const danger = isDefault ? true : newRemainder < 0
  const result = isDefault
    ? sc.resultText
    : newRemainder < 0
      ? `Купить можно, но неделя уйдёт в красную зону. Свободный остаток станет ${formatRub(newRemainder)}.`
      : `Купить можно спокойно — неделя останется в норме. Свободный остаток станет ${formatRub(newRemainder)}.`

  return (
    <section className="rounded-[24px] bg-graphite p-5 text-white shadow-card sm:p-6">
      <div className="flex items-center gap-2">
        <ScanSearch size={20} className="text-white/85" strokeWidth={2.1} />
        <h3 className="text-[17px] font-bold tracking-[-0.01em]">Проверить покупку</h3>
      </div>
      <p className="mt-1 text-[13px] leading-relaxed text-white/70">
        Узнай за секунду, не сорвёт ли покупка неделю и цель.
      </p>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-[1fr_1.3fr_auto] sm:items-end">
        <label className="block">
          <span className="text-[12px] text-white/60">Сумма</span>
          <div className="mt-1 flex items-center rounded-2xl bg-white/10 px-3.5 py-3 focus-within:ring-2 focus-within:ring-white/30">
            <input
              inputMode="numeric"
              value={amount ? amount.toLocaleString('ru-RU') : ''}
              onChange={(e) => setAmount(Number(e.target.value.replace(/\D/g, '')) || 0)}
              className="w-full bg-transparent text-[16px] font-semibold text-white outline-none tnum"
              aria-label="Сумма покупки"
            />
            <span className="ml-1 shrink-0 text-white/60">₽</span>
          </div>
        </label>
        <label className="block">
          <span className="text-[12px] text-white/60">Покупка</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-2xl bg-white/10 px-3.5 py-3 text-[16px] font-semibold text-white outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Название покупки"
          />
        </label>
        <Button
          variant="primary"
          className="w-full sm:w-auto"
          onClick={() => toast('Проверили на текущих данных недели')}
        >
          Проверить
        </Button>
      </div>

      <div
        className={`mt-4 rounded-2xl px-4 py-3.5 text-[14px] leading-relaxed ${
          danger ? 'bg-alfa-red/20' : 'bg-[#1E854A]/25'
        }`}
      >
        {result}
      </div>

      <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
        {sc.scenarios.map((s, i) => (
          <button
            key={i}
            onClick={() => toast('Сценарий будет доступен в пилоте')}
            className="rounded-2xl bg-white/10 p-3.5 text-left transition hover:bg-white/[0.15] active:scale-[0.99]"
          >
            <div className="text-[14px] font-semibold leading-snug text-white">{s.title}</div>
            <div className="mt-1 text-[12px] leading-snug text-white/65">{s.caption}</div>
          </button>
        ))}
      </div>
    </section>
  )
}
