import type { Aggregation } from '@/types/chart'

type Props = {
  value: Aggregation
  enabled: boolean
  onChange: (agg: Aggregation) => void
}

const AGG_OPTIONS: { value: Aggregation; label: string }[] = [
  { value: 'sum', label: 'Sum' },
  { value: 'mean', label: 'Mean' },
  { value: 'count', label: 'Count' },
  { value: 'min', label: 'Min' },
  { value: 'max', label: 'Max' },
  { value: 'median', label: 'Median' },
  { value: 'none', label: 'None (raw)' },
]

export function AggControl({ value, enabled, onChange }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label
        style={{
          fontSize: '0.68rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: enabled ? 'var(--c-muted)' : 'var(--c-rule)',
        }}
      >
        Aggregation
      </label>
      <select
        value={value}
        disabled={!enabled}
        onChange={(e) => onChange(e.target.value as Aggregation)}
        style={{
          width: '100%',
          padding: '5px 8px',
          border: '1px solid var(--c-rule)',
          borderRadius: 'var(--r-md)',
          background: enabled ? 'var(--c-ground)' : 'var(--c-rule)',
          color: enabled ? 'var(--c-ink)' : 'var(--c-muted)',
          fontSize: '0.78rem',
          fontFamily: 'var(--font-body)',
          cursor: enabled ? 'pointer' : 'not-allowed',
          opacity: enabled ? 1 : 0.6,
        }}
      >
        {AGG_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {!enabled && (
        <p style={{ fontSize: '0.68rem', color: 'var(--c-muted)' }}>
          Aggregation applies when X has repeated values.
        </p>
      )}
    </div>
  )
}
