import { useState } from 'react'
import { MessageCircle, RotateCcw } from 'lucide-react'
import { useFinancialCoach } from '../hooks/useFinancialCoach'
import { useCoachAnalysis } from '../lib/useCoachAnalysis'
import { useCoachChat } from '../lib/useCoachChat'
import { useToast } from '../components/v2/Toast'
import { financialSummary } from '../data/demoFinancialData'
import { classifyIntent, DEFAULT_CHAT_SUGGESTIONS, followupChips } from '../lib/coachIntent'
import type { AnalysisStatus, UserGoal } from '../types/coach'
import { AlfiAvatar } from '../components/AlfiAvatar'
import { BottomSheet } from '../components/ui/BottomSheet'
import { FinancialCoachHero } from '../components/coach/FinancialCoachHero'
import { AnalysisProgress } from '../components/coach/AnalysisProgress'
import { ClarifyingQuestions } from '../components/coach/ClarifyingQuestions'
import { FinancialSummaryCards } from '../components/coach/FinancialSummaryCards'
import { SuggestedGoals } from '../components/coach/SuggestedGoals'
import { GoalSettingsModal } from '../components/coach/GoalSettingsModal'
import { GoalCatalogModal } from '../components/coach/GoalCatalogModal'
import { ActiveGoalsProgress } from '../components/coach/ActiveGoalsProgress'
import { FinancialCoachChat } from '../components/coach/FinancialCoachChat'

const STEP_LABEL: Record<AnalysisStatus, string> = {
  idle: 'Старт',
  analyzing: 'Анализ',
  questions: 'Уточнения',
  summary: 'Картина',
  goals: 'Цели',
  progress: 'Прогресс',
}

