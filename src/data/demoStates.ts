// Demo data for the answer-first «Финансовая неделя» screen.
// Three switchable states (OK / RISK / BAD). Everything the UI shows comes from here,
// so it's trivial to later swap these for real API data of the same shape.

export type StateId = 'ok' | 'risk' | 'bad'

export type DemoRing = {
  key: 'spending' | 'free' | 'goal'
  label: string
  valueText: string
  statusText: string
  progress: number // 0..1 visual fill
  color: string
  hint: string
}

export type ReservedRow = { label: string; amount: string; highlight?: boolean }
export type ExplanationRow = { label: string; amount: string; kind: 'income' | 'expense' | 'total' }
export type PurchaseScenario = { title: string; caption: string }
export type ActionCard = { title: string; text: string; cta: string; primary?: boolean }
export type PassionCategory = {
  name: string
  intro: string
  monthSpent: string
  safeThisWeek: string
  warning: string
}

export type DemoState = {
  id: StateId
  status: StateId
  statusLabel: string
  hero: { headline: string; subtitle: string }
  weeklyBudget: { limit: number; spent: number }
  freeRemainder: number // numeric, used by the purchase checker
  rings: DemoRing[]
  reservedPayments: ReservedRow[]
  reservedNote: string
  explanationRows: ExplanationRow[]
  purchaseCheckScenario: {
    amount: number
    name: string
    resultText: string
    scenarios: PurchaseScenario[]
  }
  actions: ActionCard[]
  passionCategory: PassionCategory
}

const RING_COLORS = { spending: '#EF3124', free: '#FF8A00', goal: '#9933FF' } as const

const RESERVED_NOTE =
  'Эти деньги не входят в свободный лимит — поэтому план показывает не баланс на счёте, а сумму, которую можно тратить спокойно.'
const PASSION_INTRO = 'Эта категория для тебя важна. Давай оставим удовольствие, но не сорвём цель.'

export const STATE_OK: DemoState = {
  id: 'ok',
  status: 'ok',
  statusLabel: 'Неделя в норме',
  hero: {
    headline: 'Можно спокойно потратить 12 400 ₽ до воскресенья',
    subtitle: 'Мы уже учли обязательные платежи, цель недели и обычные траты до конца периода.',
  },
  weeklyBudget: { limit: 20000, spent: 7600 },
  freeRemainder: 4800,
  rings: [
    {
      key: 'spending',
      label: 'Траты недели',
      valueText: '7 600 ₽ из 20 000 ₽',
      statusText: 'В норме',
      progress: 0.38,
      color: RING_COLORS.spending,
      hint: 'Сколько уже потрачено из безопасного недельного лимита.',
    },
    {
      key: 'free',
      label: 'Свободный остаток',
      valueText: 'Прогноз: 4 800 ₽',
      statusText: 'Можно отложить в цель',
      progress: 0.62,
      color: RING_COLORS.free,
      hint: 'Останется после обязательных платежей, обычных трат и шага к цели.',
    },
    {
      key: 'goal',
      label: 'Цель',
      valueText: '3 000 ₽ из 3 000 ₽',
      statusText: 'Шаг недели закрыт',
      progress: 1,
      color: RING_COLORS.goal,
      hint: 'Недельный шаг к жизненной цели.',
    },
  ],
  reservedPayments: [
    { label: 'Обязательные платежи', amount: '18 900 ₽' },
    { label: 'Цель недели', amount: '3 000 ₽' },
    { label: 'Обычные траты до воскресенья', amount: '12 000 ₽' },
    { label: 'Ожидаемый свободный остаток', amount: '4 800 ₽', highlight: true },
  ],
  reservedNote: RESERVED_NOTE,
  explanationRows: [
    { label: 'Ожидаемые доходы', amount: '+85 000 ₽', kind: 'income' },
    { label: 'Обязательные платежи', amount: '−28 400 ₽', kind: 'expense' },
    { label: 'Цель недели', amount: '−3 000 ₽', kind: 'expense' },
    { label: 'Обычные траты до конца недели', amount: '−41 200 ₽', kind: 'expense' },
    { label: 'Можно спокойно потратить', amount: '12 400 ₽', kind: 'total' },
  ],
  purchaseCheckScenario: {
    amount: 20000,
    name: 'Приставка',
    resultText:
      'Купить можно, но неделя уйдёт в красную зону. Свободный остаток станет −7 600 ₽, а цель сдвинется примерно на 3 недели.',
    scenarios: [
      { title: 'Купить сейчас', caption: 'Цель сдвинется на 3 недели' },
      { title: 'Купить после зарплаты', caption: 'Цель не пострадает' },
      { title: 'Купить сейчас и сократить кафе/такси на 4 500 ₽', caption: 'Неделя останется в норме' },
    ],
  },
  actions: [
    {
      title: 'Отложить свободный остаток',
      text: 'Если отправить 4 800 ₽ в цель, неделя закроется на 100%.',
      cta: 'Отложить',
      primary: true,
    },
    {
      title: 'Поставить мягкий лимит',
      text: 'На кафе ушло на 32% больше обычного. До воскресенья безопасно потратить ещё 1 500 ₽.',
      cta: 'Поставить лимит',
    },
    {
      title: 'Проверить регулярные списания',
      text: 'Мы нашли 3 повторяющихся платежа на 1 790 ₽.',
      cta: 'Посмотреть',
    },
  ],
  passionCategory: {
    name: 'Техника и гаджеты',
    intro: PASSION_INTRO,
    monthSpent: '14 800 ₽',
    safeThisWeek: '3 500 ₽',
    warning: 'Если потратишь больше, цель может сдвинуться на 1–2 недели.',
  },
}

