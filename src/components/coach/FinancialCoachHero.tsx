import { ArrowRight, Check } from 'lucide-react'
import { AlfiAvatar } from '../AlfiAvatar'

const BENEFITS = [
  'Без выгрузок и таблиц',
  'На реальных банковских данных',
  'С конкретными целями, а не общими советами',
  'Можно обсудить детали в чате',
]

export function FinancialCoachHero({ onStart }: { onStart: () => void }) {
  return (
    <div className="rounded-[26px] bg-white p-6 shadow-card sm:p-8">
      <div className="flex items-center gap-3">
        <AlfiAvatar size={44} />
        <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-gray-mid">
          AI Financial Coach
        </span>
      </div>

      <h1 className="mt-5 text-[28px] font-bold leading-[1.1] tracking-[-0.02em] text-graphite sm:text-[32px]">
        AI-разбор финансов
      </h1>
      <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-gray-dark">
        Я посмотрю Ваши доходы, расходы и регулярные платежи, задам пару уточнений и соберу{' '}
        <span className="font-semibold text-graphite">3 цели</span>, которые помогут улучшить ситуацию
        уже на этой неделе.
      </p>

      <ul className="mt-6 space-y-2.5">
        {BENEFITS.map((b) => (
          <li key={b} className="flex items-center gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E8F5EC]">
              <Check size={14} className="text-[#1E854A]" strokeWidth={2.6} />
            </span>
            <span className="text-[14px] text-gray-dark">{b}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onStart}
        className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-alfa-red px-5 py-4 text-[16px] font-semibold text-white shadow-[0_10px_26px_rgba(239,49,36,0.3)] transition active:scale-[0.99] hover:bg-[#e0271b] tap-transparent"
      >
        Начать разбор
        <ArrowRight size={18} strokeWidth={2.4} />
      </button>
      <p className="mt-3 text-center text-[12px] text-gray-mid">
        ≈2 минуты · данные демонстрационные, без персональных сведений
      </p>
    </div>
  )
}
