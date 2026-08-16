import { useState } from 'react'
import { CHART_RULES } from '@/lib/chartRules'
import type { FeasibilityResult } from '@/lib/chartFeasibility'
import type { ChartType } from '@/types/chart'

// ── Inline SVG icons (40×40 viewBox) ─────────────────────────────────────

const ICONS: Record<ChartType, React.ReactNode> = {
  bar: (
    <g fill="currentColor">
      <rect x="5"  y="22" width="8" height="14" rx="1" />
      <rect x="16" y="12" width="8" height="24" rx="1" />
      <rect x="27" y="17" width="8" height="19" rx="1" />
    </g>
  ),
  line: (
    <polyline
      fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      points="4,30 12,20 20,26 28,10 36,16"
    />
  ),
  scatter: (
    <g fill="currentColor">
      <circle cx="10" cy="28" r="3.5" />
      <circle cx="18" cy="13" r="3.5" />
      <circle cx="26" cy="22" r="3.5" />
      <circle cx="32" cy="9"  r="3.5" />
      <circle cx="14" cy="20" r="3.5" />
      <circle cx="30" cy="26" r="3.5" />
    </g>
  ),
  pie: (
    <>
      <circle cx="20" cy="20" r="14" fill="currentColor" opacity="0.18" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 20 L20 6 A14 14 0 0 1 32.12 27 Z" fill="currentColor" />
    </>
  ),
  area: (
    <path
      d="M4,32 L4,22 L12,14 L20,18 L28,8 L36,14 L36,32 Z"
      fill="currentColor" opacity="0.28"
      stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
    />
  ),
  histogram: (
    <g fill="currentColor">
      <rect x="4"  y="8"  width="10" height="28" rx="1" />
      <rect x="15" y="16" width="10" height="20" rx="1" />
      <rect x="26" y="21" width="10" height="15" rx="1" />
    </g>
  ),
  box: (
    <g stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round">
      <line x1="20" y1="4"  x2="20" y2="12" />
      <line x1="14" y1="4"  x2="26" y2="4" />
      <rect x="10" y="12" width="20" height="16" />
      <line x1="10" y1="20" x2="30" y2="20" />
      <line x1="20" y1="28" x2="20" y2="36" />
      <line x1="14" y1="36" x2="26" y2="36" />
    </g>
  ),
  heatmap: (
    <g fill="currentColor">
      {[0, 1, 2].flatMap((row) =>
        [0, 1, 2].map((col) => {
          const opacities = [[0.2, 0.6, 0.9], [0.5, 0.3, 0.75], [0.85, 0.45, 0.15]]
          return (
            <rect
              key={`${row}-${col}`}
              x={4 + col * 11} y={4 + row * 11}
              width={9} height={9} rx={1}
              opacity={opacities[row]![col]}
            />
          )
        }),
      )}
    </g>
  ),
}

// ── Tile ─────────────────────────────────────────────────────────────────

type Props = {
  type: ChartType
  feasibility: FeasibilityResult
  isSelected: boolean
  onSelect: (type: ChartType) => void
}

export function ChartTypeTile({ type, feasibility, isSelected, onSelect }: Props) {
  const [hovered, setHovered] = useState(false)
  const rule = CHART_RULES[type]
  const { status } = feasibility
  const isClickable = status !== 'unsupported'

  const borderColor = isSelected
    ? 'var(--c-accent)'
    : status === 'warned' && hovered
    ? '#D97706'
    : hovered && isClickable
    ? 'var(--c-accent)'
    : 'var(--c-rule)'

  const iconColor =
    status === 'unsupported'
      ? 'var(--c-muted)'
      : status === 'warned'
      ? '#D97706'
      : isSelected
      ? 'var(--c-accent)'
      : 'var(--c-ink)'

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        aria-pressed={isSelected}
        aria-label={`${rule.label} — ${rule.description}`}
        disabled={!isClickable}
        onClick={() => isClickable && onSelect(type)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '14px 10px 12px',
          width: '100%',
          background: isSelected ? 'rgba(47,111,235,0.06)' : 'var(--c-panel)',
          border: `1.5px solid ${borderColor}`,
          borderRadius: 'var(--r-md)',
          cursor: isClickable ? 'pointer' : 'not-allowed',
          opacity: status === 'unsupported' ? 0.45 : 1,
          transition: 'border-color 0.12s ease, background 0.12s ease',
        }}
      >
        <svg
          width="36" height="36" viewBox="0 0 40 40"
          aria-hidden="true"
          style={{ color: iconColor, transition: 'color 0.12s ease' }}
        >
          {ICONS[type]}
        </svg>

        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: '0.72rem',
            color: status === 'unsupported' ? 'var(--c-muted)' : 'var(--c-ink)',
            whiteSpace: 'nowrap',
          }}
        >
          {rule.label}
        </span>

        {/* Warning indicator dot */}
        {status === 'warned' && (
          <span
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#D97706',
            }}
            aria-hidden="true"
          />
        )}
      </button>

      {/* Tooltip — shown on hover when there's a reason to display */}
      {hovered && status !== 'supported' && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '200px',
            padding: '8px 10px',
            background: 'var(--c-ink)',
            color: '#fff',
            borderRadius: 'var(--r-md)',
            fontSize: '0.72rem',
            lineHeight: 1.45,
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          {'reason' in feasibility ? feasibility.reason : ''}
          {/* Caret */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: `5px solid var(--c-ink)`,
            }}
          />
        </div>
      )}
    </div>
  )
}
