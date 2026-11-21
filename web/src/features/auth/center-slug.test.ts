import { describe, expect, it } from 'vitest'
import { centerSlugFromNext } from './center-slug'

describe('centerSlugFromNext', () => {
  it('extracts the slug from an app path', () => {
    expect(centerSlugFromNext('/app/centro-aurora/agenda')).toBe('centro-aurora')
    expect(centerSlugFromNext('/app/clinica-nutrir')).toBe('clinica-nutrir')
    expect(centerSlugFromNext('/app/centro-aurora?x=1')).toBe('centro-aurora')
  })

  it('returns null when there is no center in the path', () => {
    expect(centerSlugFromNext(null)).toBeNull()
    expect(centerSlugFromNext('')).toBeNull()
    expect(centerSlugFromNext('/')).toBeNull()
    expect(centerSlugFromNext('/app')).toBeNull()
    expect(centerSlugFromNext('/app/')).toBeNull()
    expect(() => centerSlugFromNext('/app/%zz/agenda')).not.toThrow()
    expect(centerSlugFromNext('/otro/centro-aurora')).toBeNull()
  })
})
