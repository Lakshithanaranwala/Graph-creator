import { describe, it, expect } from 'vitest'
import { buildColumnName, buildColumnNames, profileColumn, profileColumns } from '@/lib/columnProfiling'
import type { CellValue } from '@/types/dataset'

describe('buildColumnName', () => {
  it('returns the trimmed header string when present', () => {
    expect(buildColumnName('  Revenue  ', 0)).toBe('Revenue')
  })

  it('generates "Column A" for a null header at index 0', () => {
    expect(buildColumnName(null, 0)).toBe('Column A')
  })

  it('generates "Column D" for a blank header at index 3', () => {
    expect(buildColumnName('', 3)).toBe('Column D')
  })

  it('generates "Column AA" for index 26', () => {
    expect(buildColumnName(null, 26)).toBe('Column AA')
  })
})

describe('buildColumnNames', () => {
  it('disambiguates duplicate names with _2, _3 suffixes', () => {
    const header: CellValue[] = ['Value', 'Value', 'Value']
    expect(buildColumnNames(header)).toEqual(['Value', 'Value_2', 'Value_3'])
  })

  it('names blank columns while keeping existing names intact', () => {
    const header: CellValue[] = ['Name', null, 'Revenue']
    expect(buildColumnNames(header)).toEqual(['Name', 'Column B', 'Revenue'])
  })
})

describe('profileColumn', () => {
  it('identifies a pure number column', () => {
    const values: CellValue[] = [1, 2, 3, 4]
    expect(profileColumn(values, 'n', 0).type).toBe('number')
  })

  it('identifies a pure string column', () => {
    const values: CellValue[] = ['a', 'b', 'c']
    expect(profileColumn(values, 's', 0).type).toBe('string')
  })

  it('flags a column with mixed numbers and strings as "mixed"', () => {
    const values: CellValue[] = [1, 'text', 2]
    expect(profileColumn(values, 'm', 0).type).toBe('mixed')
  })

  it('counts null values correctly', () => {
    const values: CellValue[] = [1, null, null, 4]
    expect(profileColumn(values, 'n', 0).nullCount).toBe(2)
  })

  it('identifies a date column', () => {
    const values: CellValue[] = [new Date('2024-01-01'), new Date('2024-02-01')]
    expect(profileColumn(values, 'd', 0).type).toBe('date')
  })
})

describe('profileColumns — date serial conversion via sheetParser', () => {
  it('detects Date objects produced by SheetJS cellDates:true', () => {
    // Simulates what sheetParser returns after cellDates:true processing
    const rawRows: CellValue[][] = [
      ['Date', 'Amount'],
      [new Date('2024-01-15'), 500],
      [new Date('2024-02-20'), 750],
    ]
    const profiles = profileColumns(rawRows, 0)
    expect(profiles[0]!.type).toBe('date')
    expect(profiles[1]!.type).toBe('number')
  })
})
