// =============================================================================
// modelHelpers.ts
// Pure functions for creating, validating, and manipulating TestingModel data.
// No React imports — fully unit-testable.
// =============================================================================

import type { TestingModel, CalibrationEntry, TimeEstimate, BrowserCalibrationEntry, DeliverableEstimate, ExploratoryBlock } from '@/types'
import { TestType, ComplexityLevel, BrowserTier, DeliverableType, DefectDensity } from '@/types'

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

export function generateId(): string {
  return crypto.randomUUID()
}

// ---------------------------------------------------------------------------
// Default scenario estimates
// Each value is the EXPECTED hours at Standard rigor for that complexity level.
// These pre-populate the calibration wizard — the engineer reviews and adjusts.
// Min ≈ expected × 0.6, Max ≈ expected × 1.7 (moderate uncertainty range).
// ---------------------------------------------------------------------------

type ScenarioDefaults = Record<TestType, Record<ComplexityLevel, TimeEstimate>>

export const DEFAULT_SCENARIO_ESTIMATES: ScenarioDefaults = {
  [TestType.Functional]: {
    [ComplexityLevel.Low]:    { minHours: 0.25, expectedHours: 0.5,  maxHours: 1.0   },
    [ComplexityLevel.Medium]: { minHours: 1.0,  expectedHours: 2.0,  maxHours: 3.5   },
    [ComplexityLevel.High]:   { minHours: 2.5,  expectedHours: 4.0,  maxHours: 7.0   },
  },
  [TestType.UILayout]: {
    [ComplexityLevel.Low]:    { minHours: 0.15, expectedHours: 0.25, maxHours: 0.5   },
    [ComplexityLevel.Medium]: { minHours: 0.5,  expectedHours: 0.75, maxHours: 1.25  },
    [ComplexityLevel.High]:   { minHours: 0.75, expectedHours: 1.5,  maxHours: 2.5   },
  },
  [TestType.ContentReview]: {
    [ComplexityLevel.Low]:    { minHours: 0.1,  expectedHours: 0.25, maxHours: 0.5   },
    [ComplexityLevel.Medium]: { minHours: 0.25, expectedHours: 0.5,  maxHours: 0.75  },
    [ComplexityLevel.High]:   { minHours: 0.5,  expectedHours: 1.0,  maxHours: 1.5   },
  },
  [TestType.LinkValidation]: {
    [ComplexityLevel.Low]:    { minHours: 0.1,  expectedHours: 0.25, maxHours: 0.5   },
    [ComplexityLevel.Medium]: { minHours: 0.25, expectedHours: 0.5,  maxHours: 0.75  },
    [ComplexityLevel.High]:   { minHours: 0.5,  expectedHours: 0.75, maxHours: 1.25  },
  },
  [TestType.FormValidation]: {
    [ComplexityLevel.Low]:    { minHours: 0.25, expectedHours: 0.5,  maxHours: 1.0   },
    [ComplexityLevel.Medium]: { minHours: 0.5,  expectedHours: 1.0,  maxHours: 1.75  },
    [ComplexityLevel.High]:   { minHours: 1.0,  expectedHours: 2.0,  maxHours: 3.5   },
  },
  [TestType.RolePermission]: {
    [ComplexityLevel.Low]:    { minHours: 0.25, expectedHours: 0.5,  maxHours: 1.0   },
    [ComplexityLevel.Medium]: { minHours: 0.75, expectedHours: 1.5,  maxHours: 2.5   },
    [ComplexityLevel.High]:   { minHours: 1.5,  expectedHours: 3.0,  maxHours: 5.0   },
  },
  [TestType.CrossBrowser]: {
    [ComplexityLevel.Low]:    { minHours: 0.25, expectedHours: 0.5,  maxHours: 0.75  },
    [ComplexityLevel.Medium]: { minHours: 0.5,  expectedHours: 1.0,  maxHours: 1.5   },
    [ComplexityLevel.High]:   { minHours: 1.0,  expectedHours: 2.0,  maxHours: 3.0   },
  },
  [TestType.ResponsiveMobile]: {
    [ComplexityLevel.Low]:    { minHours: 0.25, expectedHours: 0.5,  maxHours: 0.75  },
    [ComplexityLevel.Medium]: { minHours: 0.5,  expectedHours: 1.0,  maxHours: 1.5   },
    [ComplexityLevel.High]:   { minHours: 1.0,  expectedHours: 2.0,  maxHours: 3.0   },
  },
  [TestType.Accessibility]: {
    [ComplexityLevel.Low]:    { minHours: 0.25, expectedHours: 0.5,  maxHours: 1.0   },
    [ComplexityLevel.Medium]: { minHours: 1.0,  expectedHours: 2.0,  maxHours: 3.5   },
    [ComplexityLevel.High]:   { minHours: 2.0,  expectedHours: 4.0,  maxHours: 6.0   },
  },
  [TestType.Performance]: {
    [ComplexityLevel.Low]:    { minHours: 0.1,  expectedHours: 0.25, maxHours: 0.5   },
    [ComplexityLevel.Medium]: { minHours: 0.25, expectedHours: 0.5,  maxHours: 0.75  },
    [ComplexityLevel.High]:   { minHours: 0.5,  expectedHours: 1.0,  maxHours: 1.5   },
  },
  [TestType.SEOMeta]: {
    [ComplexityLevel.Low]:    { minHours: 0.1,  expectedHours: 0.25, maxHours: 0.5   },
    [ComplexityLevel.Medium]: { minHours: 0.25, expectedHours: 0.5,  maxHours: 0.75  },
    [ComplexityLevel.High]:   { minHours: 0.5,  expectedHours: 0.75, maxHours: 1.25  },
  },
  [TestType.SecurityPrivacy]: {
    [ComplexityLevel.Low]:    { minHours: 0.25, expectedHours: 0.5,  maxHours: 1.0   },
    [ComplexityLevel.Medium]: { minHours: 0.5,  expectedHours: 1.0,  maxHours: 1.75  },
    [ComplexityLevel.High]:   { minHours: 1.0,  expectedHours: 2.0,  maxHours: 3.5   },
  },
  [TestType.AnalyticsTag]: {
    [ComplexityLevel.Low]:    { minHours: 0.25, expectedHours: 0.5,  maxHours: 1.0   },
    [ComplexityLevel.Medium]: { minHours: 0.5,  expectedHours: 1.0,  maxHours: 2.0   },
    [ComplexityLevel.High]:   { minHours: 1.0,  expectedHours: 2.0,  maxHours: 3.5   },
  },
  [TestType.CMSAdmin]: {
    [ComplexityLevel.Low]:    { minHours: 0.25, expectedHours: 0.5,  maxHours: 1.0   },
    [ComplexityLevel.Medium]: { minHours: 1.0,  expectedHours: 2.0,  maxHours: 3.5   },
    [ComplexityLevel.High]:   { minHours: 2.0,  expectedHours: 4.0,  maxHours: 7.0   },
  },
  [TestType.EmailNotification]: {
    [ComplexityLevel.Low]:    { minHours: 0.25, expectedHours: 0.5,  maxHours: 1.0   },
    [ComplexityLevel.Medium]: { minHours: 0.5,  expectedHours: 1.0,  maxHours: 1.75  },
    [ComplexityLevel.High]:   { minHours: 1.0,  expectedHours: 2.0,  maxHours: 3.5   },
  },
  [TestType.ContentMigration]: {
    [ComplexityLevel.Low]:    { minHours: 0.5,  expectedHours: 1.0,  maxHours: 2.0   },
    [ComplexityLevel.Medium]: { minHours: 1.0,  expectedHours: 2.0,  maxHours: 4.0   },
    [ComplexityLevel.High]:   { minHours: 2.5,  expectedHours: 5.0,  maxHours: 9.0   },
  },
  [TestType.Exploratory]: {
    [ComplexityLevel.Low]:    { minHours: 1.0,  expectedHours: 2.0,  maxHours: 2.0   },
    [ComplexityLevel.Medium]: { minHours: 2.0,  expectedHours: 2.0,  maxHours: 4.0   },
    [ComplexityLevel.High]:   { minHours: 2.0,  expectedHours: 4.0,  maxHours: 4.0   },
  },
  [TestType.E2EAutomation]: {
    [ComplexityLevel.Low]:    { minHours: 2.0,  expectedHours: 4.0,  maxHours: 8.0   },
    [ComplexityLevel.Medium]: { minHours: 4.0,  expectedHours: 8.0,  maxHours: 16.0  },
    [ComplexityLevel.High]:   { minHours: 8.0,  expectedHours: 16.0, maxHours: 30.0  },
  },
}

