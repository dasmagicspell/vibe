// =============================================================================
// certaintyHelpers.ts
// Pure functions for certainty level ordering, derivation, and intake lookup.
// =============================================================================

import type {
  CalibrationEntry,
  CertaintyBreakdown,
  CertaintyLevel,
  CertaintyMultipliers,
  IntegrationSpec,
  PageSpec,
  ProjectSpec,
  TimeEstimate,
  WorkflowSpec,
} from '@/types'
import { DEFAULT_CERTAINTY_MULTIPLIERS } from '@/types'
import {
  TestType,
  ComplexityLevel,
  ALWAYS_ACTIVE_TEST_TYPES,
  CONDITIONAL_TEST_TYPES,
} from '@/types'
import { findBaseRateEntry } from '@/utils/modelHelpers'
import { inferNotificationScope, normalizePageCategory } from '@/utils/projectHelpers'

const CALIBRATION_COMPLEXITIES = [
  ComplexityLevel.Low,
  ComplexityLevel.Medium,
  ComplexityLevel.High,
] as const

/** One complexity row on the calibration matrix that is not fully High. */
export interface CalibrationAttentionRow {
  complexity: ComplexityLevel
  empty: boolean
  certainty: CertaintyLevel
}

/** Test type with at least one non–High-certainty or missing estimate row. */
export interface CalibrationAttentionItem {
  testType: TestType
  rows: CalibrationAttentionRow[]
}

export const CERTAINTY_RANK: Record<CertaintyLevel, number> = {
  Low:    0,
  Medium: 1,
  High:   2,
}

const CERTAINTY_LEVELS: CertaintyLevel[] = ['High', 'Medium', 'Low']

/** Backfill missing multiplier keys from defaults (legacy JSON / partial saves). */
export function normalizeCertaintyMultipliers(
  raw?: Partial<CertaintyMultipliers>,
): CertaintyMultipliers {
  return {
    High:   raw?.High   ?? DEFAULT_CERTAINTY_MULTIPLIERS.High,
    Medium: raw?.Medium ?? DEFAULT_CERTAINTY_MULTIPLIERS.Medium,
    Low:    raw?.Low    ?? DEFAULT_CERTAINTY_MULTIPLIERS.Low,
  }
}

/** TE-side leg for multiplier lookup: min(lookup, calibration). */
export function teCertaintyLegFromBreakdown(breakdown: CertaintyBreakdown): CertaintyLevel {
  return minCertainty(breakdown.lookup, breakdown.calibration)
}

export function certaintyMultiplierForLevel(
  level: CertaintyLevel,
  multipliers: CertaintyMultipliers,
): number {
  return multipliers[level] ?? 1.0
}

/** Returns the most conservative (lowest) certainty level. */
export function minCertainty(...levels: CertaintyLevel[]): CertaintyLevel {
  if (levels.length === 0) return 'High'
  return levels.reduce((min, level) =>
    CERTAINTY_RANK[level] < CERTAINTY_RANK[min] ? level : min
  )
}

/** True when there is no usable expected-hour estimate. */
export function isEstimateEmpty(estimate: TimeEstimate): boolean {
  return estimate.expectedHours <= 0
}

/** Effective certainty for a base-rate calibration row (empty estimate → Low). */
export function calibrationRowCertainty(
  entries: CalibrationEntry[],
  testType: TestType,
  complexity: ComplexityLevel,
): CertaintyLevel {
  const entry = findBaseRateEntry(entries, testType, complexity)
  if (!entry || isEstimateEmpty(entry.baseEstimate)) return 'Low'
  return entry.certainty
}

/**
 * Test types that have any missing estimate or explicit certainty below High.
 * Used by the calibration scenarios summary panel and review step.
 */
export function getCalibrationAttentionItems(
  entries: CalibrationEntry[],
  testTypes: readonly TestType[] = [
    ...ALWAYS_ACTIVE_TEST_TYPES,
    ...CONDITIONAL_TEST_TYPES,
  ],
): CalibrationAttentionItem[] {
  const items: CalibrationAttentionItem[] = []

  for (const testType of testTypes) {
    const rows: CalibrationAttentionRow[] = []
    for (const complexity of CALIBRATION_COMPLEXITIES) {
      const entry = findBaseRateEntry(entries, testType, complexity)
      const empty = !entry || isEstimateEmpty(entry.baseEstimate)
      const certainty = calibrationRowCertainty(entries, testType, complexity)
      if (empty || certainty !== 'High') {
        rows.push({ complexity, empty, certainty })
      }
    }
    if (rows.length > 0) {
      items.push({ testType, rows })
    }
  }

  return items
}

