import { useState, useEffect } from 'react'
import { useChartStore } from '@/store/chartStore'
import { useTransformStore } from '@/store/transformStore'
import { toPlotly } from '@/lib/toPlotly'
import { exportPng, copyPngToClipboard, pngPixelSize, DPI_OPTIONS } from '@/lib/exportPng'
import type { Dpi } from '@/lib/exportPng'
import { exportSvg } from '@/lib/exportSvg'
import { exportPdf } from '@/lib/exportPdf'
import { outputToCsv, downloadCsv } from '@/lib/exportCsv'
import { exportFilename, slugify } from '@/lib/slugify'

type Format = 'png' | 'svg' | 'pdf'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color: 'var(--c-muted)',
        marginBottom: '8px',
      }}
    >
      {children}
    </p>
  )
}

function RadioGroup<T extends string | number>({
  name,
  options,
  value,
  onChange,
}: {
  name: string
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {options.map((opt) => (
        <label
          key={opt.value}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            color: value === opt.value ? 'var(--c-ink)' : 'var(--c-muted)',
            cursor: 'pointer',
          }}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            style={{ accentColor: 'var(--c-accent)', cursor: 'pointer' }}
          />
          {opt.label}
        </label>
      ))}
    </div>
  )
}

function ActionButton({
  onClick,
  disabled,
  children,
  variant = 'secondary',
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        width: '100%',
        padding: '7px 10px',
        border: variant === 'primary' ? 'none' : '1px solid var(--c-rule)',
        borderRadius: 'var(--r-md)',
        background: variant === 'primary' ? 'var(--c-accent)' : 'var(--c-ground)',
        color: variant === 'primary' ? '#fff' : 'var(--c-ink)',
        fontSize: '0.78rem',
        fontWeight: variant === 'primary' ? 600 : 400,
        fontFamily: 'var(--font-body)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.1s ease',
      }}
    >
      {children}
    </button>
  )
}

export function ExportPanel() {
  const spec = useChartStore((s) => s.activeSpec)
  const transformResult = useTransformStore((s) => s.result)

  const [format, setFormat] = useState<Format>('png')
  const [dpi, setDpi] = useState<Dpi>(300)
  const [transparent, setTransparent] = useState(false)
  const [filename, setFilename] = useState('')
  const [busy, setBusy] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  // Keep filename in sync when chart title changes
  useEffect(() => {
    const ext = format === 'pdf' ? 'pdf' : format === 'svg' ? 'svg' : 'png'
    setFilename(exportFilename(spec?.style.title, ext))
  }, [spec?.style.title, format])

  if (!spec || !transformResult?.ok) {
    return (
      <p style={{ color: 'var(--c-muted)', fontSize: '0.8rem' }}>
        Build a chart first to export it.
      </p>
    )
  }

  const output = transformResult.output
  const widthMm = spec.style.widthMm ?? 180
  const { w: pxW, h: pxH } = pngPixelSize(widthMm, dpi)
  const figure = toPlotly(output, spec)

  async function handleDownload() {
    if (busy) return
    setBusy(true)
    try {
      const ext = format === 'pdf' ? 'pdf' : format === 'svg' ? 'svg' : 'png'
      const fname = filename || exportFilename(spec!.style.title, ext)

      if (format === 'png') {
        await exportPng(figure, { widthMm, dpi, transparent, filename: fname })
      } else if (format === 'svg') {
        await exportSvg(figure, { widthMm, filename: fname })
      } else {
        await exportPdf(figure, { widthMm, filename: fname })
      }
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setBusy(false)
    }
  }

  async function handleCopy() {
    if (busy) return
    setBusy(true)
    try {
      await copyPngToClipboard(figure, { widthMm, dpi, transparent })
      setCopyStatus('copied')
      setTimeout(() => setCopyStatus('idle'), 2000)
    } catch {
      setCopyStatus('error')
      setTimeout(() => setCopyStatus('idle'), 2000)
    } finally {
      setBusy(false)
    }
  }

  function handleDownloadCsv() {
    const csv = outputToCsv(output)
    const fname =
      (spec!.style.title ? slugify(spec!.style.title) : 'chart-data') +
      '-' +
      new Date().toISOString().slice(0, 10) +
      '.csv'
    downloadCsv(csv, fname)
  }

  const formatOptions: { value: Format; label: string }[] = [
    { value: 'png', label: 'PNG — raster image' },
    { value: 'svg', label: 'SVG — vector / Inkscape' },
    { value: 'pdf', label: 'PDF — vector print' },
  ]

  const dpiOptions = DPI_OPTIONS.map((o) => ({
    value: o.dpi as Dpi,
    label: o.label,
  }))

  const copyLabel =
    copyStatus === 'copied'
      ? '✓ Copied!'
      : copyStatus === 'error'
      ? '✗ Clipboard unavailable'
      : '📋 Copy to clipboard'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* ── Format ──────────────────────────────────────────────────── */}
      <section>
        <SectionLabel>Format</SectionLabel>
        <RadioGroup
          name="export-format"
          options={formatOptions}
          value={format}
          onChange={setFormat}
        />
      </section>

      {/* ── PNG-only options ─────────────────────────────────────────── */}
      {format === 'png' && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid var(--c-rule)' }} />

          <section>
            <SectionLabel>Resolution</SectionLabel>
            <RadioGroup
              name="export-dpi"
              options={dpiOptions}
              value={dpi}
              onChange={setDpi}
            />

            {/* Live pixel dimension display */}
            <p
              style={{
                marginTop: '8px',
                padding: '5px 8px',
                background: 'var(--c-ground)',
                border: '1px solid var(--c-rule)',
                borderRadius: 'var(--r-md)',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--c-ink)',
              }}
            >
              {pxW.toLocaleString()} × {pxH.toLocaleString()} px
            </p>
          </section>

          <section>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                color: 'var(--c-ink)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={transparent}
                onChange={(e) => setTransparent(e.target.checked)}
                style={{ accentColor: 'var(--c-accent)', cursor: 'pointer' }}
              />
              Transparent background
            </label>
          </section>
        </>
      )}

      {/* ── Filename ─────────────────────────────────────────────────── */}
      <hr style={{ border: 'none', borderTop: '1px solid var(--c-rule)' }} />

      <section>
        <SectionLabel>Filename</SectionLabel>
        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          style={{
            width: '100%',
            padding: '5px 7px',
            border: '1px solid var(--c-rule)',
            borderRadius: 'var(--r-md)',
            background: 'var(--c-ground)',
            color: 'var(--c-ink)',
            fontSize: '0.72rem',
            fontFamily: 'var(--font-mono)',
          }}
        />
      </section>

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <ActionButton variant="primary" onClick={handleDownload} disabled={busy}>
          {busy ? 'Exporting…' : `⬇ Download ${format.toUpperCase()}`}
        </ActionButton>

        {format === 'png' && (
          <ActionButton onClick={handleCopy} disabled={busy}>
            {copyLabel}
          </ActionButton>
        )}
      </section>

      {/* ── CSV ──────────────────────────────────────────────────────── */}
      <hr style={{ border: 'none', borderTop: '1px solid var(--c-rule)' }} />
      <section>
        <SectionLabel>Data</SectionLabel>
        <ActionButton onClick={handleDownloadCsv}>⬇ Download CSV</ActionButton>
      </section>
    </div>
  )
}
