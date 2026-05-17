import type { ScheduleOutput } from '@/types'

interface ReviewFlagsProps {
  flags: ScheduleOutput['reviewFlags']
}

/**
 * Shown below the summary when any cells need review (low certainty or missing calibration).
 */
export function ReviewFlags({ flags }: ReviewFlagsProps) {
  if (flags.length === 0) return null

  return (
    <div className="rounded-xl border border-red-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-red-50 border-b border-red-200 flex items-center gap-2">
        <svg className="w-4 h-4 text-red-500 flex-none" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd"
            d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17
               2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10
               5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-sm font-semibold text-red-800">
          {flags.length} cell{flags.length !== 1 ? 's' : ''} need engineer review
        </p>
      </div>

      <div className="px-4 py-3 text-xs text-red-700 leading-relaxed bg-red-50">
        These cells have low overall certainty — from missing calibration data, low engineer confidence,
        or low intake confidence. Review with the test engineer and adjust the model or intake before sharing the schedule.
      </div>

      <ul className="divide-y divide-red-100">
        {flags.map((flag, i) => (
          <li key={i} className="flex items-start gap-3 px-4 py-2.5 bg-white">
            <span className="flex-none mt-0.5 w-2 h-2 rounded-full bg-red-400" aria-hidden="true" />
            <div>
              <span className="font-medium text-gray-900">{flag.rowLabel}</span>
              <span className="text-gray-400 mx-1">—</span>
              <span className="text-gray-700">{flag.testType}</span>
              <p className="text-gray-400 text-xs mt-0.5">{flag.reason}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
