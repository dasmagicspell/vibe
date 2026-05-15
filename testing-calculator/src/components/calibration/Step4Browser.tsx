import type { BrowserCalibrationEntry } from '@/types'
import { BrowserTier, BROWSER_TIER_DEFINITIONS } from '@/types'
import { TimeEstimateInput } from '@/components/shared/TimeEstimateInput'
import { Tooltip } from '@/components/shared/Tooltip'
import { StepNav } from './StepWizard'

interface Step4Props {
  data: BrowserCalibrationEntry[]
  onChange: (data: BrowserCalibrationEntry[]) => void
  onBack: () => void
  onNext: () => void
}

const TIERS = [BrowserTier.Basic, BrowserTier.Standard, BrowserTier.Enhanced, BrowserTier.Custom]

export function Step4Browser({ data, onChange, onBack, onNext }: Step4Props) {
  function handleChange(tier: BrowserTier, entry: BrowserCalibrationEntry) {
    onChange(data.map(d => d.tier === tier ? entry : d))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Browser and device calibration</h2>
        <p className="mt-1 text-sm text-gray-500">
          Enter the additional time per page for cross-browser testing at each tier.
          These estimates are added on top of the functional test estimates for every
          page in the project that requires cross-browser coverage.
        </p>
      </div>

      {/* Column header */}
      <div className="grid grid-cols-[1fr_auto] gap-4 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">
        <span>Browser tier</span>
        <span>Min / Expected / Max per page</span>
      </div>

      <div className="space-y-2">
        {TIERS.map(tier => {
          const entry = data.find(d => d.tier === tier)
          if (!entry) return null

          return (
            <div
              key={tier}
              className="flex items-center gap-4 px-4 py-3 rounded-lg border border-gray-200 bg-white"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-gray-900">{tier}</span>
                  <Tooltip content={BROWSER_TIER_DEFINITIONS[tier]} />
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {BROWSER_TIER_DEFINITIONS[tier]}
                </p>
              </div>

              <TimeEstimateInput
                id={`browser-${tier}`}
                value={entry.estimatePerPage}
                onChange={estimate =>
                  handleChange(tier, { ...entry, estimatePerPage: estimate })
                }
              />
            </div>
          )
        })}
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
        <strong>Note on Custom tier:</strong> when a project selects Custom browser coverage, the
        account manager will describe the specific requirements. The estimate here serves as a
        starting point — it should be adjusted per project in those cases.
      </div>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  )
}
