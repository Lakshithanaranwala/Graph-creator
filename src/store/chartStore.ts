import { create } from 'zustand'
import type { ChartSpec, Aggregation } from '@/types/chart'
import type { Filter } from '@/types/chart'

type AppState = {
  activeSpec: ChartSpec | null
  activeDatasetId: string | null

  setActiveSpec: (spec: ChartSpec) => void
  setActiveDatasetId: (id: string) => void
  initSpec: (spec: ChartSpec) => void
  updateX: (column: string | null) => void
  updateY: (columns: string[]) => void
  updateColor: (column: string | null) => void
  updateValue: (column: string | null) => void
  updateAgg: (agg: Aggregation) => void
  updateStyle: (patch: Partial<ChartSpec['style']>) => void
  addFilter: (filter: Filter) => void
  removeFilter: (index: number) => void
  resetSpec: () => void
}

export const useChartStore = create<AppState>((set) => ({
  activeSpec: null,
  activeDatasetId: null,

  setActiveSpec: (spec) => set({ activeSpec: spec }),
  setActiveDatasetId: (id) => set({ activeDatasetId: id }),

  initSpec: (spec) => set({ activeSpec: spec }),

  updateX: (column) =>
    set((s) =>
      s.activeSpec
        ? { activeSpec: { ...s.activeSpec, encodings: { ...s.activeSpec.encodings, x: column } } }
        : s,
    ),

  updateY: (columns) =>
    set((s) =>
      s.activeSpec
        ? { activeSpec: { ...s.activeSpec, encodings: { ...s.activeSpec.encodings, y: columns } } }
        : s,
    ),

  updateColor: (column) =>
    set((s) =>
      s.activeSpec
        ? { activeSpec: { ...s.activeSpec, encodings: { ...s.activeSpec.encodings, color: column } } }
        : s,
    ),

  updateValue: (column) =>
    set((s) =>
      s.activeSpec
        ? { activeSpec: { ...s.activeSpec, encodings: { ...s.activeSpec.encodings, value: column } } }
        : s,
    ),

  updateAgg: (agg) =>
    set((s) =>
      s.activeSpec
        ? { activeSpec: { ...s.activeSpec, encodings: { ...s.activeSpec.encodings, agg } } }
        : s,
    ),

  updateStyle: (patch) =>
    set((s) =>
      s.activeSpec
        ? { activeSpec: { ...s.activeSpec, style: { ...s.activeSpec.style, ...patch } } }
        : s,
    ),

  addFilter: (filter) =>
    set((s) =>
      s.activeSpec
        ? { activeSpec: { ...s.activeSpec, filters: [...s.activeSpec.filters, filter] } }
        : s,
    ),

  removeFilter: (index) =>
    set((s) =>
      s.activeSpec
        ? {
            activeSpec: {
              ...s.activeSpec,
              filters: s.activeSpec.filters.filter((_, i) => i !== index),
            },
          }
        : s,
    ),

  resetSpec: () => set({ activeSpec: null, activeDatasetId: null }),
}))
