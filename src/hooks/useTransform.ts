import { useEffect, useRef } from 'react'
import { useDatasetStore, selectHeaderRow } from '@/store/datasetStore'
import { useChartStore } from '@/store/chartStore'
import { useProfileStore } from '@/store/profileStore'
import { useTransformStore } from '@/store/transformStore'
import { transform } from '@/lib/transform'
import type { TransformWorkerInbound, TransformWorkerOutbound } from '@/workers/transformProtocol'

const DEBOUNCE_MS = 150
const WORKER_THRESHOLD = 10_000

export function useTransform() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const workerRef = useRef<Worker | null>(null)

  const state = useDatasetStore()
  const { phase, dataset, activeSheetIndex } = state
  const headerRowIndex = selectHeaderRow(state)
  const spec = useChartStore((s) => s.activeSpec)
  const profiles = useProfileStore((s) => s.profiles)
  const typeOverrides = useProfileStore((s) => s.typeOverrides)
  const { setResult, setComputing, reset } = useTransformStore()

  const effectiveProfiles = profiles.map((p) =>
    typeOverrides[p.index] !== undefined
      ? { ...p, inferredType: typeOverrides[p.index]! }
      : p,
  )

  useEffect(() => {
    if (phase !== 'preview' || !spec || !dataset) {
      reset()
      return
    }

    const activeSheet = dataset.sheets[activeSheetIndex]
    if (!activeSheet) {
      reset()
      return
    }

    const rows = activeSheet.rawRows
    const dataRowCount = rows.length - headerRowIndex - 1

    // Clear pending timer and running worker
    if (timerRef.current) clearTimeout(timerRef.current)
    workerRef.current?.terminate()
    workerRef.current = null

    setComputing(true)

    timerRef.current = setTimeout(() => {
      if (dataRowCount > WORKER_THRESHOLD) {
        // Off-load to Web Worker
        const worker = new Worker(
          new URL('../workers/transform.worker.ts', import.meta.url),
          { type: 'module' },
        )
        workerRef.current = worker

        const msg: TransformWorkerInbound = {
          type: 'transform',
          rows,
          headerRowIndex,
          spec,
          profiles: effectiveProfiles,
        }
        worker.postMessage(msg)

        worker.onmessage = (e: MessageEvent<TransformWorkerOutbound>) => {
          if (e.data.type === 'result') {
            setResult(e.data.result)
          } else {
            setResult({ ok: false, error: e.data.message })
          }
          worker.terminate()
          workerRef.current = null
        }

        worker.onerror = (err) => {
          setResult({ ok: false, error: err.message || 'Transform worker crashed.' })
          worker.terminate()
          workerRef.current = null
        }
      } else {
        // Synchronous for small datasets
        const result = transform(rows, headerRowIndex, spec, effectiveProfiles)
        setResult(result)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, activeSheetIndex, headerRowIndex, spec, profiles, typeOverrides, dataset])
}
