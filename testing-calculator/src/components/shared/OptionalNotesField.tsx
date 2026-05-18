interface OptionalNotesFieldProps {
  id: string
  value?: string
  onChange: (notes: string | undefined) => void
  placeholder?: string
}

/** Optional free-text notes for intake items (pages, workflows, integrations). */
export function OptionalNotesField({
  id,
  value,
  onChange,
  placeholder = 'Testing context for engineers — e.g. special behavior, dependencies, or scope caveats…',
}: OptionalNotesFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-500 mb-1">
        Notes for test engineers <span className="font-normal text-gray-400">(optional)</span>
      </label>
      <textarea
        id={id}
        value={value ?? ''}
        onChange={e => {
          const trimmed = e.target.value.trim()
          onChange(trimmed ? e.target.value : undefined)
        }}
        placeholder={placeholder}
        rows={2}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm resize-none
                   focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
      />
    </div>
  )
}
