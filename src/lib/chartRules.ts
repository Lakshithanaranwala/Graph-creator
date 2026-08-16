// Static rule table: what each chart type needs in terms of column types.
// This is pure data — the feasibility logic lives in chartFeasibility.ts.

import type { ChartType } from '@/types/chart'
import type { InferredType } from '@/types/profile'

export type SlotDef = {
  accepts: InferredType[]
  required: boolean
  // True when the slot can receive multiple columns (e.g. Y on bar/line)
  multiple: boolean
  // Max distinct values allowed in this slot (pie X capped at 20)
  maxCardinality?: number
}

export type ChartRule = {
  label: string
  description: string
  slots: Partial<Record<'x' | 'y' | 'color' | 'size' | 'value', SlotDef>>
  aggregationAvailable: boolean
}

export const CHART_RULES: Record<ChartType, ChartRule> = {
  bar: {
    label: 'Bar',
    description: 'Compare values across categories',
    slots: {
      x: { accepts: ['categorical', 'temporal', 'boolean'], required: true, multiple: false },
      y: { accepts: ['numeric'], required: true, multiple: true },
      color: { accepts: ['categorical', 'boolean'], required: false, multiple: false },
    },
    aggregationAvailable: true,
  },

  line: {
    label: 'Line',
    description: 'Show trends over an ordered axis',
    slots: {
      x: { accepts: ['temporal', 'numeric', 'categorical'], required: true, multiple: false },
      y: { accepts: ['numeric'], required: true, multiple: true },
      color: { accepts: ['categorical', 'boolean'], required: false, multiple: false },
    },
    aggregationAvailable: true,
  },

  scatter: {
    label: 'Scatter',
    description: 'Explore relationships between two numeric variables',
    slots: {
      x: { accepts: ['numeric'], required: true, multiple: false },
      y: { accepts: ['numeric'], required: true, multiple: false },
      color: { accepts: ['categorical', 'boolean', 'numeric'], required: false, multiple: false },
      size:  { accepts: ['numeric'], required: false, multiple: false },
    },
    aggregationAvailable: false,
  },

  pie: {
    label: 'Pie',
    description: 'Show part-to-whole relationships',
    slots: {
      x: { accepts: ['categorical', 'boolean'], required: true, multiple: false, maxCardinality: 20 },
      y: { accepts: ['numeric'], required: true, multiple: false },
    },
    aggregationAvailable: true,
  },

  area: {
    label: 'Area',
    description: 'Show trends with emphasis on cumulative volume',
    slots: {
      x: { accepts: ['temporal', 'numeric', 'categorical'], required: true, multiple: false },
      y: { accepts: ['numeric'], required: true, multiple: true },
      color: { accepts: ['categorical', 'boolean'], required: false, multiple: false },
    },
    aggregationAvailable: true,
  },

  histogram: {
    label: 'Histogram',
    description: 'Show the distribution of a numeric variable',
    slots: {
      x: { accepts: ['numeric'], required: true, multiple: false },
    },
    aggregationAvailable: false,
  },

  box: {
    label: 'Box plot',
    description: 'Compare distributions across groups',
    slots: {
      x: { accepts: ['categorical', 'boolean', 'temporal'], required: false, multiple: false },
      y: { accepts: ['numeric'], required: true, multiple: true },
    },
    aggregationAvailable: false,
  },

  heatmap: {
    label: 'Heatmap',
    description: 'Show a matrix of values by two categorical axes',
    slots: {
      x:     { accepts: ['categorical', 'boolean', 'temporal'], required: true, multiple: false },
      y:     { accepts: ['categorical', 'boolean', 'temporal'], required: true, multiple: false },
      value: { accepts: ['numeric'], required: true, multiple: false },
    },
    aggregationAvailable: true,
  },
}
