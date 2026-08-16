import { describe, it, expect } from 'vitest'
import { tryParseNumeric } from '@/lib/numericParser'

type Case = {
  label: string
  input: unknown
  expected: number | null
  transform?: string | RegExp
}

const cases: Case[] = [
  // --- Native numbers ---
  { label: 'integer',           input: 42,            expected: 42,       transform: 'none' },
  { label: 'float',             input: 3.14,           expected: 3.14,     transform: 'none' },
  { label: 'negative',          input: -7,             expected: -7,       transform: 'none' },
  { label: 'zero',              input: 0,              expected: 0,        transform: 'none' },

  // --- Plain strings ---
  { label: 'string integer',    input: '42',           expected: 42,       transform: 'none' },
  { label: 'string float',      input: '3.14',         expected: 3.14,     transform: 'none' },
  { label: 'scientific',        input: '1.5e3',        expected: 1500,     transform: 'none' },
  { label: 'negative string',   input: '-99',          expected: -99,      transform: 'none' },

  // --- Currency ---
  { label: 'dollar',            input: '$1,234',       expected: 1234,     transform: /currency/ },
  { label: 'euro prefix',       input: '€42.50',       expected: 42.50,    transform: /currency/ },
  { label: 'pound suffix',      input: '100£',         expected: 100,      transform: /currency/ },
  { label: 'currency+percent',  input: '$50%',         expected: 50,       transform: /currency/ },

  // --- Percent ---
  { label: 'percent',           input: '12%',          expected: 12,       transform: /percent/ },
  { label: 'decimal percent',   input: '3.5%',         expected: 3.5,      transform: /percent/ },
  { label: 'negative percent',  input: '-4%',          expected: -4,       transform: /percent/ },

  // --- Thousands separators ---
  { label: 'thousands',         input: '1,234',        expected: 1234,     transform: /thousands/ },
  { label: 'millions',          input: '1,234,567',    expected: 1234567,  transform: /thousands/ },
  { label: 'thousands+decimal', input: '1,234.56',     expected: 1234.56,  transform: /thousands/ },

  // --- European decimal comma ---
  { label: 'EU simple',         input: '1,5',          expected: 1.5,      transform: /european/ },
  { label: 'EU two decimals',   input: '12,50',        expected: 12.5,     transform: /european/ },
  { label: 'EU full format',    input: '1.234,56',     expected: 1234.56,  transform: /european/ },
  { label: 'EU millions',       input: '1.234.567,89', expected: 1234567.89, transform: /european/ },

  // --- Accounting negatives ---
  { label: 'paren negative',    input: '(1,234)',      expected: -1234,    transform: /parens/ },

  // --- Null / non-numeric ---
  { label: 'null',              input: null,           expected: null },
  { label: 'undefined',        input: undefined,      expected: null },
  { label: 'empty string',     input: '',             expected: null },
  { label: 'text',             input: 'hello',        expected: null },
  { label: 'Date object',      input: new Date(),     expected: null },
  { label: 'boolean true',     input: true,           expected: null },
  { label: 'boolean false',    input: false,          expected: null },
  { label: 'Infinity',         input: Infinity,       expected: null },
  { label: 'NaN',              input: NaN,            expected: null },
]

describe('tryParseNumeric', () => {
  for (const { label, input, expected, transform } of cases) {
    it(label, () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = tryParseNumeric(input as any)
      if (expected === null) {
        expect(result).toBeNull()
      } else {
        expect(result).not.toBeNull()
        expect(result!.value).toBeCloseTo(expected, 6)
        if (transform instanceof RegExp) {
          expect(result!.transform).toMatch(transform)
        } else if (typeof transform === 'string') {
          expect(result!.transform).toBe(transform)
        }
      }
    })
  }
})
