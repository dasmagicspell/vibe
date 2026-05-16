import type { OverheadFactors } from '@/types'
import { DefectDensity, DEFECT_DENSITY_DEFINITIONS } from '@/types'
import { Tooltip } from '@/components/shared/Tooltip'
import { StepNav } from './StepWizard'

interface Step2Props {
  data: OverheadFactors
  onChange: (data: OverheadFactors) => void
  onBack?: () => void
  onNext?: () => void
}

const DENSITY_OPTIONS = [
  { value: DefectDensity.Low,    label: 'Low',    pct: '~10%', color: 'green'  },
  { value: DefectDensity.Medium, label: 'Medium', pct: '~20%', color: 'yellow' },
  { value: DefectDensity.High,   label: 'High',   pct: '~35%', color: 'red'    },
] as const

export function Step2Overhead({ data, onChange, onBack, onNext }: Step2Props) {
  function setFraction(field: 'coordinationFraction' | 'reportingFraction', pct: number) {
    onChange({ ...data, [field]: pct / 100 })
  }

  const coordPct = Math.round(data.coordinationFraction * 100)
  const reportPct = Math.round(data.reportingFraction * 100)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Overhead factors</h2>
        <p className="mt-1 text-sm text-gray-500">
          These percentages are added to the test execution total to produce the final
          billable estimate. They appear as separate line items in the schedule.
        </p>
      </div>

      {/* Coordination overhead */}
      <div className="space-y-3">
        <div className="flex items-center gap-1">
          <label className="text-sm font-medium text-gray-700">
            Coordination overhead
          </label>
          <Tooltip content="Time spent on planning, attending standups, communicating with the development team, and clarifying requirements. Does not include time spent actively testing." />
          <span className="ml-auto text-sm font-semibold text-brand-700 tabular-nums">
            {coordPct}%
          </span>
        </div>
        <input
          type="range"
          min={5} max={30} step={1}
          value={coordPct}
          onChange={e => setFraction('coordinationFraction', parseInt(e.target.value))}
          className="w-full accent-brand-600"
          aria-label="Coordination overhead percentage"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>5% (minimal)</span>
          <span className="text-gray-500 font-medium">Typical: 10–15%</span>
          <span>30% (heavy)</span>
        </div>
      </div>

      {/* Reporting overhead */}
      <div className="space-y-3">
        <div className="flex items-center gap-1">
          <label className="text-sm font-medium text-gray-700">
            Reporting overhead
          </label>
          <Tooltip content="Time spent writing bug reports, maintaining the test matrix, preparing status updates, and producing the final QA report. Scales with the client's reporting expectations." />
          <span className="ml-auto text-sm font-semibold text-brand-700 tabular-nums">
            {reportPct}%
          </span>
        </div>
        <input
          type="range"
          min={5} max={30} step={1}
          value={reportPct}
          onChange={e => setFraction('reportingFraction', parseInt(e.target.value))}
          className="w-full accent-brand-600"
          aria-label="Reporting overhead percentage"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>5% (bug list only)</span>
          <span className="text-gray-500 font-medium">Typical: 10–20%</span>
          <span>30% (formal audit)</span>
        </div>
      </div>

      {/* Defect density */}
      <div className="space-y-3">
        <div className="flex items-center gap-1">
          <label className="text-sm font-medium text-gray-700">
            Default defect density
          </label>
          <Tooltip content="Your experience-based estimate of how much churn is typical on a project. This drives the retesting and regression line items in the schedule. Can be overridden per project in the intake form." />
        </div>
        <p className="text-xs text-gray-500">
          Based on your experience: how often do bugs get re-opened or cause regressions?
        </p>
        <div className="grid grid-cols-3 gap-3">
          {DENSITY_OPTIONS.map(opt => {
            const isSelected = data.defaultDefectDensity === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ ...data, defaultDefectDensity: opt.value })}
                className={`
                  p-3 rounded-lg border-2 text-left transition-all
                  ${isSelected
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'}
                `}
                aria-pressed={isSelected}
              >
                <div className="text-sm font-semibold text-gray-900">{opt.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{opt.pct} overhead</div>
              </button>
            )
          })}
        </div>
        {/* Definition tooltip for selected option */}
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
          {DEFECT_DENSITY_DEFINITIONS[data.defaultDefectDensity]}
        </p>
      </div>

      {/* Summary preview */}
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
        <p className="text-xs font-medium text-gray-700 mb-2">Example: project with 40 hrs of test execution</p>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Test execution</span><span className="font-mono">40.0 hrs</span>
          </div>
          <div className="flex justify-between">
            <span>Coordination ({coordPct}%)</span>
            <span className="font-mono">{(40 * data.coordinationFraction).toFixed(1)} hrs</span>
          </div>
          <div className="flex justify-between">
            <span>Reporting ({reportPct}%)</span>
            <span className="font-mono">{(40 * data.reportingFraction).toFixed(1)} hrs</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-gray-300 font-semibold text-gray-900">
            <span>Billable subtotal</span>
            <span className="font-mono">
              {(40 * (1 + data.coordinationFraction + data.reportingFraction)).toFixed(1)} hrs
            </span>
          </div>
        </div>
      </div>

      {(onBack || onNext) && <StepNav onBack={onBack} onNext={onNext} />}
    </div>
  )
}