// ---------------------------------------------------------------------------
// Default browser tier calibration (per page, at Standard rigor)
// ---------------------------------------------------------------------------

export const DEFAULT_BROWSER_CALIBRATION: BrowserCalibrationEntry[] = [
  { tier: BrowserTier.Basic,    estimatePerPage: { minHours: 0.1,  expectedHours: 0.2,  maxHours: 0.35 } },
  { tier: BrowserTier.Standard, estimatePerPage: { minHours: 0.25, expectedHours: 0.4,  maxHours: 0.7  } },
  { tier: BrowserTier.Enhanced, estimatePerPage: { minHours: 0.4,  expectedHours: 0.75, maxHours: 1.25 } },
  { tier: BrowserTier.Custom,   estimatePerPage: { minHours: 0.5,  expectedHours: 1.0,  maxHours: 2.0  } },
]

// ---------------------------------------------------------------------------
// Default deliverable estimates
// ---------------------------------------------------------------------------

export const DEFAULT_DELIVERABLE_ESTIMATES: DeliverableEstimate[] = [
  {
    type:     DeliverableType.TestPlanMatrix,
    estimate: { minHours: 2.0, expectedHours: 4.0, maxHours: 6.0 },
    notes:    'Includes test coverage matrix and risk assessment',
  },
  {
    type:     DeliverableType.UATSupport,
    estimate: { minHours: 2.0, expectedHours: 4.0, maxHours: 8.0 },
    notes:    'Helping client team create and run acceptance tests',
  },
  {
    type:     DeliverableType.FinalQAReport,
    estimate: { minHours: 1.5, expectedHours: 3.0, maxHours: 5.0 },
    notes:    'Formal sign-off document with test results summary',
  },
]

