import type { CertaintyLevel } from '@/types'

interface CertaintySelectorProps {
  value: CertaintyLevel
  onChange: (value: CertaintyLevel) => void
  disabled?: boolean
  /** Compact = dot-only radios; default shows L/M/H labels */
  compact?: boolean
  id?: string
}

const OPTIONS: CertaintyLevel[] = ['Low', 'Medium', 'High']

const DOT_STYLES: Record<CertaintyLevel, string> = {
  Low:    'bg-red-500 border-red-600',
  Medium: 'bg-yellow-500 border-yellow-600',
  High:   'bg-green-500 border-green-600',
}

const SELECTED_RING: Record<CertaintyLevel, string> = {
  Low:    'ring-red-400',
  Medium: 'ring-yellow-400',
  High:   'ring-green-400',
}

// Size-encoded certainty: bigger = needs more attention (Low/red is largest).
// Provides a redundant, color-blind-friendly cue alongside the color hue.
const DOT_SIZE_COMPACT: Record<CertaintyLevel, string> = {
  Low:    'w-3.5 h-3.5',
  Medium: 'w-3 h-3',
  High:   'w-2.5 h-2.5',
}

const DOT_SIZE_DEFAULT: Record<CertaintyLevel, string> = {
  Low:    'w-4 h-4',
  Medium: 'w-3.5 h-3.5',
  High:   'w-3 h-3',
}

/**
 * Compact three-option certainty control (colored radio buttons).
 * Used in calibration and intake wherever the user declares confidence.
 */
export function CertaintySelector({
  value,
  onChange,
  disabled = false,
  compact = false,
  id,
}: CertaintySelectorProps) {
  return (
    <fieldset
      disabled={disabled}
      className={`inline-flex items-center gap-1 ${disabled ? 'opacity-50' : ''}`}
      aria-label="Certainty level"
    >
      <legend className="sr-only">Certainty</legend>
      {OPTIONS.map(level => {
        const isSelected = value === level
        return (
          <label
            key={level}
            className={`
              relative flex items-center justify-center cursor-pointer
              ${compact ? 'p-0.5' : 'px-1 py-0.5'}
              ${disabled ? 'cursor-not-allowed' : ''}
            `}
            title={`${level} certainty`}
          >
            <input
              type="radio"
              name={id ?? 'certainty'}
              value={level}
              checked={isSelected}
              disabled={disabled}
              onChange={() => onChange(level)}
              className="sr-only"
            />
            <span
              className={`
                block rounded-full border-2 transition-all
                ${compact ? DOT_SIZE_COMPACT[level] : DOT_SIZE_DEFAULT[level]}
                ${DOT_STYLES[level]}
                ${isSelected ? `ring-2 ring-offset-1 ${SELECTED_RING[level]}` : 'opacity-60'}
              `}
              aria-hidden="true"
            />
            {!compact && (
              <span className="sr-only">{level}</span>
            )}
          </label>
        )
      })}
      {!compact && (
        <span className="text-xs text-gray-400 ml-1 w-12">{value}</span>
      )}
    </fieldset>
  )
}
