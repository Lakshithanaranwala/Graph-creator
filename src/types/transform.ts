import type { CellValue } from '@/types/dataset'

export type XYPoint = { x: CellValue; y: number }
export type XYSeries = { name: string; points: XYPoint[] }

export type PieSlice = { label: string; value: number }

export type DistributionBin = { min: number; max: number; count: number }

export type MatrixCell = { x: string; y: string; value: number }

export type BoxGroup = { label: string; values: number[] }

// Discriminated union of all possible transform outputs
export type TransformOutput =
  | { kind: 'xy'; series: XYSeries[]; totalPoints: number; sampledPoints: number }
  | { kind: 'pie'; slices: PieSlice[] }
  | { kind: 'distribution'; bins: DistributionBin[]; column: string; totalRows: number }
  | { kind: 'matrix'; cells: MatrixCell[]; xLabels: string[]; yLabels: string[] }
  | { kind: 'box'; groups: BoxGroup[] }

export type TransformResult =
  | { ok: true; output: TransformOutput }
  | { ok: false; error: string }
