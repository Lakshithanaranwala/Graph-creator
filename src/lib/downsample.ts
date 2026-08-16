import type { CellValue } from '@/types/dataset'

export const MAX_POINTS = 5000

// Mulberry32 seeded PRNG — returns a function that yields numbers in [0, 1)
function mulberry32(seed: number): () => number {
  let s = seed
  return () => {
    s += 0x6d2b79f5
    let z = s
    z = Math.imul(z ^ (z >>> 15), z | 1)
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61)
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000
  }
}

// LTTB (Largest-Triangle-Three-Buckets) for ordered line/area data
export function lttb(
  points: Array<{ x: CellValue; y: number }>,
  threshold: number,
): Array<{ x: CellValue; y: number }> {
  const n = points.length
  if (n <= threshold) return points

  const sampled: Array<{ x: CellValue; y: number }> = []
  const bucketSize = (n - 2) / (threshold - 2)
  let a = 0

  sampled.push(points[0]!)

  for (let i = 0; i < threshold - 2; i++) {
    // Average point in the next bucket (used as the "far" triangle vertex)
    const nextStart = Math.floor((i + 1) * bucketSize) + 1
    const nextEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, n)
    let avgX = 0
    let avgY = 0
    const avgCount = nextEnd - nextStart
    for (let j = nextStart; j < nextEnd; j++) {
      avgX += j
      avgY += points[j]!.y
    }
    avgX /= avgCount
    avgY /= avgCount

    // Current bucket: pick the point that forms the largest triangle with a and avg
    const bucketStart = Math.floor(i * bucketSize) + 1
    const bucketEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, n)

    const pointA = points[a]!
    let maxArea = -1
    let maxIdx = bucketStart

    for (let j = bucketStart; j < bucketEnd; j++) {
      const area = Math.abs(
        (j - a) * (avgY - pointA.y) - (avgX - a) * (points[j]!.y - pointA.y),
      )
      if (area > maxArea) {
        maxArea = area
        maxIdx = j
      }
    }

    sampled.push(points[maxIdx]!)
    a = maxIdx
  }

  sampled.push(points[n - 1]!)
  return sampled
}

// Seeded random sample of `count` items, reproducible across renders (Fisher-Yates partial shuffle)
export function randomSample<T>(items: T[], count: number, seed = 42): T[] {
  if (items.length <= count) return items
  const rng = mulberry32(seed)
  const arr = [...items]
  // Partial Fisher-Yates from the end
  for (let i = arr.length - 1; i > arr.length - 1 - count; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr.slice(arr.length - count)
}

// Keep the top N categories by y value, rolling the remainder into "Other"
export function topNCategories(
  points: Array<{ x: CellValue; y: number }>,
  n: number,
): Array<{ x: CellValue; y: number }> {
  if (points.length <= n) return points
  const sorted = [...points].sort((a, b) => b.y - a.y)
  const top = sorted.slice(0, n)
  const rest = sorted.slice(n)
  const otherTotal = rest.reduce((sum, p) => sum + p.y, 0)
  return [...top, { x: 'Other', y: otherTotal }]
}
