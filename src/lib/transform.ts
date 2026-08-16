import type { CellValue } from '@/types/dataset'
import type { ChartSpec } from '@/types/chart'
import type { ColumnProfile } from '@/types/profile'
import type { TransformResult, XYSeries, BoxGroup, MatrixCell } from '@/types/transform'
import { filterRows } from '@/lib/filterRows'
import {
  colIndex,
  groupRowsByX,
  buildXYFromGroups,
  sortPoints,
  extractY,
  aggregateValues,
} from '@/lib/aggregateGroups'
import { lttb, randomSample, topNCategories, MAX_POINTS } from '@/lib/downsample'

// Histogram: auto-pick bin count using Sturges' rule, capped at 60
function computeBins(values: number[], binCount: number) {
  if (values.length === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (min === max) return [{ min, max: min + 1, count: values.length }]
  const width = (max - min) / binCount
  const bins = Array.from({ length: binCount }, (_, i) => ({
    min: min + i * width,
    max: min + (i + 1) * width,
    count: 0,
  }))
  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / width), binCount - 1)
    bins[idx]!.count++
  }
  return bins
}

export function transform(
  rows: CellValue[][],
  headerRowIndex: number,
  spec: ChartSpec,
  profiles: ColumnProfile[],
): TransformResult {
  const { chartType, encodings, filters } = spec
  const agg = encodings.agg ?? 'sum'

  // --- 1. Filter ---
  let dataRows: CellValue[][]
  try {
    dataRows = filterRows(rows, headerRowIndex, filters, profiles)
  } catch (e) {
    return { ok: false, error: `Filter error: ${e instanceof Error ? e.message : String(e)}` }
  }

  if (dataRows.length === 0) {
    return { ok: false, error: 'No rows remain after applying filters.' }
  }

  // --- Dispatch by chart type ---

  // ── Histogram ────────────────────────────────────────────────────────────
  if (chartType === 'histogram') {
    const xCol = encodings.x
    if (!xCol) return { ok: false, error: 'No column selected for X axis.' }
    const xi = colIndex(xCol, profiles)
    if (xi === -1) return { ok: false, error: `Column "${xCol}" not found.` }

    const values = extractY(dataRows, xi)
    if (values.length === 0) return { ok: false, error: 'No numeric values in selected column.' }

    const binCount = Math.min(60, Math.max(5, Math.ceil(Math.log2(values.length) + 1)))
    return {
      ok: true,
      output: {
        kind: 'distribution',
        bins: computeBins(values, binCount),
        column: xCol,
        totalRows: values.length,
      },
    }
  }

  // ── Box plot ─────────────────────────────────────────────────────────────
  if (chartType === 'box') {
    const yNames = encodings.y
    if (yNames.length === 0) return { ok: false, error: 'No numeric column selected for Y.' }

    const xName = encodings.x
    const groups: BoxGroup[] = []

    if (xName) {
      const xi = colIndex(xName, profiles)
      const grouped = groupRowsByX(dataRows, xi)
      for (const [xVal, groupRows] of grouped) {
        const allVals: number[] = []
        for (const yName of yNames) {
          const yi = colIndex(yName, profiles)
          if (yi !== -1) allVals.push(...extractY(groupRows, yi))
        }
        if (allVals.length > 0) groups.push({ label: String(xVal ?? ''), values: allVals })
      }
    } else {
      const allVals: number[] = []
      for (const yName of yNames) {
        const yi = colIndex(yName, profiles)
        if (yi !== -1) allVals.push(...extractY(dataRows, yi))
      }
      if (allVals.length > 0) groups.push({ label: yNames[0] ?? 'Values', values: allVals })
    }

    if (groups.length === 0) return { ok: false, error: 'No numeric values found.' }
    return { ok: true, output: { kind: 'box', groups } }
  }

  // ── Heatmap ───────────────────────────────────────────────────────────────
  if (chartType === 'heatmap') {
    const xName = encodings.x
    const yName = encodings.y[0] ?? null
    const valueName = encodings.value
    if (!xName || !yName || !valueName) {
      return { ok: false, error: 'Heatmap requires X column, Y column, and a value column.' }
    }
    const xi = colIndex(xName, profiles)
    const yi = colIndex(yName, profiles)
    const vi = colIndex(valueName, profiles)
    if (xi === -1 || yi === -1 || vi === -1) {
      return { ok: false, error: 'One or more selected columns not found.' }
    }

    // Group by (x, y) string key and aggregate
    const cellMap = new Map<string, number[]>()
    const xSet = new Set<string>()
    const ySet = new Set<string>()

    for (const row of dataRows) {
      const xStr = String(row[xi] ?? '')
      const yStr = String(row[yi] ?? '')
      const num = typeof row[vi] === 'number' ? (row[vi] as number) : null
      if (num === null) continue
      xSet.add(xStr)
      ySet.add(yStr)
      const key = `${xStr}\0${yStr}`
      if (!cellMap.has(key)) cellMap.set(key, [])
      cellMap.get(key)!.push(num)
    }

    const xLabels = [...xSet].sort((a, b) => a.localeCompare(b))
    const yLabels = [...ySet].sort((a, b) => a.localeCompare(b))
    const cells: MatrixCell[] = []

    for (const [key, vals] of cellMap) {
      const [x, y] = key.split('\0') as [string, string]
      cells.push({ x, y, value: aggregateValues(vals, agg) })
    }

    return { ok: true, output: { kind: 'matrix', cells, xLabels, yLabels } }
  }

  // ── Pie ───────────────────────────────────────────────────────────────────
  if (chartType === 'pie') {
    const xName = encodings.x
    const yName = encodings.y[0] ?? null
    if (!xName) return { ok: false, error: 'No category column selected for X.' }
    if (!yName) return { ok: false, error: 'No value column selected for Y.' }

    const xi = colIndex(xName, profiles)
    const yi = colIndex(yName, profiles)
    if (xi === -1) return { ok: false, error: `Column "${xName}" not found.` }
    if (yi === -1) return { ok: false, error: `Column "${yName}" not found.` }

    const groups = groupRowsByX(dataRows, xi)
    const points = buildXYFromGroups(groups, yi, agg)
    const withLabels = points.map((p) => ({ x: p.x, y: p.y }))
    const topN = topNCategories(withLabels, 20)
    const slices = topN.map((p) => ({ label: String(p.x ?? ''), value: p.y }))

    return { ok: true, output: { kind: 'pie', slices } }
  }

  // ── Scatter ───────────────────────────────────────────────────────────────
  if (chartType === 'scatter') {
    const xName = encodings.x
    const yName = encodings.y[0] ?? null
    if (!xName) return { ok: false, error: 'No column selected for X axis.' }
    if (!yName) return { ok: false, error: 'No column selected for Y axis.' }

    const xi = colIndex(xName, profiles)
    const yi = colIndex(yName, profiles)
    if (xi === -1) return { ok: false, error: `Column "${xName}" not found.` }
    if (yi === -1) return { ok: false, error: `Column "${yName}" not found.` }

    const allPoints = dataRows
      .map((row) => {
        const x = row[xi] ?? null
        const y = row[yi] ?? null
        if (typeof x !== 'number' || typeof y !== 'number') return null
        return { x: x as CellValue, y }
      })
      .filter((p): p is { x: CellValue; y: number } => p !== null)

    const totalPoints = allPoints.length
    const sampled = randomSample(allPoints, MAX_POINTS)

    const series: XYSeries[] = [{ name: yName, points: sampled }]
    return {
      ok: true,
      output: { kind: 'xy', series, totalPoints, sampledPoints: sampled.length },
    }
  }

  // ── Bar / Line / Area (XY with grouping) ─────────────────────────────────
  const xName = encodings.x
  const yNames = encodings.y
  if (!xName) return { ok: false, error: 'No column selected for X axis.' }
  if (yNames.length === 0) return { ok: false, error: 'No column selected for Y axis.' }

  const xi = colIndex(xName, profiles)
  if (xi === -1) return { ok: false, error: `Column "${xName}" not found.` }

  const groups = groupRowsByX(dataRows, xi)
  let totalPoints = 0
  let sampledPoints = 0
  const series: XYSeries[] = []

  for (const yName of yNames) {
    const yi = colIndex(yName, profiles)
    if (yi === -1) continue

    const rawPoints = buildXYFromGroups(groups, yi, agg)
    const sorted = sortPoints(rawPoints)
    totalPoints = Math.max(totalPoints, sorted.length)

    const downsampled =
      chartType === 'bar'
        ? topNCategories(sorted, MAX_POINTS)
        : lttb(sorted, MAX_POINTS)

    sampledPoints = Math.max(sampledPoints, downsampled.length)
    series.push({ name: yName, points: downsampled })
  }

  if (series.length === 0) return { ok: false, error: 'No valid Y columns found.' }

  return {
    ok: true,
    output: { kind: 'xy', series, totalPoints, sampledPoints },
  }
}
