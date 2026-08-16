import type { ChartType } from '@/types/chart'
import type { ColumnProfile } from '@/types/profile'

export type FeasibilityResult =
  | { status: 'supported' }
  | { status: 'warned'; reason: string }
  | { status: 'unsupported'; reason: string }

const ok = (): FeasibilityResult => ({ status: 'supported' })
const warn = (reason: string): FeasibilityResult => ({ status: 'warned', reason })
const no = (reason: string): FeasibilityResult => ({ status: 'unsupported', reason })

function buckets(profiles: ColumnProfile[]) {
  // Exclude columns the engine marked as empty — they can't be encoded
  const usable = profiles.filter((p) => p.inferredType !== 'empty')
  const numeric = usable.filter((p) => p.inferredType === 'numeric')
  const categorical = usable.filter(
    (p) => p.inferredType === 'categorical' || p.inferredType === 'boolean',
  )
  const temporal = usable.filter((p) => p.inferredType === 'temporal')
  // Categorical columns with few enough distinct values to be readable as slices
  const catLowCard = categorical.filter((p) => p.distinctCount <= 20)
  return { numeric, categorical, temporal, catLowCard }
}

// Returns whether a chart type can be sensibly configured from the given profiles,
// plus a plain-language reason when it cannot (shown in the picker tooltip).
export function checkFeasibility(
  profiles: ColumnProfile[],
  type: ChartType,
): FeasibilityResult {
  const { numeric, categorical, temporal, catLowCard } = buckets(profiles)

  switch (type) {
    case 'bar': {
      if (categorical.length + temporal.length === 0)
        return no('Needs a categorical or date column for the X axis; this sheet has neither.')
      if (numeric.length === 0)
        return no('Needs at least one numeric column for the Y axis; this sheet has none.')
      return ok()
    }

    case 'line':
    case 'area': {
      if (numeric.length === 0)
        return no('Needs at least one numeric column for the Y axis; this sheet has none.')
      // Ideal X is temporal; a second numeric also works; warn if only categorical
      const hasOrderedX = temporal.length > 0 || numeric.length >= 2
      if (!hasOrderedX) {
        const name = type === 'line' ? 'line' : 'area'
        return warn(
          `No date or numeric X column — the ${name} chart will draw over categories. A bar chart may suit this data better.`,
        )
      }
      return ok()
    }

    case 'scatter': {
      if (numeric.length < 2) {
        const has = numeric.length === 0 ? 'none' : 'only one'
        return no(`Needs at least two numeric columns; this sheet has ${has}.`)
      }
      return ok()
    }

    case 'pie': {
      if (catLowCard.length === 0) {
        if (categorical.length > 0) {
          const max = Math.max(...categorical.map((c) => c.distinctCount))
          return no(
            `Pie charts need ≤ 20 slices. The categorical column has ${max} distinct values — too many to read clearly.`,
          )
        }
        return no(
          'Needs a categorical column with ≤ 20 distinct values for the slices; this sheet has none.',
        )
      }
      if (numeric.length === 0)
        return no('Needs one numeric column for the slice sizes; this sheet has none.')
      return ok()
    }

    case 'histogram': {
      if (numeric.length === 0)
        return no('Needs at least one numeric column to show a distribution; this sheet has none.')
      return ok()
    }

    case 'box': {
      if (numeric.length === 0)
        return no('Needs at least one numeric column to show distributions; this sheet has none.')
      return ok()
    }

    case 'heatmap': {
      if (categorical.length < 2) {
        const has = categorical.length === 0 ? 'none' : 'only one'
        return no(`Needs two categorical columns (for X and Y axes); this sheet has ${has}.`)
      }
      if (numeric.length === 0)
        return no('Needs a numeric column for the cell values; this sheet has none.')
      return ok()
    }
  }
}
