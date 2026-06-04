// Orchestration for the AI Financial Coach flow: a single reducer that owns the
// whole FinancialCoachState. Flow: idle → analyzing(audit) → questions(gaps+pref)
// → summary(picture) → goals(selection+explanation) → progress.

import { useMemo, useReducer } from 'react'
import type { Dispatch } from 'react'
import type {
  ChatMessage,
  ClarifyingQuestion,
  FinancialCoachState,
  GoalDifficulty,
  SummaryCard,
  UserGoal,
} from '../types/coach'
import { adjustGoalDifficulty, changeGoalCategory, instantiateGoal, isGoalComplete, nudgeGoal } from '../lib/goalMechanics'
import { GOAL_CATEGORY_LABELS, templateById } from '../data/goalCatalog'
import { PREFERENCE_QUESTIONS } from '../data/clarifyingQuestions'

const GREETING =
  'Здравствуйте! Я разберу Ваши доходы и расходы и предложу 3 конкретных действия на неделю. Спрашивайте про траты, доходы и цели — отвечу на реальных данных. Не вводите в чат персональные данные.'

const greet = (): ChatMessage[] => [{ id: 0, role: 'assistant', text: GREETING }]

const initialState: FinancialCoachState = {
  analysisStatus: 'idle',
  userAnswers: {},
  analysisQuestions: [],
  summaryCards: [],
  suggestedGoals: [],
  activeGoals: [],
  chatMessages: greet(),
  planExplanation: '',
  questionsLoading: false,
  resultsLoading: false,
  analysisError: false,
}

export type CoachAction =
  | { type: 'START_ANALYSIS' }
  | { type: 'AUDIT_RESOLVE'; cards: SummaryCard[]; gapQuestions: ClarifyingQuestion[]; fromLLM: boolean }
  | { type: 'ANSWER_QUESTION'; id: string; value: string }
  | { type: 'GO_TO_SUMMARY' }
  | { type: 'REQUEST_GOALS' }
  | { type: 'GOALS_RESOLVE'; goals: UserGoal[]; planExplanation: string; fromLLM: boolean }
  | { type: 'ACCEPT_GOAL'; id: string }
  | { type: 'ACCEPT_ALL' }
  | { type: 'REPLACE_GOAL'; id: string; templateId: string }
  | { type: 'ADJUST_DIFFICULTY'; id: string; direction: 'easier' | 'harder' }
  | { type: 'CHANGE_CATEGORY'; id: string; categoryId: string }
  | { type: 'NUDGE_PROGRESS'; id: string }
  | { type: 'RESET' }
  | { type: 'CHAT_SEND'; text: string }
  | { type: 'CHAT_RESOLVE'; text: string }

const nextId = (msgs: ChatMessage[]) => msgs.reduce((m, x) => Math.max(m, x.id), 0) + 1

const mapById = (goals: UserGoal[], id: string, fn: (g: UserGoal) => UserGoal) =>
  goals.map((g) => (g.id === id ? fn(g) : g))

