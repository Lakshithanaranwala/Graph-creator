import { useEffect } from 'react'
import { useDatasetStore, selectHeaderRow } from '@/store/datasetStore'
import { useProfileStore } from '@/store/profileStore'
import { profileDataset } from '@/lib/profile'

// Recomputes column profiles whenever the active sheet or header row changes.
// Overrides are cleared when the sheet changes but survive header-row adjustments
// so the user doesn't lose manual corrections when tweaking the header row.
export function useProfiler() {
  const state = useDatasetStore()
  const { phase, dataset, activeSheetIndex } = state
  const headerRow = selectHeaderRow(state)

  const setProfiles = useProfileStore((s) => s.setProfiles)
  const clearOverrides = useProfileStore((s) => s.clearOverrides)

  // Clear overrides when the loaded dataset or active sheet changes
  useEffect(() => {
    clearOverrides()
  }, [dataset?.id, activeSheetIndex, clearOverrides])

  // Recompute profiles when any profiling input changes
  useEffect(() => {
    if (phase !== 'preview' || !dataset) {
      setProfiles([])
      return
    }
    const sheet = dataset.sheets[activeSheetIndex]
    if (!sheet) return

    const profiles = profileDataset(sheet.rawRows, headerRow)
    setProfiles(profiles)
  }, [phase, dataset, activeSheetIndex, headerRow, setProfiles])
}
