import { useState } from 'react'
import type { ClientScopeDoc, ScopeDocSection } from '@/types'

interface ClientScopeTabProps {
  doc:      ClientScopeDoc
  onChange: (doc: ClientScopeDoc) => void
}

const SECTION_ORDER: Array<keyof ClientScopeDoc['sections']> = [
  'whatWeWillTest',
  'whatWeWillNotTest',
  'whatWeNeedFromYou',
  'deliverables',
  'assumptions',
  'changeTriggers',
  'optionalAddOns',
]

/**
 * The client-facing scope document tab.
 * Auto-populated from the project and schedule, with all sections editable.
 * Renders as a clean document on screen and even cleaner on print.
 *
 * Editing: click any bullet to edit it in-place.
 * Buttons to add/remove items are hidden on print.
 */
export function ClientScopeTab({ doc, onChange }: ClientScopeTabProps) {
  function updateSection(
    key: keyof ClientScopeDoc['sections'],
    section: ScopeDocSection,
  ) {
    onChange({
      ...doc,
      sections: { ...doc.sections, [key]: section },
    })
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Document header */}
      <div className="mb-8 pb-6 border-b-2 border-gray-900 print:mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1 no-print">
          Client scope document
        </p>
        <h2 className="text-2xl font-bold text-gray-900">{doc.projectName}</h2>
        <p className="text-base text-gray-600 mt-0.5">{doc.clientName}</p>

        <div className="flex flex-wrap gap-6 mt-3 text-sm text-gray-500">
          <span>Prepared by: <strong className="text-gray-700">{doc.preparedBy}</strong></span>
          <span>
            Date:{' '}
            <strong className="text-gray-700">
              {new Date(doc.preparedAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </strong>
          </span>
        </div>
      </div>

      {/* Instruction strip — hidden on print */}
      <div className="no-print mb-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
        💡 Click any bullet item to edit it. Use the + and × buttons to add or remove items.
        All edits are session-only — export the project or take a screenshot to save changes.
        Print or save as PDF using the button above.
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {SECTION_ORDER.map(key => (
          <ScopeSection
            key={key}
            section={doc.sections[key]}
            onChange={section => updateSection(key, section)}
          />
        ))}
      </div>

      {/* Print footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-400 print:block hidden">
        <p>{doc.preparedBy} · {doc.projectName} · QA Scope Document</p>
        <p>This document is an estimate. Changes to scope require a revised estimate.</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Section component
// ---------------------------------------------------------------------------

interface ScopeSectionProps {
  section:  ScopeDocSection
  onChange: (section: ScopeDocSection) => void
}

function ScopeSection({ section, onChange }: ScopeSectionProps) {
  function updateItem(index: number, value: string) {
    const next = [...section.items]
    next[index] = value
    onChange({ ...section, items: next })
  }

  function removeItem(index: number) {
    onChange({ ...section, items: section.items.filter((_, i) => i !== index) })
  }

  function addItem() {
    onChange({ ...section, items: [...section.items, ''] })
  }

  return (
    <section>
      {/* Section heading */}
      <h3 className="text-base font-bold text-gray-900 mb-3 pb-1 border-b border-gray-200">
        {section.heading}
      </h3>

      {/* Items list */}
      <ul className="space-y-2">
        {section.items.map((item, i) => (
          <EditableItem
            key={i}
            value={item}
            onSave={value => updateItem(i, value)}
            onRemove={() => removeItem(i)}
          />
        ))}
      </ul>

      {/* Add item button — hidden on print */}
      <button
        type="button"
        onClick={addItem}
        className="no-print mt-2 flex items-center gap-1.5 text-xs text-brand-600
                   hover:text-brand-700 font-medium transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
        Add item
      </button>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Editable item
// ---------------------------------------------------------------------------

interface EditableItemProps {
  value:    string
  onSave:   (value: string) => void
  onRemove: () => void
}

function EditableItem({ value, onSave, onRemove }: EditableItemProps) {
  const [editing, setEditing]   = useState(value === '')
  const [draft, setDraft]       = useState(value)

  function commit() {
    onSave(draft)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      commit()
    }
    if (e.key === 'Escape') {
      setDraft(value)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <li className="flex items-start gap-2">
        <span className="mt-2 text-gray-400 flex-none select-none" aria-hidden="true">•</span>
        <textarea
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          rows={2}
          className="flex-1 text-sm rounded-lg border border-brand-300 px-2 py-1
                     focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          placeholder="Enter item text…"
        />
      </li>
    )
  }

  return (
    <li className="flex items-start gap-2 group">
      <span className="mt-0.5 text-gray-400 flex-none select-none" aria-hidden="true">•</span>
      <span
        className="flex-1 text-sm text-gray-800 leading-relaxed cursor-text
                   group-hover:text-gray-900 transition-colors"
        onClick={() => { setDraft(value); setEditing(true) }}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setDraft(value); setEditing(true) } }}
        aria-label={`Edit: ${value}`}
      >
        {value || <em className="text-gray-400">Empty item — click to edit</em>}
      </span>

      {/* Remove button — hidden on print */}
      <button
        type="button"
        onClick={onRemove}
        className="no-print flex-none opacity-0 group-hover:opacity-100 transition-opacity
                   text-gray-400 hover:text-red-500 p-0.5 rounded"
        aria-label="Remove this item"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </li>
  )
}
