import type { PlotlyFigure } from '@/lib/toPlotly'
import { renderToDataUrl, decodeSvgDataUrl, triggerDownload } from '@/lib/plotlyRender'
import { injectFonts } from '@/lib/fontEmbed'

/**
 * Export the figure as a standalone SVG with self-contained @font-face declarations.
 * Opening the file in Inkscape, Illustrator, or a text editor will show the
 * font data embedded as a base64 data URI — no external network reference needed.
 */
export async function exportSvg(
  figure: PlotlyFigure,
  opts: { widthMm: number; filename: string },
): Promise<void> {
  const widthPx = Math.round((opts.widthMm / 25.4) * 96)
  const heightPx = Math.round(widthPx * 0.65)

  const dataUrl = await renderToDataUrl(figure.data, figure.layout, {
    format: 'svg',
    widthPx,
    heightPx,
  })

  const svgString = decodeSvgDataUrl(dataUrl)
  const svgWithFonts = await injectFonts(svgString)

  const blob = new Blob([svgWithFonts], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  triggerDownload(url, opts.filename)
  URL.revokeObjectURL(url)
}
