import type { CellValue } from '@/types/dataset'

function isEmpty(v: CellValue): boolean {
  return v === null || v === undefined || v === ''
}

// Removes trailing all-empty rows from the bottom of the sheet.
export function trimEmptyRows(rows: CellValue[][]): CellValue[][] {
  let last = rows.length - 1
  while (last >= 0 && rows[last]!.every(isEmpty)) last--
  return rows.slice(0, last + 1)
}

// Removes trailing all-empty columns from the right of the sheet.
export function trimEmptyColumns(rows: CellValue[][]): CellValue[][] {
  if (rows.length === 0) return rows

  const width = Math.max(...rows.map((r) => r.length))
  let last = width - 1
  while (last >= 0 && rows.every((row) => isEmpty(row[last]!))) last--

  if (last < 0) return rows.map(() => [])
  return rows.map((row) => row.slice(0, last + 1))
}
