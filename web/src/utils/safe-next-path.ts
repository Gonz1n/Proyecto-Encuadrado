import { NEXT_PATH_BASE } from '@/constants/navigation'

export function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith('/')) return '/'
  const url = new URL(next, NEXT_PATH_BASE)
  if (url.origin !== NEXT_PATH_BASE) return '/'
  const path = url.pathname + url.search + url.hash
  return path.startsWith('//') || path.includes('\\') ? '/' : path
}
