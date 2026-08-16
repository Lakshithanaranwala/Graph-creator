type Props = {
  pct: number      // 0–100
  message: string
}

export function ProgressBar({ pct, message }: Props) {
  const clamped = Math.min(100, Math.max(0, pct))

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        width: '100%',
        height: '100%',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: '0.9rem',
          color: 'var(--c-ink)',
        }}
      >
        {message}
      </p>

      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Parsing: ${clamped}%`}
        style={{
          width: '240px',
          height: '4px',
          background: 'var(--c-rule)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${clamped}%`,
            background: 'var(--c-accent)',
            borderRadius: '2px',
            transition: 'width 0.2s ease',
          }}
        />
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>
        {clamped}%
      </p>
    </div>
  )
}
