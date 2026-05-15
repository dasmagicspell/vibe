import type { ExploratoryBlock } from '@/types'
import { generateId } from '@/utils/modelHelpers'
import { StepNav } from './StepWizard'

interface Step6Props {
  data: ExploratoryBlock[]
  onChange: (data: ExploratoryBlock[]) => void
  onBack: () => void
  onNext: () => void
}

export function Step6Exploratory({ data, onChange, onBack, onNext }: Step6Props) {
  function addBlock() {
    // Use the id as a local key (ExploratoryBlock doesn't have an id in the type,
    // so we track order by index — add a temporary key for React rendering)
    onChange([...data, { label: '', hours: 0 }])
  }

  function updateBlock(index: number, field: keyof ExploratoryBlock, value: string | number) {
    onChange(data.map((b, i) => i === index ? { ...b, [field]: value } : b))
  }

  function removeBlock(index: number) {
    onChange(data.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Exploratory testing blocks</h2>
        <p className="mt-1 text-sm text-gray-500">
          Define the time blocks the account manager can select for exploratory testing.
          Exploratory testing is fixed-time, unscripted expert exploration — the block size
          is the commitment, not the number of test cases.
        </p>
      </div>

      <div className="space-y-2">
        {data.map((block, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white"
          >
            {/* Label */}
            <div className="flex-1">
              <label htmlFor={`block-label-${index}`} className="sr-only">
                Block label
              </label>
              <input
                id={`block-label-${index}`}
                type="text"
                value={block.label}
                onChange={e => updateBlock(index, 'label', e.target.value)}
                placeholder="e.g. 2-hour block"
                className="w-full px-3 py-1.5 text-sm rounded border border-gray-200
                           focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Hours */}
            <div className="flex items-center gap-2 flex-none">
              <label htmlFor={`block-hours-${index}`} className="text-xs text-gray-500 whitespace-nowrap">
                Hours:
              </label>
              <input
                id={`block-hours-${index}`}
                type="number"
                min={0.5}
                step={0.5}
                value={block.hours === 0 ? '' : block.hours}
                onChange={e => updateBlock(index, 'hours', parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1.5 text-sm rounded border border-gray-200 text-right
                           focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={() => removeBlock(index)}
              className="flex-none text-gray-400 hover:text-red-500 transition-colors p-1"
              aria-label={`Remove block ${block.label || index + 1}`}
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd"
                  d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75
                     0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75
                     0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0
                     0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69
                     0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0
                     00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3
                     7.5a.75.75 0 101.5.06l.3-7.5z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-6 text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          No blocks defined. Add at least one below.
        </div>
      )}

      <button
        type="button"
        onClick={addBlock}
        className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
        Add exploratory block
      </button>

      <StepNav onBack={onBack} onNext={onNext} nextLabel="Review model" />
    </div>
  )
}

// Silence unused import — generateId is used if we add keyed blocks in future
void generateId
