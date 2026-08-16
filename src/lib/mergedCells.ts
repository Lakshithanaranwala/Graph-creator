import type { CellValue } from '@/types/dataset'

// Matches XLSX.Range without importing the xlsx package here,
// keeping this function pure and testable without a workbook fixture.
export type MergeRange = {
  s: { r: number; c: number }
  e: { r: number; c: number }
}

// Fills secondary cells of every merged region with the top-left value.
// SheetJS leaves secondary cells empty; without this, header detection
// and column naming treat them as blank columns.
export function expandMerges(rows: CellValue[][], merges: MergeRange[]): CellValue[][] {
  if (merges.length === 0) return rows

  const result = rows.map((row) => [...row])

  for (const { s, e } of merges) {
    const value = result[s.r]?.[s.c] ?? null
    for (let r = s.r; r <= e.r; r++) {
      for (let c = s.c; c <= e.c; c++) {
        if (r === s.r && c === s.c) continue
        const row = result[r]
        if (row) row[c] = value
      }
    }
  }

  return result
}
