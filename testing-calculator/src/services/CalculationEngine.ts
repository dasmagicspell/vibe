// =============================================================================
// CalculationEngine.ts
// Pure function: (TestingModel, ProjectSpec) → ScheduleOutput
//
// Certainty (final per cell):
//   min(lookupCertainty, calibrationCertainty, intakeCertainty)
//   lookup: High = exact match, Medium = adjacent interpolation, Low = no data
//   calibration: engineer-declared on CalibrationEntry
//   intake: account manager confidence on complexity, rigor, browser, integrations, etc.
// =============================================================================

import type {
  TestingModel, ProjectSpec, ScheduleOutput, ScheduleRow, ScheduleCell,
  SummaryLineItem, CalibrationEntry, TimeEstimate, CertaintyLevel,
  CertaintyBreakdown,
} from '@/types'
import {
  TestType, ComplexityLevel, BrowserTier,
  RIGOR_MULTIPLIERS, DEFECT_DENSITY_MULTIPLIERS,
} from '@/types'
import { getRepresentativeTestCases } from './testCases'
import { formatRange } from '@/utils/modelHelpers'
import {
  minCertainty,
  intakeCertaintyForCell,
  intakeCertaintyForProject,
  isEstimateEmpty,
  teCertaintyLegFromBreakdown,
  certaintyMultiplierForLevel,
} from '@/utils/certaintyHelpers'
import { isCellExcluded } from '@/utils/projectHelpers'

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

const COMPLEXITY_ORDER = [
  ComplexityLevel.Low,
  ComplexityLevel.Medium,
  ComplexityLevel.High,
] as const

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
  if (n <= 0) return 0
  const rounded = Math.round(n * 4) / 4
  // Preserve tiny non-zero values that would otherwise collapse to 0
  // (e.g. an engineer-entered 0.1 hr min stays 0.1 instead of becoming 0).
  if (rounded === 0) return Math.round(n * 100) / 100
  return rounded
}

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

