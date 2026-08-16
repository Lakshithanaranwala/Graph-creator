import type { RawSheet } from '@/types/dataset'

type Props = {
  sheets: RawSheet[]
  onSelect: (index: number) => void
}

export function SheetPicker({ sheets, onSelect }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        padding: '32px',
        gap: '24px',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '1rem',
            color: 'var(--c-ink)',
            marginBottom: '4px',
          }}
        >
          {sheets.length === 1 ? 'One sheet found' : `${sheets.length} sheets found`}
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)' }}>
          Choose the sheet you want to chart
        </p>
      </div>

      <ul
        role="list"
        style={{
          listStyle: 'none',
          width: '100%',
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {sheets.map((sheet, i) => {
          const dataRows = sheet.rawRows.length - sheet.detectedHeaderRow - 1
          const cols = sheet.rawRows[sheet.detectedHeaderRow]?.length ?? 0

          return (
            <li key={sheet.name}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'var(--c-panel)',
                  border: '1px solid var(--c-rule)',
                  borderRadius: 'var(--r-md)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.1s ease',
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--c-accent)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--c-rule)')
                }
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    color: 'var(--c-ink)',
                  }}
                >
                  {sheet.name}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--c-muted)',
                  }}
                >
                  {dataRows} rows · {cols} cols
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
