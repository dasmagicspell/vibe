import { describe, it, expect } from 'vitest'
import type { CalibrationEntry, ProjectSpec } from '@/types'
import { TestType, ComplexityLevel, NotificationScope, PageCategory } from '@/types'
import {
  minCertainty,
  isEstimateEmpty,
  deriveCalibrationCertainty,
  normalizeEntryCertainty,
  calibrationRowCertainty,
  getCalibrationAttentionItems,
  formatCalibrationAttentionRow,
  intakeCertaintyForCell,
  intakeCertaintyForProject,
  normalizeProjectSpec,
} from './certaintyHelpers'

describe('minCertainty', () => {
  it('returns the lowest level', () => {
    expect(minCertainty('High', 'Medium', 'Low')).toBe('Low')
    expect(minCertainty('High', 'High', 'Medium')).toBe('Medium')
    expect(minCertainty('High')).toBe('High')
  })
})

describe('isEstimateEmpty', () => {
  it('is true when expectedHours is zero', () => {
    expect(isEstimateEmpty({ minHours: 1, expectedHours: 0, maxHours: 2 })).toBe(true)
    expect(isEstimateEmpty({ minHours: 0, expectedHours: 0, maxHours: 0 })).toBe(true)
  })

  it('is false when expectedHours is positive', () => {
    expect(isEstimateEmpty({ minHours: 0, expectedHours: 1, maxHours: 0 })).toBe(false)
  })
})

describe('deriveCalibrationCertainty', () => {
  const filled = { minHours: 1, expectedHours: 2, maxHours: 3 }

  it('returns Low for empty estimate regardless of explicit', () => {
    const empty = { minHours: 0, expectedHours: 0, maxHours: 0 }
    expect(deriveCalibrationCertainty(empty, 'High')).toBe('Low')
  })

  it('returns explicit when estimate is filled', () => {
    expect(deriveCalibrationCertainty(filled, 'Medium')).toBe('Medium')
  })

  it('defaults to High when filled and no explicit', () => {
    expect(deriveCalibrationCertainty(filled)).toBe('High')
  })
})

describe('calibrationRowCertainty', () => {
  it('returns Low when estimate is empty', () => {
    const entries = [{
      id: '1',
      testType: TestType.Functional,
      complexity: ComplexityLevel.Low,
      baseEstimate: { minHours: 0, expectedHours: 0, maxHours: 0 },
      certainty: 'High',
    }] as CalibrationEntry[]
    expect(calibrationRowCertainty(entries, TestType.Functional, ComplexityLevel.Low)).toBe('Low')
  })

  it('returns stored certainty when estimate is filled', () => {
    const entries = [{
      id: '1',
      testType: TestType.Functional,
      complexity: ComplexityLevel.Low,
      baseEstimate: { minHours: 1, expectedHours: 2, maxHours: 3 },
      certainty: 'Medium',
    }] as CalibrationEntry[]
    expect(calibrationRowCertainty(entries, TestType.Functional, ComplexityLevel.Low)).toBe('Medium')
  })
})

