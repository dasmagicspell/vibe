import type { CertaintyLevel } from '@/types'

interface CertaintyBadgeProps {
  level: CertaintyLevel
  /** compact = dot-only; default = dot + label */
  compact?: boolean
}

const STYLES: Record<CertaintyLevel, { dot: string; pill: string; label: string }> = {
  High:   { dot: 'bg-green-500',  pill: 'bg-green-100  text-green-800  border-green-200',  label: 'High'   },
  Medium: { dot: 'bg-yellow-500', pill: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Medium' },
  Low:    { dot: 'bg-red-500',    pill: 'bg-red-100    text-red-800    border-red-200',    label: 'Low'    },
}

/** Indicates how confident the engine is in a cell estimate. */
export function CertaintyBadge({ level, compact = false }: CertaintyBadgeProps) {
  const s = STYLES[level]

  if (compact) {
    return (
      <span
        className={`inline-block w-2 h-2 rounded-full ${s.dot}`}
        aria-label={`${level} certainty`}
        title={`${level} certainty`}
      />
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-medium ${s.pill}`}
      aria-label={`${level} certainty`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  )
}

/** Tooltip explanation shown in the drill-down panel */
export const CERTAINTY_EXPLANATIONS: Record<CertaintyLevel, string> = {
  High:   'Exact calibration data found for this test type and complexity level.',
  Medium: 'Estimate interpolated from an adjacent complexity level — verify with the engineer.',
  Low:    'No calibration data found. Add this test type to the model for a reliable estimate.',
}
