import { describe, it, expect } from 'vitest'
import { expandMerges } from '@/lib/mergedCells'
import type { CellValue } from '@/types/dataset'

describe('expandMerges', () => {
  it('propagates a horizontally merged header value to secondary cells', () => {
    // A1:C1 merged containing "Revenue". B1 and C1 are null after sheet_to_json.
    const rows: CellValue[][] = [
      ['Revenue', null, null],
      [100, 200, 300],
    ]
    const result = expandMerges(rows, [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
    ])
    expect(result[0]).toEqual(['Revenue', 'Revenue', 'Revenue'])
    // Data rows must be unchanged
    expect(result[1]).toEqual([100, 200, 300])
  })

  it('propagates a vertically merged cell value downward', () => {
    const rows: CellValue[][] = [
      ['Category', null],
      ['A', 'B'],
    ]
    const result = expandMerges(rows, [
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },
    ])
    expect(result[0]![0]).toBe('Category')
    expect(result[1]![0]).toBe('Category')
  })

  it('does not mutate the original rows array', () => {
    const rows: CellValue[][] = [['X', null]]
    expandMerges(rows, [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }])
    expect(rows[0]![1]).toBeNull()
  })

  it('is a no-op when there are no merges', () => {
    const rows: CellValue[][] = [['A', 'B'], [1, 2]]
    const result = expandMerges(rows, [])
    expect(result).toEqual(rows)
  })
})
