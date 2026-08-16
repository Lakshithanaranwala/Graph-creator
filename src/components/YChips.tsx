import type { ColumnProfile } from '@/types/profile'
import type { InferredType } from '@/types/profile'

type Props = {
  selected: string[]
  accepts: InferredType[]
  profiles: ColumnProfile[]
  onChange: (columns: string[]) => void
}

export function YChips({ selected, accepts, profiles, onChange }: Props) {
  const compatible = profiles.filter((p) => accepts.includes(p.inferredType))
  const available = compatible.filter((p) => !selected.includes(p.name))

  function remove(name: string) {
    onChange(selected.filter((s) => s !== name))
  }

  function add(name: string) {
    if (name && !selected.includes(name)) onChange([...selected, name])
  }

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
        Y axis <span style={{ color: 'var(--c-accent)' }}>*</span>
      </label>

      {/* Chips for currently selected Y columns */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {selected.map((name) => (
            <span
              key={name}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 6px',
                background: 'rgba(47,111,235,0.1)',
                border: '1px solid rgba(47,111,235,0.3)',
                borderRadius: 'var(--r-md)',
                fontSize: '0.72rem',
                color: 'var(--c-accent)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {name}
              <button
                type="button"
                aria-label={`Remove ${name}`}
                onClick={() => remove(name)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--c-accent)',
                  padding: '0',
                  lineHeight: 1,
                  fontSize: '0.85rem',
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown to add more columns */}
      {available.length > 0 && (
        <select
          value=""
          onChange={(e) => add(e.target.value)}
          style={{
            width: '100%',
            padding: '5px 8px',
            border: '1px solid var(--c-rule)',
            borderRadius: 'var(--r-md)',
            background: 'var(--c-ground)',
            color: 'var(--c-muted)',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
          }}
        >
          <option value="">Add Y column…</option>
          {available.map((p) => (
            <option key={p.index} value={p.name}>
              {p.name} ({p.distinctCount} distinct)
            </option>
          ))}
        </select>
      )}

      {selected.length === 0 && available.length === 0 && (
        <p style={{ fontSize: '0.72rem', color: 'var(--c-muted)' }}>No numeric columns available.</p>
      )}
    </div>
  )
}
