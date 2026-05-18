import { describe, it, expect } from 'vitest'
import { getTestCases } from './testCases'
import { TestType } from '@/types'

describe('getTestCases — ERP integration extras', () => {
  it('appends ERP cases to Functional when hasErpIntegration is true', () => {
    const without = getTestCases(TestType.Functional, undefined, { hasErpIntegration: false })
    const withErp = getTestCases(TestType.Functional, undefined, { hasErpIntegration: true })
    expect(withErp.length).toBeGreaterThan(without.length)
    expect(withErp.some(tc => tc.description.includes('ERP'))).toBe(true)
  })

  it('does not append ERP cases when flag is omitted', () => {
    const base = getTestCases(TestType.Functional)
    const withFlag = getTestCases(TestType.Functional, undefined, { hasErpIntegration: true })
    expect(withFlag.length).toBeGreaterThan(base.length)
  })
})
