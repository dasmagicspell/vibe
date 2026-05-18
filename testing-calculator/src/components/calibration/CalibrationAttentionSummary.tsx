import type { CalibrationEntry } from '@/types'
import {
  getCalibrationAttentionItems,
  formatCalibrationAttentionRow,
} from '@/utils/certaintyHelpers'
import { CertaintyBadge } from '@/components/shared/CertaintyBadge'

interface CalibrationAttentionSummaryProps {
  entries: CalibrationEntry[]
  /** Shown when every test type is High with filled estimates */
  allClearMessage?: string
}

/**
 * Lists test types that still have missing estimates or certainty below High.
 * Rendered at the bottom of the calibration scenarios step and review summary.
 */
export function CalibrationAttentionSummary({
  entries,
  allClearMessage = 'All test types have High-certainty estimates across Low, Medium, and High complexity.',
}: CalibrationAttentionSummaryProps) {
  const items = getCalibrationAttentionItems(entries)

  return (
    <div
      className={`
        rounded-xl border p-4
        ${items.length > 0
          ? 'border-amber-200 bg-amber-50'
          : 'border-green-200 bg-green-50'}
      `}
      aria-live="polite"
    >
      <p className="text-sm font-semibold text-gray-900">
        {items.length > 0
          ? `${items.length} test type${items.length !== 1 ? 's' : ''} need review`
          : 'Calibration certainty summary'}
      </p>

      {items.length === 0 ? (
        <p className="mt-2 text-sm text-green-800">{allClearMessage}</p>
      ) : (
        <>
          <p className="mt-1 text-xs text-amber-800 leading-relaxed">
            These test types have a missing estimate or certainty below High. Update them
            before exporting so schedules are not flagged for engineer review.
          </p>
          <ul className="mt-3 space-y-2">
            {items.map(({ testType, rows }) => {
              const worstCertainty = rows.reduce<'Low' | 'Medium' | 'High'>(
                (worst, row) => {
                  if (row.empty || row.certainty === 'Low') return 'Low'
                  if (row.certainty === 'Medium' && worst !== 'Low') return 'Medium'
                  return worst
                },
                'High',
              )
              return (
                <li
                  key={testType}
                  className="flex items-start gap-2 text-sm text-gray-800 bg-white/70 rounded-lg px-3 py-2 border border-amber-100"
                >
                  <span className="mt-0.5 flex-none">
                    <CertaintyBadge level={worstCertainty} compact />
                  </span>
                  <div className="min-w-0">
                    <span className="font-medium">{testType}</span>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {rows.map(formatCalibrationAttentionRow).join(' · ')}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
