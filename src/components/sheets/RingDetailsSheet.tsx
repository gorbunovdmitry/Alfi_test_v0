import type { ReactNode } from 'react'
import type { RingId, WeekState } from '../../types'
import { formatRub, formatSignedRub } from '../../lib/format'
import { monthsLabel } from '../../lib/goal'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'

type Props = {
  open: boolean
  ringId: RingId | null
  ws: WeekState
  onClose: () => void
  onContributeGoal: (amount: number) => void
  onAddSavings: (amount: number) => void
  onOpenGoalSetup: () => void
  onAsk: (prompt: string) => void
}

function Headline({
  big,
  muted,
  sub,
  statusLabel,
}: {
  big: string
  muted: string
  sub: ReactNode
  statusLabel: string
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-[34px] font-bold leading-none tracking-[-0.03em] text-graphite tnum">
          {big}
        </span>
        <span className="text-[16px] text-gray-mid">из {muted}</span>
        <span className="ml-auto rounded-full bg-bg-light px-2.5 py-1 text-[12px] font-medium text-gray-dark">
          {statusLabel}
        </span>
      </div>
      {sub && <p className="mt-3 text-[14px] leading-relaxed text-gray-mid">{sub}</p>}
    </div>
  )
}

function BreakdownRow({
  label,
  amount,
  max,
  color,
  signed,
}: {
  label: string
  amount: number
  max: number
  color: string
  signed?: boolean
}) {
  const width = max > 0 ? Math.max(amount <= 0 ? 0 : 6, (amount / max) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-[14px]">
        <span className="text-gray-dark">{label}</span>
        <span className="font-semibold text-graphite tnum">
          {signed ? formatSignedRub(amount) : formatRub(amount)}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg-light">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export function RingDetailsSheet({
  open,
  ringId,
  ws,
  onClose,
  onContributeGoal,
  onAddSavings,
  onOpenGoalSetup,
  onAsk,
}: Props) {
  const ring = ringId ? ws.rings.find((r) => r.id === ringId) : undefined

  let title = ''
  let body: ReactNode = null
  let footer: ReactNode = null

  if (ring?.id === 'spending') {
    const maxCat = Math.max(...ws.spendingByCategory.map((c) => c.amount), 1)
    title = 'Управление тратами'
    body = (
      <div className="space-y-5">
        <Headline
          big={formatRub(ws.actualSpending)}
          muted={formatRub(ws.spendingTarget)}
          statusLabel={ring.statusLabel}
          sub={
            ws.spendingRemaining >= 0
              ? `Осталось ${formatRub(ws.spendingRemaining)} до воскресенья`
              : `Неделя выше плана на ${formatRub(-ws.spendingRemaining)}`
          }
        />
        <div className="space-y-3">
          {ws.spendingByCategory.map((c) => (
            <BreakdownRow
              key={c.key}
              label={c.label}
              amount={c.amount}
              max={maxCat}
              color="#EF3124"
            />
          ))}
        </div>
        <p className="rounded-2xl bg-bg-light px-4 py-3 text-[13px] leading-relaxed text-gray-dark">
          План рассчитан по твоим обычным тратам, неделе месяца, обязательным платежам и цели.
        </p>
      </div>
    )
    footer = (
      <div className="flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={() => onAsk('Почему просело кольцо?')}>
          Где сократить
        </Button>
        <Button className="flex-1" onClick={() => onAsk('Пересчитать цель')}>
          Пересчитать план
        </Button>
      </div>
    )
  }

  if (ring?.id === 'savings') {
    const maxProd = Math.max(...ws.savingsByProduct.map((p) => p.amount), 1)
    const addAmount = ws.savingsRemaining > 0 ? ws.savingsRemaining : 1000
    title = 'Накопления'
    body = (
      <div className="space-y-5">
        <Headline
          big={formatSignedRub(ws.savingsGrowth)}
          muted={formatRub(ws.savingsTarget)}
          statusLabel={ring.statusLabel}
          sub={`Цель недели — ${formatRub(ws.savingsTarget)}. Это 10% дохода, разделённые на 4 недели.`}
        />
        <div className="space-y-3">
          {ws.savingsByProduct.map((p) => (
            <BreakdownRow
              key={p.accountId}
              label={p.name}
              amount={p.amount}
              max={maxProd}
              color="#111111"
              signed
            />
          ))}
        </div>
      </div>
    )
    footer = (
      <div className="flex gap-2.5">
        <Button variant="secondary" className="flex-1" onClick={onOpenGoalSetup}>
          Изменить сумму
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            onAddSavings(addAmount)
            onClose()
          }}
        >
          Отложить ещё {formatRub(addAmount)}
        </Button>
      </div>
    )
  }

  if (ring?.id === 'goal') {
    title = 'Шаг к цели'
    const addAmount = ws.goalRemainingStep > 0 ? ws.goalRemainingStep : 2000
    body = (
      <div className="space-y-5">
        <Headline
          big={formatRub(ws.goalContributions)}
          muted={formatRub(ws.goalStep)}
          statusLabel={ring.statusLabel}
          sub={`Чтобы накопить на ${ws.goal.name.toLowerCase()} за ${monthsLabel(ws.goal)}, нужно откладывать около ${formatRub(ws.goalStep)} в неделю.`}
        />
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="secondary" onClick={onOpenGoalSetup}>
            Сдвинуть срок
          </Button>
          <Button variant="secondary" onClick={onOpenGoalSetup}>
            Сделать мягче
          </Button>
        </div>
        <button
          onClick={onOpenGoalSetup}
          className="w-full text-center text-[14px] font-medium text-gray-mid transition active:opacity-60 tap-transparent"
        >
          Поменять цель
        </button>
      </div>
    )
    footer = (
      <Button
        fullWidth
        size="lg"
        onClick={() => {
          onContributeGoal(addAmount)
          onClose()
        }}
      >
        Внести {formatRub(addAmount)} в цель
      </Button>
    )
  }

  return (
    <BottomSheet open={open && !!ring} onClose={onClose} title={title}>
      {body}
      {footer && <div className="mt-6">{footer}</div>}
    </BottomSheet>
  )
}
