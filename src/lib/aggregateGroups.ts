import type { CellValue } from '@/types/dataset'
import type { Aggregation } from '@/types/chart'
import type { ColumnProfile } from '@/types/profile'

export function colIndex(name: string, profiles: ColumnProfile[]): number {
  return profiles.findIndex((p) => p.name === name)
}

function toNumber(v: CellValue): number | null {
  if (typeof v === 'number') return v
  if (v instanceof Date) return v.getTime()
  return null
}

function sortedMedian(nums: number[]): number {
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!
}

export function aggregateValues(values: number[], agg: Aggregation): number {
  if (values.length === 0) return 0
  switch (agg) {
    case 'none':
    case 'sum':
      return values.reduce((a, b) => a + b, 0)
    case 'mean':
      return values.reduce((a, b) => a + b, 0) / values.length
    case 'count':
      return values.length
    case 'min':
      return Math.min(...values)
    case 'max':
      return Math.max(...values)
    case 'median':
      return sortedMedian(values)
  }
}

// Extract numeric Y values from a column, dropping nulls
export function extractY(rows: CellValue[][], colIdx: number): number[] {
  const out: number[] = []
  for (const row of rows) {
    const n = toNumber(row[colIdx] ?? null)
    if (n !== null) out.push(n)
  }
  return out
}

// Group rows by the value at xColIndex, returning Map<xValue, rows>
export function groupRowsByX(
  rows: CellValue[][],
  xColIdx: number,
): Map<CellValue, CellValue[][]> {
  const groups = new Map<CellValue, CellValue[][]>()
  for (const row of rows) {
    const xVal = row[xColIdx] ?? null
    if (!groups.has(xVal)) groups.set(xVal, [])
    groups.get(xVal)!.push(row)
  }
  return groups
}

// Build XY points for a single Y column from pre-grouped data
export function buildXYFromGroups(
  groups: Map<CellValue, CellValue[][]>,
  yColIdx: number,
  agg: Aggregation,
): Array<{ x: CellValue; y: number }> {
  const points: Array<{ x: CellValue; y: number }> = []
  for (const [xVal, groupRows] of groups) {
    if (agg === 'count') {
      points.push({ x: xVal, y: groupRows.length })
    } else {
      const yVals = extractY(groupRows, yColIdx)
      if (yVals.length === 0) continue
      points.push({ x: xVal, y: aggregateValues(yVals, agg) })
    }
  }
  return points
}

// Sort XY points by x — dates and numbers numerically, strings lexically
export function sortPoints(
  points: Array<{ x: CellValue; y: number }>,
): Array<{ x: CellValue; y: number }> {
  return [...points].sort((a, b) => {
    if (a.x instanceof Date && b.x instanceof Date) return a.x.getTime() - b.x.getTime()
    if (typeof a.x === 'number' && typeof b.x === 'number') return a.x - b.x
    return String(a.x ?? '').localeCompare(String(b.x ?? ''))
  })
}
