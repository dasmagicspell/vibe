import { Tooltip } from './Tooltip'

interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  id: string
  label: string
  tooltip?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  className?: string
}

/** Labelled <select> element with optional tooltip icon. */
export function SelectField({
  id, label, tooltip, value, onChange, options, className = '',
}: SelectFieldProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-0.5">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        {tooltip && <Tooltip content={tooltip} />}
      </div>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white
                   focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
