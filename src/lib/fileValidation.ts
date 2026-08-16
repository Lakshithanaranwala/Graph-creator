const MAX_BYTES = 50 * 1024 * 1024

const ALLOWED = new Set(['.xlsx', '.xls', '.xlsm', '.csv', '.tsv'])

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string; hint: string }

function ext(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot).toLowerCase()
}

export function validateQuick(file: File): ValidationResult {
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      reason: `File is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 50 MB.`,
      hint: 'Export only the sheet you need, or split the file.',
    }
  }
  const e = ext(file.name)
  if (!ALLOWED.has(e)) {
    return {
      ok: false,
      reason: `"${e || file.name}" is not a supported format.`,
      hint: 'Accepted: .xlsx, .xls, .xlsm, .csv, .tsv',
    }
  }
  return { ok: true }
}

// Must be called after reading the file into a buffer.
export function validateMagicBytes(fileName: string, buffer: ArrayBuffer): ValidationResult {
  const e = ext(fileName)
  const bytes = new Uint8Array(buffer, 0, Math.min(8, buffer.byteLength))

  if (e === '.xlsx' || e === '.xlsm') {
    // ZIP magic: PK (50 4B)
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
      return {
        ok: false,
        reason: 'This file does not look like a valid .xlsx file.',
        hint: 'Re-save from Excel or Google Sheets, then try again.',
      }
    }
  }

  if (e === '.xls') {
    // OLE2 compound document: D0 CF 11 E0
    if (bytes[0] !== 0xd0 || bytes[1] !== 0xcf || bytes[2] !== 0x11 || bytes[3] !== 0xe0) {
      return {
        ok: false,
        reason: 'This file does not look like a valid .xls file.',
        hint: 'Re-save from Excel, then try again.',
      }
    }
  }

  return { ok: true }
}
