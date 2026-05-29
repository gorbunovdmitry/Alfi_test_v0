// Parses a bank-statement CSV (the user's sheet format) into typed rows.
// Columns: Дата операции, Дата проводки, Код, Категория, Описание, Сумма в руб, Статус

export type StatementRow = {
  operationDate: string // DD.MM.YYYY
  postingDate: string // DD.MM.YYYY
  code: string
  category: string
  description: string
  amount: number // signed RUB (negative = expense)
  status: string
}

/** Minimal RFC-4180-ish CSV tokenizer: handles quoted fields, escaped quotes, CRLF. */
function tokenize(text: string): string[][] {
  const rows: string[][] = []
  let field = ''
  let row: string[] = []
  let inQuotes = false
  let i = 0
  const endField = () => {
    row.push(field)
    field = ''
  }
  const endRow = () => {
    rows.push(row)
    row = []
  }
  while (i < text.length) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i += 1
        continue
      }
      field += c
      i += 1
      continue
    }
    if (c === '"') {
      inQuotes = true
      i += 1
      continue
    }
    if (c === ',') {
      endField()
      i += 1
      continue
    }
    if (c === '\n') {
      endField()
      endRow()
      i += 1
      continue
    }
    if (c === '\r') {
      i += 1
      continue
    }
    field += c
    i += 1
  }
  if (field.length > 0 || row.length > 0) {
    endField()
    endRow()
  }
  return rows
}

/** "−1 500,00" / "120 000,00" → number (handles spaces, nbsp, decimal comma). */
export function parseAmount(raw: string): number {
  const cleaned = raw
    .replace(/[\s  ]/g, '')
    .replace(',', '.')
    .replace(/[−–—]/g, '-') // normalize unicode minus/dashes
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}

export function parseStatement(csv: string): StatementRow[] {
  const rows = tokenize(csv)
  return rows
    .slice(1) // drop header
    .filter((r) => r.length >= 7 && r[0].trim() !== '')
    .map((r) => ({
      operationDate: r[0].trim(),
      postingDate: r[1].trim(),
      code: r[2].trim(),
      category: r[3].trim(),
      description: r[4].trim(),
      amount: parseAmount(r[5]),
      status: r[6].trim(),
    }))
}
