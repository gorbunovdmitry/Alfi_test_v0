// Deterministic generator for a synthetic Alfa-Bank statement (May 2026).
// Output: src/data/transactions.may2026.csv — exact 7-column format of the user's sheet:
//   Дата операции, Дата проводки, Код, Категория, Описание, Сумма в руб, Статус
// Run: node scripts/generate-statement.mjs
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../src/data/transactions.may2026.csv')

const HEADER = ['Дата операции', 'Дата проводки', 'Код', 'Категория', 'Описание', 'Сумма в руб', 'Статус']

const MCC = {
  'Супермаркеты': '5411',
  'Рестораны и кафе': '5812',
  'Маркетплейсы': '5399',
  'Транспорт': '4121',
  'Развлечения': '7832',
  'Одежда и обувь': '5651',
  'Здоровье и аптеки': '5912',
  'Связь и интернет': '4814',
  'Прочее': '5999',
  'Коммунальные платежи': '4900',
}

const MERCH = {
  'Супермаркеты': ['ВкусВилл', 'Перекрёсток', 'Пятёрочка', 'Магнит', 'Лента', 'Азбука Вкуса'],
  'Рестораны и кафе': ['Шоколадница', 'Додо Пицца', 'Тануки', 'Surf Coffee', 'Кофикс', 'Вкусно — и точка'],
  'Маркетплейсы': ['OZON', 'Wildberries', 'Яндекс Маркет'],
  'Транспорт': ['Яндекс Такси', 'Метро Москвы', 'Whoosh', 'Ситимобил', 'АЗС Лукойл'],
  'Развлечения': ['Кинотеатр Поклонка', 'Okko', 'Стендап Клуб', 'Боулинг Космик'],
  'Одежда и обувь': ['Lamoda', 'Uniqlo', 'Спортмастер'],
  'Здоровье и аптеки': ['Аптека Ригла', 'Инвитро', 'Аптека Здоровье'],
  'Прочее': ['Цветы Рив Гош', 'Подарки', 'Хозтовары'],
}

const AMOUNTS = {
  'Супермаркеты': [650, 820, 1100, 1450, 540, 980, 1230],
  'Рестораны и кафе': [320, 540, 780, 1200, 450, 690],
  'Маркетплейсы': [760, 990, 1500, 2300],
  'Транспорт': [180, 250, 350, 420, 1600],
  'Развлечения': [600, 900, 1200],
  'Одежда и обувь': [1900, 2500, 3200],
  'Здоровье и аптеки': [430, 760, 1250],
  'Прочее': [500, 800, 1300],
}

const rows = []
const dt = (d) => `${String(d).padStart(2, '0')}.05.2026`
const pick = (arr, i) => arr[i % arr.length]

function push(opDay, postDay, code, category, desc, amount, status = 'Проведена') {
  rows.push({
    op: typeof opDay === 'string' ? opDay : dt(opDay),
    post: typeof postDay === 'string' ? postDay : dt(postDay),
    code,
    category,
    desc,
    amount,
    status,
  })
}

// --- Income ---
push(1, 1, 'SAL', 'Зарплата', 'Зарплата ООО «Технополис»', 120000)
push(15, 15, 'CB', 'Пополнения', 'Кэшбэк за апрель', 740)

// --- Regular / obligatory across the month ---
push(10, 10, '4814', 'Связь и интернет', 'МТС, мобильная связь', -650)
push(12, 12, '4900', 'Коммунальные платежи', 'Дом.ру, интернет', -700)

// --- Savings / goal contributions in earlier weeks (realism; not in current week) ---
push(5, 5, 'SAV', 'Накопления', 'Пополнение накопительного счёта', -1500)
push(12, 12, 'SAV', 'Накопления', 'Пополнение накопительного счёта', -1500)
push(13, 13, 'INV', 'Накопления', 'Инвесткопилка', -500)
push(19, 19, 'SAV', 'Накопления', 'Пополнение накопительного счёта', -1500)
push(8, 8, 'GOAL', 'Накопления', 'Цель «Ноутбук»', -4000)
push(20, 20, 'GOAL', 'Накопления', 'Цель «Ноутбук»', -3000)

// --- Everyday spending, days 1..25 (deterministic spread, 2–4 ops/day) ---
const catCycle = [
  'Супермаркеты', 'Транспорт', 'Рестораны и кафе', 'Супермаркеты', 'Маркетплейсы',
  'Транспорт', 'Рестораны и кафе', 'Здоровье и аптеки', 'Супермаркеты', 'Развлечения',
  'Транспорт', 'Прочее', 'Одежда и обувь', 'Супермаркеты', 'Рестораны и кафе',
]
let cur = 0
for (let day = 1; day <= 25; day++) {
  const n = 2 + (day % 3) // 2..4 ops per day
  for (let j = 0; j < n; j++) {
    const cat = catCycle[cur % catCycle.length]
    cur += 1
    const merch = pick(MERCH[cat], day + j)
    const amount = pick(AMOUNTS[cat], day * 2 + j)
    push(day, day, MCC[cat] ?? '5999', cat, merch, -amount)
  }
}
// a couple of larger discretionary buys mid-month
push(9, 9, '5651', 'Одежда и обувь', 'Uniqlo', -2500)
push(17, 17, '5399', 'Маркетплейсы', 'OZON', -2300)
push(22, 22, '7832', 'Развлечения', 'Okko, подписка', -399)

