export function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function nameInitials(fullName: string): string {
  const words = fullName.split(/\s+/).filter(Boolean)
  return `${words[0]?.charAt(0) ?? ''}${words.length > 1 ? words.at(-1)!.charAt(0) : ''}`.toUpperCase()
}
