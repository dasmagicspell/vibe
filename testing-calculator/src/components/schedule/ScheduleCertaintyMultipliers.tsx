import type { CertaintyMultipliers, ProjectSpec, TestingModel } from '@/types'
import {
  CertaintyMultipliersEditor,
  resetCertaintyMultipliers,
} from '@/components/shared/CertaintyMultipliersEditor'

interface ScheduleCertaintyMultipliersProps {
  model: TestingModel
  project: ProjectSpec
  onModelMultipliersChange: (multipliers: CertaintyMultipliers) => void
  onProjectMultipliersChange: (multipliers: CertaintyMultipliers) => void
}

/**
 * Live-editable TE certainty and AM confidence multipliers on the schedule screen.
 * Changes persist via SET_MODEL / SET_PROJECT and trigger schedule regeneration.
 */
export function ScheduleCertaintyMultipliers({
  model,
  project,
  onModelMultipliersChange,
  onProjectMultipliersChange,
}: ScheduleCertaintyMultipliersProps) {
  return (
    <div className="no-print grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <CertaintyMultipliersEditor
          idPrefix="schedule-te-mult"
          title="Engineer certainty (TE)"
          description="Scales cells by TE certainty (lookup + calibration). Adjust to reflect how much buffer you want when calibration data is uncertain."
          multipliers={model.teCertaintyMultipliers}
          onChange={onModelMultipliersChange}
          onReset={() => onModelMultipliersChange(resetCertaintyMultipliers())}
          compact
        />
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <CertaintyMultipliersEditor
          idPrefix="schedule-am-mult"
          title="Account manager confidence (AM)"
          description="Scales cells by intake confidence. Increase the Low factor when scope or complexity answers are still shaky."
          multipliers={project.amConfidenceMultipliers}
          onChange={onProjectMultipliersChange}
          onReset={() => onProjectMultipliersChange(resetCertaintyMultipliers())}
          compact
        />
      </div>
    </div>
  )
}
