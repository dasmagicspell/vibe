// =============================================================================
// CalculationEngine.ts
// Pure function: (TestingModel, ProjectSpec) → ScheduleOutput
//
// Formula recap (from SPEC.md):
//   CellEstimate = BaseEstimate(testType, complexity) at Standard rigor
//                × RIGOR_MULTIPLIERS[rigorLevel]
//                × BROWSER_SCALING[browserTier]   (CrossBrowser/Responsive only)
//
//   RetestingEstimate  = ExecutionSubtotal × DEFECT_DENSITY_MULTIPLIERS[density]
//   RegressionEstimate = RetestingEstimate × 0.60
//   CoordOverhead      = ExecutionSubtotal × coordinationFraction
//   ReportOverhead     = ExecutionSubtotal × reportingFraction
//   GrandTotal         = sum of all the above + deliverables
//
// Certainty:
//   High   — exact (testType, complexity) base-rate entry found
//   Medium — entry found at adjacent complexity (interpolated / approximate)
//   Low    — no calibration data for this testType; flagged for review
// =============================================================================

import type {
  TestingModel, ProjectSpec, ScheduleOutput, ScheduleRow, ScheduleCell,
  SummaryLineItem, CalibrationEntry, TimeEstimate,
} from '@/types'
import {
  TestType, ComplexityLevel, BrowserTier,
  RIGOR_MULTIPLIERS, DEFECT_DENSITY_MULTIPLIERS,
} from '@/types'
import { getTestCases } from './testCases'
import { formatRange } from '@/utils/modelHelpers'

// ---------------------------------------------------------------------------
// Browser-tier scaling factors
// Applied on top of the base scenario estimate for browser-dependent test types.
// The engineer calibrates CrossBrowser/Responsive at their Standard tier baseline.
// ---------------------------------------------------------------------------

const BROWSER_TIER_SCALING: Record<BrowserTier, number> = {
  [BrowserTier.Basic]:    0.50,
  [BrowserTier.Standard]: 1.00,
  [BrowserTier.Enhanced]: 1.65,
  [BrowserTier.Custom]:   2.20,
}

const RESPONSIVE_TIER_SCALING: Record<BrowserTier, number> = {
  [BrowserTier.Basic]:    0.65,
  [BrowserTier.Standard]: 1.00,
  [BrowserTier.Enhanced]: 1.40,
  [BrowserTier.Custom]:   1.80,
}

// Complexity order for adjacent-entry fallback
const COMPLEXITY_ORDER = [
  ComplexityLevel.Low,
  ComplexityLevel.Medium,
  ComplexityLevel.High,
] as const

// ---------------------------------------------------------------------------
// Arithmetic helpers
// ---------------------------------------------------------------------------

export function addEstimates(a: TimeEstimate, b: TimeEstimate): TimeEstimate {
  return {
    minHours:      roundQ(a.minHours + b.minHours),
    expectedHours: roundQ(a.expectedHours + b.expectedHours),
    maxHours:      roundQ(a.maxHours + b.maxHours),
  }
}

export function scaleEstimate(e: TimeEstimate, factor: number): TimeEstimate {
  return {
    minHours:      roundQ(e.minHours * factor),
    expectedHours: roundQ(e.expectedHours * factor),
    maxHours:      roundQ(e.maxHours * factor),
  }
}

export function sumEstimates(estimates: TimeEstimate[]): TimeEstimate {
  return estimates.reduce(addEstimates, { minHours: 0, expectedHours: 0, maxHours: 0 })
}

function roundQ(n: number): number {
  return Math.round(n * 4) / 4   // nearest 0.25 hrs
}

// ---------------------------------------------------------------------------
// Calibration entry lookup
// ---------------------------------------------------------------------------

function findExactEntry(
  entries: CalibrationEntry[],
  testType: TestType,
  complexity: ComplexityLevel,
): CalibrationEntry | undefined {
  return entries.find(
    e => e.pageCategory === undefined &&
         e.testType    === testType   &&
         e.complexity  === complexity
  )
}

