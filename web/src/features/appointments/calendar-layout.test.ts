import { expect, test } from 'vitest'
import {
  assignLanes,
  blockPosition,
  dayColumns,
  parseDateParam,
  professionalColor,
  resolveView,
  visibleHourRange,
  weekDays,
  weekRangeLabel,
} from './calendar-layout'

test('parseDateParam acepta fecha real y rechaza invalidas', () => {
  const today = new Date(2026, 10, 20)
  expect(parseDateParam('2026-11-25', today)).toEqual(new Date(2026, 10, 25))
  expect(parseDateParam('2026-02-30', today)).toEqual(today)
  expect(parseDateParam('abc', today)).toEqual(today)
  expect(parseDateParam(null, today)).toEqual(today)
})

test('weekDays empieza el lunes', () => {
  const days = weekDays(new Date(2026, 10, 20))
  expect(days).toHaveLength(7)
  expect(days[0]).toEqual(new Date(2026, 10, 16))
  expect(days[6]).toEqual(new Date(2026, 10, 22))
})

test('visibleHourRange usa el horario del centro', () => {
  expect(visibleHourRange('09:00', '19:00', [])).toEqual({ startMinutes: 540, endMinutes: 1140 })
})

test('visibleHourRange se extiende para citas fuera del horario', () => {
  const appts = [
    { start: '2026-11-20T08:15', end: '2026-11-20T09:00' },
    { start: '2026-11-20T19:00', end: '2026-11-20T19:45' },
  ]
  expect(visibleHourRange('09:00', '19:00', appts)).toEqual({ startMinutes: 480, endMinutes: 1200 })
})

test('blockPosition en porcentaje del rango', () => {
  expect(
    blockPosition('2026-11-20T10:00', '2026-11-20T11:00', { startMinutes: 540, endMinutes: 1140 }),
  ).toEqual({ top: 10, height: 10 })
})

test('assignLanes separa solapes y deja solos los que no chocan', () => {
  const r = assignLanes([
    { id: 1, start: '2026-11-20T09:00', end: '2026-11-20T10:00' },
    { id: 2, start: '2026-11-20T09:30', end: '2026-11-20T10:30' },
    { id: 3, start: '2026-11-20T11:00', end: '2026-11-20T12:00' },
  ])
  expect(r.map((x) => [x.item.id, x.lane, x.lanes])).toEqual([
    [1, 0, 2],
    [2, 1, 2],
    [3, 0, 1],
  ])
})

test('assignLanes: solape transitivo forma un solo grupo', () => {
  const r = assignLanes([
    { id: 1, start: '2026-11-20T09:00', end: '2026-11-20T11:00' },
    { id: 2, start: '2026-11-20T09:30', end: '2026-11-20T10:00' },
    { id: 3, start: '2026-11-20T10:30', end: '2026-11-20T12:00' },
  ])
  expect(r.map((x) => [x.item.id, x.lane, x.lanes])).toEqual([
    [1, 0, 2],
    [2, 1, 2],
    [3, 1, 2],
  ])
})

test('assignLanes: cita que termina justo cuando empieza otra no se solapa', () => {
  const r = assignLanes([
    { id: 1, start: '2026-11-20T09:00', end: '2026-11-20T10:00' },
    { id: 2, start: '2026-11-20T10:00', end: '2026-11-20T11:00' },
  ])
  expect(r.map((x) => x.lanes)).toEqual([1, 1])
})

test('professionalColor es estable por id', () => {
  expect(professionalColor(3)).toBe(professionalColor(3))
  expect(professionalColor(1)).not.toBe(professionalColor(2))
})

test('weekRangeLabel abrevia segun mes y año', () => {
  expect(weekRangeLabel(new Date(2026, 10, 16), new Date(2026, 10, 22))).toBe('16 – 22 nov 2026')
  expect(weekRangeLabel(new Date(2026, 10, 30), new Date(2026, 11, 6))).toBe('30 nov – 6 dic 2026')
  expect(weekRangeLabel(new Date(2025, 11, 29), new Date(2026, 0, 4))).toBe('29 dic 2025 – 4 ene 2026')
})

test('resolveView cae a semana sin permiso y a lista con valores invalidos', () => {
  expect(resolveView('dia', true)).toBe('dia')
  expect(resolveView('dia', false)).toBe('semana')
  expect(resolveView('semana', false)).toBe('semana')
  expect(resolveView('mes', true)).toBe('lista')
  expect(resolveView(null, true)).toBe('lista')
})

test('dayColumns pone primero a los miembros y agrega profesionales desconocidos sin duplicar', () => {
  const members = [
    { id: 2, full_name: 'Camila' },
    { id: 1, full_name: 'Matías' },
  ]
  const appointments = [
    { professional: { id: 1, full_name: 'Matías' } },
    { professional: { id: 9, full_name: 'Ex Miembro' } },
    { professional: { id: 9, full_name: 'Ex Miembro' } },
  ]
  expect(dayColumns(members, appointments)).toEqual([
    { id: 2, name: 'Camila' },
    { id: 1, name: 'Matías' },
    { id: 9, name: 'Ex Miembro' },
  ])
})
