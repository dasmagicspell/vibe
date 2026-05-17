// =============================================================================
// certaintyHelpers.ts
// Pure functions for certainty level ordering, derivation, and intake lookup.
// =============================================================================

import type {
  CalibrationEntry,
  CertaintyLevel,
  IntegrationSpec,
  PageSpec,
  ProjectSpec,
  TimeEstimate,
  WorkflowSpec,
} from '@/types'

export const CERTAINTY_RANK: Record<CertaintyLevel, number> = {
  Low:    0,
  Medium: 1,
  High:   2,
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

/** Row-level intake certainty from page or workflow complexity confidence. */
export function intakeCertaintyForRow(
  project: ProjectSpec,
  rowType: 'page' | 'workflow',
  rowId: string,
): CertaintyLevel {
  if (rowType === 'page') {
    const page = project.pages.find(p => p.id === rowId)
    return page?.complexityCertainty ?? defaultComplexityCertainty()
  }
  const workflow = project.workflows.find(w => w.id === rowId)
  return workflow?.complexityCertainty ?? defaultComplexityCertainty()
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
  rowType: 'page' | 'workflow',
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
    certainty: integration.certainty ?? defaultComplexityCertainty(),
  }
}

export function normalizeProjectSpec(project: ProjectSpec): ProjectSpec {
  return {
    ...project,
    rigorCertainty: project.rigorCertainty ?? 'High',
    browserTierCertainty: project.browserTierCertainty ?? 'High',
    pages: project.pages.map(normalizePageSpec),
    workflows: project.workflows.map(normalizeWorkflowSpec),
    integrations: (project.integrations ?? []).map(normalizeIntegrationSpec),
  }
}