// ---------------------------------------------------------------------------
// Default exploratory blocks
// ---------------------------------------------------------------------------

export const DEFAULT_EXPLORATORY_BLOCKS: ExploratoryBlock[] = [
  { label: '1-hour block',   hours: 1 },
  { label: '2-hour block',   hours: 2 },
  { label: 'Half-day block', hours: 4 },
  { label: 'Full-day block', hours: 8 },
]

// ---------------------------------------------------------------------------
// Model factory — creates a fresh model with all defaults pre-populated
// ---------------------------------------------------------------------------

/**
 * Builds CalibrationEntry records (base rates) from DEFAULT_SCENARIO_ESTIMATES.
 * pageCategory is undefined — these are base rates applying to all categories.
 */
export function createDefaultEntries(): CalibrationEntry[] {
  const entries: CalibrationEntry[] = []
  const complexities = [ComplexityLevel.Low, ComplexityLevel.Medium, ComplexityLevel.High]

  for (const testType of Object.values(TestType)) {
    for (const complexity of complexities) {
      entries.push({
        id:          generateId(),
        testType,
        complexity,
        baseEstimate: DEFAULT_SCENARIO_ESTIMATES[testType][complexity],
      })
    }
  }
  return entries
}

export function createDefaultModel(): TestingModel {
  return {
    version:      '1.0.0',
    engineerName: '',
    calibratedAt: new Date().toISOString(),
    entries:      createDefaultEntries(),
    browserCalibration:    DEFAULT_BROWSER_CALIBRATION.map(b => ({ ...b })),
    overheadFactors: {
      coordinationFraction:    0.12,
      reportingFraction:       0.15,
      defaultDefectDensity:    DefectDensity.Medium,
    },
    deliverableEstimates: DEFAULT_DELIVERABLE_ESTIMATES.map(d => ({ ...d })),
    exploratoryBlocks:    DEFAULT_EXPLORATORY_BLOCKS.map(b => ({ ...b })),
  }
}

