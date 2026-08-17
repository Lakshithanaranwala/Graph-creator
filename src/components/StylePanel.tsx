import { useChartStore } from '@/store/chartStore'
import { PALETTES } from '@/lib/palettes'
import type { ChartSpec, LegendPosition } from '@/types/chart'

// ── Tiny reusable sub-controls ─────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color: 'var(--c-muted)',
        marginBottom: '6px',
      }}
    >
      {children}
    </p>
  )
}

function TextInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <label style={{ fontSize: '0.7rem', color: 'var(--c-muted)' }}>{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '4px 7px',
          border: '1px solid var(--c-rule)',
          borderRadius: 'var(--r-md)',
          background: 'var(--c-ground)',
          color: 'var(--c-ink)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-body)',
          width: '100%',
        }}
      />
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
        fontSize: '0.75rem',
        color: 'var(--c-ink)',
        padding: '2px 0',
      }}
    >
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: 'var(--c-accent)', width: '14px', height: '14px', cursor: 'pointer' }}
      />
    </label>
  )
}

function NumberInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: number | undefined
  placeholder?: string
  onChange: (v: number | undefined) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <label style={{ fontSize: '0.68rem', color: 'var(--c-muted)' }}>{label}</label>
      <input
        type="number"
        value={value ?? ''}
        placeholder={placeholder ?? 'auto'}
        onChange={(e) => {
          const v = e.target.value
          onChange(v === '' ? undefined : Number(v))
        }}
        style={{
          padding: '4px 7px',
          border: '1px solid var(--c-rule)',
          borderRadius: 'var(--r-md)',
          background: 'var(--c-ground)',
          color: 'var(--c-ink)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          width: '100%',
        }}
      />
    </div>
  )
}

// ── Palette picker ─────────────────────────────────────────────────────────

