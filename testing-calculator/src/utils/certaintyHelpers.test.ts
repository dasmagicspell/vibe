import { describe, it, expect } from 'vitest'
import type { CalibrationEntry, ProjectSpec } from '@/types'
import { TestType, ComplexityLevel, NotificationScope, PageCategory } from '@/types'
import {
  minCertainty,
  isEstimateEmpty,
  deriveCalibrationCertainty,
  normalizeEntryCertainty,
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
