import type { CertaintyLevel, PageSpec, ProjectSpec } from '@/types'
import { PageCategory, ComplexityLevel, COMPLEXITY_DEFINITIONS } from '@/types'
import { createPageSpec, PAGE_CATEGORY_DESCRIPTIONS } from '@/utils/projectHelpers'
import { Tooltip } from '@/components/shared/Tooltip'
import { CertaintySelector } from '@/components/shared/CertaintySelector'
import { OptionalNotesField } from '@/components/shared/OptionalNotesField'
interface Props {
  pages: PageSpec[]
  onChange: (updates: Partial<ProjectSpec>) => void
}

const CATEGORY_OPTIONS = Object.values(PageCategory).map(c => ({
  value: c,
  label: c,
}))

const COMPLEXITY_OPTIONS = [
  { value: ComplexityLevel.Low,    label: 'Low' },
  { value: ComplexityLevel.Medium, label: 'Medium' },
  { value: ComplexityLevel.High,   label: 'High' },
]

export function Section3Pages({ pages, onChange }: Props) {
  function addPage() {
    onChange({ pages: [...pages, createPageSpec()] })
  }

  function updatePage(id: string, updates: Partial<PageSpec>) {
    onChange({ pages: pages.map(p => p.id === id ? { ...p, ...updates } : p) })
  }

  function removePage(id: string) {
    onChange({ pages: pages.filter(p => p.id !== id) })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Pages</h2>
        <p className="mt-1 text-sm text-gray-500">
          Add every distinct page or page template. For repeated layouts (e.g. blog posts),
          use the template toggle and enter the number of instances.
        </p>
      </div>

      {/* Page cards */}
      <div className="space-y-3">
        {pages.map((page, index) => (
          <PageCard
            key={page.id}
            page={page}
            index={index}
            onUpdate={updates => updatePage(page.id, updates)}
            onRemove={() => removePage(page.id)}
          />
        ))}
      </div>

      {pages.length === 0 && (
        <div className="text-center py-8 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-sm text-gray-400">No pages added yet.</p>
          <p className="text-xs text-gray-400 mt-1">Add at least one page to generate a meaningful estimate.</p>
        </div>
      )}

      {/* Add page button */}
      <button
        type="button"
        onClick={addPage}
        className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
        Add page
      </button>

    </div>
  )
}

// ---------------------------------------------------------------------------
// PageCard — one page entry
// ---------------------------------------------------------------------------

interface PageCardProps {
  page: PageSpec
  index: number
  onUpdate: (updates: Partial<PageSpec>) => void
  onRemove: () => void
}

function PageCard({ page, index, onUpdate, onRemove }: PageCardProps) {
  const categoryDescription = PAGE_CATEGORY_DESCRIPTIONS[page.category]

  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-4">
      {/* Row 1: name + remove */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <label htmlFor={`page-name-${page.id}`} className="block text-xs font-medium text-gray-500 mb-1">
            Page name
          </label>
          <input
            id={`page-name-${page.id}`}
            type="text"
            value={page.name}
            onChange={e => onUpdate({ name: e.target.value })}
            placeholder={`Page ${index + 1} — e.g. Home, Contact, Product Detail`}
            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="mt-5 p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded"
          aria-label={`Remove ${page.name || `page ${index + 1}`}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23
                 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0
                 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014
                 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69
                 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Row 2: category + complexity */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`page-cat-${page.id}`} className="block text-xs font-medium text-gray-500 mb-1">
            Page category
          </label>
          <select
            id={`page-cat-${page.id}`}
            value={page.category}
            onChange={e => onUpdate({ category: e.target.value as PageCategory })}
            className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-brand-500"
            title={categoryDescription}
          >
            {CATEGORY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-400 leading-snug">{categoryDescription}</p>
        </div>

        <div>
          <div className="flex items-center gap-0.5 mb-1">
            <label htmlFor={`page-cplx-${page.id}`} className="text-xs font-medium text-gray-500">
              Complexity
            </label>
            <Tooltip content={COMPLEXITY_DEFINITIONS[page.complexity]} />
          </div>
          <div className="flex gap-1">
            {COMPLEXITY_OPTIONS.map(opt => {
              const isSelected = page.complexity === opt.value
              const colors = {
                [ComplexityLevel.Low]:    isSelected ? 'bg-green-100 text-green-800 border-green-400' : 'bg-white text-gray-600 border-gray-300',
                [ComplexityLevel.Medium]: isSelected ? 'bg-yellow-100 text-yellow-800 border-yellow-400' : 'bg-white text-gray-600 border-gray-300',
                [ComplexityLevel.High]:   isSelected ? 'bg-red-100 text-red-800 border-red-400' : 'bg-white text-gray-600 border-gray-300',
              }
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate({ complexity: opt.value })}
                  className={`flex-1 py-1.5 rounded-lg border-2 text-xs font-medium transition-all ${colors[opt.value]}`}
                  title={COMPLEXITY_DEFINITIONS[opt.value]}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-500">Confidence in complexity:</span>
            <CertaintySelector
              id={`page-certainty-${page.id}`}
              compact
              value={page.complexityCertainty ?? 'High'}
              onChange={v => onUpdate({ complexityCertainty: v as CertaintyLevel })}
            />
          </div>
        </div>
      </div>

      {/* Row 3: template toggle */}
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={page.isTemplate}
            onChange={e => onUpdate({ isTemplate: e.target.checked, templateInstanceCount: e.target.checked ? (page.templateInstanceCount ?? 5) : undefined })}
            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-xs text-gray-600">
            This is a template (same layout used for multiple pages)
          </span>
        </label>

        {page.isTemplate && (
          <div className="flex items-center gap-2">
            <label htmlFor={`page-instances-${page.id}`} className="text-xs text-gray-500 whitespace-nowrap">
              Number of instances:
            </label>
            <input
              id={`page-instances-${page.id}`}
              type="number"
              min={1}
              step={1}
              value={page.templateInstanceCount ?? 5}
              onChange={e => onUpdate({ templateInstanceCount: parseInt(e.target.value) || 1 })}
              className="w-16 px-2 py-1 text-sm rounded border border-gray-300 text-right
                         focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        )}
      </div>

      <OptionalNotesField
        id={`page-notes-${page.id}`}
        value={page.notes}
        onChange={notes => onUpdate({ notes })}
        placeholder="e.g. custom form validation, third-party embed, content varies by locale…"
      />
    </div>
  )
}
