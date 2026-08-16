import { describe, it, expect } from 'vitest'
import { filterRows } from '@/lib/filterRows'
import type { CellValue } from '@/types/dataset'
import type { Filter } from '@/types/chart'
import type { ColumnProfile } from '@/types/profile'

function makeProfile(name: string, index: number, type: ColumnProfile['inferredType'] = 'categorical'): ColumnProfile {
  return {
    name,
    index,
    inferredType: type,
    confidence: 0.9,
    nullCount: 0,
    nullRatio: 0,
    distinctCount: 10,
    isHighCardinality: false,
    isLikelyId: false,
    sampleValues: [],
  }
}

const PROFILES = [
  makeProfile('Name', 0, 'categorical'),
  makeProfile('Score', 1, 'numeric'),
  makeProfile('Active', 2, 'boolean'),
]

// rows: header at index 0, data at 1+
const HEADER_IDX = 0

const ROWS: CellValue[][] = [
  ['Name', 'Score', 'Active'],
  ['Alice', 90, true],
  ['Bob', 75, false],
  ['Carol', 85, true],
  ['Dave', null, false],
]

describe('filterRows', () => {
  it('returns all data rows when no filters', () => {
    const result = filterRows(ROWS, HEADER_IDX, [], PROFILES)
    expect(result).toHaveLength(4)
  })

  it('op: = on categorical', () => {
    const filters: Filter[] = [{ column: 'Name', op: '=', value: 'Alice' }]
    const result = filterRows(ROWS, HEADER_IDX, filters, PROFILES)
    expect(result).toHaveLength(1)
    expect(result[0]![0]).toBe('Alice')
  })

  it('op: != on categorical', () => {
    const filters: Filter[] = [{ column: 'Name', op: '!=', value: 'Alice' }]
    const result = filterRows(ROWS, HEADER_IDX, filters, PROFILES)
    expect(result).toHaveLength(3)
  })

  it('op: contains (case-insensitive)', () => {
    // 'o' appears in Bob and Carol
    const filters: Filter[] = [{ column: 'Name', op: 'contains', value: 'o' }]
    const result = filterRows(ROWS, HEADER_IDX, filters, PROFILES)
    expect(result).toHaveLength(2)
    const names = result.map((r) => r[0])
    expect(names).toContain('Bob')
    expect(names).toContain('Carol')
  })

  it('op: not contains', () => {
    const filters: Filter[] = [{ column: 'Name', op: 'not contains', value: 'a' }]
    const result = filterRows(ROWS, HEADER_IDX, filters, PROFILES)
    // Bob and Dave don't contain 'a'
    expect(result.every((r) => !String(r[0]).toLowerCase().includes('a'))).toBe(true)
  })

  it('op: > on numeric', () => {
    const filters: Filter[] = [{ column: 'Score', op: '>', value: 80 }]
    const result = filterRows(ROWS, HEADER_IDX, filters, PROFILES)
    expect(result).toHaveLength(2) // Alice (90), Carol (85)
  })

  it('op: <= on numeric', () => {
    const filters: Filter[] = [{ column: 'Score', op: '<=', value: 75 }]
    const result = filterRows(ROWS, HEADER_IDX, filters, PROFILES)
    expect(result).toHaveLength(1) // Bob (75)
  })

  it('op: is null', () => {
    const filters: Filter[] = [{ column: 'Score', op: 'is null', value: null }]
    const result = filterRows(ROWS, HEADER_IDX, filters, PROFILES)
    expect(result).toHaveLength(1)
    expect(result[0]![0]).toBe('Dave')
  })

  it('op: is not null', () => {
    const filters: Filter[] = [{ column: 'Score', op: 'is not null', value: null }]
    const result = filterRows(ROWS, HEADER_IDX, filters, PROFILES)
    expect(result).toHaveLength(3)
  })

  it('multiple filters are AND-ed together', () => {
    const filters: Filter[] = [
      { column: 'Score', op: '>', value: 80 },
      { column: 'Active', op: '=', value: 'true' },
    ]
    const result = filterRows(ROWS, HEADER_IDX, filters, PROFILES)
    expect(result).toHaveLength(2) // Alice and Carol
  })

  it('unknown column filter is a no-op (passes all rows)', () => {
    const filters: Filter[] = [{ column: 'NonExistent', op: '=', value: 'X' }]
    const result = filterRows(ROWS, HEADER_IDX, filters, PROFILES)
    expect(result).toHaveLength(4)
  })

  it('respects headerRowIndex', () => {
    // Header at row 2 means rows 0-2 are headers, data starts at 3
    const result = filterRows(ROWS, 2, [], PROFILES)
    expect(result).toHaveLength(2) // Carol and Dave
  })
})
