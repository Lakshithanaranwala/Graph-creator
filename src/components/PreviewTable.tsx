import { buildColumnNames } from '@/lib/columnProfiling'
import type { CellValue } from '@/types/dataset'

const PREVIEW_ROWS = 50

type Props = {
  rawRows: CellValue[][]
  headerRowIndex: number
}

function formatCell(v: CellValue): string {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return v.toLocaleDateString()
  return String(v)
}

export function PreviewTable({ rawRows, headerRowIndex }: Props) {
  const headerRow = rawRows[headerRowIndex] ?? []
  const colNames = buildColumnNames(headerRow)
  const dataRows = rawRows.slice(headerRowIndex + 1, headerRowIndex + 1 + PREVIEW_ROWS)
  const totalDataRows = rawRows.length - headerRowIndex - 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--c-rule)',
          fontSize: '0.75rem',
          color: 'var(--c-muted)',
          fontFamily: 'var(--font-mono)',
          flexShrink: 0,
        }}
      >
        Showing {dataRows.length} of {totalDataRows} rows · {colNames.length} columns
      </div>

      <div style={{ overflow: 'auto', flex: 1 }}>
        <table
          style={{
            borderCollapse: 'collapse',
            width: '100%',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <thead>
            <tr>
              {colNames.map((name, i) => (
                <th
                  key={i}
                  style={{
                    position: 'sticky',
                    top: 0,
                    padding: '6px 10px',
                    background: 'var(--c-ground)',
                    borderBottom: '2px solid var(--c-rule)',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: 'var(--c-ink)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => (
              <tr
                key={ri}
                style={{ background: ri % 2 === 0 ? 'var(--c-panel)' : 'var(--c-ground)' }}
              >
                {colNames.map((_, ci) => (
                  <td
                    key={ci}
                    style={{
                      padding: '5px 10px',
                      borderBottom: '1px solid var(--c-rule)',
                      color: row[ci] === null ? 'var(--c-muted)' : 'var(--c-ink)',
                      whiteSpace: 'nowrap',
                      maxWidth: '220px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {formatCell(row[ci] ?? null)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
