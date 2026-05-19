import { useState } from 'react'
import type { TestCase } from '@/types'
import { generateId } from '@/utils/modelHelpers'

interface Props {
  items: TestCase[]
  onChange: (items: TestCase[]) => void
  idPrefix: string
}

export function EditableDescriptionList({ items, onChange, idPrefix }: Props) {
  function addItem() {
    onChange([...items, { id: generateId(), description: '' }])
  }

  function updateItem(id: string, description: string) {
    onChange(items.map(item => item.id === id ? { ...item, description } : item))
  }

  function removeItem(id: string) {
    onChange(items.filter(item => item.id !== id))
  }

  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <p className="text-xs text-gray-400">No test cases yet.</p>
      )}

      <ul className="space-y-2">
        {items.map((item, index) => (
          <EditableDescriptionItem
            key={item.id}
            item={item}
            index={index}
            idPrefix={idPrefix}
            onSave={description => updateItem(item.id, description)}
            onRemove={() => removeItem(item.id)}
          />
        ))}
      </ul>

      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
        Add test case
      </button>
    </div>
  )
}

interface ItemProps {
  item: TestCase
  index: number
  idPrefix: string
  onSave: (description: string) => void
  onRemove: () => void
}

function EditableDescriptionItem({ item, index, idPrefix, onSave, onRemove }: ItemProps) {
  const [editing, setEditing] = useState(item.description === '')
  const [draft, setDraft] = useState(item.description)

  function commit() {
    onSave(draft.trim())
    setEditing(false)
  }

  function startEdit() {
    setDraft(item.description)
    setEditing(true)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commit()
    }
    if (e.key === 'Escape') {
      setDraft(item.description)
      setEditing(false)
    }
  }

  const inputId = `${idPrefix}-${item.id}`

  return (
    <li className="flex items-start gap-2 group rounded-lg border border-gray-100 bg-white px-3 py-2">
      <span className="flex-none w-5 h-5 mt-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold flex items-center justify-center">
        {index + 1}
      </span>

      {editing ? (
        <input
          id={inputId}
          type="text"
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          placeholder="Describe the test case…"
          className="flex-1 text-sm rounded-lg border border-brand-300 px-2 py-1
                     focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      ) : (
        <span className="flex-1 text-sm text-gray-700 leading-snug pt-0.5">
          {item.description || <em className="text-gray-400">Empty — click edit to add text</em>}
        </span>
      )}

      <div className="flex items-center gap-1 flex-none">
        <button
          type="button"
          onClick={() => (editing ? commit() : startEdit())}
          className="p-1.5 text-gray-400 hover:text-brand-600 transition-colors"
          aria-label={editing ? 'Save test case description' : 'Edit test case description'}
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M2.695 14.363l1.149 1.149a3 3 0 004.243 0l9.9-9.9a3 3 0 00-4.243-4.243l-1.15 1.15-8.28 8.28 1.72 1.72 8.28-8.28Zm11.586-11.586 1.72 1.72-1.72 1.72-1.72-1.72 1.72-1.72Z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Remove test case"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75
                 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75
                 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014
                 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5z" clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </li>
  )
}
