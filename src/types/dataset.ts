export type CellValue = string | number | Date | boolean | null

export type ColumnType = 'string' | 'number' | 'date' | 'boolean' | 'mixed'

export type ColumnProfile = {
  name: string
  originalIndex: number
  type: ColumnType
  nullCount: number
  rowCount: number
}

// A sheet as it comes out of the parser: raw rows + where the header lives.
// rawRows[detectedHeaderRow] is the header row; everything after is data.
export type RawSheet = {
  name: string
  rawRows: CellValue[][]
  detectedHeaderRow: number
}

export type ParsedDataset = {
  id: string           // SHA-256 of file content
  fileName: string
  sheets: RawSheet[]
  parsedAt: number
}

export type RecentFile = {
  id: string
  fileName: string
  parsedAt: number
  sheetNames: string[]
  totalRows: number
}
