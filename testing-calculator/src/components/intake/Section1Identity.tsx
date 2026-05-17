import type { ProjectSpec } from '@/types'

interface Props {
  data: Pick<ProjectSpec, 'projectName' | 'clientName' | 'createdAt'>
  onChange: (updates: Partial<ProjectSpec>) => void
}

export function Section1Identity({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Project identity</h2>
        <p className="mt-1 text-sm text-gray-500">
          Basic identifiers that appear in the generated schedule and scope document.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-1">
            Project name <span className="text-red-500">*</span>
          </label>
          <input
            id="project-name"
            type="text"
            value={data.projectName}
            onChange={e => onChange({ projectName: e.target.value })}
            placeholder="e.g. Acme Corp Website Relaunch"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        <div>
          <label htmlFor="client-name" className="block text-sm font-medium text-gray-700 mb-1">
            Client name <span className="text-red-500">*</span>
          </label>
          <input
            id="client-name"
            type="text"
            value={data.clientName}
            onChange={e => onChange({ clientName: e.target.value })}
            placeholder="e.g. Acme Corp"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        <div>
          <label htmlFor="created-at" className="block text-sm font-medium text-gray-700 mb-1">
            Estimate date
          </label>
          <input
            id="created-at"
            type="date"
            value={data.createdAt.slice(0, 10)}
            onChange={e => onChange({ createdAt: new Date(e.target.value).toISOString() })}
            className="w-48 px-3 py-2 rounded-lg border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
      </div>
    </div>
  )
}
