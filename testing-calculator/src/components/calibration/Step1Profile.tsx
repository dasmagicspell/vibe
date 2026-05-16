import { StepNav } from './StepWizard'

interface ProfileData {
  engineerName: string
  version: string
  notes: string
}

interface Step1Props {
  data: ProfileData
  onChange: (data: ProfileData) => void
  onNext?: () => void
}

export function Step1Profile({ data, onChange, onNext }: Step1Props) {
  const isValid = data.engineerName.trim().length > 0 && data.version.trim().length > 0

  function set(field: keyof ProfileData, value: string) {
    onChange({ ...data, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Engineer profile</h2>
        <p className="mt-1 text-sm text-gray-500">
          Identify this model. The name and version appear in every schedule generated from it.
        </p>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="engineer-name" className="block text-sm font-medium text-gray-700 mb-1">
            Engineer name <span className="text-red-500">*</span>
          </label>
          <input
            id="engineer-name"
            type="text"
            value={data.engineerName}
            onChange={e => set('engineerName', e.target.value)}
            placeholder="Your full name"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        {/* Version */}
        <div>
          <label htmlFor="model-version" className="block text-sm font-medium text-gray-700 mb-1">
            Model version <span className="text-red-500">*</span>
          </label>
          <input
            id="model-version"
            type="text"
            value={data.version}
            onChange={e => set('version', e.target.value)}
            placeholder="e.g. 1.0.0"
            className="w-full max-w-xs px-3 py-2 rounded-lg border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            Use semantic versioning. When updating a loaded model, this auto-increments on your
            first calibration change unless you edit it here.
          </p>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="model-notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="model-notes"
            value={data.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="e.g. Calibrated for WordPress and Shopify projects; standard team tooling"
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
                       resize-none"
          />
        </div>
      </div>

      {onNext && (
        <StepNav
          onNext={onNext}
          nextDisabled={!isValid}
        />
      )}
    </div>
  )
}