function findAdjacentEntry(
  entries: CalibrationEntry[],
  testType: TestType,
  targetComplexity: ComplexityLevel,
): CalibrationEntry | undefined {
  const tryOrder = COMPLEXITY_ORDER.filter(c => c !== targetComplexity)
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

function calibrationCertaintyFromEntry(entry: CalibrationEntry | undefined): CertaintyLevel {
  if (!entry || isEstimateEmpty(entry.baseEstimate)) return 'Low'
  return entry.certainty ?? 'High'
}

interface CellComputation {
  estimate:    TimeEstimate
  lookupCertainty: CertaintyLevel
  calibrationCertainty: CertaintyLevel
  needsReview: boolean
  source:      string
}

export function computeCellEstimate(
  entries:    CalibrationEntry[],
  testType:   TestType,
  complexity: ComplexityLevel,
  rigorLevel: import('@/types').RigorLevel,
  browserTier: BrowserTier,
): CellComputation {
  const rigorMultiplier = RIGOR_MULTIPLIERS[rigorLevel]

  const browserScale =
    testType === TestType.CrossBrowser    ? BROWSER_TIER_SCALING[browserTier]    :
    testType === TestType.ResponsiveMobile ? RESPONSIVE_TIER_SCALING[browserTier] :
    1.0

  const exact = findExactEntry(entries, testType, complexity)
  if (exact && exact.baseEstimate.expectedHours > 0) {
    const base = scaleEstimate(exact.baseEstimate, rigorMultiplier * browserScale)
    return {
      estimate:             base,
      lookupCertainty:      'High',
      calibrationCertainty: calibrationCertaintyFromEntry(exact),
      needsReview:          false,
      source:               `Calibrated at ${complexity} complexity × ${rigorLevel} rigor`,
    }
  }

  const adjacent = findAdjacentEntry(entries, testType, complexity)
  if (adjacent && adjacent.baseEstimate.expectedHours > 0) {
    const fromIdx = COMPLEXITY_ORDER.indexOf(adjacent.complexity)
    const toIdx   = COMPLEXITY_ORDER.indexOf(complexity)
    const complexityRatio = (toIdx + 1) / (fromIdx + 1)

    const base = scaleEstimate(
      adjacent.baseEstimate,
      rigorMultiplier * browserScale * complexityRatio
    )
    return {
      estimate:             base,
      lookupCertainty:      'Medium',
      calibrationCertainty: calibrationCertaintyFromEntry(adjacent),
      needsReview:          false,
      source:               `Interpolated from ${adjacent.complexity} calibration (no exact ${complexity} entry)`,
    }
  }

  return {
    estimate:             { minHours: 0, expectedHours: 0, maxHours: 0 },
    lookupCertainty:      'Low',
    calibrationCertainty: 'Low',
    needsReview:          true,
    source:               `No calibration data found for ${testType} — add to model`,
  }
}

function buildMatrixRow(
  rowId:          string,
  rowLabel:       string,
  rowType:        'page' | 'workflow' | 'integration',
  pageCategory:   import('@/types').PageCategory | undefined,
  complexity:     ComplexityLevel,
  instanceMult:   number,
  matrixTestTypes: TestType[],
  model:          TestingModel,
  project:        ProjectSpec,
  notes?:         string,
): ScheduleRow {
  const cells: Record<string, ScheduleCell> = {}
  const intakeCertainty = intakeCertaintyForCell(project, rowType, rowId)

  for (const testType of matrixTestTypes) {
    const excluded = isCellExcluded(project, rowId, testType)

    const comp = computeCellEstimate(
      model.entries,
      testType,
      complexity,
      project.rigorLevel,
      project.browserTier,
    )

    const certaintyBreakdown: CertaintyBreakdown = {
      lookup:      comp.lookupCertainty,
      calibration: comp.calibrationCertainty,
      intake:      intakeCertainty,
    }

    const certainty = minCertainty(
      certaintyBreakdown.lookup,
      certaintyBreakdown.calibration,
      certaintyBreakdown.intake,
    )

    const teLeg = teCertaintyLegFromBreakdown(certaintyBreakdown)
    const teMult = certaintyMultiplierForLevel(teLeg, model.teCertaintyMultipliers)
    const amMult = certaintyMultiplierForLevel(
      certaintyBreakdown.intake,
      project.amConfidenceMultipliers,
    )
    const scaledEstimate = scaleEstimate(comp.estimate, instanceMult * teMult * amMult)

    cells[testType] = {
      rowId,
      testType,
      // Keep the computed estimate populated even when excluded so the drill-down
      // modal renders identically; subtotals filter excluded cells out at sum time.
      estimate:           scaledEstimate,
      certainty,
      certaintyBreakdown,
      testCases:            getRepresentativeTestCases(model, testType),
      needsReview:          !excluded && (comp.needsReview || certainty === 'Low'),
      isExcluded:           excluded,
    }
  }

  const subtotal = sumEstimates(
    Object.values(cells)
      .filter(c => !c.isExcluded)
      .map(c => c.estimate),
  )

  const trimmedNotes = notes?.trim()
  return {
    id: rowId,
    label: rowLabel,
    rowType,
    notes: trimmedNotes || undefined,
    subtotal,
    cells,
  }
}

function buildDeliverableLineItems(
  model:   TestingModel,
  project: ProjectSpec,
): SummaryLineItem[] {
  return project.selectedDeliverables.map(type => {
    const calibrated = model.deliverableEstimates.find(d => d.type === type)
    const estimate   = calibrated?.estimate ?? { minHours: 2, expectedHours: 4, maxHours: 6 }

    const lookupCertainty: CertaintyLevel = calibrated && !isEstimateEmpty(calibrated.estimate)
      ? 'High'
      : 'Low'
    const calibrationCertainty: CertaintyLevel = calibrated && !isEstimateEmpty(calibrated.estimate)
      ? 'High'
      : 'Low'
    const intakeCertainty = project.deliverableCertainties?.[type] ?? 'High'

    const certainty = minCertainty(lookupCertainty, calibrationCertainty, intakeCertainty)

    return {
      label:     type,
      estimate,
      certainty,
      tooltip:   calibrated?.notes,
    }
  })
}

function buildE2ELineItem(
  model:   TestingModel,
  project: ProjectSpec,
): SummaryLineItem {
  const maxComplexity = project.pages.some(p => p.complexity === ComplexityLevel.High)
    ? ComplexityLevel.High : ComplexityLevel.Medium

  const comp = computeCellEstimate(
    model.entries,
    TestType.E2EAutomation,
    maxComplexity,
    project.rigorLevel,
    project.browserTier,
  )

  const intakeCertainty = intakeCertaintyForProject(project)

  return {
    label:     TestType.E2EAutomation,
    estimate:  comp.estimate,
    certainty: minCertainty(comp.lookupCertainty, comp.calibrationCertainty, intakeCertainty),
    tooltip:   'E2E automation is a project-level line item. Refine with the engineer after scope confirmation.',
  }
}

function collectReviewFlags(
  rows: ScheduleRow[]
): ScheduleOutput['reviewFlags'] {
  const flags: ScheduleOutput['reviewFlags'] = []
  for (const row of rows) {
    for (const cell of Object.values(row.cells)) {
      if (cell.isExcluded) continue
      if (cell.needsReview) {
        const reason = cell.certaintyBreakdown.lookup === 'Low'
          ? 'No calibration data — add this test type to the model'
          : 'Low certainty — review calibration and intake confidence'
        flags.push({
          rowLabel: row.label,
          testType: cell.testType,
          reason,
        })
      }
    }
  }
  return flags
}

export function runCalculationEngine(
  model:   TestingModel,
  project: ProjectSpec,
): ScheduleOutput {
  const matrixTestTypes = project.selectedTestTypes.filter(
    t => t !== TestType.E2EAutomation
  )

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
      page.notes,
    )
  )

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
      wf.notes,
    )
  )

  const integrationRows = project.integrations.map(integ =>
    buildMatrixRow(
      integ.id,
      integ.name || '(unnamed integration)',
      'integration',
      undefined,
      integ.complexity,
      1,
      matrixTestTypes,
      model,
      project,
      integ.notes,
    )
  )

  const allRows = [...pageRows, ...workflowRows, ...integrationRows]

  const executionSubtotal = sumEstimates(allRows.map(r => r.subtotal))

  const effectiveDensity =
    project.defectDensityOverride ?? model.overheadFactors.defaultDefectDensity
  const retestingFraction    = DEFECT_DENSITY_MULTIPLIERS[effectiveDensity]
  const retestingEstimate    = project.retestingIncluded
    ? scaleEstimate(executionSubtotal, retestingFraction)
    : { minHours: 0, expectedHours: 0, maxHours: 0 }
  const regressionEstimate   = project.retestingIncluded
    ? scaleEstimate(retestingEstimate, 0.60)
    : { minHours: 0, expectedHours: 0, maxHours: 0 }

  const coordinationOverhead = scaleEstimate(
    executionSubtotal, model.overheadFactors.coordinationFraction
  )
  const reportingOverhead = scaleEstimate(
    executionSubtotal, model.overheadFactors.reportingFraction
  )

  const deliverableLineItems = buildDeliverableLineItems(model, project)
  if (project.includeAutomation) {
    deliverableLineItems.push(buildE2ELineItem(model, project))
  }

  const grandTotal = [
    executionSubtotal,
    retestingEstimate,
    regressionEstimate,
    coordinationOverhead,
    reportingOverhead,
    ...deliverableLineItems.map(d => d.estimate),
  ].reduce(addEstimates, { minHours: 0, expectedHours: 0, maxHours: 0 })

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

export { formatRange }
