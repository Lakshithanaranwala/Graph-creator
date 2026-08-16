import { describe, it, expect } from 'vitest'
import { transform } from '@/lib/transform'
import { MAX_POINTS } from '@/lib/downsample'
import type { CellValue } from '@/types/dataset'
import type { ChartSpec } from '@/types/chart'
import type { ColumnProfile } from '@/types/profile'

// ── Helpers ───────────────────────────────────────────────────────────────

function makeProfile(
  name: string,
  index: number,
  type: ColumnProfile['inferredType'],
  distinctCount = 10,
): ColumnProfile {
  return {
    name,
    index,
    inferredType: type,
    confidence: 0.95,
    nullCount: 0,
    nullRatio: 0,
    distinctCount,
    isHighCardinality: distinctCount > 50,
    isLikelyId: false,
    sampleValues: [],
  }
}

function makeSpec(overrides: Partial<ChartSpec> = {}): ChartSpec {
  return {
    id: 'test',
    datasetId: 'ds1',
    sheetName: 'Sheet1',
    chartType: 'bar',
    encodings: { x: 'Category', y: ['Value'], agg: 'sum' },
    filters: [],
    style: { palette: 'default', showLegend: true, showGrid: true },
    ...overrides,
  }
}

const CAT_COL = makeProfile('Category', 0, 'categorical', 3)
const VAL_COL = makeProfile('Value', 1, 'numeric')
const VAL2_COL = makeProfile('Value2', 2, 'numeric')
const PROFILES = [CAT_COL, VAL_COL, VAL2_COL]

// Header row = 0, data rows start at 1
const HEADER_IDX = 0

const ROWS: CellValue[][] = [
  ['Category', 'Value', 'Value2'],
  ['A', 10, 1],
  ['B', 20, 2],
  ['A', 30, 3], // A appears twice
  ['C', 5, 4],
]

// ── Bar chart tests ───────────────────────────────────────────────────────

describe('transform — bar (xy)', () => {
  it('groups by X and sums Y by default', () => {
    const result = transform(ROWS, HEADER_IDX, makeSpec(), PROFILES)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.output.kind).toBe('xy')
    if (result.output.kind !== 'xy') return

    const series = result.output.series[0]!
    expect(series.name).toBe('Value')

    const aPoint = series.points.find((p) => p.x === 'A')
    expect(aPoint?.y).toBe(40) // 10 + 30

    const bPoint = series.points.find((p) => p.x === 'B')
    expect(bPoint?.y).toBe(20)
  })

  it('aggregates with mean', () => {
    const spec = makeSpec({ encodings: { x: 'Category', y: ['Value'], agg: 'mean' } })
    const result = transform(ROWS, HEADER_IDX, spec, PROFILES)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    if (result.output.kind !== 'xy') return

    const aPoint = result.output.series[0]!.points.find((p) => p.x === 'A')
    expect(aPoint?.y).toBe(20) // (10 + 30) / 2
  })

  it('aggregates with count', () => {
    const spec = makeSpec({ encodings: { x: 'Category', y: ['Value'], agg: 'count' } })
    const result = transform(ROWS, HEADER_IDX, spec, PROFILES)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    if (result.output.kind !== 'xy') return

    const aPoint = result.output.series[0]!.points.find((p) => p.x === 'A')
    expect(aPoint?.y).toBe(2) // A appears twice

    const cPoint = result.output.series[0]!.points.find((p) => p.x === 'C')
    expect(cPoint?.y).toBe(1)
  })

  it('multi-series bar produces one series per Y column', () => {
    const spec = makeSpec({ encodings: { x: 'Category', y: ['Value', 'Value2'], agg: 'sum' } })
    const result = transform(ROWS, HEADER_IDX, spec, PROFILES)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    if (result.output.kind !== 'xy') return

    expect(result.output.series).toHaveLength(2)
    expect(result.output.series[0]!.name).toBe('Value')
    expect(result.output.series[1]!.name).toBe('Value2')
  })

  it('returns error when no rows remain after filter', () => {
    const spec = makeSpec({
      filters: [{ column: 'Category', op: '=', value: 'Z' }],
    })
    const result = transform(ROWS, HEADER_IDX, spec, PROFILES)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toMatch(/No rows/)
  })

  it('handles null X values (grouped as null)', () => {
    const rowsWithNull: CellValue[][] = [
      ['Category', 'Value'],
      [null, 5],
      ['A', 10],
      [null, 15],
    ]
    const profiles = [CAT_COL, VAL_COL]
    const result = transform(rowsWithNull, HEADER_IDX, makeSpec({ encodings: { x: 'Category', y: ['Value'], agg: 'sum' } }), profiles)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    if (result.output.kind !== 'xy') return
    // null group should aggregate to 5 + 15 = 20
    const nullPt = result.output.series[0]!.points.find((p) => p.x === null)
    expect(nullPt?.y).toBe(20)
  })

  it('returns error when X column is missing', () => {
    const spec = makeSpec({ encodings: { x: 'NonExistent', y: ['Value'], agg: 'sum' } })
    const result = transform(ROWS, HEADER_IDX, spec, PROFILES)
    expect(result.ok).toBe(false)
  })
})

// ── Scatter chart tests ────────────────────────────────────────────────────

