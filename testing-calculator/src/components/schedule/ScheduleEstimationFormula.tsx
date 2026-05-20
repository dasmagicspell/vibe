import type { ReactNode } from 'react'
import type { ScheduleOutput, ProjectSpec, TestingModel } from '@/types'
import { RIGOR_MULTIPLIERS, DEFECT_DENSITY_MULTIPLIERS } from '@/types'

interface ScheduleEstimationFormulaProps {
  schedule: ScheduleOutput
  project:  ProjectSpec
  model:    TestingModel
}

/**
 * Collapsible formula summary for how matrix cells and totals are computed.
 * Collapsed by default; expands for print/PDF via .estimation-formula-details in index.css.
 */
export function ScheduleEstimationFormula({
  schedule,
  project,
  model,
}: ScheduleEstimationFormulaProps) {
  const rigorMult = RIGOR_MULTIPLIERS[schedule.rigorLevel]
  const density =
    project.defectDensityOverride ?? model.overheadFactors.defaultDefectDensity
  const densityPct = Math.round(DEFECT_DENSITY_MULTIPLIERS[density] * 100)
  const coordPct   = Math.round(model.overheadFactors.coordinationFraction * 100)
  const reportPct  = Math.round(model.overheadFactors.reportingFraction * 100)

  return (
    <details className="estimation-formula-details group mb-3 rounded-xl border border-gray-200 bg-gray-50">
      <summary
        className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-xs font-semibold
                   text-gray-700 select-none [&::-webkit-details-marker]:hidden"
      >
        <svg
          className="h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform group-open:rotate-90"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5
               4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
            clipRule="evenodd"
          />
        </svg>
        How estimates are calculated
      </summary>

      <div
        className="space-y-2 border-t border-gray-200 px-3 pb-3 pt-2 text-xs text-gray-600"
        aria-label="Estimation algorithm"
      >
        <FormulaLine>
          Cell estimation = Base(testType, complexity) × Rigor × BrowserScale? × Instances
        </FormulaLine>
        <p className="pl-2 text-gray-500 leading-relaxed">
          Base from engineer calibration (Standard-rigor rates). Rigor:{' '}
          <span className="font-medium text-gray-700">{schedule.rigorLevel}</span>{' '}
          <span className="font-mono">×{rigorMult}</span>. Browser tier (
          <span className="font-medium text-gray-700">{schedule.browserTier}</span>) scales
          Cross-browser and Responsive columns only. Template pages multiply by instance count.
        </p>

        <FormulaLine>
          Cell certainty = min(Lookup, TE Certainty, AM Confidence)
        </FormulaLine>
        <p className="pl-2 text-gray-500 leading-relaxed">
          <span className="font-medium text-gray-700">Lookup</span>: exact calibration → High,
          adjacent complexity → Medium, no data → Low (flagged).{' '}
          <span className="font-medium text-gray-700">TE Certainty</span>: engineer's confidence
          on the calibration entry.{' '}
          <span className="font-medium text-gray-700">AM Confidence</span>: account manager's
          confidence on page/workflow complexity, integrations, rigor, browser tier, defect
          density, and deliverables.
        </p>
        <p className="pl-2 text-gray-500 italic leading-relaxed">
          Confidence and Certainty don't change hours — they cap the cell's certainty badge so
          ambiguous inputs surface early in Review flags and get addressed before the schedule
          ships.
        </p>

        <FormulaLine>Execution = Σ matrix cells</FormulaLine>

        {project.retestingIncluded ? (
          <>
            <FormulaLine>
              Retesting = Execution × {densityPct}% · Regression = Retesting × 60%
            </FormulaLine>
            <p className="pl-2 text-gray-500">
              Defect density: <span className="font-medium text-gray-700">{density}</span>
            </p>
          </>
        ) : (
          <p className="pl-2 text-gray-500 italic">Retesting not included for this project.</p>
        )}

        <FormulaLine>
          Coordination = Execution × {coordPct}% · Reporting = Execution × {reportPct}%
        </FormulaLine>

        <FormulaLine>
          Total = Execution
          {project.retestingIncluded ? ' + Retesting + Regression' : ''}
          {' '}+ Coordination + Reporting + Deliverables
          {project.includeAutomation ? ' + E2E automation' : ''}
        </FormulaLine>
      </div>
    </details>
  )
}

function FormulaLine({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-gray-800 leading-relaxed">{children}</p>
  )
}
