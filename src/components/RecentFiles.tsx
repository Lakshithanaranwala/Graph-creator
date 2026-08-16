import type { RecentFile } from '@/types/dataset'
import { getDataset } from '@/lib/db'
import { useDatasetStore } from '@/store/datasetStore'

type Props = {
  files: RecentFile[]
}

function relativeDate(ts: number): string {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function RecentFiles({ files }: Props) {
  const store = useDatasetStore()

  async function openCached(file: RecentFile) {
    const dataset = await getDataset(file.id)
    if (!dataset) return
    store.setDataset(dataset)
    store.setPhase('sheetPick')
  }

  if (files.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <p
        style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: 'var(--c-muted)',
          marginBottom: '2px',
        }}
      >
        Recent files
      </p>

      {files.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => void openCached(f)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            padding: '7px 10px',
            background: 'var(--c-ground)',
            border: '1px solid var(--c-rule)',
            borderRadius: 'var(--r-md)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 500,
              color: 'var(--c-ink)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
            }}
          >
            {f.fileName}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--c-muted)', fontFamily: 'var(--font-mono)' }}>
            {relativeDate(f.parsedAt)} · {f.sheetNames.length} sheet{f.sheetNames.length !== 1 ? 's' : ''}
          </span>
        </button>
      ))}
    </div>
  )
}
