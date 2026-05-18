import type { ProjectSpec } from '@/types'

interface IntegrationIntakeNotesProps {
  project: ProjectSpec
}

/** Surfaces integration notes from intake on the internal schedule (integrations have no matrix rows). */
export function IntegrationIntakeNotes({ project }: IntegrationIntakeNotesProps) {
  const withNotes = project.integrations.filter(i => i.notes?.trim())
  if (withNotes.length === 0) return null

  return (
    <div className="rounded-xl border border-amber-200 overflow-hidden">
      <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200">
        <p className="text-sm font-semibold text-amber-900">
          Integration notes from intake
        </p>
        <p className="text-xs text-amber-800/80 mt-0.5">
          Context from the account manager — not shown in the matrix above.
        </p>
      </div>
      <ul className="divide-y divide-amber-100">
        {withNotes.map(integration => (
          <li key={integration.id} className="px-4 py-3 bg-white">
            <p className="text-sm font-medium text-gray-900">
              {integration.name || 'Unnamed integration'}
              {integration.category && (
                <span className="text-gray-400 font-normal"> · {integration.category}</span>
              )}
            </p>
            <p className="mt-1 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {integration.notes}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
