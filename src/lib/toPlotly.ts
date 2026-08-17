import type { Data, Layout } from 'plotly.js'
import type { TransformOutput } from '@/types/transform'
import type { ChartSpec } from '@/types/chart'
import type { CellValue } from '@/types/dataset'
import { getPalette, toColorscale } from '@/lib/palettes'

// 96 DPI screen resolution → pixel size from mm
const MM_TO_PX = 96 / 25.4

// ── Helpers ────────────────────────────────────────────────────────────────

/** Convert CellValue to Plotly Datum (boolean coerced to string). */
function toDatum(v: CellValue): string | number | Date | null {
  if (typeof v === 'boolean') return String(v)
  return v
}

function toDatumArr(arr: CellValue[]): (string | number | Date | null)[] {
  return arr.map(toDatum)
}

/** Pick a d3-format tick format string that fits the data's magnitude. */
function tickFmt(values: number[]): string {
  const finite = values.filter(Number.isFinite)
  if (finite.length === 0) return ''
  const absMax = Math.max(...finite.map(Math.abs))
  const allInt = finite.every(Number.isInteger)
  if (allInt && absMax < 10_000) return ','
  if (absMax >= 1_000_000 || allInt) return ',.3s'
  if (absMax < 0.01) return '.3e'
  return '.3g'
}

// ── Layout helpers ─────────────────────────────────────────────────────────

function axisBase(showGrid: boolean): Partial<Layout['xaxis']> {
  return {
    showgrid: showGrid,
    gridcolor: '#DDE2EA',
    zeroline: false,
    linecolor: '#DDE2EA',
    tickfont: { family: 'DM Sans, system-ui, sans-serif', size: 11, color: '#7A8899' },
    titlefont: { family: 'Space Grotesk, system-ui, sans-serif', size: 12, color: '#1B2230' },
  }
}

function buildLayout(
  output: TransformOutput,
  spec: ChartSpec,
  widthPx: number,
  heightPx: number,
): Partial<Layout> {
  const { style, encodings, chartType } = spec
  const showGrid = style.showGrid

  const xTitle = style.xLabel || encodings.x || ''
  const yTitle =
    style.yLabel ||
    (output.kind === 'xy' && output.series[0]?.name) ||
    (output.kind === 'distribution' && output.column) ||
    encodings.y[0] ||
    encodings.value ||
    ''

  const isLogX = style.xLog ?? false
  const isLogY = style.yLog ?? false

  const hasXRange = style.xMin !== undefined || style.xMax !== undefined
  const hasYRange = style.yMin !== undefined || style.yMax !== undefined

  let yValues: number[] = []
  if (output.kind === 'xy') {
    yValues = output.series.flatMap((s) => s.points.map((p) => p.y))
  } else if (output.kind === 'distribution') {
    yValues = output.bins.map((b) => b.count)
  } else if (output.kind === 'pie') {
    yValues = output.slices.map((s) => s.value)
  } else if (output.kind === 'matrix') {
    yValues = output.cells.map((c) => c.value)
  } else if (output.kind === 'box') {
    yValues = output.groups.flatMap((g) => g.values)
  }

  const isPie = chartType === 'pie'
  const isHeatmap = chartType === 'heatmap'

  const layout: Partial<Layout> = {
    width: widthPx,
    height: heightPx,
    paper_bgcolor: '#FFFFFF',
    plot_bgcolor: '#F3F5F7',
    font: { family: 'DM Sans, system-ui, sans-serif', size: 12, color: '#1B2230' },
    margin: {
      l: isPie || isHeatmap ? 20 : 64,
      r: 20,
      t: style.title ? 48 : 24,
      b: isPie ? 20 : 64,
    },
    showlegend: style.showLegend && !isPie,
    legend: {
      bgcolor: 'rgba(255,255,255,0.85)',
      bordercolor: '#DDE2EA',
      borderwidth: 1,
      font: { family: 'DM Sans, system-ui, sans-serif', size: 11, color: '#1B2230' },
    },
  }

  if (style.title) {
    layout.title = {
      text: style.title,
      font: { family: 'Space Grotesk, system-ui, sans-serif', size: 15, color: '#1B2230' },
      x: 0.5,
      xanchor: 'center',
    }
  }

  if (!isPie) {
    const xAxisDef: Partial<Layout['xaxis']> = {
      ...axisBase(showGrid),
      title: { text: xTitle },
      type: isLogX ? 'log' : '-',
      tickangle: chartType === 'bar' || isHeatmap ? -40 : 0,
      automargin: true,
    }
    if (hasXRange && !isLogX) {
      xAxisDef.range = [style.xMin ?? null, style.xMax ?? null]
    }
    layout.xaxis = xAxisDef

    const yAxisDef: Partial<Layout['yaxis']> = {
      ...axisBase(showGrid),
      title: { text: yTitle },
      type: isLogY ? 'log' : '-',
      tickformat: tickFmt(yValues),
      automargin: true,
    }
    if (hasYRange && !isLogY) {
      yAxisDef.range = [style.yMin ?? null, style.yMax ?? null]
    }
    layout.yaxis = yAxisDef
  }

  return layout
}

