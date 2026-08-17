import { lazy, Suspense } from 'react'
import { toPlotly } from '@/lib/toPlotly'
import type { TransformOutput } from '@/types/transform'
import type { ChartSpec } from '@/types/chart'

// Dynamically import react-plotly.js so the large Plotly bundle is code-split
// and doesn't block the initial paint.
const Plot = lazy(() => import('react-plotly.js'))

const MM_TO_PX = 96 / 25.4

type Props = {
  output: TransformOutput
  spec: ChartSpec
}

export function PlotlyChart({ output, spec }: Props) {
  const figure = toPlotly(output, spec)
  const widthPx = Math.round((spec.style.widthMm ?? 180) * MM_TO_PX)
  const heightPx = Math.round(widthPx * 0.65)

  return (
    <div
      style={{
        flex: 1,
        overflow: 'auto',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--c-ground)',
      }}
    >
      {/* Size card — matches the export dimensions exactly */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 'var(--r-md)',
          border: '1px solid var(--c-rule)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          flexShrink: 0,
          width: widthPx + 'px',
          height: heightPx + 'px',
        }}
      >
        <Suspense
          fallback={
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--c-muted)',
                fontSize: '0.8rem',
              }}
            >
              Loading chart…
            </div>
          }
        >
          <Plot
            data={figure.data}
            layout={{
              ...figure.layout,
              autosize: false,
              width: widthPx,
              height: heightPx,
            }}
            config={{
              responsive: false,
              displayModeBar: true,
              displaylogo: false,
              modeBarButtonsToRemove: ['select2d', 'lasso2d'],
              toImageButtonOptions: {
                format: 'svg',
                filename: spec.style.title || 'chart',
                width: widthPx,
                height: heightPx,
              },
            }}
            style={{ display: 'block' }}
            useResizeHandler={false}
          />
        </Suspense>
      </div>
    </div>
  )
}

// ── Empty / computing / error states ──────────────────────────────────────

export function ChartEmpty() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        color: 'var(--c-muted)',
      }}
    >
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" style={{ opacity: 0.35 }}>
        <rect x="6"  y="28" width="10" height="14" rx="2" fill="currentColor" />
        <rect x="19" y="18" width="10" height="24" rx="2" fill="currentColor" />
        <rect x="32" y="22" width="10" height="20" rx="2" fill="currentColor" />
      </svg>
      <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>Pick a chart type to get started</p>
      <p style={{ fontSize: '0.75rem' }}>Then assign columns in the left panel</p>
    </div>
  )
}

export function ChartComputing() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--c-muted)',
        fontSize: '0.82rem',
        gap: '10px',
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 18 18"
        aria-hidden="true"
        style={{ animation: 'spin 0.9s linear infinite' }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <circle cx="9" cy="9" r="7" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="22 10" />
      </svg>
      Computing…
    </div>
  )
}

export function ChartError({ message }: { message: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '32px',
      }}
    >
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true" style={{ color: '#D55E00', opacity: 0.8 }}>
        <path
          d="M18 3L33 30H3L18 3Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <line x1="18" y1="14" x2="18" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="18" cy="26" r="1.5" fill="currentColor" />
      </svg>
      <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--c-ink)' }}>
        Can't render chart
      </p>
      <p
        style={{
          fontSize: '0.75rem',
          color: 'var(--c-muted)',
          textAlign: 'center',
          maxWidth: '28ch',
        }}
      >
        {message}
      </p>
    </div>
  )
}
