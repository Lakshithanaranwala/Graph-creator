type Props = {
  detectedRow: number   // 0-based, auto-detected
  currentRow: number    // 0-based, currently active (may be overridden)
  maxRow: number        // highest valid row index
  onChange: (row: number) => void
  onReset: () => void
}

export function HeaderRowControl({ detectedRow, currentRow, maxRow, onChange, onReset }: Props) {
  const isOverridden = currentRow !== detectedRow

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = parseInt(e.target.value, 10)
    if (!Number.isNaN(v) && v >= 1 && v - 1 <= maxRow) {
      onChange(v - 1)  // store 0-based, display 1-based
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label
        htmlFor="header-row-input"
        style={{
          fontSize: '0.75rem',
          fontWeight: 500,
          color: 'var(--c-muted)',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        Header row
      </label>

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <input
          id="header-row-input"
          type="number"
          min={1}
          max={maxRow + 1}
          value={currentRow + 1}
          onChange={handleChange}
          style={{
            width: '60px',
            padding: '4px 8px',
            border: `1px solid ${isOverridden ? 'var(--c-accent)' : 'var(--c-rule)'}`,
            borderRadius: 'var(--r-base)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.85rem',
            color: 'var(--c-ink)',
            background: 'var(--c-panel)',
            outline: 'none',
          }}
        />

        {isOverridden && (
          <button
            type="button"
            onClick={onReset}
            title={`Reset to auto-detected row ${detectedRow + 1}`}
            style={{
              padding: '4px 8px',
              fontSize: '0.75rem',
              color: 'var(--c-muted)',
              background: 'none',
              border: '1px solid var(--c-rule)',
              borderRadius: 'var(--r-base)',
              cursor: 'pointer',
            }}
          >
            Reset
          </button>
        )}
      </div>

      {!isOverridden && (
        <p style={{ fontSize: '0.72rem', color: 'var(--c-muted)' }}>
          Auto-detected
        </p>
      )}
    </div>
  )
}
