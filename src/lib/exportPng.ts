import type { PlotlyFigure } from '@/lib/toPlotly'
import { renderToDataUrl, triggerDownload } from '@/lib/plotlyRender'

export const DPI_OPTIONS = [
  { dpi: 96,  label: '96 dpi  — screen' },
  { dpi: 150, label: '150 dpi — presentation' },
  { dpi: 300, label: '300 dpi — print' },
  { dpi: 600, label: '600 dpi — archival' },
] as const

export type Dpi = (typeof DPI_OPTIONS)[number]['dpi']

/** Pixel dimensions the PNG will have at the given DPI. */
export function pngPixelSize(widthMm: number, dpi: Dpi): { w: number; h: number } {
  const w = Math.round((widthMm / 25.4) * dpi)
  const h = Math.round(w * 0.65)
  return { w, h }
}

/**
 * Export the figure as a PNG at the requested DPI.
 * Plotly renders at 96 DPI (screen) internally; `scale = dpi/96` multiplies
 * the canvas so the output pixel count equals mm/25.4 × dpi.
 */
export async function exportPng(
  figure: PlotlyFigure,
  opts: {
    widthMm: number
    dpi: Dpi
    transparent: boolean
    filename: string
  },
): Promise<void> {
  const scale = opts.dpi / 96
  const basePx = Math.round((opts.widthMm / 25.4) * 96)
  const baseH = Math.round(basePx * 0.65)

  const layout = opts.transparent
    ? { ...figure.layout, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)' }
    : figure.layout

  const dataUrl = await renderToDataUrl(figure.data, layout, {
    format: 'png',
    widthPx: basePx,
    heightPx: baseH,
    scale,
  })

  triggerDownload(dataUrl, opts.filename)
}

/** Copy the chart as a PNG to the system clipboard. */
export async function copyPngToClipboard(
  figure: PlotlyFigure,
  opts: { widthMm: number; dpi: Dpi; transparent: boolean },
): Promise<void> {
  const scale = opts.dpi / 96
  const basePx = Math.round((opts.widthMm / 25.4) * 96)
  const baseH = Math.round(basePx * 0.65)

  const layout = opts.transparent
    ? { ...figure.layout, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)' }
    : figure.layout

  const dataUrl = await renderToDataUrl(figure.data, layout, {
    format: 'png',
    widthPx: basePx,
    heightPx: baseH,
    scale,
  })

  const blob = await fetch(dataUrl).then((r) => r.blob())
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}
