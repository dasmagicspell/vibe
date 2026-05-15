import type { TimeEstimate } from '@/types'

interface TimeEstimateInputProps {
  value: TimeEstimate
  onChange: (value: TimeEstimate) => void
  disabled?: boolean
  /** Show labels above each field (default: false for compact use inside tables) */
  showLabels?: boolean
  id?: string
}

/**
 * Three number inputs in a row: min / expected / max hours.
 * Used throughout the calibration wizard wherever a TimeEstimate is edited.
 */
export function TimeEstimateInput({
  value,
  onChange,
  disabled = false,
  showLabels = false,
  id,
}: TimeEstimateInputProps) {
  function handleChange(field: keyof TimeEstimate, raw: string) {
    const parsed = parseFloat(raw)
    const num = isNaN(parsed) || parsed < 0 ? 0 : parsed
    onChange({ ...value, [field]: num })
  }

  const fields: Array<{ key: keyof TimeEstimate; label: string; placeholder: string }> = [
    { key: 'minHours',      label: 'Min',      placeholder: '0' },
    { key: 'expectedHours', label: 'Expected', placeholder: '0' },
    { key: 'maxHours',      label: 'Max',      placeholder: '0' },
  ]

  return (
    <div className="flex items-end gap-2">
      {fields.map(({ key, label, placeholder }) => (
        <div key={key} className="flex flex-col gap-0.5">
          {showLabels && (
            <label
              htmlFor={id ? `${id}-${key}` : undefined}
              className="text-xs text-gray-400 text-center"
            >
              {label}
            </label>
          )}
          <div className="relative">
            <input
              id={id ? `${id}-${key}` : undefined}
              type="number"
              min={0}
              step={0.25}
              value={value[key] === 0 ? '' : value[key]}
              placeholder={placeholder}
              disabled={disabled}
              onChange={e => handleChange(key, e.target.value)}
              className={`
                w-20 px-2 py-1.5 text-sm rounded-md border text-right
                focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                ${disabled
                  ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-900 border-gray-300 hover:border-gray-400'}
              `}
            />
          </div>
        </div>
      ))}
      <span className="text-xs text-gray-400 pb-1.5 whitespace-nowrap">hrs</span>
    </div>
  )
}
