import { describe, it, expect } from 'vitest'
import { trimEmptyRows, trimEmptyColumns } from '@/lib/trimSheet'
import type { CellValue } from '@/types/dataset'

describe('trimEmptyRows', () => {
  it('removes trailing rows that are all null or empty string', () => {
    const rows: CellValue[][] = [
      ['A', 'B'],
      [1, 2],
      [null, null],
      ['', ''],
    ]
    const result = trimEmptyRows(rows)
    expect(result).toHaveLength(2)
    expect(result[result.length - 1]).toEqual([1, 2])
  })

  it('keeps leading empty rows', () => {
    const rows: CellValue[][] = [[null, null], ['A', 'B'], [1, 2]]
    const result = trimEmptyRows(rows)
    expect(result).toHaveLength(3)
  })

  it('returns empty array when all rows are empty', () => {
    expect(trimEmptyRows([[null], [null]])).toEqual([])
  })
})

describe('trimEmptyColumns', () => {
  it('removes trailing columns that are entirely null', () => {
    const rows: CellValue[][] = [
      ['A', 'B', null, null],
      [1,   2,   null, null],
    ]
    const result = trimEmptyColumns(rows)
    expect(result[0]).toEqual(['A', 'B'])
    expect(result[1]).toEqual([1, 2])
  })

  it('keeps leading empty columns', () => {
    const rows: CellValue[][] = [
      [null, 'A', 'B'],
      [null, 1,   2],
    ]
    expect(trimEmptyColumns(rows)[0]).toEqual([null, 'A', 'B'])
  })

  it('returns empty rows when all columns are empty', () => {
    const result = trimEmptyColumns([[null, null], [null, null]])
    result.forEach((row) => expect(row).toEqual([]))
  })
})
