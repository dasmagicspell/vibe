import { describe, it, expect } from 'vitest'
import { getActiveSectionIndex } from './scrollSpy'

describe('getActiveSectionIndex', () => {
  const LINE = 176

  it('returns 0 when no section has reached the activation line', () => {
    expect(getActiveSectionIndex([400, 1200, 2000], LINE)).toBe(0)
  })

  it('advances when the next section top crosses the line', () => {
    expect(getActiveSectionIndex([100, 176, 900], LINE)).toBe(1)
    expect(getActiveSectionIndex([100, 175, 900], LINE)).toBe(1)
  })

  it('keeps the highest-index section that has passed the line', () => {
    expect(getActiveSectionIndex([-200, 50, 120], LINE)).toBe(2)
  })

  it('does not flicker between adjacent sections at a shared boundary', () => {
    const tops = [80, 176]
    expect(getActiveSectionIndex(tops, LINE)).toBe(1)
    expect(getActiveSectionIndex(tops, LINE)).toBe(1)
  })
})
