import { useDatasetStore, selectHeaderRow } from '@/store/datasetStore'
import { DropZone } from '@/components/DropZone'
import { ProgressBar } from '@/components/ProgressBar'
import { ErrorBanner } from '@/components/ErrorBanner'
import { SheetPicker } from '@/components/SheetPicker'
import { PreviewTable } from '@/components/PreviewTable'

type Props = {
  onFile: (file: File) => void
}

export function ChartCanvas({ onFile }: Props) {
  const state = useDatasetStore()
  const { phase, dataset, activeSheetIndex, parseProgress, parseError } = state

  const activeSheet = dataset?.sheets[activeSheetIndex]
  const headerRow = selectHeaderRow(state)

  function handleSheetSelect(index: number) {
    state.setActiveSheetIndex(index)
    state.setPhase('preview')
  }

  function handleDismissError() {
    state.setParseError(null)
    state.reset()
  }

  const noPadding = phase === 'preview'

  return (
    <main
      aria-label="Chart canvas"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--c-ground)',
        padding: noPadding ? '0' : '24px',
      }}
    >
      {parseError ? (
        <ErrorBanner error={parseError} onDismiss={handleDismissError} />
      ) : phase === 'idle' ? (
        <DropZone onFile={onFile} />
      ) : phase === 'parsing' && parseProgress ? (
        <ProgressBar pct={parseProgress.pct} message={parseProgress.message} />
      ) : phase === 'sheetPick' && dataset ? (
        <SheetPicker sheets={dataset.sheets} onSelect={handleSheetSelect} />
      ) : phase === 'preview' && activeSheet ? (
        <PreviewTable rawRows={activeSheet.rawRows} headerRowIndex={headerRow} />
      ) : null}
    </main>
  )
}
