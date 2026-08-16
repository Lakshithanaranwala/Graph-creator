import { useProfileStore } from '@/store/profileStore'
import { ColumnProfileRow } from '@/components/ColumnProfileRow'

export function ProfilePanel() {
  const profiles = useProfileStore((s) => s.profiles)

  if (profiles.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/* Column header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          paddingBottom: '4px',
          borderBottom: '1px solid var(--c-rule)',
          marginBottom: '2px',
        }}
      >
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--c-muted)',
            flex: 1,
          }}
        >
          Columns
        </span>
        <span
          style={{
            fontSize: '0.65rem',
            color: 'var(--c-muted)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          uniq
        </span>
        <span
          style={{
            fontSize: '0.65rem',
            color: 'var(--c-muted)',
            width: '58px',
            textAlign: 'right',
          }}
        >
          null
        </span>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {profiles.map((p) => (
          <ColumnProfileRow key={p.index} profile={p} />
        ))}
      </ul>
    </div>
  )
}
