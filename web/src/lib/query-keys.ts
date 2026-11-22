export const queryKeys = {
  me: ['me'] as const,
  center: (slug: string) => ['center', slug] as const,
  services: (slug: string) => ['services', slug] as const,
  closures: (slug: string) => ['closures', slug] as const,
  members: (slug: string) => ['members', slug] as const,
  appointments: (slug: string, filters: unknown) => ['appointments', slug, filters] as const,
  publicCenters: ['public-centers'] as const,
  publicCenter: (slug: string) => ['public-center', slug] as const,
  availability: (slug: string, params: unknown) => ['availability', slug, params] as const,
  availableDays: (slug: string, params: unknown) => ['available-days', slug, params] as const,
  appointmentDays: (slug: string, id: number) => ['appointment-availability', slug, id, 'days'] as const,
  appointmentSlots: (slug: string, id: number, date: string) =>
    ['appointment-availability', slug, id, 'slots', date] as const,
}