export function FinancialCoachPage() {
  const coach = useFinancialCoach()
  const { state } = coach
  const analysis = useCoachAnalysis(state, coach.dispatch)
  const { send, busy } = useCoachChat(state, coach.dispatch)
  const toast = useToast()

  const [settingsGoalId, setSettingsGoalId] = useState<string | null>(null)
  const [catalogTargetId, setCatalogTargetId] = useState<string | null>(null)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatSuggestions, setChatSuggestions] = useState<string[]>(DEFAULT_CHAT_SUGGESTIONS)

  const status = state.analysisStatus
  const activeIds = state.activeGoals.map((g) => g.id)
  const activeSet = new Set(activeIds)
  const settingsGoal: UserGoal | undefined = state.suggestedGoals.find((g) => g.id === settingsGoalId)

  const handleSend = (text: string) => {
    setChatSuggestions(followupChips(classifyIntent(text)))
    send(text)
  }

  const handleNudge = (id: string) => {
    const g = state.activeGoals.find((x) => x.id === id)
    coach.nudgeProgress(id)
    const msg =
      g?.progressType === 'steps'
        ? 'Шаг отмечен'
        : g?.progressType === 'binary'
          ? 'Отмечено как выполненное'
          : g?.progressType === 'money_saved'
            ? 'Отложено в прогресс'
            : 'Трата учтена в лимите'
    toast(msg)
  }

  const openCatalogForReplace = () => {
    const last = state.suggestedGoals[state.suggestedGoals.length - 1]
    const target = state.suggestedGoals.find((g) => !activeSet.has(g.id))?.id ?? last?.id ?? null
    setCatalogTargetId(target)
    setCatalogOpen(true)
  }

  const reset = () => {
    setSettingsGoalId(null)
    setCatalogOpen(false)
    setChatOpen(false)
    setChatSuggestions(DEFAULT_CHAT_SUGGESTIONS)
    coach.reset()
  }

  const wide = status === 'progress'
  const showGoalsLoader = status === 'summary' && state.resultsLoading

  return (
    <div className="min-h-[100dvh] bg-bg-light text-graphite">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-[#ECEDF0] bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2.5">
            <AlfiAvatar size={26} />
            <span className="truncate text-[14px] font-bold tracking-[-0.01em] text-graphite">
              Альфи · AI-разбор финансов
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-bg-light px-3 py-1 text-[12px] font-semibold text-gray-dark">
              {STEP_LABEL[status]}
            </span>
            {status !== 'idle' && (
              <button
                onClick={reset}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium text-gray-mid transition hover:text-graphite tap-transparent"
              >
                <RotateCcw size={13} strokeWidth={2.2} />
                Заново
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={`mx-auto w-full px-4 pb-28 pt-5 sm:px-6 ${wide ? 'max-w-[1100px]' : 'max-w-[640px]'}`}>
        {status === 'idle' && <FinancialCoachHero onStart={analysis.runAudit} />}

        {status === 'analyzing' && <AnalysisProgress phase="audit" />}

        {status === 'questions' && (
          <ClarifyingQuestions
            questions={state.analysisQuestions}
            answers={state.userAnswers}
            onAnswer={coach.answerQuestion}
            onComplete={coach.goToSummary}
          />
        )}

        {status === 'summary' &&
          (showGoalsLoader ? (
            <AnalysisProgress phase="goals" />
          ) : (
            <FinancialSummaryCards
              summary={financialSummary}
              cards={state.summaryCards}
              onBuildGoals={analysis.buildGoals}
              onOpenChat={() => setChatOpen(true)}
            />
          ))}

        {status === 'goals' && (
          <SuggestedGoals
            goals={state.suggestedGoals}
            activeGoalIds={activeIds}
            planExplanation={state.planExplanation}
            onAccept={coach.acceptGoal}
            onAcceptAll={() => {
              coach.acceptAll()
              toast('Цели приняты')
            }}
            onOpenSettings={(g) => setSettingsGoalId(g.id)}
            onOpenCatalog={openCatalogForReplace}
            onOpenChat={() => setChatOpen(true)}
          />
        )}

        {status === 'progress' && (
          <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-5">
            <div className="lg:col-span-7">
              <ActiveGoalsProgress goals={state.activeGoals} onNudge={handleNudge} />
            </div>
            <div className="mt-4 lg:col-span-5 lg:mt-0 lg:sticky lg:top-20">
              <div className="flex h-[70dvh] flex-col rounded-[24px] bg-white p-4 shadow-card sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <AlfiAvatar size={28} />
                  <div>
                    <div className="text-[14px] font-bold tracking-[-0.01em] text-graphite">Чат с Альфи</div>
                    <div className="text-[12px] text-gray-mid">Разбор трат, доходов и целей</div>
                  </div>
                </div>
                <FinancialCoachChat
                  className="flex-1"
                  messages={state.chatMessages}
                  onSend={handleSend}
                  busy={busy}
                  suggestions={chatSuggestions}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* floating chat (summary / goals) */}
      {(status === 'summary' || status === 'goals') && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-5 right-4 z-40 flex items-center gap-2.5 rounded-full bg-white py-2 pl-2 pr-4 shadow-frame transition active:scale-95 tap-transparent sm:right-6"
        >
          <AlfiAvatar size={32} />
          <span className="text-[14px] font-semibold text-graphite">Спросить Альфи</span>
        </button>
      )}

      {/* chat sheet */}
      {chatOpen && (
        <BottomSheet open onClose={() => setChatOpen(false)} title="Альфи" eyebrow="AI Financial Coach">
          <FinancialCoachChat
            className="h-[58dvh]"
            messages={state.chatMessages}
            onSend={handleSend}
            busy={busy}
            suggestions={chatSuggestions}
          />
        </BottomSheet>
      )}

      {/* goal settings */}
      {settingsGoal && (
        <GoalSettingsModal
          goal={settingsGoal}
          onClose={() => setSettingsGoalId(null)}
          onEasier={() => coach.adjustDifficulty(settingsGoal.id, 'easier')}
          onHarder={() => coach.adjustDifficulty(settingsGoal.id, 'harder')}
          onChangeCategory={(categoryId) => {
            coach.changeCategory(settingsGoal.id, categoryId)
            toast('Категория цели обновлена')
          }}
          onReplace={() => {
            setCatalogTargetId(settingsGoal.id)
            setSettingsGoalId(null)
            setCatalogOpen(true)
          }}
        />
      )}

      {/* goal catalog */}
      {catalogOpen && (
        <GoalCatalogModal
          onClose={() => setCatalogOpen(false)}
          onPick={(templateId) => {
            if (catalogTargetId) coach.replaceGoal(catalogTargetId, templateId)
            setCatalogOpen(false)
            toast('Цель заменена')
          }}
        />
      )}

      {/* idle hint */}
      {status === 'idle' && (
        <div className="pointer-events-none fixed bottom-5 left-0 right-0 z-10 flex justify-center px-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[12px] text-gray-mid shadow-card-sm">
            <MessageCircle size={13} /> Чат с Альфи откроется после разбора
          </span>
        </div>
      )}
    </div>
  )
}
