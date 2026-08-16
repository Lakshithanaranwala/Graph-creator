import { describe, it, expect } from 'vitest'
import { detectHeaderRow } from '@/lib/headerDetection'
import type { CellValue } from '@/types/dataset'

describe('detectHeaderRow', () => {
  it('detects row 0 when headers are on the first row', () => {
    const rows: CellValue[][] = [
      ['Month', 'Revenue'],
      [1, 4500],
      [2, 5200],
    ]
    expect(detectHeaderRow(rows)).toBe(0)
  })

  it('skips a title row and finds headers on row 1', () => {
    const rows: CellValue[][] = [
      ['Q4 2024 Sales Report'],   // title — only one non-empty cell
      ['Month', 'Revenue', 'Units'],
      [1, 4500, 120],
      [2, 5200, 135],
    ]
    expect(detectHeaderRow(rows)).toBe(1)
  })

  it('skips a numeric first row (e.g. row of IDs)', () => {
    const rows: CellValue[][] = [
      [1, 2, 3],
      ['Product', 'Price', 'Stock'],
      ['Widget', 9.99, 50],
    ]
    // Row 0 has numbers — does not qualify; row 1 is strings with numeric data below
    expect(detectHeaderRow(rows)).toBe(1)
  })

  it('falls back to row 0 when no candidate is found', () => {
    const rows: CellValue[][] = [
      [1, 2, 3],
      [4, 5, 6],
    ]
    expect(detectHeaderRow(rows)).toBe(0)
  })

  it('detects headers when only one row exists', () => {
    // Only one row → no "next row" to check → fall back to 0
    const rows: CellValue[][] = [['Name', 'Age']]
    expect(detectHeaderRow(rows)).toBe(0)
  })
})
