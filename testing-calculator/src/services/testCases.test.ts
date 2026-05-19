import { describe, it, expect } from 'vitest'
import {
  createDefaultRepresentativeTestCases,
  normalizeRepresentativeTestCases,
  getRepresentativeTestCases,
} from './testCases'
import { TestType } from '@/types'
import { createDefaultModel } from '@/utils/modelHelpers'

describe('createDefaultRepresentativeTestCases', () => {
  it('seeds every test type with at least one case', () => {
    const cases = createDefaultRepresentativeTestCases()
    for (const testType of Object.values(TestType)) {
      expect(cases[testType].length).toBeGreaterThan(0)
    }
  })

  it('assigns unique ids per case', () => {
    const cases = createDefaultRepresentativeTestCases()
    const ids = cases[TestType.Functional].map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('normalizeRepresentativeTestCases', () => {
  it('returns defaults when raw is undefined', () => {
    const normalized = normalizeRepresentativeTestCases(undefined)
    expect(normalized[TestType.Functional].length).toBeGreaterThan(0)
  })

  it('preserves custom cases for a test type', () => {
    const custom = [{ id: 'custom-1', description: 'Custom functional check' }]
    const normalized = normalizeRepresentativeTestCases({
      [TestType.Functional]: custom,
    })
    expect(normalized[TestType.Functional]).toEqual(custom)
    expect(normalized[TestType.UILayout].length).toBeGreaterThan(0)
  })

  it('keeps an explicit empty list for a test type', () => {
    const normalized = normalizeRepresentativeTestCases({
      [TestType.Functional]: [],
    })
    expect(normalized[TestType.Functional]).toEqual([])
  })
})

describe('getRepresentativeTestCases', () => {
  it('returns cases from the model for the requested test type', () => {
    const model = createDefaultModel()
    const custom = [{ id: 'x', description: 'Only case' }]
    model.representativeTestCases[TestType.SEOMeta] = custom

    expect(getRepresentativeTestCases(model, TestType.SEOMeta)).toEqual(custom)
    expect(getRepresentativeTestCases(model, TestType.Functional).length).toBeGreaterThan(0)
  })
})