export const STATE_RISK: DemoState = {
  id: 'risk',
  status: 'risk',
  statusLabel: 'Есть риск перерасхода',
  hero: {
    headline: 'Можно спокойно потратить 3 200 ₽ до воскресенья',
    subtitle: 'Кафе и такси на этой неделе выше обычного — поэтому свободный лимит меньше.',
  },
  weeklyBudget: { limit: 20000, spent: 15800 },
  freeRemainder: 900,
  rings: [
    {
      key: 'spending',
      label: 'Траты недели',
      valueText: '15 800 ₽ из 20 000 ₽',
      statusText: 'Выше обычного',
      progress: 0.79,
      color: RING_COLORS.spending,
      hint: 'Кафе и такси на этой неделе выше обычного темпа.',
    },
    {
      key: 'free',
      label: 'Свободный остаток',
      valueText: 'Прогноз: 900 ₽',
      statusText: 'Лучше не уходить в минус',
      progress: 0.12,
      color: RING_COLORS.free,
      hint: 'Останется после обязательных платежей, обычных трат и шага к цели.',
    },
    {
      key: 'goal',
      label: 'Цель',
      valueText: '1 500 ₽ из 3 000 ₽',
      statusText: 'Шаг недели наполовину',
      progress: 0.5,
      color: RING_COLORS.goal,
      hint: 'Недельный шаг к жизненной цели.',
    },
  ],
  reservedPayments: [
    { label: 'Обязательные платежи', amount: '18 900 ₽' },
    { label: 'Цель недели', amount: '3 000 ₽' },
    { label: 'Обычные траты до воскресенья', amount: '14 500 ₽' },
    { label: 'Ожидаемый свободный остаток', amount: '900 ₽', highlight: true },
  ],
  reservedNote: RESERVED_NOTE,
  explanationRows: [
    { label: 'Ожидаемые доходы', amount: '+85 000 ₽', kind: 'income' },
    { label: 'Обязательные платежи', amount: '−28 400 ₽', kind: 'expense' },
    { label: 'Цель недели', amount: '−3 000 ₽', kind: 'expense' },
    { label: 'Обычные траты до конца недели', amount: '−50 400 ₽', kind: 'expense' },
    { label: 'Можно спокойно потратить', amount: '3 200 ₽', kind: 'total' },
  ],
  purchaseCheckScenario: {
    amount: 20000,
    name: 'Приставка',
    resultText:
      'Сейчас покупка уведёт неделю глубоко в минус: свободный остаток станет −16 800 ₽, а цель сдвинется примерно на 4 недели.',
    scenarios: [
      { title: 'Купить сейчас', caption: 'Цель сдвинется на 4 недели' },
      { title: 'Купить после зарплаты', caption: 'Цель не пострадает' },
      { title: 'Купить и сократить кафе/такси на 6 000 ₽', caption: 'Риск заметно уменьшится' },
    ],
  },
  actions: [
    {
      title: 'Поставить мягкий лимит на кафе',
      text: 'На кафе и такси ушло на 32% больше обычного. До воскресенья безопасно потратить ещё 1 500 ₽.',
      cta: 'Поставить лимит',
      primary: true,
    },
    {
      title: 'Сдвинуть необязательную покупку',
      text: 'Перенос одной крупной покупки на следующую неделю вернёт план в норму.',
      cta: 'Посмотреть',
    },
    {
      title: 'Проверить регулярные списания',
      text: 'Мы нашли 3 повторяющихся платежа на 1 790 ₽.',
      cta: 'Посмотреть',
    },
  ],
  passionCategory: {
    name: 'Техника и гаджеты',
    intro: PASSION_INTRO,
    monthSpent: '17 200 ₽',
    safeThisWeek: '1 200 ₽',
    warning: 'Если потратишь больше, цель может сдвинуться примерно на 2 недели.',
  },
}

