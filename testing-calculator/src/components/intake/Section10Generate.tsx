import type { ProjectSpec } from '@/types'
import { validateProject, countEffectivePages } from '@/utils/projectHelpers'
interface Props {
  project: ProjectSpec
  onGenerate: () => void
  modelName: string
}

export function Section10Generate({ project, onGenerate, modelName }: Props) {
  const validation = validateProject(project)
  const effectivePages = countEffectivePages(project.pages)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Review and generate</h2>
        <p className="mt-1 text-sm text-gray-500">
          Review your project summary below, then generate the estimation schedule.
        </p>
      </div>

      {/* Validation errors */}
      {!validation.isValid && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-1">
          <p className="text-sm font-semibold text-red-800">Fix these issues before generating:</p>
          {validation.errors.map(err => (
            <p key={err} className="text-sm text-red-700">• {err}</p>
          ))}
        </div>
      )}
      {validation.warnings.map(w => (
        <div key={w} className="p-3 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-sm text-amber-800">⚠ {w}</p>
        </div>
      ))}

      {/* Project summary card */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <p className="font-semibold text-gray-900">{project.projectName || '(unnamed project)'}</p>
          <p className="text-xs text-gray-500">{project.clientName} · {new Date(project.createdAt).toLocaleDateString()}</p>
        </div>

        <dl className="divide-y divide-gray-100">
          <SummaryRow label="Site type" value={project.siteType} />
          <SummaryRow label="Project moment" value={project.projectMoment} />
          <SummaryRow label="Sensitive data" value={project.sensitiveData} />
          <SummaryRow
            label="Pages"
            value={`${project.pages.length} defined (${effectivePages} effective incl. template instances)`}
          />
          <SummaryRow
            label="Workflows"
            value={project.workflows.length > 0
              ? project.workflows.map(w => w.name || 'Unnamed').join(', ')
              : 'None'}
          />
          <SummaryRow
            label="Integrations"
            value={project.integrations.length > 0
              ? `${project.integrations.length} (${project.integrations.filter(i => i.hasAnalytics).length} with analytics)`
              : 'None'}
          />
          <SummaryRow label="Payment scope" value={project.paymentScope} />
          <SummaryRow label="User accounts" value={project.accountScope} />
          <SummaryRow label="Risk level" value={project.riskLevel} />
          <SummaryRow label="Rigour" value={project.rigorLevel} />
          <SummaryRow label="Browser tier" value={project.browserTier} />
          <SummaryRow
            label="Active test types"
            value={`${project.selectedTestTypes.length} types`}
          />
          <SummaryRow
            label="Deliverables"
            value={project.selectedDeliverables.length > 0
              ? project.selectedDeliverables.join(', ')
              : 'None'}
          />
          <SummaryRow label="Reporting" value={project.reportingLevel} />
          <SummaryRow
            label="Retesting"
            value={project.retestingIncluded ? 'Included' : 'Excluded'}
          />
          <SummaryRow label="Testing model" value={modelName} />
        </dl>
      </div>

      {/* Active test types list */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Active test types ({project.selectedTestTypes.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {project.selectedTestTypes.map(tt => (
            <span
              key={tt}
              className="px-2.5 py-1 bg-brand-100 text-brand-800 rounded-full text-xs font-medium"
            >
              {tt}
            </span>
          ))}
        </div>
      </div>

      {/* Generate button */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          type="button"
          onClick={onGenerate}
          disabled={!validation.isValid}
          className={`
            w-full py-3 rounded-xl text-sm font-semibold transition-colors
            ${validation.isValid
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
          `}
        >
          🚀 Generate estimation schedule
        </button>
        {!validation.isValid && (
          <p className="text-xs text-center text-red-500">
            Fix the errors above before generating.
          </p>
        )}
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 px-4 py-2.5 text-sm">
      <dt className="w-40 flex-none text-gray-500">{label}</dt>
      <dd className="text-gray-900 flex-1">{value}</dd>
    </div>
  )
}
