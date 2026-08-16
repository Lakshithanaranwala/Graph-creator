import type { RawSheet } from '@/types/dataset'

export type WorkerInbound = {
  type: 'parse'
  buffer: ArrayBuffer
  fileName: string
}

export type WorkerOutbound =
  | { type: 'progress'; pct: number; message: string }
  | { type: 'result'; sheets: RawSheet[] }
  | { type: 'error'; reason: string; hint: string }
