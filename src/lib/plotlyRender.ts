/**
 * Renders a Plotly figure in a hidden off-screen div and returns a data URL.
 * Supports PNG and SVG formats with optional scaling (for DPI control).
 *
 * Plotly is imported dynamically so it lands in the same async chunk as the
 * lazy-loaded <Plot> component, avoiding a duplicate 4 MB copy in the main bundle.
 */
import type { Data, Layout } from 'plotly.js'

export async function renderToDataUrl(
  data: Data[],
  layout: Partial<Layout>,
  opts: {
    format: 'png' | 'svg'
    widthPx: number
    heightPx: number
    /** Scale multiplier — output will be widthPx*scale by heightPx*scale (PNG only). */
    scale?: number
  },
): Promise<string> {
  // Dynamic import — shares the chunk already created by lazy(<Plot>)
  const Plotly = (await import('plotly.js/dist/plotly')).default

  const div = document.createElement('div')
  div.style.cssText =
    'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;visibility:hidden'
  document.body.appendChild(div)

  try {
    await Plotly.newPlot(div, data, {
      ...layout,
      width: opts.widthPx,
      height: opts.heightPx,
    })

    const url = await Plotly.toImage(div, {
      format: opts.format,
      width: opts.widthPx,
      height: opts.heightPx,
      scale: opts.scale ?? 1,
    })

    return url
  } finally {
    Plotly.purge(div)
    document.body.removeChild(div)
  }
}

/** Decode a Plotly SVG data URI into a raw SVG string. */
export function decodeSvgDataUrl(dataUrl: string): string {
  if (dataUrl.includes('base64,')) {
    return atob(dataUrl.split('base64,')[1]!)
  }
  // URL-encoded form: data:image/svg+xml,<svg...>
  return decodeURIComponent(dataUrl.replace(/^data:image\/svg\+xml,/, ''))
}

/** Trigger a browser file download from a data URL or object URL. */
export function triggerDownload(href: string, filename: string): void {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
