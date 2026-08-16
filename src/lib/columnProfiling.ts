import type { CellValue, ColumnProfile, ColumnType } from '@/types/dataset'

// Converts 0 → 'A', 1 → 'B', 26 → 'AA' (Excel column letter notation).
function toColumnLetter(index: number): string {
  let result = ''
  let n = index
  while (n >= 0) {
    result = String.fromCharCode(65 + (n % 26)) + result
    n = Math.floor(n / 26) - 1
  }
  return result
}

export function buildColumnName(cell: CellValue, index: number): string {
  const str = cell !== null && cell !== '' ? String(cell).trim() : ''
  return str || `Column ${toColumnLetter(index)}`
}

// Disambiguates duplicate names by appending _2, _3, … to later occurrences.
export function buildColumnNames(headerRow: CellValue[]): string[] {
  const seen = new Map<string, number>()
  return headerRow.map((cell, i) => {
    const base = buildColumnName(cell, i)
    const count = (seen.get(base) ?? 0) + 1
    seen.set(base, count)
    return count === 1 ? base : `${base}_${count}`
  })
}

function cellType(v: CellValue): ColumnType {
  if (v instanceof Date) return 'date'
  if (typeof v === 'boolean') return 'boolean'
  if (typeof v === 'number') return 'number'
  return 'string'
}

export function profileColumn(values: CellValue[], name: string, originalIndex: number): ColumnProfile {
  const nonNull = values.filter((v) => v !== null && v !== undefined)
  const nullCount = values.length - nonNull.length
  const types = new Set(nonNull.map(cellType))

  let type: ColumnType
  if (types.size === 0) type = 'string'
  else if (types.size === 1) type = [...types][0]!
  else type = 'mixed'

  return { name, originalIndex, type, nullCount, rowCount: values.length }
}

export function profileColumns(rawRows: CellValue[][], headerRowIndex: number): ColumnProfile[] {
  const header = rawRows[headerRowIndex] ?? []
  const dataRows = rawRows.slice(headerRowIndex + 1)
  const names = buildColumnNames(header)

  return names.map((name, i) => {
    const values = dataRows.map((row) => row[i] ?? null)
    return profileColumn(values, name, i)
  })
}
