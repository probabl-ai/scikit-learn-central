/** Known taxonomy slugs for published use cases (derived from data/use-cases/). */

export const APPLICATION_FIELDS = [
  'banking',
  'e-commerce',
  'insurance',
  'marketing',
  'real-estate',
  'retail',
] as const

export const PROBLEM_TYPES = [
  'anomaly-detection',
  'classification',
  'fraud-detection',
  'nlp',
  'price-optimization',
  'regression',
  'sentiment-analysis',
] as const

export const DATA_TYPES = ['tabular', 'text'] as const

export type ApplicationField = (typeof APPLICATION_FIELDS)[number]
export type ProblemType = (typeof PROBLEM_TYPES)[number]
export type DataType = (typeof DATA_TYPES)[number]

export type TaxonomyDimension = 'application-field' | 'problem-type' | 'data-type'

const APPLICATION_FIELD_SET = new Set<string>(APPLICATION_FIELDS)
const PROBLEM_TYPE_SET = new Set<string>(PROBLEM_TYPES)
const DATA_TYPE_SET = new Set<string>(DATA_TYPES)

const LABEL_OVERRIDES: Record<string, string> = {
  'e-commerce': 'E-Commerce',
  'real-estate': 'Real Estate',
  'hr': 'HR / People',
  'hpo-automl': 'HPO / AutoML',
  nlp: 'NLP',
}

export function humanizeTaxonomyValue(slug: string): string {
  if (LABEL_OVERRIDES[slug]) return LABEL_OVERRIDES[slug]
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function filterKnownApplicationFields(values: string[]): ApplicationField[] {
  return values.filter((v): v is ApplicationField => APPLICATION_FIELD_SET.has(v))
}

export function filterKnownProblemTypes(values: string[]): ProblemType[] {
  return values.filter((v): v is ProblemType => PROBLEM_TYPE_SET.has(v))
}

export function filterKnownDataTypes(values: string[]): DataType[] {
  return values.filter((v): v is DataType => DATA_TYPE_SET.has(v))
}

export function formatKnownList<T extends string>(
  values: string[],
  filter: (v: string[]) => T[],
): string {
  const known = filter(values)
  return known.length ? known.map((v) => humanizeTaxonomyValue(v)).join(', ') : '—'
}

export const DIFFICULTY_ORDER = ['beginner', 'intermediate', 'advanced'] as const

export function difficultyRank(d: string): number {
  const i = DIFFICULTY_ORDER.indexOf(d as (typeof DIFFICULTY_ORDER)[number])
  return i === -1 ? DIFFICULTY_ORDER.length : i
}
