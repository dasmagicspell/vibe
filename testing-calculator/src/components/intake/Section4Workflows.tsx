import type { CertaintyLevel, WorkflowSpec, ProjectSpec } from '@/types'
import { ComplexityLevel, COMPLEXITY_DEFINITIONS } from '@/types'
import { createWorkflowSpec } from '@/utils/projectHelpers'
import { Tooltip } from '@/components/shared/Tooltip'
import { CertaintySelector } from '@/components/shared/CertaintySelector'
interface Props {
  workflows: WorkflowSpec[]
  onChange: (updates: Partial<ProjectSpec>) => void
}

export function Section4Workflows({ workflows, onChange }: Props) {
  function addWorkflow() {
    onChange({ workflows: [...workflows, createWorkflowSpec()] })
  }

  function updateWorkflow(id: string, updates: Partial<WorkflowSpec>) {
    onChange({ workflows: workflows.map(w => w.id === id ? { ...w, ...updates } : w) })
  }

  function removeWorkflow(id: string) {
    onChange({ workflows: workflows.filter(w => w.id !== id) })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Workflows</h2>
        <p className="mt-1 text-sm text-gray-500">
          A workflow is a multi-step user journey that may span several pages or states
          — a checkout, a booking, an onboarding sequence. List each distinct user flow separately.
        </p>
      </div>

      <div className="space-y-3">
        {workflows.map((wf, index) => (
          <WorkflowCard
            key={wf.id}
            workflow={wf}
            index={index}
            onUpdate={updates => updateWorkflow(wf.id, updates)}
            onRemove={() => removeWorkflow(wf.id)}
          />
        ))}
      </div>

      {workflows.length === 0 && (
        <div className="text-center py-6 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-sm text-gray-400">No workflows added.</p>
          <p className="text-xs text-gray-400 mt-1">
            Skip this section if there are no multi-step user flows to test.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={addWorkflow}
        className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
        Add workflow
      </button>

    </div>
  )
}

interface WorkflowCardProps {
  workflow: WorkflowSpec
  index: number
  onUpdate: (updates: Partial<WorkflowSpec>) => void
  onRemove: () => void
}

function WorkflowCard({ workflow, index, onUpdate, onRemove }: WorkflowCardProps) {
  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-4">
      {/* Name + remove */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor={`wf-name-${workflow.id}`} className="block text-xs font-medium text-gray-500 mb-1">
            Workflow name
          </label>
          <input
            id={`wf-name-${workflow.id}`}
            type="text"
            value={workflow.name}
            onChange={e => onUpdate({ name: e.target.value })}
            placeholder={`Workflow ${index + 1} — e.g. Checkout, Onboarding, Booking`}
            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="mt-5 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
          aria-label={`Remove workflow ${workflow.name || index + 1}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23
                 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0
                 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75
                 2.75 0 0011.25 1h-2.5z" clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Step count + complexity */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={`wf-steps-${workflow.id}`} className="block text-xs font-medium text-gray-500 mb-1">
            Number of steps
          </label>
          <input
            id={`wf-steps-${workflow.id}`}
            type="number"
            min={2}
            step={1}
            value={workflow.stepCount}
            onChange={e => onUpdate({ stepCount: parseInt(e.target.value) || 2 })}
            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <div className="flex items-center gap-0.5 mb-1">
            <span className="text-xs font-medium text-gray-500">Complexity</span>
            <Tooltip content={COMPLEXITY_DEFINITIONS[workflow.complexity]} />
          </div>
          <div className="flex gap-1">
            {([ComplexityLevel.Low, ComplexityLevel.Medium, ComplexityLevel.High] as const).map(c => (
              <button
                key={c}
                type="button"
                onClick={() => onUpdate({ complexity: c })}
                className={`
                  flex-1 py-1.5 rounded-lg border-2 text-xs font-medium transition-all
                  ${workflow.complexity === c
                    ? c === ComplexityLevel.Low    ? 'bg-green-100  text-green-800  border-green-400'
                    : c === ComplexityLevel.Medium ? 'bg-yellow-100 text-yellow-800 border-yellow-400'
                    :                               'bg-red-100    text-red-800    border-red-400'
                    : 'bg-white text-gray-600 border-gray-300'}
                `}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500">Confidence in complexity:</span>
            <CertaintySelector
              id={`wf-certainty-${workflow.id}`}
              compact
              value={workflow.complexityCertainty ?? 'High'}
              onChange={v => onUpdate({ complexityCertainty: v as CertaintyLevel })}
            />
          </div>
        </div>
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={workflow.hasBranching}
            onChange={e => onUpdate({ hasBranching: e.target.checked })}
            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-xs text-gray-600">Has branching paths (conditional steps)</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={workflow.hasPaymentStep}
            onChange={e => onUpdate({ hasPaymentStep: e.target.checked })}
            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-xs text-gray-600">Includes a payment step</span>
        </label>
      </div>
    </div>
  )
}
