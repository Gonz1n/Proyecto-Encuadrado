import { CENTER_PHOTOS } from '@/constants/center-photos'

export function photoFor(photos: Record<string, string>, slug: string): string | null {
  return Object.hasOwn(photos, slug) ? photos[slug] : null
}

export function centerPhoto(slug: string): string | null {
  return photoFor(CENTER_PHOTOS, slug)
}
