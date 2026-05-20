import type { CertaintyLevel, CertaintyMultipliers } from '@/types'
import { DEFAULT_CERTAINTY_MULTIPLIERS } from '@/types'
import { CERTAINTY_LEVELS } from '@/utils/certaintyHelpers'

const MIN_FACTOR = 0.1
const MAX_FACTOR = 5.0
const STEP = 0.05

interface CertaintyMultipliersEditorProps {
  idPrefix: string
  title: string
  description: string
  multipliers: CertaintyMultipliers
  onChange: (multipliers: CertaintyMultipliers) => void
  onReset?: () => void
  compact?: boolean
}

function clampFactor(value: number): number {
  if (Number.isNaN(value)) return 1
  return Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, value))
}

export function CertaintyMultipliersEditor({
  idPrefix,
  title,
  description,
  multipliers,
  onChange,
  onReset,
  compact = false,
}: CertaintyMultipliersEditorProps) {
  function setLevel(level: CertaintyLevel, raw: string) {
    const parsed = parseFloat(raw)
    onChange({
      ...multipliers,
      [level]: clampFactor(parsed),
    })
  }

  const gridClass = compact
    ? 'grid grid-cols-3 gap-2'
    : 'grid grid-cols-3 gap-3'

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className={`font-medium text-gray-900 ${compact ? 'text-xs' : 'text-sm'}`}>
            {title}
          </h3>
          <p className={`text-gray-500 mt-0.5 ${compact ? 'text-xs' : 'text-xs'}`}>
            {description}
          </p>
        </div>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="shrink-0 text-xs text-gray-500 hover:text-gray-800 underline"
          >
            Reset to 1.00
          </button>
        )}
      </div>
      <div className={gridClass}>
        {CERTAINTY_LEVELS.map(level => {
          const value = multipliers[level]
          const pctAboveBase = Math.round((value - 1) * 100)
          const adjustmentLabel =
            pctAboveBase === 0
              ? 'no change'
              : pctAboveBase > 0
                ? `+${pctAboveBase}%`
                : `${pctAboveBase}%`
          return (
            <label
              key={level}
              htmlFor={`${idPrefix}-${level}`}
              className={`rounded-lg border border-gray-200 bg-white ${compact ? 'p-2' : 'p-3'}`}
            >
              <span className="block text-xs font-semibold text-gray-700">{level}</span>
              <input
                id={`${idPrefix}-${level}`}
                type="number"
                min={MIN_FACTOR}
                max={MAX_FACTOR}
                step={STEP}
                value={value}
                onChange={e => setLevel(level, e.target.value)}
                className={`mt-1 w-full rounded border border-gray-300 px-2 font-mono text-gray-900
                           focus:outline-none focus:ring-2 focus:ring-brand-500 ${compact ? 'py-1 text-xs' : 'py-1.5 text-sm'}`}
                aria-label={`${title} ${level} factor`}
              />
              <span className="mt-0.5 block text-xs text-gray-400">{adjustmentLabel}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

export function resetCertaintyMultipliers(): CertaintyMultipliers {
  return { ...DEFAULT_CERTAINTY_MULTIPLIERS }
}
