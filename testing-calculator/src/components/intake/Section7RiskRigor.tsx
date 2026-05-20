import type { CertaintyLevel, CertaintyMultipliers, ProjectSpec } from '@/types'
import { CertaintyMultipliersEditor } from '@/components/shared/CertaintyMultipliersEditor'
import { RiskLevel, RigorLevel, BrowserTier, RIGOR_DEFINITIONS, BROWSER_TIER_DEFINITIONS } from '@/types'
import { RadioGroup } from '@/components/shared/RadioGroup'
import { CertaintySelector } from '@/components/shared/CertaintySelector'

interface Props {
  data: Pick<
    ProjectSpec,
    | 'riskLevel'
    | 'rigorLevel'
    | 'rigorCertainty'
    | 'browserTier'
    | 'browserTierCertainty'
    | 'customBrowserDescription'
    | 'amConfidenceMultipliers'
  >
  onChange: (updates: Partial<ProjectSpec>) => void
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

export function Section7RiskRigor({ data, onChange }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Risk and rigor</h2>
        <p className="mt-1 text-sm text-gray-500">
          These settings scale every estimate in the schedule. Higher rigor and higher risk
          increase time across all test types via the rigor multiplier.
        </p>
      </div>

      <RadioGroup
        name="risk-level"
        label="How risky is failure?"
        tooltip="Risk level is recorded for scope context. It does not directly multiply estimates or affect certainty — rigor does that."
        value={data.riskLevel}
        onChange={v => onChange({ riskLevel: v as RiskLevel })}
        options={RISK_OPTIONS}
        columns={3}
      />

      <div className="space-y-2">
        <RadioGroup
          name="rigor-level"
          label="Required testing rigor"
          tooltip="Rigor multiplies all estimates: Smoke=0.5×, Standard=1.0×, Enhanced=1.5×, Audit=2.2×. Choose based on what the client needs to see and sign off on."
          value={data.rigorLevel}
          onChange={v => onChange({ rigorLevel: v as RigorLevel })}
          options={RIGOR_OPTIONS}
          columns={4}
        />
        <div className="flex items-center gap-2 pl-1">
          <span className="text-xs text-gray-500">Confidence in rigor:</span>
          <CertaintySelector
            id="rigor-certainty"
            compact
            value={data.rigorCertainty ?? 'High'}
            onChange={v => onChange({ rigorCertainty: v as CertaintyLevel })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <RadioGroup
          name="browser-tier"
          label="Browser and device coverage"
          tooltip="Drives the cross-browser and responsive estimates. Standard covers most projects. Enhanced is recommended for e-commerce or high-traffic sites."
          value={data.browserTier}
          onChange={v => onChange({ browserTier: v as BrowserTier })}
          options={BROWSER_OPTIONS}
          columns={4}
        />
        <div className="flex items-center gap-2 pl-1">
          <span className="text-xs text-gray-500">Confidence in browser tier:</span>
          <CertaintySelector
            id="browser-certainty"
            compact
            value={data.browserTierCertainty ?? 'High'}
            onChange={v => onChange({ browserTierCertainty: v as CertaintyLevel })}
          />
        </div>
      </div>

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

      <CertaintyMultipliersEditor
        idPrefix="intake-am-mult"
        title="Account manager confidence multipliers"
        description="Factor applied to matrix cells by intake confidence (pages, workflows, integrations, rigor, browser tier, etc.). 1.00 leaves the estimate unchanged; higher values increase hours when confidence is low."
        multipliers={data.amConfidenceMultipliers}
        onChange={amConfidenceMultipliers => onChange({ amConfidenceMultipliers })}
      />

    </div>
  )
}
