import type { CellValue } from '@/types/dataset'
import type { Filter } from '@/types/chart'
import type { ColumnProfile } from '@/types/profile'

function toNumber(v: CellValue): number | null {
  if (typeof v === 'number') return v
  if (v instanceof Date) return v.getTime()
  return null
}

function applyFilter(value: CellValue, op: string, filterValue: unknown): boolean {
  switch (op) {
    case 'is null':
      return value === null || value === undefined || value === ''
    case 'is not null':
      return value !== null && value !== undefined && value !== ''
    case '=':
      return String(value) === String(filterValue)
    case '!=':
      return String(value) !== String(filterValue)
    case 'contains':
      return String(value ?? '').toLowerCase().includes(String(filterValue).toLowerCase())
    case 'not contains':
      return !String(value ?? '').toLowerCase().includes(String(filterValue).toLowerCase())
    case '<':
    case '<=':
    case '>':
    case '>=': {
      const n = toNumber(value)
      const fv = Number(filterValue)
      if (n === null || isNaN(fv)) return false
      if (op === '<') return n < fv
      if (op === '<=') return n <= fv
      if (op === '>') return n > fv
      return n >= fv
    }
    default:
      return true
  }
}

export function filterRows(
  rows: CellValue[][],
  headerRowIndex: number,
  filters: Filter[],
  profiles: ColumnProfile[],
): CellValue[][] {
  const dataRows = rows.slice(headerRowIndex + 1)
  if (filters.length === 0) return dataRows

  const indexed = filters.map((f) => ({
    filter: f,
    colIndex: profiles.findIndex((p) => p.name === f.column),
  }))

  return dataRows.filter((row) =>
    indexed.every(({ filter, colIndex }) => {
      if (colIndex === -1) return true
      return applyFilter(row[colIndex] ?? null, filter.op, filter.value)
    }),
  )
}
