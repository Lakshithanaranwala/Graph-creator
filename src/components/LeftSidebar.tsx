import { useDatasetStore, selectHeaderRow } from '@/store/datasetStore'
import { HeaderRowControl } from '@/components/HeaderRowControl'
import { RecentFiles } from '@/components/RecentFiles'

export function LeftSidebar() {
  const state = useDatasetStore()
  const { phase, dataset, activeSheetIndex, recentFiles } = state

  const activeSheet = dataset?.sheets[activeSheetIndex]
  const detectedRow = activeSheet?.detectedHeaderRow ?? 0
  const currentRow = selectHeaderRow(state)
  const maxRow = (activeSheet?.rawRows.length ?? 1) - 1

  return (
    <aside
      aria-label="Data and encoding controls"
      style={{
        width: '15rem',
        minWidth: '15rem',
        background: 'var(--c-panel)',
        borderRight: '1px solid var(--c-rule)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Wordmark */}
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--c-rule)',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: '0.9rem',
          letterSpacing: '0.01em',
          color: 'var(--c-ink)',
          flexShrink: 0,
        }}
      >
        SheetChart
      </div>

      <div
        style={{
          padding: '16px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Sheet info + header row control when a sheet is active */}
        {phase === 'preview' && activeSheet && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'var(--c-muted)',
                }}
              >
                Active sheet
              </p>
              <p
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--c-ink)',
                }}
              >
                {activeSheet.name}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--c-muted)' }}>
                {activeSheet.rawRows.length - detectedRow - 1} rows ·{' '}
                {activeSheet.rawRows[detectedRow]?.length ?? 0} cols
              </p>
            </div>

            <HeaderRowControl
              detectedRow={detectedRow}
              currentRow={currentRow}
              maxRow={maxRow}
              onChange={state.setHeaderRowOverride}
              onReset={() => state.setHeaderRowOverride(null)}
            />
          </>
        )}

        {/* Recent files pushed to the bottom */}
        {phase !== 'parsing' && (
          <div style={{ marginTop: 'auto' }}>
            {recentFiles.length > 0 ? (
              <RecentFiles files={recentFiles} />
            ) : phase === 'idle' ? (
              <p style={{ color: 'var(--c-muted)', fontSize: '0.8rem' }}>
                Drop a file to get started.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  )
}
