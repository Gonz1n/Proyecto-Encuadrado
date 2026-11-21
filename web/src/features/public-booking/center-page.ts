export function professionalSubtitle({ title, university }: { title: string; university: string }): string {
  return [title, university].filter(Boolean).join(' · ')
}

const NAV_LINKS = [
  { key: 'services', href: '#servicios', label: 'Servicios' },
  { key: 'professionals', href: '#profesionales', label: 'Profesionales' },
  { key: 'location', href: '#ubicacion', label: 'Ubicación' },
  { key: 'contact', href: '#contacto', label: 'Contacto' },
] as const

export function navLinks(sections: Record<(typeof NAV_LINKS)[number]['key'], boolean>) {
  return NAV_LINKS.filter((link) => sections[link.key])
}
