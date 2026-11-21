import { describe, expect, test } from 'vitest'
import { safeNextPath } from './safe-next-path'

describe('safeNextPath', () => {
  test('accepts internal paths', () => {
    expect(safeNextPath('/app/x?y=1')).toBe('/app/x?y=1')
    expect(safeNextPath('/app/centro-aurora/agenda?vista=semana')).toBe('/app/centro-aurora/agenda?vista=semana')
  })

  test.each([null, '', '//evil.com', 'https://evil.com', '/\\evil', '/\t/evil.com', '/\n/evil.com', '/..//evil.com', '/.//evil.com', '/%2e%2e//evil.com'])('rejects %j', (value) => {
    expect(safeNextPath(value)).toBe('/')
  })
})
