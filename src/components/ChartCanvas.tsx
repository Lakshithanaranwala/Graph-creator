import { useDatasetStore, selectHeaderRow } from '@/store/datasetStore'
import { useChartStore } from '@/store/chartStore'
import { useTransformStore } from '@/store/transformStore'
import { useTransform } from '@/hooks/useTransform'
import { DropZone } from '@/components/DropZone'
import { ProgressBar } from '@/components/ProgressBar'
import { ErrorBanner } from '@/components/ErrorBanner'
import { SheetPicker } from '@/components/SheetPicker'
import { PreviewTable } from '@/components/PreviewTable'
import { ChartTypePicker } from '@/components/ChartTypePicker'
import { DownsampleNotice } from '@/components/DownsampleNotice'
import { PlotlyChart, ChartEmpty, ChartComputing, ChartError } from '@/components/PlotlyChart'

type Props = {
  onFile: (file: File) => void
}

export function ChartCanvas({ onFile }: Props) {
  useTransform()

  const state = useDatasetStore()
  const { phase, dataset, activeSheetIndex, parseProgress, parseError, selectedChartType } = state
  const activeSheet = dataset?.sheets[activeSheetIndex]
  const headerRow = selectHeaderRow(state)

  const spec = useChartStore((s) => s.activeSpec)
  const { result: transformResult, computing } = useTransformStore()

  function handleSheetSelect(index: number) {
    state.setActiveSheetIndex(index)
    state.setPhase('preview')
  }

  function handleDismissError() {
    state.setParseError(null)
    state.reset()
  }

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
          <ChartTypePicker />

          {downsampleInfo && (
            <DownsampleNotice
              totalPoints={downsampleInfo.totalPoints}
              sampledPoints={downsampleInfo.sampledPoints}
            />
          )}

          {/* Main area: chart or data preview */}
          {!selectedChartType ? (
            // No chart type chosen yet — show the data preview table
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <PreviewTable rawRows={activeSheet.rawRows} headerRowIndex={headerRow} />
            </div>
          ) : !spec ? (
            // Chart type chosen but no encodings set yet
            <ChartEmpty />
          ) : computing ? (
            <ChartComputing />
          ) : transformResult && !transformResult.ok ? (
            <ChartError message={transformResult.error} />
          ) : transformResult && transformResult.ok ? (
            <PlotlyChart output={transformResult.output} spec={spec} />
          ) : (
            // spec exists but transform hasn't run yet
            <ChartEmpty />
          )}
        </>
      ) : null}
    </main>
  )
}
