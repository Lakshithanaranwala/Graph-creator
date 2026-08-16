import { create } from 'zustand'
import type { ChartSpec } from '@/types/chart'

type AppState = {
  // The active chart spec. Null until the user has configured a chart.
  activeSpec: ChartSpec | null
  // The dataset id currently loaded in memory.
  activeDatasetId: string | null
  setActiveSpec: (spec: ChartSpec) => void
  setActiveDatasetId: (id: string) => void
  resetSpec: () => void
}

export const useChartStore = create<AppState>((set) => ({
  activeSpec: null,
  activeDatasetId: null,
  setActiveSpec: (spec) => set({ activeSpec: spec }),
  setActiveDatasetId: (id) => set({ activeDatasetId: id }),
  resetSpec: () => set({ activeSpec: null, activeDatasetId: null }),
}))
