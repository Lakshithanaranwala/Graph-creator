import { tryParseNumeric } from '@/lib/numericParser'
import type { CellValue } from '@/types/dataset'
import type { InferredType } from '@/types/profile'

// Known boolean pairs — matched case-insensitively
const BOOL_PAIRS: Array<ReadonlySet<string>> = [
  new Set(['true', 'false']),
  new Set(['yes', 'no']),
  new Set(['y', 'n']),
  new Set(['1', '0']),
]

export type InferenceResult = {
  type: InferredType
  confidence: number
  numericTransform?: string
  temporalFormat?: string
}

// Returns the date format name if v looks like a date string, or 'native' for Date objects.
export function getDateFormat(v: CellValue): string | null {
  if (v instanceof Date) return 'native'
  if (typeof v !== 'string') return null
  const s = v.trim()
  // ISO 8601: 2024-01-15 or 2024-01-15T10:30
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/.test(s)) return 'ISO'
  // MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) return 'MM/DD/YYYY'
  // DD.MM.YYYY
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(s)) return 'DD.MM.YYYY'
  // DD-MM-YYYY (4-digit year last avoids confusion with ISO)
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(s)) return 'DD-MM-YYYY'
  return null
}

function dominantTransform(parseResults: Array<{ transform: string } | null>): string {
  const counts = new Map<string, number>()
  for (const r of parseResults) {
    if (r) counts.set(r.transform, (counts.get(r.transform) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'none'
}

// Decides the type of a column from a sample of its non-null values.
// `distinctCount` is the full-dataset distinct count, not just the sample.
export function inferColumnType(
  nonNullSample: CellValue[],
  distinctCount: number,
): InferenceResult {
  const n = nonNullSample.length

  if (n === 0) return { type: 'empty', confidence: 1.0 }

  // Boolean: the distinct set must exactly match a known pair
  if (distinctCount <= 2) {
    const lower = new Set(nonNullSample.map((v) => String(v).toLowerCase().trim()))
    for (const pair of BOOL_PAIRS) {
      if (lower.size >= 1 && [...lower].every((v) => pair.has(v))) {
        return { type: 'boolean', confidence: 1.0 }
      }
    }
  }

  // Temporal: ≥80% of sample values parse as recognisable dates
  let dateCount = 0
  let firstFmt = ''
  for (const v of nonNullSample) {
    const fmt = getDateFormat(v)
    if (fmt) { dateCount++; if (!firstFmt) firstFmt = fmt }
  }
  const dateRatio = dateCount / n
  if (dateRatio >= 0.8) {
    return {
      type: 'temporal',
      confidence: Math.min(0.97, 0.72 + dateRatio * 0.25),
      temporalFormat: firstFmt,
    }
  }

  // Numeric: ≥90% parse as finite numbers after cleaning
  const parsed = nonNullSample.map(tryParseNumeric)
  const numericRatio = parsed.filter(Boolean).length / n

  if (numericRatio >= 0.9) {
    const transform = dominantTransform(parsed)

    // Low-cardinality numeric almost always encodes a category (e.g. survey ratings 1–5).
    // Only downgrade when there are clearly more rows than distinct values (> 2:1 ratio)
    // so we don't misclassify a small numeric dataset (10 rows, 10 distinct values).
    if (distinctCount <= 12 && n > distinctCount * 2) {
      return { type: 'categorical', confidence: 0.72, numericTransform: transform }
    }

    return {
      type: 'numeric',
      confidence: numericRatio >= 0.99 ? 0.97 : 0.85,
      numericTransform: transform,
    }
  }

  // Mixed: a meaningful fraction could be parsed as numbers but not enough for numeric
  if (numericRatio > 0.1 && numericRatio < 0.9) {
    return { type: 'mixed', confidence: 0.3 + numericRatio * 0.2 }
  }

  // Default: categorical (strings, codes, labels)
  return { type: 'categorical', confidence: 0.85 }
}
