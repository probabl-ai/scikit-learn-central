/**
 * Format an ISO timestamp as a short human-readable relative phrase
 * ("3 weeks ago", "yesterday"). Returns null for missing/invalid input.
 *
 * Granularity tuned for catalog use: surface activity at week/month
 * granularity — older than ~2 years we just print the year.
 */
export function relativeTime(iso: string | null | undefined): string | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  const diffMs = Date.now() - t
  if (diffMs < 0) return 'in the future'

  const SECOND = 1000
  const MINUTE = 60 * SECOND
  const HOUR = 60 * MINUTE
  const DAY = 24 * HOUR
  const WEEK = 7 * DAY
  const MONTH = 30 * DAY
  const YEAR = 365 * DAY

  if (diffMs < MINUTE) return 'just now'
  if (diffMs < HOUR) {
    const n = Math.floor(diffMs / MINUTE)
    return `${n} min ago`
  }
  if (diffMs < DAY) {
    const n = Math.floor(diffMs / HOUR)
    return `${n} hour${n === 1 ? '' : 's'} ago`
  }
  if (diffMs < 2 * DAY) return 'yesterday'
  if (diffMs < WEEK) {
    const n = Math.floor(diffMs / DAY)
    return `${n} days ago`
  }
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
