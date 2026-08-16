import { useChartStore } from '@/store/chartStore'
import { useProfileStore } from '@/store/profileStore'
import { useDatasetStore } from '@/store/datasetStore'
import { getSmartDefaults } from '@/lib/smartDefaults'
import { CHART_RULES } from '@/lib/chartRules'
import { SlotControl } from '@/components/SlotControl'
import { YChips } from '@/components/YChips'
import { AggControl } from '@/components/AggControl'
import { FilterBuilder } from '@/components/FilterBuilder'
import type { ChartType, Aggregation, Filter } from '@/types/chart'
import type { InferredType } from '@/types/profile'

type Props = {
  chartType: ChartType
}

export function EncoderPanel({ chartType }: Props) {
  const store = useChartStore()
  const { activeSpec, updateX, updateY, updateColor, updateValue, updateAgg, addFilter, removeFilter, initSpec } = store

  const profiles = useProfileStore((s) => s.profiles)
  const typeOverrides = useProfileStore((s) => s.typeOverrides)
  const dataset = useDatasetStore((s) => s.dataset)
  const activeSheetIndex = useDatasetStore((s) => s.activeSheetIndex)

  // Apply user overrides to profiles so slot filtering reflects manual changes
  const effectiveProfiles = profiles.map((p) =>
    typeOverrides[p.index] !== undefined
      ? { ...p, inferredType: typeOverrides[p.index]! }
      : p,
  )

  const rule = CHART_RULES[chartType]
  const spec = activeSpec
  const encodings = spec?.encodings

  function handleSmartDefaults() {
    if (!dataset) return
    const activeSheet = dataset.sheets[activeSheetIndex]
    if (!activeSheet) return
    const defaults = getSmartDefaults(
      effectiveProfiles,
      chartType,
      dataset.id,
      activeSheet.name,
    )
    initSpec(defaults)
  }

  // Determine if aggregation should be enabled:
  // Only when X has at least one column with repeated values (distinct < total data rows)
  const xProfile = encodings?.x
    ? effectiveProfiles.find((p) => p.name === encodings.x)
    : null
  const aggEnabled =
    rule.aggregationAvailable &&
    xProfile !== null &&
    xProfile !== undefined

  const xSlot = rule.slots.x
  const ySlot = rule.slots.y
  const colorSlot = rule.slots.color
  const sizeSlot = rule.slots.size
  const valueSlot = rule.slots.value

  function handleFilterChange(index: number, filter: Filter) {
    if (!spec) return
    const newFilters = [...spec.filters]
    newFilters[index] = filter
    store.setActiveSpec({ ...spec, filters: newFilters })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header with smart defaults button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p
          style={{
            fontSize: '0.68rem',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--c-muted)',
          }}
        >
          Encodings
        </p>
        <button
          type="button"
          onClick={handleSmartDefaults}
          style={{
            padding: '3px 8px',
            border: '1px solid var(--c-accent)',
            borderRadius: 'var(--r-md)',
            background: 'none',
            color: 'var(--c-accent)',
            fontSize: '0.68rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Smart defaults
        </button>
      </div>

      {/* X axis */}
      {xSlot && (
        <SlotControl
          label="X axis"
          value={encodings?.x ?? null}
          accepts={xSlot.accepts as InferredType[]}
          profiles={effectiveProfiles}
          required={xSlot.required}
          onChange={updateX}
        />
      )}

      {/* Y axis — single for scatter/pie/heatmap, multi for bar/line/area/box */}
      {ySlot && (
        ySlot.multiple ? (
          <YChips
            selected={encodings?.y ?? []}
            accepts={ySlot.accepts as InferredType[]}
            profiles={effectiveProfiles}
            onChange={updateY}
          />
        ) : (
          <SlotControl
            label="Y axis"
            value={encodings?.y[0] ?? null}
            accepts={ySlot.accepts as InferredType[]}
            profiles={effectiveProfiles}
            required={ySlot.required}
            onChange={(v) => updateY(v ? [v] : [])}
          />
        )
      )}

      {/* Heatmap value slot */}
      {valueSlot && (
        <SlotControl
          label="Value"
          value={encodings?.value ?? null}
          accepts={valueSlot.accepts as InferredType[]}
          profiles={effectiveProfiles}
          required={valueSlot.required}
          onChange={updateValue}
        />
      )}

      {/* Color encoding */}
      {colorSlot && (
        <SlotControl
          label="Color"
          value={encodings?.color ?? null}
          accepts={colorSlot.accepts as InferredType[]}
          profiles={effectiveProfiles}
          required={colorSlot.required}
          onChange={updateColor}
        />
      )}

      {/* Size encoding (scatter only) */}
      {sizeSlot && (
        <SlotControl
          label="Size"
          value={encodings?.size ?? null}
          accepts={sizeSlot.accepts as InferredType[]}
          profiles={effectiveProfiles}
          required={sizeSlot.required}
          onChange={(v) => store.setActiveSpec(spec ? { ...spec, encodings: { ...spec.encodings, size: v } } : spec!)}
        />
      )}

      {/* Aggregation */}
      {rule.aggregationAvailable && (
        <AggControl
          value={encodings?.agg ?? 'sum'}
          enabled={aggEnabled}
          onChange={updateAgg as (agg: Aggregation) => void}
        />
      )}

      {/* Filters */}
      {spec && (
        <FilterBuilder
          filters={spec.filters}
          profiles={effectiveProfiles}
          onAdd={addFilter}
          onRemove={removeFilter}
          onChange={handleFilterChange}
        />
      )}
    </div>
  )
}
