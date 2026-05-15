import { Tooltip } from './Tooltip'

interface RadioOption {
  value: string
  label: string
  description?: string
}

interface RadioGroupProps {
  name: string
  label: string
  tooltip?: string
  value: string
  onChange: (value: string) => void
  options: RadioOption[]
  /** Number of columns in the grid (default: 3) */
  columns?: 2 | 3 | 4
}

const GRID_COLS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
}

/**
 * Card-style radio group used for enum selectors throughout the intake form.
 * Each option is a clickable card with a label and optional description.
 */
export function RadioGroup({
  name, label, tooltip, value, onChange, options, columns = 3,
}: RadioGroupProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="flex items-center gap-0.5">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {tooltip && <Tooltip content={tooltip} />}
      </legend>

      <div className={`grid gap-2 ${GRID_COLS[columns] ?? 'grid-cols-3'}`}>
        {options.map(opt => {
          const isSelected = opt.value === value
          return (
            <label
              key={opt.value}
              className={`
                relative flex flex-col gap-0.5 p-3 rounded-lg border-2 cursor-pointer
                transition-all select-none
                ${isSelected
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}
              `}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={isSelected}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <span className={`text-sm font-medium ${isSelected ? 'text-brand-800' : 'text-gray-900'}`}>
                {opt.label}
              </span>
              {opt.description && (
                <span className="text-xs text-gray-500 leading-snug">{opt.description}</span>
              )}
              {isSelected && (
                <span className="absolute top-2 right-2">
                  <svg className="w-4 h-4 text-brand-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483
                         4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
