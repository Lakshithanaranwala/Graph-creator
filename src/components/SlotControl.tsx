import type { ColumnProfile } from '@/types/profile'
import type { InferredType } from '@/types/profile'

type Props = {
  label: string
  value: string | null
  accepts: InferredType[]
  profiles: ColumnProfile[]
  required: boolean
  onChange: (value: string | null) => void
}

const TYPE_ORDER: InferredType[] = ['temporal', 'numeric', 'categorical', 'boolean', 'mixed', 'empty']

const TYPE_LABEL: Record<InferredType, string> = {
  temporal: 'Date/Time',
  numeric: 'Numeric',
  categorical: 'Categorical',
  boolean: 'Boolean',
  mixed: 'Mixed',
  empty: 'Empty',
}

export function SlotControl({ label, value, accepts, profiles, required, onChange }: Props) {
  // Filter to only compatible profiles, grouped by type
  const compatible = profiles.filter((p) => accepts.includes(p.inferredType))

  const grouped = TYPE_ORDER.reduce<Record<string, ColumnProfile[]>>((acc, type) => {
    const cols = compatible.filter((p) => p.inferredType === type)
    if (cols.length > 0) acc[TYPE_LABEL[type]] = cols
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label
        style={{
          fontSize: '0.68rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--c-muted)',
        }}
      >
        {label}
        {required && (
          <span style={{ color: 'var(--c-accent)', marginLeft: '2px' }} aria-label="required">
            *
          </span>
        )}
      </label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        style={{
          width: '100%',
          padding: '5px 8px',
          border: '1px solid var(--c-rule)',
          borderRadius: 'var(--r-md)',
          background: 'var(--c-ground)',
          color: value ? 'var(--c-ink)' : 'var(--c-muted)',
          fontSize: '0.78rem',
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
        }}
      >
        <option value="">{required ? 'Select column…' : 'None'}</option>
        {Object.entries(grouped).map(([groupLabel, cols]) => (
          <optgroup key={groupLabel} label={groupLabel}>
            {cols.map((p) => (
              <option key={p.index} value={p.name}>
                {p.name} ({p.distinctCount} distinct)
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
