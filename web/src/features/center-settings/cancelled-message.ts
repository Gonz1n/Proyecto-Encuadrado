export function cancelledMessage(base: string, n: number): string {
  if (n <= 0) return base
  return n === 1 ? `${base} Se canceló 1 cita.` : `${base} Se cancelaron ${n} citas.`
}
