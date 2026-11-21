import { expect, test } from 'vitest'
import { navLinks, professionalSubtitle } from './center-page'

test('joins title and university and omits empty parts', () => {
  expect(professionalSubtitle({ title: 'Psicóloga', university: 'Universidad de Chile' })).toBe(
    'Psicóloga · Universidad de Chile',
  )
  expect(professionalSubtitle({ title: 'Psicóloga', university: '' })).toBe('Psicóloga')
  expect(professionalSubtitle({ title: '', university: '' })).toBe('')
})

test('shows only nav links whose section has data', () => {
  const all = navLinks({ services: true, professionals: true, location: true, contact: true })
  expect(all.map((link) => link.href)).toEqual(['#servicios', '#profesionales', '#ubicacion', '#contacto'])
  const some = navLinks({ services: true, professionals: false, location: false, contact: true })
  expect(some.map((link) => link.label)).toEqual(['Servicios', 'Contacto'])
})
