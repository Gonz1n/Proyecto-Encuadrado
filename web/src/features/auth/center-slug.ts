const NEXT_CENTER = /^\/app\/([^/?#]+)(?:[/?#]|$)/

export function centerSlugFromNext(next: string | null): string | null {
  const match = next ? NEXT_CENTER.exec(next) : null
  return match ? match[1] : null
}
