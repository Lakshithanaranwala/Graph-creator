// Vite resolves these to the hashed bundle URLs at build time.
// The ?url suffix returns a string URL rather than processing the file content.
import dmSansUrl from '@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2?url'
import spaceGroteskUrl from '@fontsource/space-grotesk/files/space-grotesk-latin-600-normal.woff2?url'

async function toBase64(url: string): Promise<string> {
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  // Convert ArrayBuffer to base64 in chunks to avoid call-stack overflow on large fonts
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const CHUNK = 8192
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

let cachedFontStyles: string | null = null

/**
 * Loads DM Sans 400 and Space Grotesk 600 as base64 woff2 data URIs
 * and returns a CSS `@font-face` block ready to embed in an SVG <defs>.
 * Result is memoised — subsequent calls are instant.
 */
export async function getFontFaceBlock(): Promise<string> {
  if (cachedFontStyles) return cachedFontStyles

  const [dmSansB64, spaceGroteskB64] = await Promise.all([
    toBase64(dmSansUrl),
    toBase64(spaceGroteskUrl),
  ])

  cachedFontStyles = [
    '@font-face{',
    `  font-family:'DM Sans';`,
    `  font-weight:400;font-style:normal;`,
    `  src:url(data:font/woff2;base64,${dmSansB64}) format('woff2');`,
    '}',
    '@font-face{',
    `  font-family:'Space Grotesk';`,
    `  font-weight:600;font-style:normal;`,
    `  src:url(data:font/woff2;base64,${spaceGroteskB64}) format('woff2');`,
    '}',
  ].join('\n')

  return cachedFontStyles
}

/**
 * Injects self-contained @font-face declarations into an SVG string's <defs>.
 * The returned SVG is a standalone file — no external font references.
 */
export async function injectFonts(svgString: string): Promise<string> {
  const block = await getFontFaceBlock()
  const styleTag = `<style type="text/css">${block}</style>`

  // Prefer inserting inside an existing <defs> element
  if (/<defs[^>]*>/.test(svgString)) {
    return svgString.replace(/(<defs[^>]*>)/, `$1${styleTag}`)
  }

  // Create a <defs> immediately after the opening <svg> tag
  return svgString.replace(/(<svg[^>]*>)/, `$1<defs>${styleTag}</defs>`)
}