/** Try adjacent complexities in order: Medium → then the other end. */
function findAdjacentEntry(
  entries: CalibrationEntry[],
  testType: TestType,
  targetComplexity: ComplexityLevel,
): CalibrationEntry | undefined {
  const tryOrder = COMPLEXITY_ORDER.filter(c => c !== targetComplexity)
  // Prefer Medium as the most neutral fallback
  const sorted = [
    ComplexityLevel.Medium,
    ...tryOrder.filter(c => c !== ComplexityLevel.Medium),
  ]
  for (const c of sorted) {
    const entry = entries.find(
      e => e.pageCategory === undefined && e.testType === testType && e.complexity === c
    )
    if (entry) return entry
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Single-cell estimate computation
// ---------------------------------------------------------------------------

interface CellComputation {
  estimate:    TimeEstimate
  certainty:   'High' | 'Medium' | 'Low'
  needsReview: boolean
  source:      string   // human-readable explanation, shown in drill-down
}

export function computeCellEstimate(
  entries:    CalibrationEntry[],
  testType:   TestType,
  complexity: ComplexityLevel,
  rigorLevel: import('@/types').RigorLevel,
  browserTier: BrowserTier,
): CellComputation {
  const rigorMultiplier = RIGOR_MULTIPLIERS[rigorLevel]

  // Determine browser scaling for browser-sensitive test types
  const browserScale =
    testType === TestType.CrossBrowser    ? BROWSER_TIER_SCALING[browserTier]    :
    testType === TestType.ResponsiveMobile ? RESPONSIVE_TIER_SCALING[browserTier] :
    1.0

  // 1. Exact match
  const exact = findExactEntry(entries, testType, complexity)
  if (exact && exact.baseEstimate.expectedHours > 0) {
    const base = scaleEstimate(exact.baseEstimate, rigorMultiplier * browserScale)
    return {
      estimate:    base,
      certainty:   'High',
      needsReview: false,
      source:      `Calibrated at ${complexity} complexity × ${rigorLevel} rigor`,
    }
  }

  // 2. Adjacent complexity fallback
  const adjacent = findAdjacentEntry(entries, testType, complexity)
  if (adjacent && adjacent.baseEstimate.expectedHours > 0) {
    // Apply a rough complexity ratio using COMPLEXITY_ORDER indices
    const fromIdx = COMPLEXITY_ORDER.indexOf(adjacent.complexity)
    const toIdx   = COMPLEXITY_ORDER.indexOf(complexity)
    const complexityRatio = (toIdx + 1) / (fromIdx + 1)   // simple 1:2:3 ratio

    const base = scaleEstimate(
      adjacent.baseEstimate,
      rigorMultiplier * browserScale * complexityRatio
    )
    return {
      estimate:    base,
      certainty:   'Medium',
      needsReview: false,
      source:      `Interpolated from ${adjacent.complexity} calibration (no exact ${complexity} entry)`,
    }
  }

  // 3. No data — return zero estimate, flag for review
  return {
    estimate:    { minHours: 0, expectedHours: 0, maxHours: 0 },
    certainty:   'Low',
    needsReview: true,
    source:      `No calibration data found for ${testType} — add to model`,
  }
}

// ---------------------------------------------------------------------------
// Row builders
// ---------------------------------------------------------------------------

function buildMatrixRow(
  rowId:          string,
  rowLabel:       string,
  rowType:        'page' | 'workflow',
  pageCategory:   import('@/types').PageCategory | undefined,
  complexity:     ComplexityLevel,
  instanceMult:   number,
  matrixTestTypes: TestType[],
  model:          TestingModel,
  project:        ProjectSpec,
): ScheduleRow {
  const cells: Record<string, ScheduleCell> = {}

  for (const testType of matrixTestTypes) {
    const comp = computeCellEstimate(
      model.entries,
      testType,
      complexity,
      project.rigorLevel,
      project.browserTier,
    )

    const scaledEstimate = scaleEstimate(comp.estimate, instanceMult)

    const cell: ScheduleCell = {
      rowId,
      testType,
      estimate:    scaledEstimate,
      certainty:   comp.certainty,
      testCases:   getTestCases(testType, pageCategory),
      needsReview: comp.needsReview,
    }
    cells[testType] = cell
  }

  const subtotal = sumEstimates(
    Object.values(cells).map(c => c.estimate)
  )

  return { id: rowId, label: rowLabel, rowType, subtotal, cells }
}

// ---------------------------------------------------------------------------
// Summary helpers
// ---------------------------------------------------------------------------

function buildDeliverableLineItems(
  model:   TestingModel,
  project: ProjectSpec,
): SummaryLineItem[] {
  return project.selectedDeliverables.map(type => {
    const calibrated = model.deliverableEstimates.find(d => d.type === type)
    const estimate   = calibrated?.estimate ?? { minHours: 2, expectedHours: 4, maxHours: 6 }
    return {
      label:     type,
      estimate,
      certainty: calibrated ? 'High' as const : 'Low' as const,
      tooltip:   calibrated?.notes,
    }
  })
}

function buildE2ELineItem(
  model:   TestingModel,
  project: ProjectSpec,
): SummaryLineItem {
  // Use the E2E automation calibration entry at the project's highest complexity
  const maxComplexity = project.pages.some(p => p.complexity === ComplexityLevel.High)
    ? ComplexityLevel.High : ComplexityLevel.Medium

  const comp = computeCellEstimate(
    model.entries,
    TestType.E2EAutomation,
    maxComplexity,
    project.rigorLevel,
    project.browserTier,
  )

  return {
    label:     TestType.E2EAutomation,
    estimate:  comp.estimate,
    certainty: comp.certainty,
    tooltip:   'E2E automation is a project-level line item. Refine with the engineer after scope confirmation.',
  }
}

// ---------------------------------------------------------------------------
// Review flag collector
// ---------------------------------------------------------------------------

function collectReviewFlags(
  rows: ScheduleRow[]
): ScheduleOutput['reviewFlags'] {
  const flags: ScheduleOutput['reviewFlags'] = []
  for (const row of rows) {
    for (const cell of Object.values(row.cells)) {
      if (cell.needsReview) {
        flags.push({
          rowLabel: row.label,
          testType: cell.testType,
          reason:   'No calibration data — add this test type to the model',
        })
      }
    }
  }
  return flags
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Runs the full estimation calculation.
 * Pure function — does not mutate inputs, does not access localStorage.
 */
export function runCalculationEngine(
  model:   TestingModel,
  project: ProjectSpec,
): ScheduleOutput {
  // E2E automation is a summary-level line item, not a matrix column
  const matrixTestTypes = project.selectedTestTypes.filter(
    t => t !== TestType.E2EAutomation
  )

  // Build page rows
  const pageRows = project.pages.map(page =>
    buildMatrixRow(
      page.id,
      page.isTemplate
        ? `${page.name} (×${page.templateInstanceCount ?? 1} instances)`
        : page.name || '(unnamed page)',
      'page',
      page.category,
      page.complexity,
      page.isTemplate ? (page.templateInstanceCount ?? 1) : 1,
      matrixTestTypes,
      model,
      project,
    )
  )

  // Build workflow rows (no page category → uses base rates)
  const workflowRows = project.workflows.map(wf =>
    buildMatrixRow(
      wf.id,
      wf.name || '(unnamed workflow)',
      'workflow',
      undefined,
      wf.complexity,
      1,
      matrixTestTypes,
      model,
      project,
    )
  )

  const allRows = [...pageRows, ...workflowRows]

  // Execution subtotal
  const executionSubtotal = sumEstimates(allRows.map(r => r.subtotal))

  // Retesting and regression
  const effectiveDensity =
    project.defectDensityOverride ?? model.overheadFactors.defaultDefectDensity
  const retestingFraction    = DEFECT_DENSITY_MULTIPLIERS[effectiveDensity]
  const retestingEstimate    = project.retestingIncluded
    ? scaleEstimate(executionSubtotal, retestingFraction)
    : { minHours: 0, expectedHours: 0, maxHours: 0 }
  const regressionEstimate   = project.retestingIncluded
    ? scaleEstimate(retestingEstimate, 0.60)
    : { minHours: 0, expectedHours: 0, maxHours: 0 }

  // Overhead
  const coordinationOverhead = scaleEstimate(
    executionSubtotal, model.overheadFactors.coordinationFraction
  )
  const reportingOverhead = scaleEstimate(
    executionSubtotal, model.overheadFactors.reportingFraction
  )

  // Deliverables
  const deliverableLineItems = buildDeliverableLineItems(model, project)
  if (project.includeAutomation) {
    deliverableLineItems.push(buildE2ELineItem(model, project))
  }

  // Grand total
  const grandTotal = [
    executionSubtotal,
    retestingEstimate,
    regressionEstimate,
    coordinationOverhead,
    reportingOverhead,
    ...deliverableLineItems.map(d => d.estimate),
  ].reduce(addEstimates, { minHours: 0, expectedHours: 0, maxHours: 0 })

  // Review flags
  const reviewFlags = collectReviewFlags(allRows)

  return {
    projectName:    project.projectName,
    clientName:     project.clientName,
    generatedAt:    new Date().toISOString(),
    engineerName:   model.engineerName,
    modelVersion:   model.version,
    rigorLevel:     project.rigorLevel,
    browserTier:    project.browserTier,
    activeTestTypes: matrixTestTypes,
    rows:            allRows,
    executionSubtotal,
    retestingEstimate,
    regressionEstimate,
    coordinationOverhead,
    reportingOverhead,
    deliverableLineItems,
    grandTotal,
    reviewFlags,
  }
}

// Re-export for convenience
export { formatRange }
