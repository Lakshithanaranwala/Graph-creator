export type ChartType =
  | 'bar'
  | 'line'
  | 'scatter'
  | 'pie'
  | 'area'
  | 'histogram'
  | 'box'
  | 'heatmap'

export type Aggregation = 'none' | 'sum' | 'mean' | 'count' | 'min' | 'max' | 'median'

export type Filter = {
  column: string
  op: string
  value: unknown
}

export type ChartSpec = {
  id: string
  datasetId: string
  sheetName: string
  chartType: ChartType
  encodings: {
    x: string | null
    y: string[]
    color?: string | null
    size?: string | null
    agg?: Aggregation
  }
  filters: Filter[]
  style: {
    title?: string
    xLabel?: string
    yLabel?: string
    palette: string
    showLegend: boolean
    showGrid: boolean
  }
}
