import { beforeEach, expect, test } from 'vitest'
import type { Booking } from '../types/booking'
import { readBooking, saveBooking } from './booking-storage'

const booking: Booking = {
  id: 1,
  center: { name: 'Centro Aurora', slug: 'centro-aurora' },
  professional: { full_name: 'Ana Perez' },
  service: { id: 1, name: 'Consulta', price_clp: 20000 },
  start: '2026-11-25T10:00:00',
  end: '2026-11-25T10:30:00',
  modality: 'in_person',
}

beforeEach(() => {
  const store = new Map<string, string>()
  globalThis.sessionStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: () => null,
    length: 0,
  } as Storage
})

test('readBooking returns saved booking for same center', () => {
  saveBooking(booking)
  expect(readBooking('centro-aurora')).toEqual(booking)
})

test('readBooking returns null on missing or corrupt data', () => {
  expect(readBooking('centro-aurora')).toBeNull()
  sessionStorage.setItem('encuadrado.booking', '{not json')
  expect(readBooking('centro-aurora')).toBeNull()
})

test('readBooking returns null for another center', () => {
  saveBooking(booking)
  expect(readBooking('otro-centro')).toBeNull()
})