// --- Current week (26.05–01.06) — composed to reproduce the demo figures ---
// Manageable spend = 10 300 ₽: groceries 2800, restaurants 1900, marketplaces 3200, transport 1100,
// subscriptions 700, other 600.
push(26, 26, '5411', 'Супермаркеты', 'ВкусВилл', -1500)
push(28, 28, '5411', 'Супермаркеты', 'Перекрёсток', -1300)
push(27, 27, '5812', 'Рестораны и кафе', 'Шоколадница', -900)
push(29, 29, '5812', 'Рестораны и кафе', 'Додо Пицца', -1000)
push(28, 28, '5399', 'Маркетплейсы', 'OZON', -2000)
push(30, 30, '5399', 'Маркетплейсы', 'Wildberries', -1200)
push(26, 26, '4121', 'Транспорт', 'Яндекс Такси', -350)
push(28, 28, '4111', 'Транспорт', 'Метро Москвы', -250)
push(30, 30, '4121', 'Транспорт', 'Яндекс Такси', -500)
push(27, 27, '4814', 'Связь и интернет', 'Яндекс Плюс, подписка', -700)
push(29, 29, '5999', 'Прочее', 'Цветы Рив Гош', -600)

// Savings ring this week: +2 000 ₽ (накопительный 1500 + инвесткопилка 500)
push(27, 27, 'SAV', 'Накопления', 'Пополнение накопительного счёта', -1500)
push(28, 28, 'INV', 'Накопления', 'Инвесткопилка', -500)

// Goal ring this week: 5 000 ₽
push(28, 28, 'GOAL', 'Накопления', 'Цель «Ноутбук»', -5000)

// Obligatory this week: 12 400 ₽ (ЖКХ 4200 + кредит 8200)
push(26, 26, '4900', 'Коммунальные платежи', 'ЖКХ, ЕИРЦ', -4200)
push(27, 27, 'CRED', 'Кредит', 'Платёж по кредитной карте', -8200)

// Internal transfer — excluded everywhere
push(26, 26, 'C2C', 'Переводы', 'Перевод между своими счетами', -10000)

// One pending op in the current week (shows status variety; excluded from completed totals)
push('01.06.2026', '01.06.2026', '5411', 'Супермаркеты', 'Лента', -650, 'В обработке')

// --- Serialize to CSV ---
const needsQuote = (s) => /[",\n]/.test(s)
const cell = (v) => {
  const s = String(v)
  return needsQuote(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const fmtAmount = (n) => {
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  const grouped = abs.toLocaleString('ru-RU').replace(/ /g, ' ').replace(/,/g, ' ')
  return `"${sign}${grouped},00"` // always quoted (decimal comma)
}

const lines = [HEADER.map(cell).join(',')]
for (const r of rows) {
  lines.push([cell(r.op), cell(r.post), cell(r.code), cell(r.category), cell(r.desc), fmtAmount(r.amount), cell(r.status)].join(','))
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, lines.join('\n') + '\n', 'utf-8')

// --- Self-check: current week (26.05–01.06) composition ---
const inCurrentWeek = (op) => {
  const [d, m] = op.split('.').map(Number)
  return (m === 5 && d >= 26) || (m === 6 && d === 1)
}
const manageableCats = ['Супермаркеты', 'Рестораны и кафе', 'Маркетплейсы', 'Транспорт', 'Связь и интернет', 'Развлечения', 'Одежда и обувь', 'Здоровье и аптеки', 'Прочее']
let manageable = 0, savings = 0, goal = 0, obligatory = 0
for (const r of rows) {
  if (!inCurrentWeek(r.op) || r.status !== 'Проведена') continue
  if (r.category === 'Накопления') {
    if (r.desc.includes('Цель')) goal += -r.amount
    else savings += -r.amount
  } else if (r.category === 'Коммунальные платежи' || r.category === 'Кредит') {
    obligatory += -r.amount
  } else if (manageableCats.includes(r.category) && r.amount < 0) {
    manageable += -r.amount
  }
}
console.log(`Rows: ${rows.length}`)
console.log(`Current-week manageable: ${manageable} (expect 10300)`)
console.log(`Current-week savings: ${savings} (expect 2000)`)
console.log(`Current-week goal: ${goal} (expect 5000)`)
console.log(`Current-week obligatory: ${obligatory} (expect 12400)`)
console.log(`Written: ${OUT}`)
