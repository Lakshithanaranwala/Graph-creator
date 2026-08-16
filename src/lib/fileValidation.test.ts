import { describe, it, expect } from 'vitest'
import { validateQuick, validateMagicBytes } from '@/lib/fileValidation'

function fakeFile(name: string, size = 100): File {
  return new File(['x'.repeat(size)], name)
}

function xlsxMagic(): ArrayBuffer {
  // PK header (50 4B) followed by zeros
  const buf = new ArrayBuffer(8)
  const view = new Uint8Array(buf)
  view[0] = 0x50; view[1] = 0x4b
  return buf
}

function corruptMagic(): ArrayBuffer {
  return new ArrayBuffer(8) // all zeros
}

describe('validateQuick', () => {
  it('accepts a valid xlsx file', () => {
    expect(validateQuick(fakeFile('report.xlsx'))).toEqual({ ok: true })
  })

  it('accepts csv and tsv', () => {
    expect(validateQuick(fakeFile('data.csv'))).toEqual({ ok: true })
    expect(validateQuick(fakeFile('data.tsv'))).toEqual({ ok: true })
  })

  it('rejects an unsupported extension', () => {
    const r = validateQuick(fakeFile('data.pdf'))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/not a supported format/)
  })

  it('rejects a file over 50 MB', () => {
    const r = validateQuick(fakeFile('huge.xlsx', 51 * 1024 * 1024))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/50 MB/)
  })
})

describe('validateMagicBytes', () => {
  it('passes a valid xlsx magic sequence', () => {
    expect(validateMagicBytes('file.xlsx', xlsxMagic())).toEqual({ ok: true })
  })

  it('rejects an xlsx file with wrong magic bytes', () => {
    const r = validateMagicBytes('file.xlsx', corruptMagic())
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/valid \.xlsx/)
  })

  it('does not magic-check csv files', () => {
    // CSV has no magic — any bytes should pass
    expect(validateMagicBytes('file.csv', corruptMagic())).toEqual({ ok: true })
  })
})
