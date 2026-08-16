import { useEffect } from 'react'
import { LeftSidebar } from '@/components/LeftSidebar'
import { ChartCanvas } from '@/components/ChartCanvas'
import { RightSidebar } from '@/components/RightSidebar'
import { useParseWorker } from '@/hooks/useParseWorker'
import { useDatasetStore } from '@/store/datasetStore'
import { getRecentFiles } from '@/lib/db'

export function App() {
  const { parse } = useParseWorker()
  const setRecentFiles = useDatasetStore((s) => s.setRecentFiles)

  // Hydrate the recent-files list from IndexedDB on startup.
  useEffect(() => {
    getRecentFiles()
      .then(setRecentFiles)
      .catch(() => {/* IDB unavailable — private browsing, etc. */})
  }, [setRecentFiles])

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
      <LeftSidebar />
      <ChartCanvas onFile={parse} />
      <RightSidebar />
    </div>
  )
}
