// Strips the most common human-readable decorators from numeric strings
// and returns both the numeric value and which transforms were applied.
// Order matters: currency stripping before percent, percent before separators.

import type { CellValue } from '@/types/dataset'

export type ParsedNumber = {
  value: number
  transform: string   // e.g. 'currency+thousands', 'percent', 'none'
}

const CURRENCY_RE = /^[\$€£¥₹₩₦₴₨₪₫฿₿\s]+|[\$€£¥₹₩₦₴₨₪₫฿₿\s]+$/g

// "1,234,567" or "1,234" — strictly three-digit groups after the first block
const THOUSANDS_RE = /^-?\d{1,3}(,\d{3})*(\.\d+)?$/

// "1.234,56" or "1.234.567,89" — European format with dot-thousands, comma-decimal
const EU_FULL_RE = /^-?\d{1,3}(\.\d{3})*,\d+$/

// "1,5" or "12,50" — simple European decimal (1–2 digits after comma)
const EU_SIMPLE_RE = /^-?\d+,\d{1,2}$/

export function tryParseNumeric(raw: CellValue): ParsedNumber | null {
  // Native numbers need no transformation
  if (typeof raw === 'number') {
    return isFinite(raw) ? { value: raw, transform: 'none' } : null
  }

  // Dates and booleans have their own types — never coerce them
  if (raw === null || raw === undefined || raw instanceof Date || typeof raw === 'boolean') {
    return null
  }

  let s = String(raw).trim()
  if (!s) return null

  const transforms: string[] = []

  // Strip leading/trailing currency symbols
  const noC = s.replace(CURRENCY_RE, '').trim()
  if (noC !== s) { s = noC; transforms.push('currency') }

  // Strip accounting negatives: (1,234) → -1234
  const paren = /^\((.+)\)$/.exec(s)
  if (paren) { s = '-' + paren[1]!.trim(); transforms.push('parens') }

  // Strip trailing percent
  if (s.endsWith('%')) { s = s.slice(0, -1).trim(); transforms.push('percent') }

  // Direct parse — handles integers, decimals, scientific notation
  const direct = Number(s)
  if (s !== '' && isFinite(direct)) {
    return { value: direct, transform: transforms.join('+') || 'none' }
  }

  // US thousands separator: "1,234,567"
  if (THOUSANDS_RE.test(s)) {
    const n = Number(s.replace(/,/g, ''))
    if (isFinite(n)) {
      return { value: n, transform: [...transforms, 'thousands'].join('+') }
    }
  }

  // European full: "1.234,56"
  if (EU_FULL_RE.test(s)) {
    const n = Number(s.replace(/\./g, '').replace(',', '.'))
    if (isFinite(n)) {
      return { value: n, transform: [...transforms, 'european'].join('+') }
    }
  }

  // European simple: "1,5"
  if (EU_SIMPLE_RE.test(s)) {
    const n = Number(s.replace(',', '.'))
    if (isFinite(n)) {
      return { value: n, transform: [...transforms, 'european'].join('+') }
    }
  }

  return null
}
