import { NEXT_CENTER_PATTERN } from '../constants/patterns'

export function centerSlugFromNext(next: string | null): string | null {
  const match = next ? NEXT_CENTER_PATTERN.exec(next) : null
  return match ? match[1] : null
}
