const MS_PER_DAY = 24 * 60 * 60 * 1000

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function toISO(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return toISO(d)
}

/** Whole-day difference a − b. */
export function differenceInCalendarDays(a: string, b: string): number {
  return Math.round((parseISO(a).getTime() - parseISO(b).getTime()) / MS_PER_DAY)
}

export function isWithin(dateISO: string, startISO: string, endISO: string): boolean {
  const t = parseISO(dateISO).getTime()
  return t >= parseISO(startISO).getTime() && t <= parseISO(endISO).getTime()
}

/** Fractional weeks between two ISO dates (to − from). */
export function weeksBetween(fromISO: string, toISODate: string): number {
  return differenceInCalendarDays(toISODate, fromISO) / 7
}

/** Whole months between two ISO dates, at least 1. */
export function monthsBetween(fromISO: string, toISODate: string): number {
  return Math.max(1, Math.round(weeksBetween(fromISO, toISODate) / 4.345))
}

/** "DD.MM.YYYY" → "YYYY-MM-DD" (bank-statement date format). */
export function ddmmyyyyToISO(s: string): string {
  const [d, m, y] = s.trim().split('.')
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}
