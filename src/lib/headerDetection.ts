import type { CellValue } from '@/types/dataset'

function isString(v: CellValue): v is string {
  return typeof v === 'string'
}

function isDataValue(v: CellValue): boolean {
  return typeof v === 'number' || v instanceof Date || typeof v === 'boolean'
}

// Scans the first 20 rows to find the header row.
// A row qualifies when:
//  1. Every non-empty cell is a string (no numbers / dates / booleans mixed in)
//  2. At least two cells are non-empty strings (title rows often have just one)
//  3. The row directly below contains at least one number, date, or boolean
// Falls back to row 0 if no candidate is found.
export function detectHeaderRow(rows: CellValue[][]): number {
  const scanLimit = Math.min(20, rows.length - 1)

  for (let i = 0; i < scanLimit; i++) {
    const row = rows[i]!
    const nextRow = rows[i + 1]!

    const nonEmpty = row.filter((v) => v !== null && v !== undefined && v !== '')
    if (nonEmpty.length < 2) continue
    if (!nonEmpty.every(isString)) continue
    if (nextRow.some(isDataValue)) return i
  }

  return 0
}
