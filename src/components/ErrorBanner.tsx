import type { ParseError } from '@/store/datasetStore'

type Props = {
  error: ParseError
  onDismiss: () => void
}

export function ErrorBanner({ error, onDismiss }: Props) {
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '100%',
        height: '100%',
        padding: '32px',
        textAlign: 'center',
      }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="14" stroke="#E53E3E" strokeWidth="2" />
        <path d="M16 9v8M16 22v1" stroke="#E53E3E" strokeWidth="2" strokeLinecap="round" />
      </svg>

      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: '0.95rem',
          color: 'var(--c-ink)',
          maxWidth: '360px',
        }}
      >
        {error.reason}
      </p>

      <p
        style={{
          fontSize: '0.8rem',
          color: 'var(--c-muted)',
          maxWidth: '360px',
          lineHeight: 1.5,
        }}
      >
        {error.hint}
      </p>

      <button
        type="button"
        onClick={onDismiss}
        style={{
          marginTop: '8px',
          padding: '6px 18px',
          background: 'var(--c-ink)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--r-base)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.8rem',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Try another file
      </button>
    </div>
  )
}