export function formatCalibrationAttentionRow(row: CalibrationAttentionRow): string {
  if (row.empty) return `${row.complexity}: missing estimate`
  return `${row.complexity}: ${row.certainty} certainty`
}

/**
 * Derive calibration certainty from estimate and optional explicit value.
 * Empty estimate always yields Low.
 */
export function deriveCalibrationCertainty(
  estimate: TimeEstimate,
  explicit?: CertaintyLevel,
): CertaintyLevel {
  if (isEstimateEmpty(estimate)) return 'Low'
  return explicit ?? 'High'
}

/** Normalize a calibration entry's certainty after import or legacy load. */
export function normalizeEntryCertainty(entry: CalibrationEntry): CalibrationEntry {
  return {
    ...entry,
    certainty: deriveCalibrationCertainty(entry.baseEstimate, entry.certainty),
  }
}

export function defaultComplexityCertainty(): CertaintyLevel {
  return 'High'
}

/** Row-level intake certainty from page, workflow, or integration complexity confidence. */
export function intakeCertaintyForRow(
  project: ProjectSpec,
  rowType: 'page' | 'workflow' | 'integration',
  rowId: string,
): CertaintyLevel {
  if (rowType === 'page') {
    const page = project.pages.find(p => p.id === rowId)
    return page?.complexityCertainty ?? defaultComplexityCertainty()
  }
  if (rowType === 'workflow') {
    const workflow = project.workflows.find(w => w.id === rowId)
    return workflow?.complexityCertainty ?? defaultComplexityCertainty()
  }
  const integration = project.integrations.find(i => i.id === rowId)
  return integration?.complexityCertainty ?? defaultComplexityCertainty()
}

function integrationCertainties(project: ProjectSpec): CertaintyLevel[] {
  return (project.integrations ?? []).map(i => i.certainty ?? defaultComplexityCertainty())
}

/** Project-wide intake certainty applied to every matrix cell. */
export function intakeCertaintyForProject(project: ProjectSpec): CertaintyLevel {
  const levels: CertaintyLevel[] = [
    project.rigorCertainty ?? 'High',
    project.browserTierCertainty ?? 'High',
    ...integrationCertainties(project),
  ]
  if (project.defectDensityOverride !== undefined) {
    levels.push(project.defectDensityCertainty ?? 'High')
  }
  return minCertainty(...levels)
}

/** Combined intake certainty for a matrix cell. */
export function intakeCertaintyForCell(
  project: ProjectSpec,
  rowType: 'page' | 'workflow' | 'integration',
  rowId: string,
): CertaintyLevel {
  return minCertainty(
    intakeCertaintyForRow(project, rowType, rowId),
    intakeCertaintyForProject(project),
  )
}

export function normalizePageSpec(page: PageSpec): PageSpec {
  return {
    ...page,
    category: normalizePageCategory(page.category),
    complexityCertainty: page.complexityCertainty ?? defaultComplexityCertainty(),
  }
}

export function normalizeWorkflowSpec(workflow: WorkflowSpec): WorkflowSpec {
  return {
    ...workflow,
    complexityCertainty: workflow.complexityCertainty ?? defaultComplexityCertainty(),
  }
}

export function normalizeIntegrationSpec(integration: IntegrationSpec): IntegrationSpec {
  return {
    ...integration,
    complexity: integration.complexity ?? ComplexityLevel.Medium,
    complexityCertainty: integration.complexityCertainty ?? defaultComplexityCertainty(),
    certainty: integration.certainty ?? defaultComplexityCertainty(),
  }
}

export function normalizeProjectSpec(project: ProjectSpec): ProjectSpec {
  const pages = project.pages.map(normalizePageSpec)
  const workflows = project.workflows.map(normalizeWorkflowSpec)
  return {
    ...project,
    rigorCertainty: project.rigorCertainty ?? 'High',
    browserTierCertainty: project.browserTierCertainty ?? 'High',
    amConfidenceMultipliers: normalizeCertaintyMultipliers(project.amConfidenceMultipliers),
    pages,
    workflows,
    integrations: (project.integrations ?? []).map(normalizeIntegrationSpec),
    excludedCells: project.excludedCells ?? [],
    notificationScope: inferNotificationScope({ ...project, pages, workflows }),
  }
}

export { CERTAINTY_LEVELS }
