import { describe, expect, test } from 'vitest'
import { phoneError, socialHref, socialLinkError } from './social-links'

describe('socialLinkError', () => {
  test('acepta vacio y enlaces del dominio correcto', () => {
    expect(socialLinkError('', 'instagram.com', 'Instagram')).toBeNull()
    expect(socialLinkError('https://www.instagram.com/centro', 'instagram.com', 'Instagram')).toBeNull()
    expect(socialLinkError('https://centro.cl')).toBeNull()
  })

  test('rechaza texto que no es enlace y dominios equivocados', () => {
    expect(socialLinkError('centro')).toBe('Ingresa un enlace válido, por ejemplo https://...')
    expect(socialLinkError('https://facebook.com/centro', 'instagram.com', 'Instagram')).toBe(
      'El enlace debe ser de Instagram',
    )
    expect(socialLinkError('https://evil.com/linkedin.com', 'linkedin.com', 'LinkedIn')).toBe(
      'El enlace debe ser de LinkedIn',
    )
  })
})

describe('whatsapp', () => {
  test('arma el enlace a wa.me y valida el celular', () => {
    expect(socialHref('whatsapp_number', '+56912345678')).toBe('https://wa.me/56912345678')
    expect(phoneError('')).toBeNull()
    expect(phoneError('9 1234 5678')).toBeNull()
    expect(phoneError('12345')).toBe('Ingresa un celular chileno, por ejemplo +56 9 1234 5678')
  })
})
