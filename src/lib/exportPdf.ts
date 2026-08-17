import type { PlotlyFigure } from '@/lib/toPlotly'
import { renderToDataUrl, decodeSvgDataUrl, triggerDownload } from '@/lib/plotlyRender'
import { injectFonts } from '@/lib/fontEmbed'

/**
 * Export the figure as a vector PDF using jsPDF + svg2pdf.js.
 * The chart paths remain as PDF vector paths — no rasterisation.
 * Fonts are embedded in the SVG before conversion so they appear in the PDF.
 */
export async function exportPdf(
  figure: PlotlyFigure,
  opts: { widthMm: number; filename: string },
): Promise<void> {
  const heightMm = Math.round(opts.widthMm * 0.65)
  const widthPx = Math.round((opts.widthMm / 25.4) * 96)
  const heightPx = Math.round(widthPx * 0.65)

  // 1. Get the SVG from Plotly
  const dataUrl = await renderToDataUrl(figure.data, figure.layout, {
    format: 'svg',
    widthPx,
    heightPx,
  })
  const svgString = decodeSvgDataUrl(dataUrl)
  const svgWithFonts = await injectFonts(svgString)

  // 2. Attach SVG to the DOM so svg2pdf can traverse it
  const container = document.createElement('div')
  container.style.cssText =
    'position:fixed;top:-9999px;left:-9999px;visibility:hidden;width:0;height:0'
  container.innerHTML = svgWithFonts
  document.body.appendChild(container)

  const svgEl = container.querySelector('svg')
  if (!svgEl) {
    document.body.removeChild(container)
    throw new Error('No SVG element found after rendering')
  }

  // 3. Lazy-import jsPDF and svg2pdf.js to keep them out of the initial bundle
  const [{ default: jsPDF }, { svg2pdf }] = await Promise.all([
    import('jspdf'),
    import('svg2pdf.js'),
  ])

  // 4. Create a PDF page at the exact figure dimensions
  const pdf = new jsPDF({
    orientation: opts.widthMm >= heightMm ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [opts.widthMm, heightMm],
    compress: true,
  })

  await svg2pdf(svgEl, pdf, {
    x: 0,
    y: 0,
    width: opts.widthMm,
    height: heightMm,
  })

  document.body.removeChild(container)

  // 5. Save
  const blob = pdf.output('blob')
  const url = URL.createObjectURL(blob)
  triggerDownload(url, opts.filename)
  URL.revokeObjectURL(url)
}
