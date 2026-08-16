type Props = {
  totalPoints: number
  sampledPoints: number
}

export function DownsampleNotice({ totalPoints, sampledPoints }: Props) {
  if (sampledPoints >= totalPoints) return null

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        padding: '6px 16px',
        background: 'rgba(47,111,235,0.06)',
        borderBottom: '1px solid var(--c-rule)',
        fontSize: '0.72rem',
        color: 'var(--c-muted)',
      }}
    >
      Showing{' '}
      <strong style={{ color: 'var(--c-ink)' }}>{sampledPoints.toLocaleString()}</strong>
      {' '}of{' '}
      <strong style={{ color: 'var(--c-ink)' }}>{totalPoints.toLocaleString()}</strong>
      {' '}points
    </div>
  )
}
