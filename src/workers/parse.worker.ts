import * as XLSX from 'xlsx'
import { parseSheet } from '@/lib/sheetParser'
import type { WorkerInbound, WorkerOutbound } from './workerProtocol'
import type { RawSheet } from '@/types/dataset'

function post(msg: WorkerOutbound) {
  self.postMessage(msg)
}

self.onmessage = (e: MessageEvent<WorkerInbound>) => {
  const { buffer, fileName } = e.data

  try {
    post({ type: 'progress', pct: 10, message: 'Reading workbook…' })

    const workbook = XLSX.read(new Uint8Array(buffer), {
      type: 'array',
      cellDates: true,
      cellNF: true,
    })

    const names = workbook.SheetNames
    const sheets: RawSheet[] = []

    for (let i = 0; i < names.length; i++) {
      const name = names[i]!
      const ws = workbook.Sheets[name]
      if (!ws) continue

      post({
        type: 'progress',
        pct: 20 + Math.round(65 * i / names.length),
        message: `Processing "${name}"…`,
      })

      const sheet = parseSheet(ws, name)
      if (sheet) sheets.push(sheet)
    }

    post({ type: 'progress', pct: 90, message: 'Finishing up…' })

    if (sheets.length === 0) {
      post({
        type: 'error',
        reason: `No data found in "${fileName}".`,
        hint: 'Make sure the file has at least one sheet with data in it.',
      })
      return
    }

    post({ type: 'result', sheets })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    post({
      type: 'error',
      reason: `Could not parse "${fileName}".`,
      hint: `Try re-saving the file from Excel or Google Sheets. Detail: ${detail}`,
    })
  }
}
