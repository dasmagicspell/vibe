import type { CertaintyLevel, IntegrationSpec, ProjectSpec } from '@/types'
import { ComplexityLevel, COMPLEXITY_DEFINITIONS } from '@/types'
import { createIntegrationSpec, INTEGRATION_CATEGORY_OPTIONS } from '@/utils/projectHelpers'
import { CertaintySelector } from '@/components/shared/CertaintySelector'
import { OptionalNotesField } from '@/components/shared/OptionalNotesField'
import { Tooltip } from '@/components/shared/Tooltip'
interface Props {
  integrations: IntegrationSpec[]
  onChange: (updates: Partial<ProjectSpec>) => void
}

export function Section5Integrations({ integrations, onChange }: Props) {
  function addIntegration() {
    onChange({ integrations: [...integrations, createIntegrationSpec()] })
  }

  function updateIntegration(id: string, updates: Partial<IntegrationSpec>) {
    onChange({ integrations: integrations.map(i => i.id === id ? { ...i, ...updates } : i) })
  }

  function removeIntegration(id: string) {
    onChange({ integrations: integrations.filter(i => i.id !== id) })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Integrations</h2>
        <p className="mt-1 text-sm text-gray-500">
          List third-party services the site connects to — analytics tools, CRMs, ERP systems
          (such as Odoo), payment gateways, email platforms. Each adds an API integration surface
          that needs testing. Marking an integration as analytics will automatically activate
          Analytics and Tag testing.
        </p>
      </div>

      <div className="space-y-3">
        {integrations.map((integration, index) => (
          <div
            key={integration.id}
            className="p-4 rounded-xl border border-gray-200 bg-white space-y-3"
          >
            <div className="flex gap-3">
              {/* Name */}
              <div className="flex-1">
                <label
                  htmlFor={`int-name-${integration.id}`}
                  className="block text-xs font-medium text-gray-500 mb-1"
                >
                  Integration name <span className="text-red-500">*</span>
                </label>
                <input
                  id={`int-name-${integration.id}`}
                  type="text"
                  value={integration.name}
                  onChange={e => updateIntegration(integration.id, { name: e.target.value })}
                  placeholder={`Integration ${index + 1} — e.g. Google Analytics 4, Odoo`}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Category */}
              <div className="w-56">
                <label
                  htmlFor={`int-cat-${integration.id}`}
                  className="block text-xs font-medium text-gray-500 mb-1"
                >
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id={`int-cat-${integration.id}`}
                  value={integration.category}
                  onChange={e => {
                    const cat = e.target.value
                    // Auto-set hasAnalytics for known analytics categories
                    const isAnalytics = cat.toLowerCase().includes('analytics')
                    updateIntegration(integration.id, {
                      category: cat,
                      hasAnalytics: integration.hasAnalytics || isAnalytics,
                    })
                  }}
                  className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">Select category…</option>
                  {INTEGRATION_CATEGORY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeIntegration(integration.id)}
                className="mt-5 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                aria-label={`Remove integration ${integration.name || index + 1}`}
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

            {/* Analytics flag */}
            <div className="mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={integration.hasAnalytics}
                  onChange={e => updateIntegration(integration.id, { hasAnalytics: e.target.checked })}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs text-gray-600">
                  This integration includes analytics or tag tracking (activates Analytics &amp; Tag testing)
                </span>
              </label>
            </div>

            {/* Complexity */}
            <div className="mt-3">
              <div className="flex items-center gap-0.5 mb-1">
                <span className="text-xs font-medium text-gray-500">Complexity</span>
                <Tooltip content={COMPLEXITY_DEFINITIONS[integration.complexity ?? ComplexityLevel.Medium]} />
              </div>
              <div className="flex gap-1 max-w-md">
                {([ComplexityLevel.Low, ComplexityLevel.Medium, ComplexityLevel.High] as const).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => updateIntegration(integration.id, { complexity: c })}
                    className={`
                      flex-1 py-1.5 rounded-lg border-2 text-xs font-medium transition-all
                      ${(integration.complexity ?? ComplexityLevel.Medium) === c
                        ? c === ComplexityLevel.Low    ? 'bg-green-100  text-green-800  border-green-400'
                        : c === ComplexityLevel.Medium ? 'bg-yellow-100 text-yellow-800 border-yellow-400'
                        :                               'bg-red-100    text-red-800    border-red-400'
                        : 'bg-white text-gray-600 border-gray-300'}
                    `}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">Confidence in complexity:</span>
                <CertaintySelector
                  id={`int-complexity-certainty-${integration.id}`}
                  compact
                  value={integration.complexityCertainty ?? 'High'}
                  onChange={v => updateIntegration(integration.id, { complexityCertainty: v as CertaintyLevel })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-gray-500">Confidence in integration:</span>
              <CertaintySelector
                id={`int-certainty-${integration.id}`}
                compact
                value={integration.certainty ?? 'High'}
                onChange={v => updateIntegration(integration.id, { certainty: v as CertaintyLevel })}
              />
            </div>

            <OptionalNotesField
              id={`int-notes-${integration.id}`}
              value={integration.notes}
              onChange={notes => updateIntegration(integration.id, { notes })}
              placeholder="e.g. sandbox only, syncs orders nightly, requires VPN to reach API…"
            />
          </div>
        ))}
      </div>

      {integrations.length === 0 && (
        <div className="text-center py-6 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-sm text-gray-400">No integrations added.</p>
          <p className="text-xs text-gray-400 mt-1">Skip if the site has no third-party integrations.</p>
        </div>
      )}

      <button
        type="button"
        onClick={addIntegration}
        className="flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
        </svg>
        Add integration
      </button>

    </div>
  )
}
