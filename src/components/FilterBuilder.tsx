import type { Filter } from '@/types/chart'
import type { ColumnProfile } from '@/types/profile'
import { FilterRow } from '@/components/FilterRow'

type Props = {
  filters: Filter[]
  profiles: ColumnProfile[]
  onAdd: (filter: Filter) => void
  onRemove: (index: number) => void
  onChange: (index: number, filter: Filter) => void
}

export function FilterBuilder({ filters, profiles, onAdd, onRemove, onChange }: Props) {
  function addFilter() {
    const firstCol = profiles[0]?.name ?? ''
    onAdd({ column: firstCol, op: '=', value: '' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <p
        style={{
          fontSize: '0.68rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--c-muted)',
        }}
      >
        Filters
      </p>

      {filters.map((f, i) => (
        <FilterRow
          key={i}
          filter={f}
          index={i}
          profiles={profiles}
          onRemove={onRemove}
          onChange={onChange}
        />
      ))}

      <button
        type="button"
        onClick={addFilter}
        style={{
          padding: '4px 8px',
          border: '1px dashed var(--c-rule)',
          borderRadius: 'var(--r-md)',
          background: 'none',
          color: 'var(--c-muted)',
          fontSize: '0.75rem',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        + Add filter
      </button>
    </div>
  )
}