// ---------------------------------------------------------------------------
// Helpers for reading and updating entries
// ---------------------------------------------------------------------------

/**
 * Find the base-rate entry for a test type at a specific complexity.
 * Base rate entries have no pageCategory.
 */
export function findBaseRateEntry(
  entries: CalibrationEntry[],
  testType: TestType,
  complexity: ComplexityLevel,
): CalibrationEntry | undefined {
  return entries.find(
    e => e.testType === testType &&
         e.complexity === complexity &&
         e.pageCategory === undefined
  )
}

/** Update (or insert) a base-rate entry for a test type + complexity */
export function upsertBaseRateEntry(
  entries: CalibrationEntry[],
  testType: TestType,
  complexity: ComplexityLevel,
  baseEstimate: TimeEstimate,
  notes?: string,
): CalibrationEntry[] {
  const existing = findBaseRateEntry(entries, testType, complexity)
  if (existing) {
    return entries.map(e =>
      e.id === existing.id ? { ...e, baseEstimate, notes } : e
    )
  }
  const newEntry: CalibrationEntry = {
    id:          generateId(),
    testType,
    complexity,
    baseEstimate,
    notes,
  }
  return [...entries, newEntry]
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ModelValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export function validateModel(model: TestingModel): ModelValidationResult {
  const errors:   string[] = []
  const warnings: string[] = []

  if (!model.engineerName.trim()) {
    errors.push('Engineer name is required.')
  }
  if (!model.version.trim()) {
    errors.push('Version is required.')
  }
  if (model.overheadFactors.coordinationFraction < 0 ||
      model.overheadFactors.coordinationFraction > 1) {
    errors.push('Coordination overhead must be between 0% and 100%.')
  }
  if (model.overheadFactors.reportingFraction < 0 ||
      model.overheadFactors.reportingFraction > 1) {
    errors.push('Reporting overhead must be between 0% and 100%.')
  }
  if (model.entries.length === 0) {
    errors.push('At least one calibration entry is required.')
  }

  const hasZeroEstimates = model.entries.some(
    e => e.baseEstimate.expectedHours === 0
  )
  if (hasZeroEstimates) {
    warnings.push('Some entries have an expected time of 0 hours — verify these are intentional.')
  }

  const hasInvalidRanges = model.entries.some(
    e => e.baseEstimate.minHours > e.baseEstimate.expectedHours ||
         e.baseEstimate.expectedHours > e.baseEstimate.maxHours
  )
  if (hasInvalidRanges) {
    errors.push('Some estimates have min > expected or expected > max. Please correct these.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// ---------------------------------------------------------------------------
// Formatting helpers (used in review step and schedule output)
// ---------------------------------------------------------------------------

export function formatHours(hours: number): string {
  if (hours === 0) return '0'
  if (hours < 1) return `${(hours * 60).toFixed(0)} min`
  return hours % 1 === 0 ? `${hours}` : hours.toFixed(1)
}

export function formatRange(estimate: TimeEstimate): string {
  const min = formatHours(estimate.minHours)
  const max = formatHours(estimate.maxHours)
  return `${min}–${max} hrs`
}

export function formatExpected(estimate: TimeEstimate): string {
  return `${formatHours(estimate.expectedHours)} hrs`
}

/** Bump the patch version — used when the engineer re-exports an updated model */
export function bumpModelVersion(version: string): string {
  const parts = version.split('.').map(Number)
  if (parts.length === 3) {
    parts[2] += 1
    return parts.join('.')
  }
  return version
}
