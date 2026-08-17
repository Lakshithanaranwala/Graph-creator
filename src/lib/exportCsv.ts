import type { TransformOutput } from '@/types/transform'
import type { CellValue } from '@/types/dataset'

function csvCell(v: CellValue | number | null | undefined): string {
  if (v === null || v === undefined) return ''
  const s = v instanceof Date ? v.toISOString() : String(v)
  // Quote if the value contains comma, double-quote, or newline
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function csvRow(values: (CellValue | number | null | undefined)[]): string {
  return values.map(csvCell).join(',')
}

/** Convert a TransformOutput into a UTF-8 CSV string. */
export function outputToCsv(output: TransformOutput): string {
  const lines: string[] = []

  switch (output.kind) {
    case 'xy': {
      // One row per point, with a "series" discriminator column
      lines.push(csvRow(['series', 'x', 'y']))
      for (const series of output.series) {
        for (const pt of series.points) {
          lines.push(csvRow([series.name, pt.x, pt.y]))
        }
      }
      break
    }

    case 'pie': {
      lines.push(csvRow(['label', 'value']))
      for (const slice of output.slices) {
        lines.push(csvRow([slice.label, slice.value]))
      }
      break
    }

    case 'distribution': {
      lines.push(csvRow(['bin_min', 'bin_max', 'count']))
      for (const bin of output.bins) {
        lines.push(csvRow([bin.min, bin.max, bin.count]))
      }
      break
    }

    case 'matrix': {
      lines.push(csvRow(['x', 'y', 'value']))
      for (const cell of output.cells) {
        lines.push(csvRow([cell.x, cell.y, cell.value]))
      }
      break
    }

    case 'box': {
      lines.push(csvRow(['group', 'value']))
      for (const group of output.groups) {
        for (const v of group.values) {
          lines.push(csvRow([group.label, v]))
        }
      }
      break
    }
  }

  return lines.join('\n')
}

/** Trigger a browser CSV download. */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
