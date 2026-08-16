import { useRef, useState } from 'react'

type Props = {
  onFile: (file: File) => void
}

export function DropZone({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    setOver(true)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setOver(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    // reset so the same file can be re-selected
    e.target.value = ''
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Drop a spreadsheet file here, or press Enter to browse"
      onDragOver={onDragOver}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      onKeyDown={onKeyDown}
      onClick={() => inputRef.current?.click()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '100%',
        height: '100%',
        border: `1.5px dashed ${over ? 'var(--c-accent)' : 'var(--c-rule)'}`,
        background: over ? 'rgba(47,111,235,0.04)' : 'transparent',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease, background 0.15s ease',
        userSelect: 'none',
      }}
    >
      <UploadIcon active={over} />

      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '1rem',
            color: over ? 'var(--c-accent)' : 'var(--c-ink)',
            marginBottom: '4px',
            transition: 'color 0.15s ease',
          }}
        >
          Drop your spreadsheet here
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)' }}>
          .xlsx · .xls · .xlsm · .csv · .tsv — your file never leaves this tab
        </p>
      </div>

      <button
        type="button"
        tabIndex={-1}
        onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
        style={{
          marginTop: '4px',
          padding: '6px 16px',
          background: 'var(--c-accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--r-base)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.8rem',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Browse files
      </button>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.xlsm,.csv,.tsv"
        aria-hidden="true"
        tabIndex={-1}
        style={{ display: 'none' }}
        onChange={onChange}
      />
    </div>
  )
}

function UploadIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="40" height="40" viewBox="0 0 40 40" fill="none"
      aria-hidden="true"
      style={{ color: active ? 'var(--c-accent)' : 'var(--c-muted)', transition: 'color 0.15s ease' }}
    >
      <rect x="8" y="28" width="24" height="2.5" rx="1.25" fill="currentColor" opacity="0.3" />
      <path
        d="M20 24V12M20 12L14 18M20 12L26 18"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}
