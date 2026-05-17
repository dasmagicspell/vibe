import type { CertaintyLevel, ProjectSpec } from '@/types'
import { DeliverableType, ReportingLevel, DefectDensity, DEFECT_DENSITY_DEFINITIONS } from '@/types'
import { Tooltip } from '@/components/shared/Tooltip'
import { SelectField } from '@/components/shared/SelectField'
import { CertaintySelector } from '@/components/shared/CertaintySelector'

interface Props {
  data: Pick<
    ProjectSpec,
    | 'selectedDeliverables'
    | 'deliverableCertainties'
    | 'reportingLevel'
    | 'retestingIncluded'
    | 'defectDensityOverride'
    | 'defectDensityCertainty'
  >
  onChange: (updates: Partial<ProjectSpec>) => void
}

const DELIVERABLE_DESCRIPTIONS: Record<DeliverableType, string> = {
  [DeliverableType.TestPlanMatrix]:
    'A structured test coverage matrix and risk register before testing begins.',
  [DeliverableType.UATSupport]:
    'Helping the client team define and run their own acceptance tests.',
  [DeliverableType.FinalQAReport]:
    'Formal sign-off document: test results, coverage summary, open issues list.',
}

const REPORTING_OPTIONS = [
  { value: ReportingLevel.InternalBugList,  label: 'Internal bug list' },
  { value: ReportingLevel.ClientSummary,    label: 'Client-facing summary' },
  { value: ReportingLevel.FormalQAReport,   label: 'Formal QA report' },
]

const DEFECT_OPTIONS = [
  { value: DefectDensity.Low,    label: 'Low (~10%) — stable codebase, experienced team' },
  { value: DefectDensity.Medium, label: 'Medium (~20%) — typical project' },
  { value: DefectDensity.High,   label: 'High (~35%) — volatile codebase, rapid iteration' },
]

export function Section9Deliverables({ data, onChange }: Props) {
  function toggleDeliverable(type: DeliverableType) {
    const current = data.selectedDeliverables
    const next = current.includes(type)
      ? current.filter(d => d !== type)
      : [...current, type]
    const deliverableCertainties = { ...data.deliverableCertainties }
    if (!current.includes(type)) {
      deliverableCertainties[type] = deliverableCertainties[type] ?? 'High'
    } else {
      delete deliverableCertainties[type]
    }
    onChange({ selectedDeliverables: next, deliverableCertainties })
  }

  function setDeliverableCertainty(type: DeliverableType, certainty: CertaintyLevel) {
    onChange({
      deliverableCertainties: { ...data.deliverableCertainties, [type]: certainty },
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Deliverables and reporting</h2>
        <p className="mt-1 text-sm text-gray-500">
          These items appear as separate billable line items below the test execution matrix.
        </p>
      </div>

      {/* Deliverables */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700">Included deliverables</h3>
        {Object.values(DeliverableType).map(type => {
          const isSelected = data.selectedDeliverables.includes(type)
          return (
            <label
              key={type}
              className={`
                flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                ${isSelected
                  ? 'border-brand-400 bg-brand-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'}
              `}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleDeliverable(type)}
                className="mt-0.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">{type}</span>
                <p className="text-xs text-gray-500 mt-0.5">{DELIVERABLE_DESCRIPTIONS[type]}</p>
              </div>
              {isSelected && (
                <div
                  className="flex items-center gap-2 flex-none"
                  onClick={e => e.preventDefault()}
                >
                  <span className="text-xs text-gray-500 whitespace-nowrap">Confidence:</span>
                  <CertaintySelector
                    id={`deliverable-certainty-${type}`}
                    compact
                    value={data.deliverableCertainties?.[type] ?? 'High'}
                    onChange={v => setDeliverableCertainty(type, v)}
                  />
                </div>
              )}
            </label>
          )
        })}
      </div>

      {/* Reporting level */}
      <SelectField
        id="reporting-level"
        label="What reporting does the client expect?"
        tooltip="This influences reporting overhead. An internal bug list is minimal; a formal QA report requires structured documentation, evidence, and sign-off."
        value={data.reportingLevel}
        onChange={v => onChange({ reportingLevel: v as ReportingLevel })}
        options={REPORTING_OPTIONS}
      />

      {/* Retesting */}
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-gray-700">Retesting included in scope?</span>
          <Tooltip content="Retesting confirms a specific reported bug was fixed. If excluded, the client handles their own re-verification, which is uncommon and should be documented." />
        </div>

        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 leading-relaxed">
          <strong>Retesting</strong> confirms that a specific reported issue was fixed.{' '}
          <strong>Regression testing</strong> checks whether the fix broke nearby or related functionality.
          These are related but separate activities and may be estimated separately depending on project risk.
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.retestingIncluded}
            onChange={e => onChange({ retestingIncluded: e.target.checked })}
            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-700">
            Yes — include retesting and regression estimates in the schedule
          </span>
        </label>
      </div>

      {/* Defect density override */}
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-gray-700">
            Defect density override
          </span>
          <Tooltip content="Overrides the test engineer's default churn rate for this project specifically. Use this if you know this client or codebase has unusually high or low defect churn." />
          <span className="text-xs text-gray-400 ml-1">(optional)</span>
        </div>
        <select
          value={data.defectDensityOverride ?? ''}
          onChange={e => {
            const value = e.target.value ? e.target.value as DefectDensity : undefined
            onChange({
              defectDensityOverride: value,
              defectDensityCertainty: value ? (data.defectDensityCertainty ?? 'High') : undefined,
            })
          }}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Use engineer's default</option>
          {DEFECT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {data.defectDensityOverride && (
          <>
            <p className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg leading-relaxed">
              {DEFECT_DENSITY_DEFINITIONS[data.defectDensityOverride]}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Confidence in override:</span>
              <CertaintySelector
                id="defect-density-certainty"
                compact
                value={data.defectDensityCertainty ?? 'High'}
                onChange={v => onChange({ defectDensityCertainty: v })}
              />
            </div>
          </>
        )}
      </div>

    </div>
  )
}