describe('transform — scatter', () => {
  const SCAT_ROWS: CellValue[][] = [
    ['X', 'Y'],
    [1, 2],
    [3, 4],
    [5, 6],
  ]
  const SCAT_PROFILES = [
    makeProfile('X', 0, 'numeric'),
    makeProfile('Y', 1, 'numeric'),
  ]

  it('produces xy series with raw points (no grouping)', () => {
    const spec = makeSpec({
      chartType: 'scatter',
      encodings: { x: 'X', y: ['Y'], agg: 'none' },
    })
    const result = transform(SCAT_ROWS, HEADER_IDX, spec, SCAT_PROFILES)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    if (result.output.kind !== 'xy') return
    expect(result.output.series[0]!.points).toHaveLength(3)
  })

  it('downsamples with random sample when > MAX_POINTS', () => {
    const bigRows: CellValue[][] = [['X', 'Y']]
    for (let i = 0; i < MAX_POINTS + 500; i++) bigRows.push([i, i * 2])

    const spec = makeSpec({
      chartType: 'scatter',
      encodings: { x: 'X', y: ['Y'], agg: 'none' },
    })
    const result = transform(bigRows, HEADER_IDX, spec, SCAT_PROFILES)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    if (result.output.kind !== 'xy') return
    expect(result.output.sampledPoints).toBe(MAX_POINTS)
    expect(result.output.totalPoints).toBe(MAX_POINTS + 500)
  })
})

// ── Pie chart tests ────────────────────────────────────────────────────────

describe('transform — pie', () => {
  it('produces slices from categorical + numeric', () => {
    const spec = makeSpec({
      chartType: 'pie',
      encodings: { x: 'Category', y: ['Value'], agg: 'sum' },
    })
    const result = transform(ROWS, HEADER_IDX, spec, PROFILES)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.output.kind).toBe('pie')
    if (result.output.kind !== 'pie') return
    // A=40, B=20, C=5
    const aSlice = result.output.slices.find((s) => s.label === 'A')
    expect(aSlice?.value).toBe(40)
  })
})

// ── Histogram tests ────────────────────────────────────────────────────────

describe('transform — histogram', () => {
  it('produces distribution bins', () => {
    const rows: CellValue[][] = [
      ['Score'],
      [10], [20], [30], [40], [50],
    ]
    const profiles = [makeProfile('Score', 0, 'numeric')]
    const spec = makeSpec({
      chartType: 'histogram',
      encodings: { x: 'Score', y: [], agg: 'none' },
    })
    const result = transform(rows, HEADER_IDX, spec, profiles)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.output.kind).toBe('distribution')
    if (result.output.kind !== 'distribution') return
    expect(result.output.column).toBe('Score')
    expect(result.output.totalRows).toBe(5)
    // All bins together should count 5 total rows
    const total = result.output.bins.reduce((s, b) => s + b.count, 0)
    expect(total).toBe(5)
  })
})

// ── Box plot tests ─────────────────────────────────────────────────────────

describe('transform — box', () => {
  it('produces a single group when no X', () => {
    const spec = makeSpec({
      chartType: 'box',
      encodings: { x: null, y: ['Value'], agg: 'none' },
    })
    const result = transform(ROWS, HEADER_IDX, spec, PROFILES)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.output.kind).toBe('box')
    if (result.output.kind !== 'box') return
    expect(result.output.groups).toHaveLength(1)
    expect(result.output.groups[0]!.values.sort((a, b) => a - b)).toEqual([5, 10, 20, 30])
  })

  it('groups by X when provided', () => {
    const spec = makeSpec({
      chartType: 'box',
      encodings: { x: 'Category', y: ['Value'], agg: 'none' },
    })
    const result = transform(ROWS, HEADER_IDX, spec, PROFILES)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    if (result.output.kind !== 'box') return
    expect(result.output.groups.length).toBeGreaterThan(1)
  })
})

// ── Heatmap tests ──────────────────────────────────────────────────────────

describe('transform — heatmap', () => {
  const HEAT_ROWS: CellValue[][] = [
    ['Row', 'Col', 'Val'],
    ['R1', 'C1', 10],
    ['R1', 'C2', 20],
    ['R2', 'C1', 30],
    ['R2', 'C2', 40],
  ]
  const HEAT_PROFILES = [
    makeProfile('Row', 0, 'categorical'),
    makeProfile('Col', 1, 'categorical'),
    makeProfile('Val', 2, 'numeric'),
  ]

  it('produces matrix cells', () => {
    const spec = makeSpec({
      chartType: 'heatmap',
      encodings: { x: 'Row', y: ['Col'], value: 'Val', agg: 'sum' },
    })
    const result = transform(HEAT_ROWS, HEADER_IDX, spec, HEAT_PROFILES)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.output.kind).toBe('matrix')
    if (result.output.kind !== 'matrix') return
    expect(result.output.cells).toHaveLength(4)
    expect(result.output.xLabels).toContain('R1')
    expect(result.output.yLabels).toContain('C1')
  })

  it('returns error when columns missing', () => {
    const spec = makeSpec({
      chartType: 'heatmap',
      encodings: { x: null, y: [], value: null, agg: 'sum' },
    })
    const result = transform(HEAT_ROWS, HEADER_IDX, spec, HEAT_PROFILES)
    expect(result.ok).toBe(false)
  })
})

// ── LTTB downsampling via line chart ──────────────────────────────────────

describe('transform — LTTB downsampling (line)', () => {
  it('downsamples large line datasets to MAX_POINTS', () => {
    const bigRows: CellValue[][] = [['X', 'Y']]
    for (let i = 0; i < MAX_POINTS + 1000; i++) bigRows.push([i, Math.sin(i / 100)])

    const profiles = [
      makeProfile('X', 0, 'numeric'),
      makeProfile('Y', 1, 'numeric'),
    ]
    const spec = makeSpec({
      chartType: 'line',
      encodings: { x: 'X', y: ['Y'], agg: 'none' },
    })
    const result = transform(bigRows, HEADER_IDX, spec, profiles)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    if (result.output.kind !== 'xy') return
    expect(result.output.sampledPoints).toBeLessThanOrEqual(MAX_POINTS)
    expect(result.output.totalPoints).toBe(MAX_POINTS + 1000)
  })
})
