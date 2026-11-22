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

const at = (time: string) => `2026-11-20T${time}`
const span = (id: number, start: string, end: string) => ({ id, start: at(start), end: at(end) })

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
  const appts = [span(1, '08:15', '09:00'), span(2, '19:00', '19:45')]
  expect(visibleHourRange('09:00', '19:00', appts)).toEqual({ startMinutes: 480, endMinutes: 1200 })
})

test('blockPosition en porcentaje del rango', () => {
  expect(blockPosition(at('10:00'), at('11:00'), { startMinutes: 540, endMinutes: 1140 })).toEqual({ top: 10, height: 10 })
})

test.each([
  [
    'separa solapes y deja solos los que no chocan',
    [span(1, '09:00', '10:00'), span(2, '09:30', '10:30'), span(3, '11:00', '12:00')],
    [[1, 0, 2], [2, 1, 2], [3, 0, 1]],
  ],
  [
    'solape transitivo forma un solo grupo',
    [span(1, '09:00', '11:00'), span(2, '09:30', '10:00'), span(3, '10:30', '12:00')],
    [[1, 0, 2], [2, 1, 2], [3, 1, 2]],
  ],
  [
    'cita que termina justo cuando empieza otra no se solapa',
    [span(1, '09:00', '10:00'), span(2, '10:00', '11:00')],
    [[1, 0, 1], [2, 0, 1]],
  ],
])('assignLanes: %s', (_, items, expected) => {
  expect(assignLanes(items).map((x) => [x.item.id, x.lane, x.lanes])).toEqual(expected)
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
  const members = [{ id: 2, full_name: 'Camila' }, { id: 1, full_name: 'Matías' }]
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
