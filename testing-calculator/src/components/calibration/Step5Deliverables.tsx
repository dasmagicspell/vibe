import type { DeliverableEstimate } from '@/types'
import { DeliverableType } from '@/types'
import { TimeEstimateInput } from '@/components/shared/TimeEstimateInput'
import { StepNav } from './StepWizard'

interface Step5Props {
  data: DeliverableEstimate[]
  onChange: (data: DeliverableEstimate[]) => void
  onBack?: () => void
  onNext?: () => void
}

const DELIVERABLE_DESCRIPTIONS: Record<DeliverableType, string> = {
  [DeliverableType.TestPlanMatrix]:
    'Creating the test coverage matrix and risk assessment before testing begins.',
  [DeliverableType.UATSupport]:
    'Helping the client team define and run their own acceptance tests.',
  [DeliverableType.FinalQAReport]:
    'Formal sign-off document with test results, coverage summary, and open issues.',
}

export function Step5Deliverables({ data, onChange, onBack, onNext }: Step5Props) {
  function handleChange(type: DeliverableType, updated: DeliverableEstimate) {
    onChange(data.map(d => d.type === type ? updated : d))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Deliverable estimates</h2>
        <p className="mt-1 text-sm text-gray-500">
          These are billable activities that aren't part of test execution. They appear as
          separate line items in the summary section when selected during project intake.
        </p>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-4 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">
        <span>Deliverable</span>
        <span>Min / Expected / Max</span>
      </div>

      <div className="space-y-3">
        {data.map(deliverable => (
          <div
            key={deliverable.type}
            className="p-4 rounded-lg border border-gray-200 bg-white space-y-3"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{deliverable.type}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {DELIVERABLE_DESCRIPTIONS[deliverable.type]}
              </p>
            </div>

            <div className="flex items-end gap-4">
              <TimeEstimateInput
                id={`deliverable-${deliverable.type}`}
                value={deliverable.estimate}
                onChange={estimate =>
                  handleChange(deliverable.type, { ...deliverable, estimate })
                }
                showLabels
              />
            </div>

            <div>
              <label
                htmlFor={`del-notes-${deliverable.type}`}
                className="text-xs text-gray-400"
              >
                Notes (optional)
              </label>
              <input
                id={`del-notes-${deliverable.type}`}
                type="text"
                value={deliverable.notes ?? ''}
                onChange={e =>
                  handleChange(deliverable.type, { ...deliverable, notes: e.target.value })
                }
                placeholder="Any assumptions or scope notes…"
                className="mt-1 w-full px-3 py-1.5 text-xs rounded border border-gray-200
                           focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>
        ))}
      </div>

      {(onBack || onNext) && <StepNav onBack={onBack} onNext={onNext} />}
    </div>
  )
}
