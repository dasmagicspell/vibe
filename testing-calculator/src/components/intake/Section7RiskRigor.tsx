import type { ProjectSpec } from '@/types'
import { RiskLevel, RigorLevel, BrowserTier, RIGOR_DEFINITIONS, BROWSER_TIER_DEFINITIONS } from '@/types'
import { RadioGroup } from '@/components/shared/RadioGroup'
import { StepNav } from '@/components/calibration/StepWizard'

interface Props {
  data: Pick<ProjectSpec, 'riskLevel' | 'rigorLevel' | 'browserTier' | 'customBrowserDescription'>
  onChange: (updates: Partial<ProjectSpec>) => void
  onBack: () => void
  onNext: () => void
}

const RISK_OPTIONS = [
  {
    value: RiskLevel.Low,
    label: 'Low',
    description: 'Internal tool or low-traffic site — impact of failure is limited',
  },
  {
    value: RiskLevel.Medium,
    label: 'Medium',
    description: 'Typical client website — bugs would be embarrassing or costly to fix',
  },
  {
    value: RiskLevel.High,
    label: 'High',
    description: 'Revenue-critical or high-traffic — failure has direct financial impact',
  },
]

const RIGOR_OPTIONS = [
  {
    value: RigorLevel.Smoke,
    label: 'Smoke',
    description: RIGOR_DEFINITIONS[RigorLevel.Smoke],
  },
  {
    value: RigorLevel.Standard,
    label: 'Standard',
    description: RIGOR_DEFINITIONS[RigorLevel.Standard],
  },
  {
    value: RigorLevel.Enhanced,
    label: 'Enhanced',
    description: RIGOR_DEFINITIONS[RigorLevel.Enhanced],
  },
  {
    value: RigorLevel.Audit,
    label: 'Audit',
    description: RIGOR_DEFINITIONS[RigorLevel.Audit],
  },
]

const BROWSER_OPTIONS = [
  {
    value: BrowserTier.Basic,
    label: 'Basic',
    description: BROWSER_TIER_DEFINITIONS[BrowserTier.Basic],
  },
  {
    value: BrowserTier.Standard,
    label: 'Standard',
    description: BROWSER_TIER_DEFINITIONS[BrowserTier.Standard],
  },
  {
    value: BrowserTier.Enhanced,
    label: 'Enhanced',
    description: BROWSER_TIER_DEFINITIONS[BrowserTier.Enhanced],
  },
  {
    value: BrowserTier.Custom,
    label: 'Custom',
    description: BROWSER_TIER_DEFINITIONS[BrowserTier.Custom],
  },
]

export function Section7RiskRigor({ data, onChange, onBack, onNext }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Risk and rigour</h2>
        <p className="mt-1 text-sm text-gray-500">
          These settings scale every estimate in the schedule. Higher rigour and higher risk
          increase time across all test types via the rigour multiplier.
        </p>
      </div>

      <RadioGroup
        name="risk-level"
        label="How risky is failure?"
        tooltip="Risk influences the certainty bands and flags in the schedule. It does not directly multiply estimates — rigour does that."
        value={data.riskLevel}
        onChange={v => onChange({ riskLevel: v as RiskLevel })}
        options={RISK_OPTIONS}
        columns={3}
      />

      <RadioGroup
        name="rigor-level"
        label="Required testing rigour"
        tooltip="Rigour multiplies all estimates: Smoke=0.5×, Standard=1.0×, Enhanced=1.5×, Audit=2.2×. Choose based on what the client needs to see and sign off on."
        value={data.rigorLevel}
        onChange={v => onChange({ rigorLevel: v as RigorLevel })}
        options={RIGOR_OPTIONS}
        columns={4}
      />

      <RadioGroup
        name="browser-tier"
        label="Browser and device coverage"
        tooltip="Drives the cross-browser and responsive estimates. Standard covers most projects. Enhanced is recommended for e-commerce or high-traffic sites."
        value={data.browserTier}
        onChange={v => onChange({ browserTier: v as BrowserTier })}
        options={BROWSER_OPTIONS}
        columns={4}
      />

      {data.browserTier === BrowserTier.Custom && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
          <label htmlFor="custom-browser" className="block text-sm font-medium text-amber-800">
            Describe the custom browser / device requirements
          </label>
          <textarea
            id="custom-browser"
            value={data.customBrowserDescription ?? ''}
            onChange={e => onChange({ customBrowserDescription: e.target.value })}
            placeholder="e.g. Chrome 120+, Safari iOS 17, Samsung Internet — as specified in the client contract"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-amber-300 text-sm resize-none
                       focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          />
        </div>
      )}

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  )
}
