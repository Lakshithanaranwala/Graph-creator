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
    value?: string | null   // heatmap cell value (numeric)
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
    showDataLabels?: boolean
    // Manual axis range overrides (undefined = auto)
    xMin?: number
    xMax?: number
    yMin?: number
    yMax?: number
    xLog?: boolean
    yLog?: boolean
    // Export width in mm — drives the rendered size so WYSIWYG
    widthMm?: number
  }
}
