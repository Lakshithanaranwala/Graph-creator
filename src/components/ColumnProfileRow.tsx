import { useProfileStore } from '@/store/profileStore'
import type { ColumnProfile, InferredType } from '@/types/profile'

const TYPE_CONFIG: Record<InferredType, { label: string; bg: string; color: string }> = {
  numeric:     { label: '123', bg: '#EFF6FF', color: '#2563EB' },
  categorical: { label: 'Abc', bg: '#F0FDF4', color: '#059669' },
  temporal:    { label: 'Cal', bg: '#F5F3FF', color: '#7C3AED' },
  boolean:     { label: 'T/F', bg: '#FFFBEB', color: '#D97706' },
  empty:       { label: '—',   bg: '#F3F4F6', color: '#9CA3AF' },
  mixed:       { label:  '?',  bg: '#FFF1F2', color: '#DC2626' },
}

const ALL_TYPES: InferredType[] = ['numeric', 'categorical', 'temporal', 'boolean', 'empty', 'mixed']

type Props = { profile: ColumnProfile }

function NullBar({ ratio }: { ratio: number }) {
  const pct = Math.round(ratio * 100)
  const fill = ratio < 0.1 ? '#10B981' : ratio < 0.3 ? '#F59E0B' : '#EF4444'
  return (
    <div
      title={`${pct}% null`}
      style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
    >
      <div style={{ width: '32px', height: '3px', background: 'var(--c-rule)', borderRadius: '2px' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: fill, borderRadius: '2px' }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--c-muted)', width: '26px' }}>
        {pct}%
      </span>
    </div>
  )
}

export function ColumnProfileRow({ profile }: Props) {
  const expandedIndex = useProfileStore((s) => s.expandedColumnIndex)
  const setExpanded = useProfileStore((s) => s.setExpandedColumnIndex)
  const typeOverrides = useProfileStore((s) => s.typeOverrides)
  const setTypeOverride = useProfileStore((s) => s.setTypeOverride)

  const isExpanded = expandedIndex === profile.index
  const effectiveType = typeOverrides[profile.index] ?? profile.inferredType
  const cfg = TYPE_CONFIG[effectiveType]
  const isOverridden = typeOverrides[profile.index] !== undefined

  function toggle() {
    setExpanded(isExpanded ? null : profile.index)
  }

  return (
    <li style={{ listStyle: 'none' }}>
      {/* Summary row */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isExpanded}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Type pill */}
        <span
          style={{
            flexShrink: 0,
            padding: '1px 5px',
            borderRadius: 'var(--r-sm)',
            background: cfg.bg,
            color: cfg.color,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            fontWeight: 600,
            opacity: isOverridden ? 1 : profile.confidence < 0.6 ? 0.6 : 1,
            border: isOverridden ? `1px solid ${cfg.color}` : '1px solid transparent',
          }}
        >
          {cfg.label}
        </span>

        {/* Column name */}
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '0.78rem',
            color: 'var(--c-ink)',
          }}
        >
          {profile.name}
        </span>

        {/* Distinct count */}
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--c-muted)', flexShrink: 0 }}>
          {profile.distinctCount}
        </span>

        <NullBar ratio={profile.nullRatio} />
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div
          style={{
            padding: '8px 0 10px 16px',
            borderLeft: '2px solid var(--c-rule)',
            marginLeft: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {/* Type override */}
          <label style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--c-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Type
            </span>
            <select
              value={effectiveType}
              onChange={(e) => setTypeOverride(profile.index, e.target.value as InferredType)}
              style={{
                padding: '3px 6px',
                border: '1px solid var(--c-rule)',
                borderRadius: 'var(--r-base)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.78rem',
                background: 'var(--c-panel)',
                color: 'var(--c-ink)',
              }}
            >
              {ALL_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          {/* Confidence (only shown if not overridden and < 0.8) */}
          {!isOverridden && profile.confidence < 0.8 && (
            <p style={{ fontSize: '0.68rem', color: '#D97706' }}>
              Low confidence ({Math.round(profile.confidence * 100)}%)
            </p>
          )}

          {/* Numeric stats */}
          {profile.numericStats && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
              {(['min', 'max', 'mean', 'median'] as const).map((k) => (
                <span key={k} style={{ fontSize: '0.68rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>
                  {k}: {profile.numericStats![k].toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              ))}
            </div>
          )}

          {/* Temporal range */}
          {profile.temporalRange && (
            <p style={{ fontSize: '0.68rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>
              {profile.temporalRange.min.toLocaleDateString()} → {profile.temporalRange.max.toLocaleDateString()}
            </p>
          )}

          {/* Flags */}
          {(profile.isLikelyId || profile.isHighCardinality) && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {profile.isLikelyId && <Tag label="likely ID" />}
              {profile.isHighCardinality && <Tag label="high cardinality" />}
            </div>
          )}

          {/* Sample values */}
          {profile.sampleValues.length > 0 && (
            <p style={{ fontSize: '0.68rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
              e.g. {profile.sampleValues.map((v) => String(v)).join(', ')}
            </p>
          )}
        </div>
      )}
    </li>
  )
}

function Tag({ label }: { label: string }) {
  return (
    <span style={{
      padding: '1px 5px',
      borderRadius: 'var(--r-sm)',
      background: 'var(--c-ground)',
      border: '1px solid var(--c-rule)',
      fontSize: '0.65rem',
      color: 'var(--c-muted)',
    }}>
      {label}
    </span>
  )
}
