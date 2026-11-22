import { CENTER_NAV_LINKS } from '../constants/center-page'

export function professionalSubtitle({ title, university }: { title: string; university: string }): string {
  return [title, university].filter(Boolean).join(' · ')
}

export function navLinks(sections: Record<(typeof CENTER_NAV_LINKS)[number]['key'], boolean>) {
  return CENTER_NAV_LINKS.filter((link) => sections[link.key])
}
