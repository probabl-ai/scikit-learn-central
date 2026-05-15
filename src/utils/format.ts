const UTC_MONTH_ABBREV = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

/** UTC calendar date `YYYY-MM-DD`, or null if missing/invalid. */
export function formatReleaseDateCompact(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

/** UTC calendar date as `Jan 15, 2026` (three-letter month), or null if missing/invalid. */
export function formatReleaseDateLong(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const y = d.getUTCFullYear()
  const mo = d.getUTCMonth()
  const day = d.getUTCDate()
  return `${UTC_MONTH_ABBREV[mo]} ${day}, ${y}`
}

/** Compact number formatter: 1500 → "1.5K", 2_000_000 → "2M". */
export function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}
