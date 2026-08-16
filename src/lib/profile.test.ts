import { describe, it, expect } from 'vitest'
import { profileColumn } from '@/lib/profile'
import type { CellValue } from '@/types/dataset'
import type { InferredType } from '@/types/profile'

type Case = {
  label: string
  values: CellValue[]
  expectedType: InferredType
  expectedConfidenceMin?: number
  expectNumericTransform?: RegExp
  expectLikelyId?: boolean
  expectHighCardinality?: boolean
  expectNullRatio?: number
}

const repeat = <T>(v: T, n: number): T[] => Array(n).fill(v)

const cases: Case[] = [
  // ── Numeric ────────────────────────────────────────────────────────────────
  {
    label: 'pure floats (10 rows, 10 distinct — no low-cardinality downgrade)',
    values: [1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9.9, 10.1],
    expectedType: 'numeric',
    expectedConfidenceMin: 0.85,
  },
  {
    label: 'currency strings ($1000 – $10000, 10 distinct rows)',
    values: Array.from({ length: 10 }, (_, i) => `$${(i + 1) * 1000}`),
    expectedType: 'numeric',
    expectNumericTransform: /currency/,
  },
  {
    label: 'percentage strings (10 distinct values)',
    values: ['12%', '34%', '56%', '78%', '90%', '11%', '23%', '45%', '67%', '89%'],
    expectedType: 'numeric',
    expectNumericTransform: /percent/,
  },
  {
    label: 'European decimal commas (10 distinct values)',
    values: ['1,5', '2,3', '3,8', '4,1', '5,7', '6,2', '7,9', '8,4', '9,6', '10,0'],
    expectedType: 'numeric',
    expectNumericTransform: /european/,
  },
  {
    label: 'mixed currency formats (€ and $)',
    values: ['€1.000,50', '$2,500', '€3.200,00', '$4,100.75', '€500,00',
             '$600', '$700.50', '$800', '€900,25', '€1.000,00'],
    expectedType: 'numeric',
  },
  {
    // 18 distinct numeric values + 2 non-parseable strings → 90% numeric threshold
    label: '10% non-numeric still qualifies (≥90% threshold)',
    values: [...Array.from({ length: 18 }, (_, i) => (i + 1) * 10), 'N/A', 'missing'],
    expectedType: 'numeric',
  },

  // ── Categorical via low-cardinality downgrade ───────────────────────────
  {
    // distinctCount=5, rowCount=100 — 100 > 5*2=10 ✓ triggers downgrade
    label: 'small integer set repeated many times (encoded category)',
    values: [...repeat(1, 20), ...repeat(2, 20), ...repeat(3, 20), ...repeat(4, 20), ...repeat(5, 20)],
    expectedType: 'categorical',
    expectedConfidenceMin: 0.7,
  },
  {
    label: 'rating scale 1–5 (12 rows, 5 distinct)',
    values: [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 1, 2],
    expectedType: 'categorical',
  },
  {
    label: 'string labels',
    values: ['Apple', 'Banana', 'Cherry', 'Apple', 'Banana', 'Cherry', 'Apple', 'Banana'],
    expectedType: 'categorical',
  },

  // ── Temporal ────────────────────────────────────────────────────────────
  {
    label: 'native Date objects',
    values: [new Date('2024-01-01'), new Date('2024-06-15'), new Date('2024-12-31')],
    expectedType: 'temporal',
  },
  {
    label: 'ISO date strings',
    values: ['2024-01-15', '2024-02-20', '2024-03-10', '2023-11-01', '2023-12-25'],
    expectedType: 'temporal',
  },
  {
    label: 'MM/DD/YYYY date strings',
    values: ['01/15/2024', '02/20/2024', '03/10/2024', '11/01/2023', '12/25/2023'],
    expectedType: 'temporal',
  },

  // ── Boolean ─────────────────────────────────────────────────────────────
  {
    label: 'yes/no strings',
    values: ['yes', 'no', 'yes', 'yes', 'no'],
    expectedType: 'boolean',
    expectedConfidenceMin: 1.0,
  },
  {
    label: 'TRUE/FALSE case-insensitive',
    values: ['TRUE', 'FALSE', 'TRUE', 'FALSE'],
    expectedType: 'boolean',
  },
  {
    label: 'native boolean values',
    values: [true, false, true, true, false],
    expectedType: 'boolean',
  },
  {
    label: '1/0 as strings',
    values: ['1', '0', '1', '0', '1', '0'],
    expectedType: 'boolean',
  },

  // ── Empty ────────────────────────────────────────────────────────────────
  {
    label: 'all nulls',
    values: [null, null, null, null],
    expectedType: 'empty',
    expectedConfidenceMin: 1.0,
  },

  // ── Mixed ────────────────────────────────────────────────────────────────
  {
    label: 'half numbers half text strings',
    values: [1, 'text', 2, 'more text', 3, 'again', 4, 'text2', 5, 'word'],
    expectedType: 'mixed',
  },

  // ── Mostly-empty column ─────────────────────────────────────────────────
  {
    label: 'mostly empty (95% null)',
    values: [...repeat(null as CellValue, 95), 'x', 'y', 'z', 'a', 'b'],
    expectedType: 'categorical',
    expectNullRatio: 0.95,
  },

  // ── ID column ───────────────────────────────────────────────────────────
  {
    label: 'UUID-like string IDs (all unique) → isLikelyId true',
    values: Array.from({ length: 10 }, (_, i) => `abc-${String(i + 1).padStart(3, '0')}`),
    expectedType: 'categorical',
    expectLikelyId: true,
  },
  {
    label: 'sequential integers (all unique) → isLikelyId true',
    values: Array.from({ length: 20 }, (_, i) => i + 1),
    expectedType: 'numeric',
    expectLikelyId: true,
  },
  {
    label: 'continuous floats (all unique) → isLikelyId false',
    values: Array.from({ length: 20 }, (_, i) => i * 1.7 + 0.3),
    expectedType: 'numeric',
    expectLikelyId: false,
  },
]

