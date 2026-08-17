import type { ColumnProfile } from '@/types/profile'
import type { ChartType, ChartSpec, Aggregation } from '@/types/chart'
import { CHART_RULES } from '@/lib/chartRules'
import { DEFAULT_PALETTE } from '@/lib/palettes'

// Pick the best X column: temporal → low-cardinality categorical/boolean → numeric → any
function pickBestCol(
  profiles: ColumnProfile[],
  accepts: string[],
  exclude: string | null = null,
): ColumnProfile | undefined {
  const candidates = profiles.filter(
    (p) => accepts.includes(p.inferredType) && p.name !== exclude,
  )
  const temporal = candidates.find((p) => p.inferredType === 'temporal')
  if (temporal) return temporal

  const lowCat = candidates.find(
    (p) =>
      (p.inferredType === 'categorical' || p.inferredType === 'boolean') &&
      p.distinctCount <= 20 &&
      !p.isLikelyId,
  )
  if (lowCat) return lowCat

  return candidates.find((p) => !p.isLikelyId) ?? candidates[0]
}

export function getSmartDefaults(
  profiles: ColumnProfile[],
  chartType: ChartType,
  datasetId: string,
  sheetName: string,
): ChartSpec {
  const rule = CHART_RULES[chartType]
  const xSlot = rule.slots.x
  const ySlot = rule.slots.y
  const valueSlot = rule.slots.value

  let xName: string | null = null
  let yNames: string[] = []
  let valueName: string | null = null

  if (xSlot) {
    xName = pickBestCol(profiles, xSlot.accepts as string[])?.name ?? null
  }

  if (ySlot) {
    const yCandidates = profiles.filter(
      (p) => (ySlot.accepts as string[]).includes(p.inferredType) && p.name !== xName && !p.isLikelyId,
    )
    yNames = ySlot.multiple
      ? yCandidates.slice(0, 2).map((p) => p.name)
      : yCandidates.slice(0, 1).map((p) => p.name)
  }

  if (valueSlot) {
    valueName =
      profiles.find(
        (p) =>
          (valueSlot.accepts as string[]).includes(p.inferredType) &&
          p.name !== xName &&
          !yNames.includes(p.name),
      )?.name ?? null
  }

  const noAggTypes: ChartType[] = ['scatter', 'histogram', 'box']
  const agg: Aggregation = noAggTypes.includes(chartType) ? 'none' : 'sum'

  return {
    id: crypto.randomUUID(),
    datasetId,
    sheetName,
    chartType,
    encodings: {
      x: xName,
      y: yNames,
      color: null,
      size: null,
      value: valueName,
      agg,
    },
    filters: [],
    style: {
      title: '',
      xLabel: xName ?? '',
      yLabel: yNames[0] ?? valueName ?? '',
      palette: DEFAULT_PALETTE,
      showLegend: true,
      legendPosition: 'right',
      showGrid: true,
      showDataLabels: false,
      xLog: false,
      yLog: false,
      widthMm: 180,
    },
  }
}
