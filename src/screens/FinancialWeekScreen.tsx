import { useMemo, useState } from 'react'
import { Settings } from 'lucide-react'
import type { Goal, RingId, Transaction, WeeklyPlan } from '../types'
import { accounts, defaultGoal, MOCK_TODAY, transactions, weeklyPlan } from '../data/mockData'
import { computeWeekState } from '../lib/calculations'
import { MobileFrame } from '../components/MobileFrame'
import { ActivityRings } from '../components/ActivityRings'
import { RingLegend } from '../components/RingLegend'
import { GoalCard } from '../components/GoalCard'
import { InsightCard } from '../components/InsightCard'
import { SafeToSpendCard } from '../components/SafeToSpendCard'
import { CalculationDetailsCard } from '../components/CalculationDetailsCard'
import { QuickActions } from '../components/QuickActions'
import { StickyChatInput } from '../components/StickyChatInput'
import { RingDetailsSheet } from '../components/sheets/RingDetailsSheet'
import { GoalSetupSheet } from '../components/sheets/GoalSetupSheet'
import { ChatBottomSheet } from '../components/sheets/ChatBottomSheet'

type Sheet =
  | null
  | { kind: 'ring'; ringId: RingId }
  | { kind: 'goalSetup' }
  | { kind: 'chat'; prompt?: string }

let extraSeq = 0
function makeTransfer(kind: 'goal' | 'savings', amount: number): Transaction {
  extraSeq += 1
  const base = {
    id: `extra_${extraSeq}`,
    operationDate: MOCK_TODAY,
    postingDate: MOCK_TODAY,
    code: 'OP',
    amount,
    direction: 'expense' as const,
    status: 'completed' as const,
    accountId: 'debit',
    sourceAccountId: 'debit',
    isInternalTransfer: false,
    isObligatory: false,
    isDebtPayment: false,
    isRecurring: false,
    confidence: 1,
  }
  if (kind === 'goal') {
    return {
      ...base,
      normalizedCategory: 'goal_contribution',
      rawCategory: 'goal',
      description: 'Взнос в цель',
      destinationAccountId: 'goal_account',
      isGoalRelated: true,
      isSavingsRelated: false,
    }
  }
  return {
    ...base,
    normalizedCategory: 'savings_transfer',
    rawCategory: 'savings',
    description: 'Пополнение накоплений',
    destinationAccountId: 'savings',
    isSavingsRelated: true,
    isGoalRelated: false,
  }
}

export function FinancialWeekScreen() {
  const [goal, setGoal] = useState<Goal>(defaultGoal)
  const [plan, setPlan] = useState<WeeklyPlan>(weeklyPlan)
  const [extraTx, setExtraTx] = useState<Transaction[]>([])
  const [sheet, setSheet] = useState<Sheet>(null)

  const allTx = useMemo(() => [...transactions, ...extraTx], [extraTx])
  const ws = useMemo(
    () => computeWeekState(allTx, accounts, goal, plan, MOCK_TODAY),
    [allTx, goal, plan],
  )

  const close = () => setSheet(null)
  const openRing = (ringId: RingId) => setSheet({ kind: 'ring', ringId })
  const openGoalSetup = () => setSheet({ kind: 'goalSetup' })
  const openChat = (prompt?: string) => setSheet({ kind: 'chat', prompt })

  const contributeGoal = (amount: number) => {
    if (amount <= 0) return
    setExtraTx((p) => [...p, makeTransfer('goal', amount)])
    setGoal((g) => ({ ...g, currentAmount: g.currentAmount + amount }))
  }
  const addSavings = (amount: number) => {
    if (amount <= 0) return
    setExtraTx((p) => [...p, makeTransfer('savings', amount)])
  }
  const applyGoal = (newGoal: Goal, weeklyStep: number) => {
    setGoal(newGoal)
    setPlan((p) => ({ ...p, goalId: newGoal.id, goalStepTarget: weeklyStep }))
    close()
  }

  return (
    <MobileFrame>
      <div className="flex-1 overflow-y-auto bg-bg-light">
        <div className="space-y-3.5 px-4 pb-8 pt-[max(18px,env(safe-area-inset-top))]">
          <header className="flex items-center justify-between py-1">
            <div>
              <h1 className="text-[24px] font-bold tracking-[-0.02em] text-graphite">
                Финансовая неделя
              </h1>
              <p className="text-[14px] text-gray-mid">26 мая — 1 июня</p>
            </div>
            <button
              aria-label="Настройки"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-dark shadow-card-sm transition active:scale-90 tap-transparent"
            >
              <Settings size={20} />
            </button>
          </header>

          <section className="rounded-[22px] bg-white p-5 shadow-card">
            <ActivityRings rings={ws.rings} centerPercent={ws.weekControlPercent} onRingClick={openRing} />
            <div className="mt-3">
              <RingLegend rings={ws.rings} onRingClick={openRing} />
            </div>
          </section>

          <InsightCard
            ws={ws}
            onCloseWeek={() => openChat('Как закрыть неделю?')}
            onWhy={() => openChat('Почему просело кольцо?')}
          />

          <GoalCard goal={goal} onEdit={openGoalSetup} />

          <SafeToSpendCard ws={ws} onHow={() => openChat('Сколько можно сегодня потратить?')} />
          <CalculationDetailsCard ws={ws} />
          <QuickActions onOpenRing={openRing} onOpenGoalSetup={openGoalSetup} />
        </div>
      </div>

      <StickyChatInput onOpenChat={openChat} />

      {sheet?.kind === 'ring' && (
        <RingDetailsSheet
          open
          ringId={sheet.ringId}
          ws={ws}
          onClose={close}
          onContributeGoal={contributeGoal}
          onAddSavings={addSavings}
          onOpenGoalSetup={openGoalSetup}
          onAsk={openChat}
        />
      )}
      {sheet?.kind === 'goalSetup' && (
        <GoalSetupSheet open onClose={close} ws={ws} onApply={applyGoal} />
      )}
      {sheet?.kind === 'chat' && (
        <ChatBottomSheet
          open
          onClose={close}
          ws={ws}
          transactions={allTx}
          initialPrompt={sheet.prompt}
          onOpenGoal={() => openRing('goal')}
        />
      )}
    </MobileFrame>
  )
}
