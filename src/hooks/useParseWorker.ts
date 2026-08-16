import { useRef, useCallback } from 'react'
import { validateQuick, validateMagicBytes } from '@/lib/fileValidation'
import { hashBuffer } from '@/lib/fileHash'
import { getDataset, storeDataset, upsertRecentFile, getRecentFiles } from '@/lib/db'
import { useDatasetStore } from '@/store/datasetStore'
import type { WorkerInbound, WorkerOutbound } from '@/workers/workerProtocol'
import type { ParsedDataset } from '@/types/dataset'

export function useParseWorker() {
  const workerRef = useRef<Worker | null>(null)
  const store = useDatasetStore()

  const cancel = useCallback(() => {
    workerRef.current?.terminate()
    workerRef.current = null
  }, [])

  const parse = useCallback(
    async (file: File) => {
      store.setParseError(null)

      // 1. Quick checks — size and extension (no buffer needed)
      const quick = validateQuick(file)
      if (!quick.ok) {
        store.setParseError({ reason: quick.reason, hint: quick.hint })
        return
      }

      store.setPhase('parsing')
      store.setParseProgress({ pct: 2, message: 'Reading file…' })

      // 2. Read into buffer
      const buffer = await file.arrayBuffer()

      // 3. Magic-byte check
      const magic = validateMagicBytes(file.name, buffer)
      if (!magic.ok) {
        store.setParseError({ reason: magic.reason, hint: magic.hint })
        store.setPhase('idle')
        return
      }

      store.setParseProgress({ pct: 8, message: 'Checking cache…' })

      // 4. Hash → IDB cache lookup (re-uploading the same file is instant)
      const id = await hashBuffer(buffer)
      const cached = await getDataset(id)

      if (cached) {
        await upsertRecentFile({
          id,
          fileName: file.name,
          parsedAt: cached.parsedAt,
          sheetNames: cached.sheets.map((s) => s.name),
          totalRows: cached.sheets.reduce((n, s) => n + s.rawRows.length, 0),
        })
        store.setDataset(cached)
        store.setRecentFiles(await getRecentFiles())
        store.setPhase('sheetPick')
        return
      }

      // 5. Start worker — transfer the buffer to avoid copying it across threads
      cancel()
      const worker = new Worker(
        new URL('../workers/parse.worker.ts', import.meta.url),
        { type: 'module' },
      )
      workerRef.current = worker

      const msg: WorkerInbound = { type: 'parse', buffer, fileName: file.name }
      worker.postMessage(msg, [buffer])

      worker.onmessage = async (e: MessageEvent<WorkerOutbound>) => {
        const data = e.data

        if (data.type === 'progress') {
          store.setParseProgress({ pct: data.pct, message: data.message })
          return
        }

        if (data.type === 'error') {
          store.setParseError({ reason: data.reason, hint: data.hint })
          store.setPhase('idle')
          worker.terminate()
          return
        }

        // data.type === 'result'
        const dataset: ParsedDataset = {
          id,
          fileName: file.name,
          sheets: data.sheets,
          parsedAt: Date.now(),
        }

        store.setParseProgress({ pct: 98, message: 'Saving to cache…' })

        await storeDataset(dataset)
        await upsertRecentFile({
          id,
          fileName: file.name,
          parsedAt: dataset.parsedAt,
          sheetNames: data.sheets.map((s) => s.name),
          totalRows: data.sheets.reduce((n, s) => n + s.rawRows.length, 0),
        })

        store.setDataset(dataset)
        store.setRecentFiles(await getRecentFiles())
        store.setPhase('sheetPick')
        worker.terminate()
      }

      worker.onerror = (e) => {
        store.setParseError({
          reason: 'The parser crashed unexpectedly.',
          hint: e.message || 'Try a different file, or re-save from Excel.',
        })
        store.setPhase('idle')
        worker.terminate()
      }
    },
    [store, cancel],
  )

  return { parse, cancel }
}
