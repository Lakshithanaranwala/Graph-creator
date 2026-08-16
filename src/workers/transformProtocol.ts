import type { CellValue } from '@/types/dataset'
import type { ChartSpec } from '@/types/chart'
import type { ColumnProfile } from '@/types/profile'
import type { TransformResult } from '@/types/transform'

export type TransformWorkerInbound = {
  type: 'transform'
  rows: CellValue[][]
  headerRowIndex: number
  spec: ChartSpec
  profiles: ColumnProfile[]
}

export type TransformWorkerOutbound =
  | { type: 'result'; result: TransformResult }
  | { type: 'error'; message: string }
