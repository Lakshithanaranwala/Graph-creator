import { useRef, useState } from 'react'

// Visual invitation to drop a file. No file processing happens here —
// this component only signals readiness and delegates to the handler prop.
type Props = {
  onFileSelected: (file: File) => void
}

export function EmptyState({ onFileSelected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave() {
    setIsDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) onFileSelected(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onFileSelected(file)
  }

  // Allow keyboard users to activate the drop zone via Enter / Space
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Drop a spreadsheet file here, or press Enter to browse"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onKeyDown={handleKeyDown}
      onClick={() => inputRef.current?.click()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '100%',
        height: '100%',
        border: `1.5px dashed ${isDragOver ? 'var(--c-accent)' : 'var(--c-rule)'}`,
        borderRadius: 'var(--r-none)',
        background: isDragOver ? 'rgba(47,111,235,0.04)' : 'transparent',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease, background 0.15s ease',
        userSelect: 'none',
      }}
    >
      <UploadIcon active={isDragOver} />

      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '1rem',
            color: isDragOver ? 'var(--c-accent)' : 'var(--c-ink)',
            marginBottom: '4px',
            transition: 'color 0.15s ease',
          }}
        >
          Drop your spreadsheet here
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)' }}>
          .xlsx, .xls, or .csv — your file never leaves this tab
        </p>
      </div>

      <button
        type="button"
        tabIndex={-1} // parent div handles focus; button is a visual affordance only
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
        accept=".xlsx,.xls,.csv"
        aria-hidden="true"
        tabIndex={-1}
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />
    </div>
  )
}

function UploadIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      style={{ color: active ? 'var(--c-accent)' : 'var(--c-muted)', transition: 'color 0.15s ease' }}
    >
      <rect x="8" y="28" width="24" height="2.5" rx="1.25" fill="currentColor" opacity="0.3" />
      <path
        d="M20 24V12M20 12L14 18M20 12L26 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