// ── Trace builders ─────────────────────────────────────────────────────────

function buildXYTraces(
  output: Extract<TransformOutput, { kind: 'xy' }>,
  spec: ChartSpec,
  colors: string[],
): Data[] {
  const { chartType, style } = spec
  const showLabels = style.showDataLabels ?? false

  return output.series.map((series, i): Data => {
    const color = colors[i % colors.length]!
    const xs = toDatumArr(series.points.map((p) => p.x))
    const ys = series.points.map((p) => p.y)

    if (chartType === 'bar') {
      return {
        type: 'bar',
        name: series.name,
        x: xs,
        y: ys,
        marker: { color },
        text: showLabels ? ys.map((v) => String(Number(v.toPrecision(4)))) : undefined,
        textposition: showLabels ? 'outside' : 'none',
        cliponaxis: false,
      }
    }

    if (chartType === 'scatter') {
      return {
        type: 'scatter',
        mode: showLabels ? 'text+markers' : 'markers',
        name: series.name,
        x: xs,
        y: ys,
        marker: { color, size: 6, opacity: 0.75 },
      }
    }

    if (chartType === 'area') {
      return {
        type: 'scatter',
        mode: 'lines',
        name: series.name,
        x: xs,
        y: ys,
        fill: i === 0 ? 'tozeroy' : 'tonexty',
        line: { color, width: 2 },
        fillcolor: `${color}33`,
      }
    }

    // line
    return {
      type: 'scatter',
      mode: 'lines',
      name: series.name,
      x: xs,
      y: ys,
      line: { color, width: 2 },
    }
  })
}

function buildPieTrace(
  output: Extract<TransformOutput, { kind: 'pie' }>,
  spec: ChartSpec,
  colors: string[],
): Data[] {
  const showLabels = spec.style.showDataLabels ?? false
  return [
    {
      type: 'pie',
      labels: output.slices.map((s) => s.label),
      values: output.slices.map((s) => s.value),
      marker: { colors },
      textinfo: showLabels ? 'label+percent' : 'label',
      hoverinfo: 'label+percent+name',
      showlegend: spec.style.showLegend,
    },
  ]
}

function buildDistributionTrace(
  output: Extract<TransformOutput, { kind: 'distribution' }>,
  colors: string[],
): Data[] {
  const midpoints = output.bins.map((b) => (b.min + b.max) / 2)
  const widths = output.bins.map((b) => b.max - b.min)
  return [
    {
      type: 'bar',
      name: output.column,
      x: midpoints,
      y: output.bins.map((b) => b.count),
      width: widths,
      marker: { color: colors[0], line: { color: '#FFFFFF', width: 1 } },
      hovertemplate: '%{y} rows<extra></extra>',
    },
  ]
}

function buildMatrixTrace(
  output: Extract<TransformOutput, { kind: 'matrix' }>,
  palette: ReturnType<typeof getPalette>,
): Data[] {
  const { xLabels, yLabels, cells } = output
  const z: (number | null)[][] = yLabels.map((y) =>
    xLabels.map((x) => cells.find((c) => c.x === x && c.y === y)?.value ?? null),
  )
  return [
    {
      type: 'heatmap',
      x: xLabels,
      y: yLabels,
      z,
      colorscale: toColorscale(palette),
      hovertemplate: 'x=%{x}<br>y=%{y}<br>value=%{z}<extra></extra>',
    },
  ]
}

function buildBoxTraces(
  output: Extract<TransformOutput, { kind: 'box' }>,
  colors: string[],
): Data[] {
  return output.groups.map((group, i): Data => ({
    type: 'box',
    name: group.label,
    y: group.values,
    marker: { color: colors[i % colors.length] },
    boxpoints: group.values.length <= 200 ? 'outliers' : false,
  }))
}

// ── Public API ─────────────────────────────────────────────────────────────

export type PlotlyFigure = { data: Data[]; layout: Partial<Layout> }

/**
 * Pure function: TransformOutput + ChartSpec → Plotly figure object.
 * Contains no Plotly API calls — safe to call in tests and outside React.
 */
export function toPlotly(output: TransformOutput, spec: ChartSpec): PlotlyFigure {
  const palette = getPalette(spec.style.palette)
  const { colors } = palette
  const widthPx = Math.round((spec.style.widthMm ?? 180) * MM_TO_PX)
  const heightPx = Math.round(widthPx * 0.65)

  let data: Data[]

  switch (output.kind) {
    case 'xy':
      data = buildXYTraces(output, spec, colors)
      break
    case 'pie':
      data = buildPieTrace(output, spec, colors)
      break
    case 'distribution':
      data = buildDistributionTrace(output, colors)
      break
    case 'matrix':
      data = buildMatrixTrace(output, palette)
      break
    case 'box':
      data = buildBoxTraces(output, colors)
      break
  }

  const layout = buildLayout(output, spec, widthPx, heightPx)

  return { data, layout }
}