export const STATE_BAD: DemoState = {
  id: 'bad',
  status: 'bad',
  statusLabel: 'Цель под угрозой',
  hero: {
    headline: 'Свободных денег до конца недели пока нет',
    subtitle:
      'Обязательные платежи и обычные траты уже превышают доход недели. Давай аккуратно поправим план.',
  },
  weeklyBudget: { limit: 20000, spent: 21500 },
  freeRemainder: -2600,
  rings: [
    {
      key: 'spending',
      label: 'Траты недели',
      valueText: '21 500 ₽ из 20 000 ₽',
      statusText: 'Перерасход',
      progress: 1,
      color: RING_COLORS.spending,
      hint: 'Недельный безопасный лимит уже превышен.',
    },
    {
      key: 'free',
      label: 'Свободный остаток',
      valueText: 'Прогноз: −2 600 ₽',
      statusText: 'В минусе',
      progress: 0,
      color: RING_COLORS.free,
      hint: 'После обязательных платежей и трат свободных денег пока не остаётся.',
    },
    {
      key: 'goal',
      label: 'Цель',
      valueText: '0 ₽ из 3 000 ₽',
      statusText: 'Шаг недели не сделан',
      progress: 0,
      color: RING_COLORS.goal,
      hint: 'Недельный шаг к жизненной цели.',
    },
  ],
  reservedPayments: [
    { label: 'Обязательные платежи', amount: '18 900 ₽' },
    { label: 'Цель недели', amount: '3 000 ₽' },
    { label: 'Обычные траты до воскресенья', amount: '16 700 ₽' },
    { label: 'Ожидаемый свободный остаток', amount: '−2 600 ₽', highlight: true },
  ],
  reservedNote: RESERVED_NOTE,
  explanationRows: [
    { label: 'Ожидаемые доходы', amount: '+85 000 ₽', kind: 'income' },
    { label: 'Обязательные платежи', amount: '−28 400 ₽', kind: 'expense' },
    { label: 'Цель недели', amount: '−3 000 ₽', kind: 'expense' },
    { label: 'Обычные траты до конца недели', amount: '−56 200 ₽', kind: 'expense' },
    { label: 'Свободный остаток', amount: '−2 600 ₽', kind: 'total' },
  ],
  purchaseCheckScenario: {
    amount: 20000,
    name: 'Приставка',
    resultText:
      'Сейчас покупку лучше перенести: свободного остатка нет, а цель сдвинется примерно на 5 недель.',
    scenarios: [
      { title: 'Перенести покупку', caption: 'Самый безопасный вариант' },
      { title: 'Купить после зарплаты', caption: 'Цель не пострадает' },
      { title: 'Сначала вернуть неделю в норму', caption: 'Сократить кафе/такси на 4 500 ₽' },
    ],
  },
  actions: [
    {
      title: 'Вернуть неделю в норму',
      text: 'Если сократить кафе и такси на 4 500 ₽ до воскресенья, свободный остаток снова станет положительным.',
      cta: 'Показать где',
      primary: true,
    },
    {
      title: 'Сделать шаг к цели мягче',
      text: 'Можно уменьшить шаг недели, чтобы не уходить в минус и не срывать обязательные платежи.',
      cta: 'Сделать мягче',
    },
    {
      title: 'Проверить регулярные списания',
      text: 'Мы нашли 3 повторяющихся платежа на 1 790 ₽.',
      cta: 'Посмотреть',
    },
  ],
  passionCategory: {
    name: 'Техника и гаджеты',
    intro: PASSION_INTRO,
    monthSpent: '19 500 ₽',
    safeThisWeek: '0 ₽',
    warning: 'Сейчас лучше удержать категорию — иначе цель сдвинется на 2–3 недели.',
  },
}

export const DEMO_STATES: Record<StateId, DemoState> = {
  ok: STATE_OK,
  risk: STATE_RISK,
  bad: STATE_BAD,
}

// 👉 Поменяй здесь дефолтное состояние демо (или переключай в UI-баре): 'ok' | 'risk' | 'bad'
export const DEFAULT_STATE: StateId = 'ok'
