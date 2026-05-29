import type { WeekState } from '../types'
import { formatRub } from '../lib/format'
import { Button } from './ui/Button'
import { AlfiAvatar } from './AlfiAvatar'

function insightText(ws: WeekState): string {
  const allClosed = ws.rings.every((r) => r.status === 'closed')
  if (allClosed) return 'Все три кольца недели закрыты. Неделя под контролем — так держать.'

  const steps: string[] = []
  if (ws.goalRemainingStep > 0) steps.push(`внести ${formatRub(ws.goalRemainingStep)} в цель`)
  if (ws.spendingRemaining > 0) steps.push('удержать траты на маркетплейсах до воскресенья')
  else if (ws.savingsRemaining > 0) steps.push(`отложить ещё ${formatRub(ws.savingsRemaining)}`)

  const tail = steps.slice(0, 2).join(' или ')
  const lead =
    ws.goalProgress < 0.999
      ? 'Неделя идёт нормально, но цель пока не закрыта.'
      : 'Неделя идёт нормально.'
  return `${lead} Самый простой шаг — ${tail}.`
}

export function InsightCard({
  ws,
  onCloseWeek,
  onWhy,
}: {
  ws: WeekState
  onCloseWeek: () => void
  onWhy: () => void
}) {
  return (
    <section className="rounded-[22px] bg-white p-5 shadow-card">
      <div className="flex items-center gap-2.5">
        <AlfiAvatar size={28} />
        <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-mid">
          Что важнее сейчас
        </div>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-graphite">{insightText(ws)}</p>
      <div className="mt-4 flex gap-2.5">
        <Button onClick={onCloseWeek} className="flex-1">
          Закрыть неделю
        </Button>
        <Button variant="secondary" onClick={onWhy}>
          Почему так?
        </Button>
      </div>
    </section>
  )
}
