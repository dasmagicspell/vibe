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

// Size-encoded certainty: bigger = needs more attention (Low/red is largest).
// Provides a redundant, color-blind-friendly cue alongside the color hue.
const COMPACT_DOT_SIZE: Record<CertaintyLevel, string> = {
  Low:    'w-2.5 h-2.5',
  Medium: 'w-2 h-2',
  High:   'w-1.5 h-1.5',
}

const PILL_DOT_SIZE: Record<CertaintyLevel, string> = {
  Low:    'w-2 h-2',
  Medium: 'w-1.5 h-1.5',
  High:   'w-1 h-1',
}

/** Indicates how confident the engine is in a cell estimate. */
export function CertaintyBadge({ level, compact = false }: CertaintyBadgeProps) {
  const s = STYLES[level]

  if (compact) {
    return (
      <span
        className={`inline-block rounded-full ${COMPACT_DOT_SIZE[level]} ${s.dot}`}
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
      <span className={`rounded-full ${PILL_DOT_SIZE[level]} ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  )
}

/** Tooltip explanation shown in the drill-down panel */
export const CERTAINTY_EXPLANATIONS: Record<CertaintyLevel, string> = {
  High:   'High confidence — calibration, intake, and lookup all support this estimate.',
  Medium: 'Medium confidence — at least one source (calibration, intake, or lookup) is approximate.',
  Low:    'Low confidence — review calibration data, intake inputs, or add missing estimates.',
}

export const CERTAINTY_BREAKDOWN_LABELS = {
  lookup:      'Lookup (exact match / interpolation)',
  calibration: 'Engineer calibration',
  intake:      'Intake confidence',
} as const
