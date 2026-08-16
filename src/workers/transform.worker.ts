import { transform } from '@/lib/transform'
import type { TransformWorkerInbound, TransformWorkerOutbound } from './transformProtocol'

function post(msg: TransformWorkerOutbound) {
  self.postMessage(msg)
}

self.onmessage = (e: MessageEvent<TransformWorkerInbound>) => {
  const { rows, headerRowIndex, spec, profiles } = e.data
  try {
    const result = transform(rows, headerRowIndex, spec, profiles)
    post({ type: 'result', result })
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}
