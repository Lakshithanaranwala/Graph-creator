import * as XLSX from 'xlsx'
import { expandMerges, type MergeRange } from '@/lib/mergedCells'
import { trimEmptyRows, trimEmptyColumns } from '@/lib/trimSheet'
import { detectHeaderRow } from '@/lib/headerDetection'
import type { CellValue, RawSheet } from '@/types/dataset'

// Pads rows to the same length so column-index access is safe.
function normalise(rows: CellValue[][]): CellValue[][] {
  if (rows.length === 0) return rows
  const width = Math.max(...rows.map((r) => r.length))
  return rows.map((row) => {
    const padded = [...row]
    while (padded.length < width) padded.push(null)
    return padded
  })
}

// Parses one worksheet into RawSheet format.
// The caller (worker) must have read the workbook with cellDates:true so that
// Excel serial date numbers are already Date objects inside the worksheet cells.
export function parseSheet(ws: XLSX.WorkSheet, name: string): RawSheet | null {
  if (!ws['!ref']) return null // empty sheet

  // raw:true preserves actual types (number, boolean, Date).
  // defval:null fills missing cells instead of leaving them undefined.
  const raw = XLSX.utils.sheet_to_json<CellValue[]>(ws, {
    header: 1,
    raw: true,
    defval: null,
  }) as CellValue[][]

  // Expand merged cells before trimming so secondary cells get the header value.
  const merges = (ws['!merges'] ?? []) as MergeRange[]
  const expanded = expandMerges(normalise(raw), merges)

  const trimmed = trimEmptyColumns(trimEmptyRows(expanded))
  if (trimmed.length === 0) return null

  const detectedHeaderRow = detectHeaderRow(trimmed)
  return { name, rawRows: trimmed, detectedHeaderRow }
}
