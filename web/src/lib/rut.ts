const RUT_PATTERN = /^(\d{7,8})-?([\dK])$/

function checkDigit(number: number): string {
  let total = 0
  let factor = 2
  for (const digit of String(number).split('').reverse()) {
    total += Number(digit) * factor
    factor = factor === 7 ? 2 : factor + 1
  }
  const rest = 11 - (total % 11)
  return rest === 11 ? '0' : rest === 10 ? 'K' : String(rest)
}

export function normalizeRut(value: string): string | null {
  const match = RUT_PATTERN.exec(value.trim().toUpperCase().replace(/[.\s]/g, ''))
  if (!match || checkDigit(Number(match[1])) !== match[2]) return null
  return `${Number(match[1]).toLocaleString('es-CL')}-${match[2]}`
}

export function formatRutInput(value: string): string {
  const clean = value
    .toUpperCase()
    .replace(/[^\dK]/g, '')
    .replace(/K(?=.)/g, '')
    .slice(0, 9)
  if (clean.length < 2) return clean
  const body = clean.slice(0, -1).replace(/\B(?=(\d{3})+$)/g, '.')
  return `${body}-${clean.slice(-1)}`
}
