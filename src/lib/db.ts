import { openDB, type IDBPDatabase } from 'idb'
import type { ParsedDataset, RecentFile } from '@/types/dataset'

const DB_NAME = 'sheet-chart'
const DB_VERSION = 1
const MAX_RECENT = 10

type Schema = {
  datasets: {
    key: string
    value: ParsedDataset
  }
  recentFiles: {
    key: string
    value: RecentFile
    indexes: { 'by-date': number }
  }
}

let _db: IDBPDatabase<Schema> | null = null

async function db(): Promise<IDBPDatabase<Schema>> {
  if (_db) return _db
  _db = await openDB<Schema>(DB_NAME, DB_VERSION, {
    upgrade(d) {
      d.createObjectStore('datasets', { keyPath: 'id' })
      const rf = d.createObjectStore('recentFiles', { keyPath: 'id' })
      rf.createIndex('by-date', 'parsedAt')
    },
  })
  return _db
}

export async function getDataset(id: string): Promise<ParsedDataset | undefined> {
  return (await db()).get('datasets', id)
}

export async function storeDataset(dataset: ParsedDataset): Promise<void> {
  await (await db()).put('datasets', dataset)
}

export async function getRecentFiles(): Promise<RecentFile[]> {
  const all = await (await db()).getAllFromIndex('recentFiles', 'by-date')
  // Return most-recent first, capped at MAX_RECENT
  return all.reverse().slice(0, MAX_RECENT)
}

export async function upsertRecentFile(file: RecentFile): Promise<void> {
  await (await db()).put('recentFiles', file)
}
