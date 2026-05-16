import { describe, it, expect } from 'vitest'
import { formatAppBuildDate } from './appMeta'

describe('formatAppBuildDate', () => {
  it('formats an ISO date in a stable locale-aware way', () => {
    const formatted = formatAppBuildDate('2026-05-16T12:00:00.000Z')
    expect(formatted).toMatch(/2026/)
    expect(formatted).toMatch(/May|5/)
    expect(formatted).toMatch(/16/)
  })
})
