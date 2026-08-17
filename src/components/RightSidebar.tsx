import { StylePanel } from '@/components/StylePanel'

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
      <div
        style={{
          padding: '16px',
          borderBottom: '1px solid var(--c-rule)',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: '0.8rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--c-muted)',
          flexShrink: 0,
        }}
      >
        Style &amp; export
      </div>

      <div style={{ padding: '14px', flex: 1 }}>
        <StylePanel />
      </div>
    </aside>
  )
}
