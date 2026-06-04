// Lightweight client-side intent classification for the coach chat (master prompt §7.3).
// Used only to offer relevant follow-up chips — the actual answer comes from the LLM.

export type ChatIntent =
  | 'ask_about_expenses'
  | 'ask_about_income'
  | 'ask_about_category'
  | 'ask_why_goal'
  | 'change_goal'
  | 'make_goal_easier'
  | 'make_goal_harder'
  | 'replace_goal'
  | 'explain_summary'
  | 'general_financial_question'

const RULES: { intent: ChatIntent; re: RegExp }[] = [
  { intent: 'make_goal_easier', re: /(легче|проще|мягче|упрост)/i },
  { intent: 'make_goal_harder', re: /(сложнее|амбициозн|жёстче|жестче|увеличь)/i },
  { intent: 'replace_goal', re: /(замен|поменя.*цель|другую цель|другая цель)/i },
  { intent: 'ask_why_goal', re: /(почему.*(цел|выбрал)|зачем эти цели|обоснуй)/i },
  { intent: 'change_goal', re: /(измен|настро).*цель|цель.*(измен|настро)/i },
  { intent: 'ask_about_income', re: /(доход|поступлени|зарплат|сколько получаю)/i },
  { intent: 'ask_about_category', re: /(категори|маркетплейс|кафе|ресторан|яндекс|доставк|продукт|транспорт|здоров)/i },
  { intent: 'ask_about_expenses', re: /(куда уход|на что трач|крупны.*трат|расход|траты|потрат)/i },
  { intent: 'explain_summary', re: /(картин|итог|объясни|резюме|вывод|баланс)/i },
]

export function classifyIntent(text: string): ChatIntent {
  for (const r of RULES) if (r.re.test(text)) return r.intent
  return 'general_financial_question'
}

export const DEFAULT_CHAT_SUGGESTIONS = [
  'Почему именно эти цели?',
  'Куда уходят деньги?',
  'Покажите крупные траты',
  'Что улучшить без жёсткой экономии?',
  'Какие траты вы не учли?',
]

const FOLLOWUPS: Partial<Record<ChatIntent, string[]>> = {
  ask_about_category: ['Поставьте лимит на эту категорию', 'Это необязательные траты?'],
  ask_about_expenses: ['Покажите крупные траты', 'Что улучшить без жёсткой экономии?'],
  ask_about_income: ['Сколько реально свободно?', 'Сколько можно откладывать?'],
  ask_why_goal: ['Сделайте цель легче', 'Замените одну цель'],
  explain_summary: ['Куда уходят деньги?', 'Какие траты вы не учли?'],
  make_goal_easier: ['Замените цель', 'Почему именно эти цели?'],
  replace_goal: ['Откройте каталог целей', 'Почему именно эти цели?'],
}

export function followupChips(intent: ChatIntent): string[] {
  return FOLLOWUPS[intent] ?? DEFAULT_CHAT_SUGGESTIONS.slice(0, 3)
}
