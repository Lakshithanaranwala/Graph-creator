import { inferColumnType } from '@/lib/typeInference'
import { tryParseNumeric } from '@/lib/numericParser'
import { buildColumnNames } from '@/lib/columnProfiling'
import type { CellValue } from '@/types/dataset'
import type { ColumnProfile } from '@/types/profile'

const SAMPLE_LIMIT = 1000

function median(sorted: number[]): number {
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2
}

function countDistinct(nonNull: CellValue[]): number {
  const seen = new Set<string>()
  for (const v of nonNull) {
    seen.add(v instanceof Date ? String(v.getTime()) : String(v))
  }
  return seen.size
}

export function profileColumn(
  allValues: CellValue[],
  name: string,
  index: number,
): ColumnProfile {
  const rowCount = allValues.length
  const nonNull = allValues.filter((v) => v !== null && v !== undefined)
  const nullCount = rowCount - nonNull.length
  const nullRatio = rowCount > 0 ? nullCount / rowCount : 0
  const distinctCount = countDistinct(nonNull)

  // Sample for inference — avoids O(n) work on huge columns
  const sample = nonNull.slice(0, SAMPLE_LIMIT)
  const inference = inferColumnType(sample, distinctCount)

  const sampleValues = nonNull.slice(0, 5)
  const isHighCardinality = distinctCount > 50

  // A likely ID has every value unique, almost no nulls, and is not a
  // continuous float column (integer-only or non-numeric qualify).
  const parsedSample =
    inference.type === 'numeric'
      ? sample.map(tryParseNumeric).filter(Boolean)
      : []
  const sampleAllIntegers =
    parsedSample.length > 0 && parsedSample.every((r) => Number.isInteger(r!.value))
  const isLikelyId =
    distinctCount === nonNull.length &&
    nonNull.length > 5 &&
    nullRatio < 0.05 &&
    (inference.type !== 'numeric' || sampleAllIntegers)

  const profile: ColumnProfile = {
    name,
    index,
    inferredType: inference.type,
    confidence: inference.confidence,
    nullCount,
    nullRatio,
    distinctCount,
    isHighCardinality,
    isLikelyId,
    sampleValues,
    numericTransform: inference.numericTransform,
    temporalFormat: inference.temporalFormat,
  }

  // Numeric stats — compute from ALL non-null values, not just the sample
  if (inference.type === 'numeric') {
    const nums = nonNull
      .map(tryParseNumeric)
      .filter(Boolean)
      .map((r) => r!.value)
      .sort((a, b) => a - b)

    if (nums.length > 0) {
      profile.numericStats = {
        min: nums[0]!,
        max: nums[nums.length - 1]!,
        mean: nums.reduce((a, b) => a + b, 0) / nums.length,
        median: median(nums),
      }
    }
  }

  // Temporal range — Date objects only (string dates are left as-is for now)
  if (inference.type === 'temporal') {
    const dates = nonNull.filter((v): v is Date => v instanceof Date)
    if (dates.length > 0) {
      const times = dates.map((d) => d.getTime()).sort((a, b) => a - b)
      profile.temporalRange = {
        min: new Date(times[0]!),
        max: new Date(times[times.length - 1]!),
      }
    }
  }

  return profile
}

export function profileDataset(
  rawRows: CellValue[][],
  headerRowIndex: number,
): ColumnProfile[] {
  const headerRow = rawRows[headerRowIndex] ?? []
  const dataRows = rawRows.slice(headerRowIndex + 1)
  const names = buildColumnNames(headerRow)

  return names.map((name, i) => {
    const values = dataRows.map((row) => row[i] ?? null)
    return profileColumn(values, name, i)
  })
}
