import { useProfileStore } from '@/store/profileStore'
import { useDatasetStore } from '@/store/datasetStore'
import { checkFeasibility } from '@/lib/chartFeasibility'
import { ChartTypeTile } from '@/components/ChartTypeTile'
import type { ChartType } from '@/types/chart'

const CHART_TYPES: ChartType[] = [
  'bar', 'line', 'scatter', 'pie',
  'area', 'histogram', 'box', 'heatmap',
]

export function ChartTypePicker() {
  const profiles = useProfileStore((s) => s.profiles)
  const typeOverrides = useProfileStore((s) => s.typeOverrides)
  const selectedChartType = useDatasetStore((s) => s.selectedChartType)
  const setSelectedChartType = useDatasetStore((s) => s.setSelectedChartType)

  // Apply user type overrides so feasibility reflects the user's column decisions
  const effectiveProfiles = profiles.map((p) =>
    typeOverrides[p.index] !== undefined
      ? { ...p, inferredType: typeOverrides[p.index]! }
      : p,
  )

  return (
    <div
      style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--c-rule)',
        background: 'var(--c-ground)',
      }}
    >
      <div style={{ marginBottom: '12px' }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '0.85rem',
            color: 'var(--c-ink)',
            marginBottom: '2px',
          }}
        >
          Choose a chart type
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--c-muted)' }}>
          Dimmed types need column combinations this sheet doesn't have — hover to see why.
        </p>
      </div>

      {/* 4-column grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
        }}
      >
        {CHART_TYPES.map((type) => {
          const feasibility = checkFeasibility(effectiveProfiles, type)
          return (
            <ChartTypeTile
              key={type}
              type={type}
              feasibility={feasibility}
              isSelected={selectedChartType === type}
              onSelect={setSelectedChartType}
            />
          )
        })}
      </div>

      {/* Contextual hint when a chart is selected */}
      {selectedChartType && (
        <p
          style={{
            marginTop: '10px',
            fontSize: '0.75rem',
            color: 'var(--c-accent)',
            fontWeight: 500,
          }}
        >
          {selectedChartType.charAt(0).toUpperCase() + selectedChartType.slice(1)} selected — configure encodings in the next step.
        </p>
      )}
    </div>
  )
}
