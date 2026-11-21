export const CENTER_PHOTOS: Record<string, string> = {
  'centro-aurora': '/centros/centro-aurora.svg',
  'clinica-nutrir': '/centros/clinica-nutrir.svg',
}

export function photoFor(photos: Record<string, string>, slug: string): string | null {
  return Object.hasOwn(photos, slug) ? photos[slug] : null
}

export function centerPhoto(slug: string): string | null {
  return photoFor(CENTER_PHOTOS, slug)
}
