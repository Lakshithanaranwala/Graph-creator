import { describe, it, expect } from 'vitest'
import { lttb, randomSample, topNCategories, MAX_POINTS } from '@/lib/downsample'

describe('MAX_POINTS', () => {
  it('is 5000', () => {
    expect(MAX_POINTS).toBe(5000)
  })
})

describe('lttb', () => {
  it('returns original array when points <= threshold', () => {
    const pts = Array.from({ length: 10 }, (_, i) => ({ x: i, y: Math.sin(i) }))
    expect(lttb(pts, 100)).toBe(pts)
  })

  it('returns exactly `threshold` points', () => {
    const pts = Array.from({ length: 1000 }, (_, i) => ({ x: i, y: Math.sin(i / 10) }))
    const result = lttb(pts, 100)
    expect(result).toHaveLength(100)
  })

  it('always includes the first and last point', () => {
    const pts = Array.from({ length: 500 }, (_, i) => ({ x: i, y: i * 2 }))
    const result = lttb(pts, 50)
    expect(result[0]).toBe(pts[0])
    expect(result[result.length - 1]).toBe(pts[pts.length - 1])
  })

  it('handles exactly 2 points', () => {
    const pts = [{ x: 0, y: 0 }, { x: 1, y: 1 }]
    expect(lttb(pts, 2)).toHaveLength(2)
  })

  it('threshold of 2 returns first and last', () => {
    const pts = Array.from({ length: 100 }, (_, i) => ({ x: i, y: i }))
    const result = lttb(pts, 2)
    expect(result).toHaveLength(2)
    expect(result[0]).toBe(pts[0])
    expect(result[1]).toBe(pts[99])
  })
})

describe('randomSample', () => {
  it('returns original array when items <= count', () => {
    const items = [1, 2, 3]
    expect(randomSample(items, 10)).toBe(items)
  })

  it('returns exactly `count` items', () => {
    const items = Array.from({ length: 1000 }, (_, i) => i)
    expect(randomSample(items, 100)).toHaveLength(100)
  })

  it('is reproducible with the same seed', () => {
    const items = Array.from({ length: 200 }, (_, i) => i)
    const a = randomSample(items, 50, 1)
    const b = randomSample(items, 50, 1)
    expect(a).toEqual(b)
  })

  it('produces different results with different seeds', () => {
    const items = Array.from({ length: 200 }, (_, i) => i)
    const a = randomSample(items, 50, 1)
    const b = randomSample(items, 50, 2)
    expect(a).not.toEqual(b)
  })

  it('all sampled items are from the original array', () => {
    const items = Array.from({ length: 100 }, (_, i) => i)
    const result = randomSample(items, 20, 99)
    for (const item of result) {
      expect(items).toContain(item)
    }
  })
})

describe('topNCategories', () => {
  it('returns original array when points <= n', () => {
    const pts = [{ x: 'A', y: 10 }, { x: 'B', y: 5 }]
    expect(topNCategories(pts, 5)).toBe(pts)
  })

  it('keeps top N by y value', () => {
    const pts = [
      { x: 'A', y: 5 },
      { x: 'B', y: 20 },
      { x: 'C', y: 15 },
      { x: 'D', y: 3 },
      { x: 'E', y: 8 },
    ]
    const result = topNCategories(pts, 3)
    expect(result).toHaveLength(4) // 3 top + "Other"
    // First three should be B(20), C(15), E(8)
    const labels = result.slice(0, 3).map((p) => p.x)
    expect(labels).toContain('B')
    expect(labels).toContain('C')
    expect(labels).toContain('E')
  })

  it('rolls remainder into "Other" with correct sum', () => {
    const pts = [
      { x: 'A', y: 100 },
      { x: 'B', y: 50 },
      { x: 'C', y: 30 },
      { x: 'D', y: 20 }, // rolled into Other
    ]
    const result = topNCategories(pts, 3)
    const other = result.find((p) => p.x === 'Other')
    expect(other?.y).toBe(20)
  })

  it('handles exactly n points without creating Other', () => {
    const pts = [{ x: 'A', y: 10 }, { x: 'B', y: 5 }, { x: 'C', y: 8 }]
    const result = topNCategories(pts, 3)
    expect(result).toBe(pts)
    expect(result.find((p) => p.x === 'Other')).toBeUndefined()
  })
})
