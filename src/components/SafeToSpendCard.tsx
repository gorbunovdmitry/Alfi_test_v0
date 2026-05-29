import type { WeekState } from '../types'
import { formatRub } from '../lib/format'

export function SafeToSpendCard({ ws, onHow }: { ws: WeekState; onHow: () => void }) {
  return (
    <section className="rounded-[22px] bg-white p-5 shadow-card">
      <div className="text-[13px] text-gray-mid">Сегодня можно потратить</div>

      {ws.safeToSpendPositive ? (
        <>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[36px] font-bold leading-none tracking-[-0.03em] text-graphite tnum">
              {formatRub(ws.safeToSpendToday)}
            </span>
            <span className="text-[14px] text-gray-mid">без риска для недели</span>
          </div>
          <p className="mt-2.5 text-[13px] leading-relaxed text-gray-mid">
            Сумма уже учитывает цель, сбережения и обязательные платежи.
          </p>
        </>
      ) : (
        <p className="mt-2 text-[16px] font-medium leading-relaxed text-graphite">
          Сегодня лучше не увеличивать необязательные траты.
        </p>
      )}

      <button
        onClick={onHow}
        className="mt-3 text-[14px] font-medium text-alfa-red transition active:opacity-60 tap-transparent"
      >
        Как посчитано?
      </button>
    </section>
  )
}
