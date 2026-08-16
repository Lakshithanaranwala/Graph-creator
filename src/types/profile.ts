export type InferredType =
  | 'numeric'
  | 'categorical'
  | 'temporal'
  | 'boolean'
  | 'empty'
  | 'mixed'

export type ColumnProfile = {
  name: string
  index: number
  inferredType: InferredType
  confidence: number       // 0–1
  nullCount: number
  nullRatio: number
  distinctCount: number
  isHighCardinality: boolean  // distinctCount > 50
  isLikelyId: boolean         // all unique, low nulls, not float
  sampleValues: unknown[]     // up to 5 non-null distinct values
  numericStats?: { min: number; max: number; mean: number; median: number }
  temporalRange?: { min: Date; max: Date }
  // Recorded so the UI can explain why a type was chosen
  numericTransform?: string
  temporalFormat?: string
}