describe('profileColumn — type inference rules', () => {
  for (const c of cases) {
    it(c.label, () => {
      const p = profileColumn(c.values, 'col', 0)

      expect(p.inferredType).toBe(c.expectedType)

      if (c.expectedConfidenceMin !== undefined) {
        expect(p.confidence).toBeGreaterThanOrEqual(c.expectedConfidenceMin)
      }
      if (c.expectNumericTransform !== undefined) {
        expect(p.numericTransform).toMatch(c.expectNumericTransform)
      }
      if (c.expectLikelyId === true) expect(p.isLikelyId).toBe(true)
      if (c.expectLikelyId === false) expect(p.isLikelyId).toBe(false)
      if (c.expectHighCardinality !== undefined) {
        expect(p.isHighCardinality).toBe(c.expectHighCardinality)
      }
      if (c.expectNullRatio !== undefined) {
        expect(p.nullRatio).toBeCloseTo(c.expectNullRatio, 1)
      }
    })
  }
})

describe('profileColumn — computed stats', () => {
  it('computes min/max/mean/median for numeric columns', () => {
    // 15 distinct values so distinctCount > 12 — ensures numeric classification
    const vals = Array.from({ length: 15 }, (_, i) => i * 2 + 2)
    const p = profileColumn(vals, 'n', 0)
    expect(p.numericStats?.min).toBe(2)
    expect(p.numericStats?.max).toBe(30)
    expect(p.numericStats?.mean).toBeCloseTo(16, 1)
  })

  it('computes temporal range from Date objects', () => {
    const dates = [new Date('2023-01-01'), new Date('2024-06-15'), new Date('2022-12-31')]
    const p = profileColumn(dates, 'd', 0)
    expect(p.temporalRange?.min.getFullYear()).toBe(2022)
    expect(p.temporalRange?.max.getFullYear()).toBe(2024)
  })

  it('counts nulls correctly', () => {
    const p = profileColumn([1, null, null, 4, null], 'n', 0)
    expect(p.nullCount).toBe(3)
    expect(p.nullRatio).toBeCloseTo(0.6, 2)
  })

  it('flags high cardinality when distinctCount > 50', () => {
    const vals = Array.from({ length: 60 }, (_, i) => `cat_${i}`)
    const p = profileColumn(vals, 'c', 0)
    expect(p.isHighCardinality).toBe(true)
  })

  it('median of even-length array is average of two middle values', () => {
    // 14 distinct values → numeric
    const vals = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28]
    const p = profileColumn(vals, 'n', 0)
    expect(p.numericStats?.median).toBe(15) // (14+16)/2
  })
})
