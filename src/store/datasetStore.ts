import { create } from 'zustand'
import type { ParsedDataset, RecentFile } from '@/types/dataset'
import type { ChartType } from '@/types/chart'

export type AppPhase = 'idle' | 'parsing' | 'sheetPick' | 'preview'
export type ParseError = { reason: string; hint: string }
export type ParseProgress = { pct: number; message: string }

type DatasetState = {
  phase: AppPhase
  dataset: ParsedDataset | null
  activeSheetIndex: number
  // null means use the auto-detected value from the sheet
  headerRowOverride: number | null
  parseProgress: ParseProgress | null
  parseError: ParseError | null
  recentFiles: RecentFile[]
  // Chart type the user has chosen in the picker (null = not chosen yet)
  selectedChartType: ChartType | null

  setPhase: (phase: AppPhase) => void
  setDataset: (dataset: ParsedDataset) => void
  setActiveSheetIndex: (index: number) => void
  setHeaderRowOverride: (row: number | null) => void
  setParseProgress: (p: ParseProgress | null) => void
  setParseError: (e: ParseError | null) => void
  setRecentFiles: (files: RecentFile[]) => void
  setSelectedChartType: (type: ChartType | null) => void
  reset: () => void
}

export const useDatasetStore = create<DatasetState>((set) => ({
  phase: 'idle',
  dataset: null,
  activeSheetIndex: 0,
  headerRowOverride: null,
  parseProgress: null,
  parseError: null,
  recentFiles: [],
  selectedChartType: null,

  setPhase: (phase) => set({ phase }),
  setDataset: (dataset) => set({ dataset }),
  setActiveSheetIndex: (index) =>
    set({ activeSheetIndex: index, headerRowOverride: null, selectedChartType: null }),
  setHeaderRowOverride: (row) => set({ headerRowOverride: row }),
  setParseProgress: (parseProgress) => set({ parseProgress }),
  setParseError: (parseError) => set({ parseError }),
  setRecentFiles: (recentFiles) => set({ recentFiles }),
  setSelectedChartType: (selectedChartType) => set({ selectedChartType }),
  reset: () =>
    set({
      phase: 'idle',
      dataset: null,
      activeSheetIndex: 0,
      headerRowOverride: null,
      parseProgress: null,
      parseError: null,
      selectedChartType: null,
    }),
}))

// Selector: the active header row index (respects user override).
export function selectHeaderRow(
  state: Pick<DatasetState, 'headerRowOverride' | 'dataset' | 'activeSheetIndex'>,
): number {
  if (state.headerRowOverride !== null) return state.headerRowOverride
  return state.dataset?.sheets[state.activeSheetIndex]?.detectedHeaderRow ?? 0
}