describe('getCalibrationAttentionItems', () => {
  it('lists test types with missing estimates or non-High certainty', () => {
    const entries = [{
      id: '1',
      testType: TestType.Functional,
      complexity: ComplexityLevel.Low,
      baseEstimate: { minHours: 1, expectedHours: 2, maxHours: 3 },
      certainty: 'Medium',
    }, {
      id: '2',
      testType: TestType.Functional,
      complexity: ComplexityLevel.Medium,
      baseEstimate: { minHours: 1, expectedHours: 2, maxHours: 3 },
      certainty: 'High',
    }, {
      id: '3',
      testType: TestType.UILayout,
      complexity: ComplexityLevel.Low,
      baseEstimate: { minHours: 0, expectedHours: 0, maxHours: 0 },
      certainty: 'High',
    }] as CalibrationEntry[]

    const items = getCalibrationAttentionItems(entries, [TestType.Functional, TestType.UILayout])
    expect(items).toHaveLength(2)
    expect(items[0].testType).toBe(TestType.Functional)
    expect(items[0].rows.map(r => r.complexity)).toEqual(
      expect.arrayContaining([ComplexityLevel.Low, ComplexityLevel.High]),
    )
    expect(items[0].rows.find(r => r.complexity === ComplexityLevel.Low)?.certainty).toBe('Medium')
    expect(items[1].testType).toBe(TestType.UILayout)
    expect(items[1].rows).toHaveLength(3)
    expect(items[1].rows.every(r => r.empty)).toBe(true)
  })

  it('returns empty when all rows are High with estimates', () => {
    const filled = { minHours: 1, expectedHours: 2, maxHours: 3 }
    const entries = [
      ComplexityLevel.Low,
      ComplexityLevel.Medium,
      ComplexityLevel.High,
    ].map((complexity, i) => ({
      id: String(i),
      testType: TestType.Functional,
      complexity,
      baseEstimate: filled,
      certainty: 'High' as const,
    }))
    expect(getCalibrationAttentionItems(entries, [TestType.Functional])).toHaveLength(0)
  })
})

describe('formatCalibrationAttentionRow', () => {
  it('describes missing estimates and certainty levels', () => {
    expect(formatCalibrationAttentionRow({
      complexity: ComplexityLevel.Low,
      empty: true,
      certainty: 'Low',
    })).toBe('Low: missing estimate')
    expect(formatCalibrationAttentionRow({
      complexity: ComplexityLevel.Medium,
      empty: false,
      certainty: 'Medium',
    })).toBe('Medium: Medium certainty')
  })
})

describe('normalizeEntryCertainty', () => {
  it('fills missing certainty from estimate', () => {
    const entry: CalibrationEntry = {
      id: '1',
      testType: TestType.Functional,
      complexity: ComplexityLevel.Medium,
      baseEstimate: { minHours: 1, expectedHours: 2, maxHours: 3 },
    } as CalibrationEntry
    expect(normalizeEntryCertainty(entry).certainty).toBe('High')
  })
})

describe('intakeCertaintyForProject', () => {
  it('includes defect density certainty when override is set', () => {
    const project = {
      rigorCertainty: 'High',
      browserTierCertainty: 'High',
      defectDensityOverride: 'High',
      defectDensityCertainty: 'Low',
    } as ProjectSpec
    expect(intakeCertaintyForProject(project)).toBe('Low')
  })

  it('includes lowest integration certainty when integrations exist', () => {
    const project = {
      rigorCertainty: 'High',
      browserTierCertainty: 'High',
      integrations: [
        { id: '1', certainty: 'High' },
        { id: '2', certainty: 'Low' },
      ],
    } as ProjectSpec
    expect(intakeCertaintyForProject(project)).toBe('Low')
  })
})

describe('intakeCertaintyForCell', () => {
  it('mins row and project certainties', () => {
    const project = {
      rigorCertainty: 'High',
      browserTierCertainty: 'Medium',
      pages: [{
        id: 'p1',
        complexityCertainty: 'Low',
      }],
      workflows: [],
    } as ProjectSpec
    expect(intakeCertaintyForCell(project, 'page', 'p1')).toBe('Low')
  })
})

describe('normalizeProjectSpec', () => {
  it('fills missing certainty fields with High', () => {
    const project = { pages: [{}], workflows: [], integrations: [{}] } as ProjectSpec
    const normalized = normalizeProjectSpec(project)
    expect(normalized.rigorCertainty).toBe('High')
    expect(normalized.browserTierCertainty).toBe('High')
    expect(normalized.pages[0].complexityCertainty).toBe('High')
    expect(normalized.integrations[0].certainty).toBe('High')
  })

  it('infers Basic notification scope when legacy project has form pages', () => {
    const project = {
      pages: [{ category: PageCategory.SimpleForm }],
      workflows: [],
    } as ProjectSpec
    const normalized = normalizeProjectSpec(project)
    expect(normalized.notificationScope).toBe(NotificationScope.Basic)
  })
})
