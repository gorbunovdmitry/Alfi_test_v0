function group(n: number): string {
  return Math.abs(Math.round(n))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/** "10 300 ₽", "−1 200 ₽" */
export function formatRub(amount: number): string {
  const r = Math.round(amount)
  return `${r < 0 ? '−' : ''}${group(r)} ₽`
}

/** Always shows a sign for non-zero: "+2 000 ₽", "0 ₽", "−500 ₽" */
export function formatSignedRub(amount: number): string {
  const r = Math.round(amount)
  const sign = r > 0 ? '+' : r < 0 ? '−' : ''
  return `${sign}${group(r)} ₽`
}

/** "160 000" without currency. */
export function formatNumber(amount: number): string {
  return group(amount)
}

/** Russian plural: pluralRu(3, ['день','дня','дней']) → 'дня' */
export function pluralRu(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100
  const n1 = abs % 10
  if (abs > 10 && abs < 20) return forms[2]
  if (n1 > 1 && n1 < 5) return forms[1]
  if (n1 === 1) return forms[0]
  return forms[2]
}