function reducer(state: FinancialCoachState, action: CoachAction): FinancialCoachState {
  switch (action.type) {
    case 'START_ANALYSIS':
      return {
        ...state,
        analysisStatus: 'analyzing',
        questionsLoading: true,
        analysisError: false,
        userAnswers: {},
        analysisQuestions: [],
        summaryCards: [],
        suggestedGoals: [],
        planExplanation: '',
      }
    case 'AUDIT_RESOLVE':
      return {
        ...state,
        summaryCards: action.cards,
        analysisQuestions: [...action.gapQuestions, ...PREFERENCE_QUESTIONS],
        questionsLoading: false,
        analysisStatus: 'questions',
        analysisError: state.analysisError || !action.fromLLM,
      }
    case 'ANSWER_QUESTION':
      return { ...state, userAnswers: { ...state.userAnswers, [action.id]: action.value } }
    case 'GO_TO_SUMMARY':
      return { ...state, analysisStatus: 'summary' }
    case 'REQUEST_GOALS':
      return { ...state, resultsLoading: true }
    case 'GOALS_RESOLVE':
      return {
        ...state,
        suggestedGoals: action.goals,
        planExplanation: action.planExplanation,
        resultsLoading: false,
        analysisStatus: 'goals',
        analysisError: state.analysisError || !action.fromLLM,
      }

    case 'ACCEPT_GOAL': {
      const g = state.suggestedGoals.find((x) => x.id === action.id)
      if (!g) return state
      const suggestedGoals = mapById(state.suggestedGoals, action.id, (x) => ({ ...x, status: 'accepted' }))
      const exists = state.activeGoals.some((x) => x.id === g.id)
      const activeGoals = exists
        ? state.activeGoals
        : [...state.activeGoals, { ...g, status: 'in_progress' as const }]
      return { ...state, suggestedGoals, activeGoals }
    }
    case 'ACCEPT_ALL': {
      const suggestedGoals = state.suggestedGoals.map((x) => ({ ...x, status: 'accepted' as const }))
      const activeGoals = suggestedGoals.map((x) => ({ ...x, status: 'in_progress' as const }))
      return { ...state, suggestedGoals, activeGoals, analysisStatus: 'progress' }
    }
    case 'REPLACE_GOAL': {
      const template = templateById[action.templateId]
      if (!template) return state
      const difficulty = (state.userAnswers['q_difficulty'] as GoalDifficulty) || 'normal'
      const fresh = instantiateGoal(template, {
        id: action.id,
        difficulty,
        recommendedReason: `Выбрана из каталога «${GOAL_CATEGORY_LABELS[template.category]}».`,
        confidence: 'medium',
        aiExplanation: template.examples[0] ?? template.description,
      })
      return {
        ...state,
        suggestedGoals: mapById(state.suggestedGoals, action.id, () => fresh),
        activeGoals: state.activeGoals.filter((x) => x.id !== action.id),
      }
    }
    case 'ADJUST_DIFFICULTY': {
      const fn = (g: UserGoal) => adjustGoalDifficulty(g, action.direction)
      return {
        ...state,
        suggestedGoals: mapById(state.suggestedGoals, action.id, fn),
        activeGoals: mapById(state.activeGoals, action.id, fn),
      }
    }
    case 'CHANGE_CATEGORY': {
      const fn = (g: UserGoal) => changeGoalCategory(g, action.categoryId)
      return {
        ...state,
        suggestedGoals: mapById(state.suggestedGoals, action.id, fn),
        activeGoals: mapById(state.activeGoals, action.id, fn),
      }
    }
    case 'NUDGE_PROGRESS': {
      return {
        ...state,
        activeGoals: mapById(state.activeGoals, action.id, (g) => {
          const n = nudgeGoal(g)
          return { ...n, status: isGoalComplete(n) ? 'completed' : 'in_progress' }
        }),
      }
    }
    case 'RESET':
      return { ...initialState, chatMessages: greet() }

    case 'CHAT_SEND': {
      const base = nextId(state.chatMessages)
      const userMsg: ChatMessage = { id: base, role: 'user', text: action.text }
      const loading: ChatMessage = { id: base + 1, role: 'assistant', text: '', loading: true }
      return { ...state, chatMessages: [...state.chatMessages, userMsg, loading] }
    }
    case 'CHAT_RESOLVE': {
      const msgs = [...state.chatMessages]
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'assistant' && msgs[i].loading) {
          msgs[i] = { ...msgs[i], text: action.text, loading: false }
          break
        }
      }
      return { ...state, chatMessages: msgs }
    }
    default:
      return state
  }
}

export type CoachApi = {
  state: FinancialCoachState
  dispatch: Dispatch<CoachAction>
  answerQuestion: (id: string, value: string) => void
  goToSummary: () => void
  acceptGoal: (id: string) => void
  acceptAll: () => void
  replaceGoal: (id: string, templateId: string) => void
  adjustDifficulty: (id: string, direction: 'easier' | 'harder') => void
  changeCategory: (id: string, categoryId: string) => void
  nudgeProgress: (id: string) => void
  reset: () => void
}

export function useFinancialCoach(): CoachApi {
  const [state, dispatch] = useReducer(reducer, initialState)
  return useMemo(
    () => ({
      state,
      dispatch,
      answerQuestion: (id, value) => dispatch({ type: 'ANSWER_QUESTION', id, value }),
      goToSummary: () => dispatch({ type: 'GO_TO_SUMMARY' }),
      acceptGoal: (id) => dispatch({ type: 'ACCEPT_GOAL', id }),
      acceptAll: () => dispatch({ type: 'ACCEPT_ALL' }),
      replaceGoal: (id, templateId) => dispatch({ type: 'REPLACE_GOAL', id, templateId }),
      adjustDifficulty: (id, direction) => dispatch({ type: 'ADJUST_DIFFICULTY', id, direction }),
      changeCategory: (id, categoryId) => dispatch({ type: 'CHANGE_CATEGORY', id, categoryId }),
      nudgeProgress: (id) => dispatch({ type: 'NUDGE_PROGRESS', id }),
      reset: () => dispatch({ type: 'RESET' }),
    }),
    [state],
  )
}
