import { describe, it, expect, beforeEach } from 'vitest'
import { useChartStore } from '@/store/chartStore'
import type { ChartSpec } from '@/types/chart'

const mockSpec: ChartSpec = {
  id: 'test-1',
  datasetId: 'ds-1',
  sheetName: 'Sheet1',
  chartType: 'bar',
  encodings: { x: 'month', y: ['revenue'], agg: 'sum' },
  filters: [],
  style: {
    palette: 'default',
    showLegend: true,
    showGrid: true,
  },
}

describe('chartStore', () => {
  beforeEach(() => {
    useChartStore.getState().resetSpec()
  })

  it('starts with no active spec', () => {
    expect(useChartStore.getState().activeSpec).toBeNull()
  })

  it('sets and retrieves the active spec', () => {
    useChartStore.getState().setActiveSpec(mockSpec)
    expect(useChartStore.getState().activeSpec).toEqual(mockSpec)
  })

  it('resets the spec back to null', () => {
    useChartStore.getState().setActiveSpec(mockSpec)
    useChartStore.getState().resetSpec()
    expect(useChartStore.getState().activeSpec).toBeNull()
    expect(useChartStore.getState().activeDatasetId).toBeNull()
  })
})
