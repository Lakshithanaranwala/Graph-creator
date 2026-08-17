export function slugify(text: string): string {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'chart'
  )
}

/** Returns e.g. "my-chart-2024-01-15.png" */
export function exportFilename(title: string | undefined, ext: string): string {
  const slug = slugify(title || 'chart')
  const date = new Date().toISOString().slice(0, 10)
  return `${slug}-${date}.${ext}`
}
