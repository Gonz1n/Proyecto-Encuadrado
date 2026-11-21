export function mapsQuery(address: string, commune: string): string {
  const street = address.trim()
  if (!street) return ''
  return [street, commune.trim(), 'Chile'].filter(Boolean).join(', ')
}

export function mapsEmbedUrl(address: string, commune: string): string {
  const query = mapsQuery(address, commune)
  return query ? `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed` : ''
}

export function mapsDirectionsUrl(address: string, commune: string): string {
  const query = mapsQuery(address, commune)
  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : ''
}

export function telHref(phone: string): string {
  const value = phone.replace(/[^+\d]/g, '')
  return value ? `tel:${value}` : ''
}
