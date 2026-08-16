import { describe, it, expect } from 'vitest'
import { checkFeasibility } from '@/lib/chartFeasibility'
import type { ColumnProfile, InferredType } from '@/types/profile'
import type { ChartType } from '@/types/chart'

function p(type: InferredType, distinctCount = 10): ColumnProfile {
  return {
    name: `${type}_col`,
    index: 0,
    inferredType: type,
    confidence: 0.95,
    nullCount: 0,
    nullRatio: 0,
    distinctCount,
    isHighCardinality: distinctCount > 50,
    isLikelyId: false,
    sampleValues: [],
  }
}

// Shorthand helpers
const cat  = (d = 10) => p('categorical', d)
const num  = ()        => p('numeric', 50)
const temp = ()        => p('temporal', 365)
const bool = ()        => p('boolean', 2)

type Scenario = {
  label: string
  profiles: ColumnProfile[]
  type: ChartType
  expectedStatus: 'supported' | 'warned' | 'unsupported'
  reasonPattern?: RegExp
}

const scenarios: Scenario[] = [
  // ── Acceptance scenario: 1 categorical + 1 numeric ───────────────────────
  { label: 'bar: cat+num → supported',          profiles: [cat(), num()], type: 'bar',       expectedStatus: 'supported' },
  { label: 'pie: cat(≤20)+num → supported',     profiles: [cat(), num()], type: 'pie',       expectedStatus: 'supported' },
  { label: 'scatter: cat+num → unsupported',    profiles: [cat(), num()], type: 'scatter',   expectedStatus: 'unsupported', reasonPattern: /two numeric/ },
  { label: 'heatmap: cat+num → unsupported',    profiles: [cat(), num()], type: 'heatmap',   expectedStatus: 'unsupported', reasonPattern: /two categorical/ },
  { label: 'line: cat+num → warned (no order)', profiles: [cat(), num()], type: 'line',      expectedStatus: 'warned' },
  { label: 'area: cat+num → warned (no order)', profiles: [cat(), num()], type: 'area',      expectedStatus: 'warned' },
  { label: 'histogram: cat+num → supported',    profiles: [cat(), num()], type: 'histogram', expectedStatus: 'supported' },
  { label: 'box: cat+num → supported',          profiles: [cat(), num()], type: 'box',       expectedStatus: 'supported' },

  // ── 2 numeric columns only ───────────────────────────────────────────────
  { label: 'scatter: 2 num → supported',    profiles: [num(), num()], type: 'scatter',   expectedStatus: 'supported' },
  { label: 'bar: 2 num → unsupported',      profiles: [num(), num()], type: 'bar',       expectedStatus: 'unsupported', reasonPattern: /categorical or date/ },
  { label: 'pie: 2 num → unsupported',      profiles: [num(), num()], type: 'pie',       expectedStatus: 'unsupported', reasonPattern: /categorical column/ },
  { label: 'heatmap: 2 num → unsupported',  profiles: [num(), num()], type: 'heatmap',   expectedStatus: 'unsupported', reasonPattern: /two categorical/ },
  { label: 'line: 2 num → supported (numeric X)', profiles: [num(), num()], type: 'line', expectedStatus: 'supported' },
  { label: 'histogram: 2 num → supported',  profiles: [num(), num()], type: 'histogram', expectedStatus: 'supported' },

  // ── 2 categorical + 1 numeric ────────────────────────────────────────────
  { label: 'heatmap: 2cat+num → supported', profiles: [cat(), cat(), num()], type: 'heatmap', expectedStatus: 'supported' },
  { label: 'scatter: 2cat+1num → unsupported', profiles: [cat(), cat(), num()], type: 'scatter', expectedStatus: 'unsupported' },

  // ── Temporal columns ────────────────────────────────────────────────────
  { label: 'line: temp+num → supported',    profiles: [temp(), num()], type: 'line',      expectedStatus: 'supported' },
  { label: 'area: temp+num → supported',    profiles: [temp(), num()], type: 'area',      expectedStatus: 'supported' },
  { label: 'bar: temp+num → supported',     profiles: [temp(), num()], type: 'bar',       expectedStatus: 'supported' },

  // ── Pie: cardinality cap ─────────────────────────────────────────────────
  { label: 'pie: high-cardinality cat (>20) → unsupported', profiles: [cat(30), num()], type: 'pie', expectedStatus: 'unsupported', reasonPattern: /30 distinct/ },
  { label: 'pie: cat with exactly 20 → supported',          profiles: [cat(20), num()], type: 'pie', expectedStatus: 'supported' },
  { label: 'pie: cat with 21 → unsupported',                profiles: [cat(21), num()], type: 'pie', expectedStatus: 'unsupported' },

  // ── Boolean columns ──────────────────────────────────────────────────────
  { label: 'bar: bool+num → supported', profiles: [bool(), num()], type: 'bar', expectedStatus: 'supported' },
  { label: 'pie: bool+num → supported', profiles: [bool(), num()], type: 'pie', expectedStatus: 'supported' },
  { label: 'heatmap: cat+bool+num → supported', profiles: [cat(), bool(), num()], type: 'heatmap', expectedStatus: 'supported' },

  // ── Empty profiles (nothing useful) ──────────────────────────────────────
  { label: 'bar: no columns → unsupported',  profiles: [],              type: 'bar',  expectedStatus: 'unsupported' },
  { label: 'scatter: no columns → unsupported', profiles: [],           type: 'scatter', expectedStatus: 'unsupported' },
  { label: 'histogram: no columns → unsupported', profiles: [],         type: 'histogram', expectedStatus: 'unsupported' },

  // ── Empty-type columns are excluded from feasibility ─────────────────────
  { label: 'bar: 1 cat + 1 empty + 1 num → supported', profiles: [cat(), p('empty'), num()], type: 'bar', expectedStatus: 'supported' },
  { label: 'scatter: 2 empty + 1 num → unsupported',   profiles: [p('empty'), p('empty'), num()], type: 'scatter', expectedStatus: 'unsupported' },

  // ── No numeric for Y ────────────────────────────────────────────────────
  { label: 'bar: cat only → unsupported',  profiles: [cat(), cat()], type: 'bar',  expectedStatus: 'unsupported', reasonPattern: /numeric/ },
  { label: 'line: cat only → unsupported', profiles: [cat()],        type: 'line', expectedStatus: 'unsupported', reasonPattern: /numeric/ },
]

describe('checkFeasibility', () => {
  for (const s of scenarios) {
    it(s.label, () => {
      const result = checkFeasibility(s.profiles, s.type)
      expect(result.status).toBe(s.expectedStatus)
      if (s.reasonPattern && result.status !== 'supported') {
        expect(result.reason).toMatch(s.reasonPattern)
      }
    })
  }
})