function PaletteSwatches({ colors }: { colors: string[] }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {colors.slice(0, 6).map((c) => (
        <span
          key={c}
          style={{
            display: 'inline-block',
            width: '12px',
            height: '12px',
            borderRadius: '2px',
            background: c,
            border: '1px solid rgba(0,0,0,0.08)',
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  )
}

function PalettePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (key: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {PALETTES.map((p) => {
        const selected = p.key === value
        return (
          <button
            key={p.key}
            type="button"
            title={p.purpose}
            onClick={() => onChange(p.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              border: `1.5px solid ${selected ? 'var(--c-accent)' : 'var(--c-rule)'}`,
              borderRadius: 'var(--r-md)',
              background: selected ? 'rgba(47,111,235,0.05)' : 'var(--c-ground)',
              cursor: 'pointer',
              textAlign: 'left',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: selected ? 600 : 400,
                color: selected ? 'var(--c-accent)' : 'var(--c-ink)',
                flexShrink: 0,
              }}
            >
              {p.label}
            </span>
            <PaletteSwatches colors={p.colors} />
          </button>
        )
      })}
    </div>
  )
}

// ── Dimension preset picker ────────────────────────────────────────────────

const WIDTH_PRESETS = [
  { label: 'Single column (90 mm)', value: 90 },
  { label: 'Double column (180 mm)', value: 180 },
  { label: 'Slide (254 mm)', value: 254 },
] as const

function DimensionPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (mm: number) => void
}) {
  const preset = WIDTH_PRESETS.find((p) => p.value === value)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <select
        value={preset ? value : 'custom'}
        onChange={(e) => {
          if (e.target.value !== 'custom') onChange(Number(e.target.value))
        }}
        style={{
          padding: '5px 8px',
          border: '1px solid var(--c-rule)',
          borderRadius: 'var(--r-md)',
          background: 'var(--c-ground)',
          color: 'var(--c-ink)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
        }}
      >
        {WIDTH_PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
        {!preset && <option value="custom">Custom ({value} mm)</option>}
      </select>
      <NumberInput
        label="Width (mm)"
        value={value}
        placeholder="180"
        onChange={(v) => onChange(v ?? 180)}
      />
    </div>
  )
}

// ── Section divider ────────────────────────────────────────────────────────

function Divider() {
  return <hr style={{ border: 'none', borderTop: '1px solid var(--c-rule)', margin: '4px 0' }} />
}

// ── Main component ─────────────────────────────────────────────────────────

export function StylePanel() {
  const spec = useChartStore((s) => s.activeSpec)
  const updateStyle = useChartStore((s) => s.updateStyle)

  if (!spec) {
    return (
      <p style={{ color: 'var(--c-muted)', fontSize: '0.8rem' }}>
        Select a chart type and assign columns to see style options.
      </p>
    )
  }

  const { style } = spec

  function patch(p: Partial<ChartSpec['style']>) {
    updateStyle(p)
  }

  const isPie = spec.chartType === 'pie'
  const isHeatmap = spec.chartType === 'heatmap'
  const isHistogram = spec.chartType === 'histogram'
  const noYRange = isPie || isHeatmap
  const noLogX = isPie
  const noLogY = isPie || isHeatmap

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* ── Labels ────────────────────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <SectionLabel>Labels</SectionLabel>
        <TextInput
          label="Chart title"
          value={style.title ?? ''}
          placeholder="Untitled chart"
          onChange={(v) => patch({ title: v })}
        />
        {!isPie && (
          <TextInput
            label="X axis"
            value={style.xLabel ?? ''}
            placeholder={spec.encodings.x ?? 'auto'}
            onChange={(v) => patch({ xLabel: v })}
          />
        )}
        {!isPie && !isHeatmap && (
          <TextInput
            label="Y axis"
            value={style.yLabel ?? ''}
            placeholder={spec.encodings.y[0] ?? 'auto'}
            onChange={(v) => patch({ yLabel: v })}
          />
        )}
      </section>

      <Divider />

      {/* ── Palette ───────────────────────────────────────────────────── */}
      <section>
        <SectionLabel>Palette</SectionLabel>
        <PalettePicker value={style.palette} onChange={(v) => patch({ palette: v })} />
      </section>

      <Divider />

      {/* ── Display toggles ───────────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <SectionLabel>Display</SectionLabel>
        {!isPie && (
          <Toggle
            label="Legend"
            checked={style.showLegend}
            onChange={(v) => patch({ showLegend: v })}
          />
        )}
        {!isPie && style.showLegend && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingLeft: '4px' }}>
            <label style={{ fontSize: '0.68rem', color: 'var(--c-muted)' }}>Legend position</label>
            <select
              value={style.legendPosition ?? 'right'}
              onChange={(e) => patch({ legendPosition: e.target.value as LegendPosition })}
              style={{
                padding: '4px 7px',
                border: '1px solid var(--c-rule)',
                borderRadius: 'var(--r-md)',
                background: 'var(--c-ground)',
                color: 'var(--c-ink)',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
              }}
            >
              <option value="right">Right (outside)</option>
              <option value="left">Left (outside)</option>
              <option value="top">Top (horizontal)</option>
              <option value="bottom">Bottom (horizontal)</option>
              <option value="top-left">Top-left (inside)</option>
              <option value="top-right">Top-right (inside)</option>
            </select>
          </div>
        )}
        {!isPie && (
          <Toggle
            label="Grid lines"
            checked={style.showGrid}
            onChange={(v) => patch({ showGrid: v })}
          />
        )}
        <Toggle
          label="Data labels"
          checked={style.showDataLabels ?? false}
          onChange={(v) => patch({ showDataLabels: v })}
        />
      </section>

      <Divider />

      {/* ── Axis controls ─────────────────────────────────────────────── */}
      {(!noYRange || !noLogX) && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <SectionLabel>Axes</SectionLabel>

          {!noYRange && !isHistogram && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <NumberInput
                label="Y min"
                value={style.yMin}
                onChange={(v) => patch({ yMin: v })}
              />
              <NumberInput
                label="Y max"
                value={style.yMax}
                onChange={(v) => patch({ yMax: v })}
              />
            </div>
          )}

          {!noLogX && (
            <Toggle
              label="Log scale (X)"
              checked={style.xLog ?? false}
              onChange={(v) => patch({ xLog: v })}
            />
          )}
          {!noLogY && (
            <Toggle
              label="Log scale (Y)"
              checked={style.yLog ?? false}
              onChange={(v) => patch({ yLog: v })}
            />
          )}
        </section>
      )}

      {(!noYRange || !noLogX) && <Divider />}

      {/* ── Export dimensions ─────────────────────────────────────────── */}
      <section>
        <SectionLabel>Export width</SectionLabel>
        <DimensionPicker
          value={style.widthMm ?? 180}
          onChange={(v) => patch({ widthMm: v })}
        />
      </section>
    </div>
  )
}
