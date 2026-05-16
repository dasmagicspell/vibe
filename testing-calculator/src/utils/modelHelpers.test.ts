import { describe, it, expect } from 'vitest'
import {
  createDefaultModel,
  createDefaultEntries,
  findBaseRateEntry,
  upsertBaseRateEntry,
  validateModel,
  calibrationStepHasError,
  getCalibrationStepErrors,
  formatHours,
  formatRange,
  bumpModelVersion,
  DEFAULT_SCENARIO_ESTIMATES,
} from './modelHelpers'
import { TestType, ComplexityLevel, DefectDensity } from '@/types'

// ---------------------------------------------------------------------------
// createDefaultEntries
// ---------------------------------------------------------------------------

describe('createDefaultEntries', () => {
  it('creates entries for every TestType × ComplexityLevel combination', () => {
    const entries = createDefaultEntries()
    const testTypes = Object.values(TestType)
    const complexities = Object.values(ComplexityLevel)
    expect(entries).toHaveLength(testTypes.length * complexities.length)
  })

  it('all entries have undefined pageCategory (base rates)', () => {
    const entries = createDefaultEntries()
    entries.forEach(e => expect(e.pageCategory).toBeUndefined())
  })

  it('all entries have valid min ≤ expected ≤ max', () => {
    const entries = createDefaultEntries()
    entries.forEach(e => {
      expect(e.baseEstimate.minHours).toBeLessThanOrEqual(e.baseEstimate.expectedHours)
      expect(e.baseEstimate.expectedHours).toBeLessThanOrEqual(e.baseEstimate.maxHours)
    })
  })

  it('each entry has a non-empty id', () => {
    const entries = createDefaultEntries()
    entries.forEach(e => expect(e.id.length).toBeGreaterThan(0))
  })

  it('all ids are unique', () => {
    const entries = createDefaultEntries()
    const ids = entries.map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ---------------------------------------------------------------------------
// createDefaultModel
// ---------------------------------------------------------------------------

describe('createDefaultModel', () => {
  it('creates a model with empty engineerName (to be filled in step 1)', () => {
    const model = createDefaultModel()
    expect(model.engineerName).toBe('')
  })

  it('creates four browser calibration entries', () => {
    const model = createDefaultModel()
    expect(model.browserCalibration).toHaveLength(4)
  })

  it('creates three deliverable estimates', () => {
    const model = createDefaultModel()
    expect(model.deliverableEstimates).toHaveLength(3)
  })

  it('creates four exploratory blocks by default', () => {
    const model = createDefaultModel()
    expect(model.exploratoryBlocks).toHaveLength(4)
  })

  it('has sensible default overhead fractions', () => {
    const model = createDefaultModel()
    expect(model.overheadFactors.coordinationFraction).toBe(0.12)
    expect(model.overheadFactors.reportingFraction).toBe(0.15)
    expect(model.overheadFactors.defaultDefectDensity).toBe(DefectDensity.Medium)
  })
})

// ---------------------------------------------------------------------------
// findBaseRateEntry
// ---------------------------------------------------------------------------

describe('findBaseRateEntry', () => {
  it('finds an existing base rate entry', () => {
    const entries = createDefaultEntries()
    const found = findBaseRateEntry(entries, TestType.Functional, ComplexityLevel.Medium)
    expect(found).toBeDefined()
    expect(found?.testType).toBe(TestType.Functional)
    expect(found?.complexity).toBe(ComplexityLevel.Medium)
  })

  it('returns undefined for a test type not in the list', () => {
    const found = findBaseRateEntry([], TestType.Functional, ComplexityLevel.Medium)
    expect(found).toBeUndefined()
  })

  it('does NOT match category-specific entries', () => {
    const entries = createDefaultEntries().map((e, i) =>
      i === 0 ? { ...e, pageCategory: 'Informational' as never } : e
    )
    const found = findBaseRateEntry(entries, entries[0].testType, entries[0].complexity)
    // Should find the base rate (not the category-specific one we patched)
    // because the category-specific one has a pageCategory set
    expect(found?.pageCategory).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// upsertBaseRateEntry
// ---------------------------------------------------------------------------

describe('upsertBaseRateEntry', () => {
  it('updates an existing entry', () => {
    const entries = createDefaultEntries()
    const newEstimate = { minHours: 99, expectedHours: 100, maxHours: 101 }
    const updated = upsertBaseRateEntry(entries, TestType.Functional, ComplexityLevel.Low, newEstimate)
    const found = findBaseRateEntry(updated, TestType.Functional, ComplexityLevel.Low)
    expect(found?.baseEstimate.expectedHours).toBe(100)
    expect(updated).toHaveLength(entries.length) // no new entry added
  })

  it('inserts a new entry when none exists', () => {
    const newEstimate = { minHours: 1, expectedHours: 2, maxHours: 3 }
    const updated = upsertBaseRateEntry([], TestType.Functional, ComplexityLevel.Low, newEstimate)
    expect(updated).toHaveLength(1)
    expect(updated[0].baseEstimate.expectedHours).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// validateModel
// ---------------------------------------------------------------------------

describe('validateModel', () => {
  it('passes validation for a fully-formed default model with an engineer name', () => {
    const model = { ...createDefaultModel(), engineerName: 'Jane Tester' }
    const result = validateModel(model)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails when engineerName is empty', () => {
    const model = createDefaultModel()
    const result = validateModel(model)
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Engineer name is required.')
  })

  it('fails when min > expected in any entry', () => {
    const model = createDefaultModel()
    model.engineerName = 'Jane'
    model.entries[0].baseEstimate = { minHours: 10, expectedHours: 1, maxHours: 2 }
    const result = validateModel(model)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.includes('min > expected'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// calibrationStepHasError
// ---------------------------------------------------------------------------

describe('calibrationStepHasError', () => {
  it('flags profile step when engineer name or version is empty', () => {
    const model = createDefaultModel()
    expect(calibrationStepHasError(0, model)).toBe(true)

    model.engineerName = 'Jane Tester'
    model.version = ''
    expect(calibrationStepHasError(0, model)).toBe(true)

    model.version = '1.0.0'
    expect(calibrationStepHasError(0, model)).toBe(false)
  })

  it('flags scenarios step when a standard type estimate is cleared', () => {
    const model = { ...createDefaultModel(), engineerName: 'Jane Tester' }
    expect(calibrationStepHasError(2, model)).toBe(false)

    const entry = findBaseRateEntry(model.entries, TestType.Functional, ComplexityLevel.Low)!
    entry.baseEstimate = { minHours: 0, expectedHours: 0, maxHours: 0 }
    expect(calibrationStepHasError(2, model)).toBe(true)
  })

  it('flags exploratory step when blocks are empty or incomplete', () => {
    const model = { ...createDefaultModel(), engineerName: 'Jane Tester' }
    expect(calibrationStepHasError(5, model)).toBe(false)

    model.exploratoryBlocks = [{ label: '', hours: 0 }]
    expect(calibrationStepHasError(5, model)).toBe(true)

    model.exploratoryBlocks = []
    expect(calibrationStepHasError(5, model)).toBe(true)
  })

  it('getCalibrationStepErrors returns seven flags', () => {
    const errors = getCalibrationStepErrors(createDefaultModel())
    expect(errors).toHaveLength(7)
    expect(errors[0]).toBe(true)
    expect(errors.slice(1, 6).every(Boolean)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// formatHours
// ---------------------------------------------------------------------------

describe('formatHours', () => {
  it('formats whole hours correctly', () => {
    expect(formatHours(2)).toBe('2')
    expect(formatHours(0)).toBe('0')
  })

  it('formats sub-hour values as minutes', () => {
    expect(formatHours(0.5)).toBe('30 min')
    expect(formatHours(0.25)).toBe('15 min')
  })

  it('formats fractional hours', () => {
    expect(formatHours(1.5)).toBe('1.5')
    expect(formatHours(2.75)).toBe('2.8')
  })
})

// ---------------------------------------------------------------------------
// formatRange
// ---------------------------------------------------------------------------

describe('formatRange', () => {
  it('formats a range correctly', () => {
    const estimate = { minHours: 1, expectedHours: 2, maxHours: 3 }
    expect(formatRange(estimate)).toBe('1–3 hrs')
  })
})

// ---------------------------------------------------------------------------
// bumpModelVersion
// ---------------------------------------------------------------------------

describe('bumpModelVersion', () => {
  it('increments the patch version', () => {
    expect(bumpModelVersion('1.0.0')).toBe('1.0.1')
    expect(bumpModelVersion('2.3.9')).toBe('2.3.10')
  })

  it('returns the original string if format is unexpected', () => {
    expect(bumpModelVersion('v1')).toBe('v1')
  })
})

// ---------------------------------------------------------------------------
// DEFAULT_SCENARIO_ESTIMATES completeness
// ---------------------------------------------------------------------------

describe('DEFAULT_SCENARIO_ESTIMATES', () => {
  it('covers all TestType values', () => {
    const defined = Object.keys(DEFAULT_SCENARIO_ESTIMATES)
    const allTypes = Object.values(TestType)
    allTypes.forEach(t => {
      expect(defined).toContain(t)
    })
  })

  it('every entry has valid min ≤ expected ≤ max', () => {
    for (const estimates of Object.values(DEFAULT_SCENARIO_ESTIMATES)) {
      for (const est of Object.values(estimates)) {
        const e = est as { minHours: number; expectedHours: number; maxHours: number }
        expect(e.minHours).toBeLessThanOrEqual(e.expectedHours)
        expect(e.expectedHours).toBeLessThanOrEqual(e.maxHours)
      }
    }
  })
})
