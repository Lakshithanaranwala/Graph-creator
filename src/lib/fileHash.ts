// SHA-256 of the file buffer — used as a stable cache key.
// SubtleCrypto is available in all modern browsers and in workers.
export async function hashBuffer(buffer: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
