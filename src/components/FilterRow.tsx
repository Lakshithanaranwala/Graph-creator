import type { Filter } from '@/types/chart'
import type { ColumnProfile } from '@/types/profile'

type Props = {
  filter: Filter
  index: number
  profiles: ColumnProfile[]
  onRemove: (index: number) => void
  onChange: (index: number, filter: Filter) => void
}

const TEXT_OPS = ['=', '!=', 'contains', 'not contains', 'is null', 'is not null'] as const
const NUM_OPS = ['=', '!=', '<', '<=', '>', '>=', 'is null', 'is not null'] as const

function getOpsForProfile(profile: ColumnProfile | undefined) {
  if (!profile) return TEXT_OPS
  if (profile.inferredType === 'numeric' || profile.inferredType === 'temporal') return NUM_OPS
  return TEXT_OPS
}

function needsValueInput(op: string) {
  return op !== 'is null' && op !== 'is not null'
}

export function FilterRow({ filter, index, profiles, onRemove, onChange }: Props) {
  const profile = profiles.find((p) => p.name === filter.column)
  const ops = getOpsForProfile(profile)
  const showValue = needsValueInput(filter.op)

  function update(patch: Partial<Filter>) {
    onChange(index, { ...filter, ...patch })
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr auto',
        gap: '4px',
        alignItems: 'center',
      }}
    >
      {/* Column picker */}
      <select
        value={filter.column}
        onChange={(e) => update({ column: e.target.value, op: '=', value: '' })}
        style={selectStyle}
      >
        <option value="">Column…</option>
        {profiles.map((p) => (
          <option key={p.index} value={p.name}>
            {p.name}
          </option>
        ))}
      </select>

      {/* Operator picker */}
      <select
        value={filter.op}
        onChange={(e) => update({ op: e.target.value, value: '' })}
        style={selectStyle}
      >
        {ops.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>

      {/* Value input */}
      {showValue ? (
        <input
          type={profile?.inferredType === 'numeric' ? 'number' : 'text'}
          value={String(filter.value ?? '')}
          onChange={(e) => update({ value: e.target.value })}
          placeholder="value"
          style={{
            padding: '4px 6px',
            border: '1px solid var(--c-rule)',
            borderRadius: 'var(--r-md)',
            background: 'var(--c-ground)',
            color: 'var(--c-ink)',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-body)',
            width: '100%',
          }}
        />
      ) : (
        <span />
      )}

      {/* Remove button */}
      <button
        type="button"
        aria-label="Remove filter"
        onClick={() => onRemove(index)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--c-muted)',
          fontSize: '1rem',
          lineHeight: 1,
          padding: '2px',
        }}
      >
        ×
      </button>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  padding: '4px 6px',
  border: '1px solid var(--c-rule)',
  borderRadius: 'var(--r-md)',
  background: 'var(--c-ground)',
  color: 'var(--c-ink)',
  fontSize: '0.75rem',
  fontFamily: 'var(--font-body)',
  width: '100%',
}
