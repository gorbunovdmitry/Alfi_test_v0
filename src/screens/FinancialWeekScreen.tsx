import { useMemo, useState } from 'react'
import { accounts, defaultGoal, MOCK_TODAY, transactions, weeklyPlan } from '../data/mockData'
import { computeWeekState } from '../lib/calculations'
import { DEMO_STATES, DEFAULT_STATE } from '../data/demoStates'
import type { StateId } from '../data/demoStates'
import { AlfiAvatar } from '../components/AlfiAvatar'
import { ToastProvider } from '../components/v2/Toast'
import { HeroSummary } from '../components/v2/HeroSummary'
import { RingsDashboard } from '../components/v2/RingsDashboard'
import { ReservedMoneyCard } from '../components/v2/ReservedMoneyCard'
import { CalculationExplanation } from '../components/v2/CalculationExplanation'
import { PurchaseChecker } from '../components/v2/PurchaseChecker'
import { ActionCards } from '../components/v2/ActionCards'
import { PassionCard } from '../components/v2/PassionCard'
import { ChatBottomSheet } from '../components/sheets/ChatBottomSheet'

const STATE_TABS: { id: StateId; label: string }[] = [
  { id: 'ok', label: 'Норма' },
  { id: 'risk', label: 'Риск' },
  { id: 'bad', label: 'Перерасход' },
]

function DemoBar({ stateId, onChange }: { stateId: StateId; onChange: (s: StateId) => void }) {
  return (
    <div className="sticky top-0 z-30 border-b border-[#ECEDF0] bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <AlfiAvatar size={26} />
          <span className="truncate text-[14px] font-bold tracking-[-0.01em] text-graphite">
            Альфи · Финансовая неделя
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-[12px] text-gray-mid sm:inline">Демо</span>
          <div className="flex rounded-full bg-bg-light p-1">
            {STATE_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition tap-transparent ${
                  stateId === t.id ? 'bg-white text-graphite shadow-card-sm' : 'text-gray-mid'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function FinancialWeekScreen() {
  const [stateId, setStateId] = useState<StateId>(DEFAULT_STATE)
  const state = DEMO_STATES[stateId]

  const [chatOpen, setChatOpen] = useState(false)
  const [chatPrompt, setChatPrompt] = useState<string | undefined>(undefined)

  // Chat context is computed from the synthetic statement (independent of the demo states).
  const ws = useMemo(
    () => computeWeekState(transactions, accounts, defaultGoal, weeklyPlan, MOCK_TODAY),
    [],
  )

  const openChat = (prompt?: string) => {
    setChatPrompt(prompt)
    setChatOpen(true)
  }

  return (
    <ToastProvider>
      <div className="min-h-[100dvh] bg-bg-light text-graphite">
        <DemoBar stateId={stateId} onChange={setStateId} />

        <main className="mx-auto w-full max-w-[1100px] px-4 pb-28 pt-5 sm:px-6">
          <div className="space-y-4 lg:grid lg:grid-cols-12 lg:items-start lg:gap-5 lg:space-y-0">
            {/* LEFT (desktop) / top (mobile): ответ + кольца + CTA */}
            <div className="space-y-4 lg:col-span-7">
              <section className="rounded-[22px] bg-white p-5 shadow-card sm:p-7">
                <HeroSummary state={state} />
              </section>
              <section className="rounded-[22px] bg-white p-5 shadow-card sm:p-6">
                <RingsDashboard rings={state.rings} />
              </section>
              {/* CTA «Проверить покупку» — на мобильном идёт третьим блоком */}
              <div className="lg:hidden">
                <PurchaseChecker key={state.id} state={state} />
              </div>
            </div>

            {/* RIGHT (desktop): проверить покупку + уже учтено */}
            <div className="space-y-4 lg:col-span-5">
              <div className="hidden lg:block">
                <PurchaseChecker key={state.id} state={state} />
              </div>
              <ReservedMoneyCard state={state} />
            </div>

            {/* BELOW (full width): что сделать → расшифровка + страсть */}
            <div className="space-y-4 lg:col-span-12">
              <ActionCards state={state} />
              <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
                <CalculationExplanation state={state} />
                <PassionCard state={state} />
              </div>
            </div>
          </div>
        </main>

        {/* Второстепенный чат Альфи */}
        <button
          onClick={() => openChat()}
          className="fixed bottom-5 right-4 z-40 flex items-center gap-2.5 rounded-full bg-white py-2 pl-2 pr-4 shadow-frame transition active:scale-95 tap-transparent sm:right-6"
        >
          <AlfiAvatar size={32} />
          <span className="text-[14px] font-semibold text-graphite">Спросить Альфи</span>
        </button>

        {chatOpen && (
          <ChatBottomSheet
            open
            onClose={() => setChatOpen(false)}
            ws={ws}
            transactions={transactions}
            initialPrompt={chatPrompt}
          />
        )}
      </div>
    </ToastProvider>
  )
}
