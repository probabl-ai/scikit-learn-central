/** Format an ISO timestamp as a short human phrase ("3 weeks ago", "yesterday").
 *  Returns null for missing/invalid input. Tuned for catalog use — past 2 years
 *  we just print the year. */
export function relativeTime(iso: string | null | undefined): string | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  const diffMs = Date.now() - t
  if (diffMs < 0) return 'in the future'

  const MINUTE = 60_000
  const HOUR = 60 * MINUTE
  const DAY = 24 * HOUR
  const WEEK = 7 * DAY
  const MONTH = 30 * DAY
  const YEAR = 365 * DAY

  if (diffMs < MINUTE) return 'just now'
  if (diffMs < HOUR) return `${Math.floor(diffMs / MINUTE)} min ago`
  if (diffMs < DAY) {
    const n = Math.floor(diffMs / HOUR)
    return `${n} hour${n === 1 ? '' : 's'} ago`
  }
  if (diffMs < 2 * DAY) return 'yesterday'
  if (diffMs < WEEK) return `${Math.floor(diffMs / DAY)} days ago`
  if (diffMs < MONTH) {
    const n = Math.floor(diffMs / WEEK)
    return `${n} week${n === 1 ? '' : 's'} ago`
  }
  if (diffMs < YEAR) {
    const n = Math.floor(diffMs / MONTH)
    return `${n} month${n === 1 ? '' : 's'} ago`
  }
  if (diffMs < 2 * YEAR) return 'last year'
  return new Date(iso).getFullYear().toString()
}
