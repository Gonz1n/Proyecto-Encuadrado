const BASE = 'http://localhost'

export function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/')) return '/'
  const url = new URL(next, BASE)
  if (url.origin !== BASE) return '/'
  const path = url.pathname + url.search + url.hash
  return path.startsWith('//') || path.includes('\\') ? '/' : path
}
