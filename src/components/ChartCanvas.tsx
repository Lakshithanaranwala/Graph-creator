import { useDatasetStore, selectHeaderRow } from '@/store/datasetStore'
import { useTransformStore } from '@/store/transformStore'
import { useTransform } from '@/hooks/useTransform'
import { DropZone } from '@/components/DropZone'
import { ProgressBar } from '@/components/ProgressBar'
import { ErrorBanner } from '@/components/ErrorBanner'
import { SheetPicker } from '@/components/SheetPicker'
import { PreviewTable } from '@/components/PreviewTable'
import { ChartTypePicker } from '@/components/ChartTypePicker'
import { DownsampleNotice } from '@/components/DownsampleNotice'

type Props = {
  onFile: (file: File) => void
}

export function ChartCanvas({ onFile }: Props) {
  // Run the transform pipeline whenever spec or data changes
  useTransform()

  const state = useDatasetStore()
  const { phase, dataset, activeSheetIndex, parseProgress, parseError } = state

  const activeSheet = dataset?.sheets[activeSheetIndex]
  const headerRow = selectHeaderRow(state)

  const transformResult = useTransformStore((s) => s.result)

  function handleSheetSelect(index: number) {
    state.setActiveSheetIndex(index)
    state.setPhase('preview')
  }

  function handleDismissError() {
    state.setParseError(null)
    state.reset()
  }

  // Extract downsample info from the transform result if available
  const downsampleInfo =
    transformResult?.ok &&
    transformResult.output.kind === 'xy' &&
    transformResult.output.sampledPoints < transformResult.output.totalPoints
      ? {
          totalPoints: transformResult.output.totalPoints,
          sampledPoints: transformResult.output.sampledPoints,
        }
      : null

  return (
    <main
      aria-label="Chart canvas"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--c-ground)',
        // Padding only when the content is a centred invitation (not a table or picker)
        padding: phase === 'preview' ? '0' : '24px',
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
        <>
          {/* Chart type picker always shows at the top when data is loaded */}
          <ChartTypePicker />

          {/* Downsample notice — shown when points were reduced */}
          {downsampleInfo && (
            <DownsampleNotice
              totalPoints={downsampleInfo.totalPoints}
              sampledPoints={downsampleInfo.sampledPoints}
            />
          )}

          {/* Preview table fills the remaining space and scrolls internally */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <PreviewTable rawRows={activeSheet.rawRows} headerRowIndex={headerRow} />
          </div>
        </>
      ) : null}
    </main>
  )
}
