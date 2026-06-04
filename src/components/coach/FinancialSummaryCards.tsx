import type { ReactNode } from 'react'
import { ArrowRight, Info, Lightbulb, MessageCircle, ThumbsUp } from 'lucide-react'
import type { CardTone, FinancialSummary, SummaryCard } from '../../types/coach'
import { formatRub, formatSignedRub } from '../../lib/format'
import { spendingBuckets } from '../../data/demoFinancialData'
import { AlfiAvatar } from '../AlfiAvatar'

function FactCard({
  label,
  value,
  valueColor,
  children,
}: {
  label: string
  value: string
  valueColor?: string
  children?: ReactNode
}) {
  return (
    <div className="rounded-[20px] bg-white p-4 shadow-card sm:p-5">
      <div className="text-[12px] font-semibold uppercase tracking-[0.04em] text-gray-mid">{label}</div>
      <div className="mt-1.5 text-[24px] font-bold tracking-[-0.01em] tnum" style={{ color: valueColor }}>
        {value}
      </div>
      {children && <div className="mt-1 text-[12.5px] leading-relaxed text-gray-dark">{children}</div>}
    </div>
  )
}

const TONE_STYLE: Record<CardTone, { bar: string; bg: string; icon: ReactNode }> = {
  good: {
    bar: '#1E854A',
    bg: '#F1FAF4',
    icon: <ThumbsUp size={15} className="text-[#1E854A]" strokeWidth={2.3} />,
  },
  watch: {
    bar: '#FF8A00',
    bg: '#FFF7EC',
    icon: <Lightbulb size={15} className="text-[#C76E00]" strokeWidth={2.3} />,
  },
  neutral: {
    bar: '#C9CDD4',
    bg: '#FFFFFF',
    icon: <Info size={15} className="text-gray-mid" strokeWidth={2.3} />,
  },
}

function ToneCard({ card }: { card: SummaryCard }) {
  const s = TONE_STYLE[card.tone]
  return (
    <div
      className="rounded-[18px] p-4 shadow-card-sm"
      style={{ backgroundColor: s.bg, borderLeft: `4px solid ${s.bar}` }}
    >
      <div className="flex items-center gap-2">
        {s.icon}
        <h3 className="text-[15px] font-bold tracking-[-0.01em] text-graphite">{card.title}</h3>
      </div>
      <p className="mt-1 text-[13.5px] leading-relaxed text-gray-dark">{card.body}</p>
    </div>
  )
}

type Props = {
  summary: FinancialSummary
  cards: SummaryCard[]
  onBuildGoals: () => void
  onOpenChat: () => void
}

export function FinancialSummaryCards({ summary, cards, onBuildGoals, onOpenChat }: Props) {
  const topZones = spendingBuckets.slice(0, 3)

  return (
    <div className="space-y-4">
      {/* numeric facts */}
      <div className="grid gap-3 sm:grid-cols-3">
        <FactCard label="Доходы за период" value={formatRub(summary.income)} valueColor="#1E854A">
          за 6 месяцев, {summary.operationsCount} операций
        </FactCard>
        <FactCard label="Расходы за период" value={formatRub(summary.expenses)}>
          включая переводы и наличные
        </FactCard>
        <FactCard label="Баланс периода" value={formatSignedRub(summary.balance)} valueColor="#EF3124">
          небольшой минус — поправимо
        </FactCard>
      </div>

      <div className="rounded-[20px] bg-white p-4 shadow-card sm:p-5">
        <div className="text-[12px] font-semibold uppercase tracking-[0.04em] text-gray-mid">
          Главные зоны расходов
        </div>
        <ul className="mt-2 space-y-1.5">
          {topZones.map((z) => (
            <li key={z.id} className="flex items-center justify-between gap-3 text-[13.5px]">
              <span className="text-gray-dark">{z.name}</span>
              <span className="shrink-0 font-semibold text-graphite tnum">{formatRub(z.amount)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* LLM conclusion cards */}
      <div className="flex items-center gap-2 pt-1">
        <AlfiAvatar size={28} />
        <h2 className="text-[16px] font-bold tracking-[-0.01em] text-graphite">Что я увидел</h2>
      </div>
      <div className="space-y-2.5">
        {cards.map((c) => (
          <ToneCard key={c.id} card={c} />
        ))}
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <button
          onClick={onBuildGoals}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-alfa-red px-5 py-4 text-[16px] font-semibold text-white shadow-[0_10px_26px_rgba(239,49,36,0.3)] transition active:scale-[0.99] hover:bg-[#e0271b] tap-transparent"
        >
          Собрать цели
          <ArrowRight size={18} strokeWidth={2.4} />
        </button>
        <button
          onClick={onOpenChat}
          className="flex items-center justify-center gap-2 rounded-2xl bg-bg-light px-5 py-4 text-[15px] font-semibold text-graphite transition active:scale-[0.99] hover:bg-[#eceef1] tap-transparent"
        >
          <MessageCircle size={17} strokeWidth={2.2} />
          Обсудить в чате
        </button>
      </div>
    </div>
  )
}
