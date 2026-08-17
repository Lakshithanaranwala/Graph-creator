import { StylePanel } from '@/components/StylePanel'
import { ExportPanel } from '@/components/ExportPanel'

export function RightSidebar() {
  return (
    <aside
      aria-label="Style and export controls"
      style={{
        width: '13rem',
        minWidth: '13rem',
        background: 'var(--c-panel)',
        borderLeft: '1px solid var(--c-rule)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* ── Style ─────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--c-rule)',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: '0.78rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--c-muted)',
          flexShrink: 0,
        }}
      >
        Style
      </div>
      <div style={{ padding: '14px', borderBottom: '1px solid var(--c-rule)' }}>
        <StylePanel />
      </div>

      {/* ── Export ────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--c-rule)',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: '0.78rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--c-muted)',
          flexShrink: 0,
        }}
      >
        Export
      </div>
      <div style={{ padding: '14px' }}>
        <ExportPanel />
      </div>
    </aside>
  )
}
