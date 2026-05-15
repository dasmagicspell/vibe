import type { TestingModel } from '@/types'
import { ComplexityLevel, ALWAYS_ACTIVE_TEST_TYPES } from '@/types'
import { validateModel, findBaseRateEntry, formatRange, bumpModelVersion } from '@/utils/modelHelpers'
import { StepNav } from './StepWizard'

interface Step7Props {
  model: TestingModel
  isExistingModel: boolean   // true if we're updating an existing model
  onBack: () => void
  onExport: (model: TestingModel) => void   // save + export
  onSaveOnly: (model: TestingModel) => void // save to session without exporting
}

const COMPLEXITY_LEVELS = [ComplexityLevel.Low, ComplexityLevel.Medium, ComplexityLevel.High]

export function Step7Review({ model, isExistingModel, onBack, onExport, onSaveOnly }: Step7Props) {
  const validation = validateModel(model)

  // Prepare the export — bump version if updating
  const modelToExport: TestingModel = isExistingModel
    ? { ...model, version: bumpModelVersion(model.version), calibratedAt: new Date().toISOString() }
    : { ...model, calibratedAt: new Date().toISOString() }

  const totalEntries   = model.entries.length
  const calibratedTypes = ALWAYS_ACTIVE_TEST_TYPES.filter(tt =>
    COMPLEXITY_LEVELS.some(c => {
      const e = findBaseRateEntry(model.entries, tt, c)
      return e && e.baseEstimate.expectedHours > 0
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Review and export</h2>
        <p className="mt-1 text-sm text-gray-500">
          Review the model summary below. When you're ready, export the model as a JSON
          file and place it in the team's shared folder on Teams.
        </p>
      </div>

      {/* Validation messages */}
      {!validation.isValid && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 space-y-1">
          <p className="text-sm font-semibold text-red-800">Please fix these issues before exporting:</p>
          {validation.errors.map(err => (
            <p key={err} className="text-sm text-red-700">• {err}</p>
          ))}
        </div>
      )}
      {validation.warnings.length > 0 && (
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-1">
          <p className="text-sm font-semibold text-amber-800">Warnings (non-blocking):</p>
          {validation.warnings.map(w => (
            <p key={w} className="text-sm text-amber-700">• {w}</p>
          ))}
        </div>
      )}

      {/* Model summary */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">
              {model.engineerName || '(unnamed)'} — v{modelToExport.version}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(modelToExport.calibratedAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>{totalEntries} calibration entries</p>
            <p>{calibratedTypes.length} of {ALWAYS_ACTIVE_TEST_TYPES.length} standard types calibrated</p>
          </div>
        </div>

        {/* Scenario summary table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-2 text-gray-500 font-medium">Test type</th>
                {COMPLEXITY_LEVELS.map(c => (
                  <th key={c} className="text-center px-3 py-2 text-gray-500 font-medium">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ALWAYS_ACTIVE_TEST_TYPES.map(testType => (
                <tr key={testType} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-900 font-medium">{testType}</td>
                  {COMPLEXITY_LEVELS.map(c => {
                    const entry = findBaseRateEntry(model.entries, testType, c)
                    return (
                      <td key={c} className="px-3 py-2 text-center text-gray-600 font-mono">
                        {entry && entry.baseEstimate.expectedHours > 0
                          ? formatRange(entry.baseEstimate)
                          : <span className="text-gray-300">—</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Overhead summary */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 space-y-1">
          <p>
            <strong>Coordination overhead:</strong>{' '}
            {(model.overheadFactors.coordinationFraction * 100).toFixed(0)}%
          </p>
          <p>
            <strong>Reporting overhead:</strong>{' '}
            {(model.overheadFactors.reportingFraction * 100).toFixed(0)}%
          </p>
          <p>
            <strong>Default defect density:</strong>{' '}
            {model.overheadFactors.defaultDefectDensity}
          </p>
          <p>
            <strong>Exploratory blocks defined:</strong>{' '}
            {model.exploratoryBlocks.map(b => b.label).join(', ')}
          </p>
        </div>
      </div>

      {/* Export instructions */}
      <div className="p-4 rounded-xl bg-brand-50 border border-brand-200 text-sm text-brand-800 leading-relaxed">
        <p className="font-semibold mb-1">After exporting:</p>
        <ol className="list-decimal list-inside space-y-1 text-brand-700">
          <li>Place the exported <code className="font-mono text-xs bg-brand-100 px-1 rounded">testing-model.json</code> in the shared Teams folder.</li>
          <li>Account managers import the file using the "Import model" button on the home screen.</li>
          <li>When you recalibrate in the future, the version number will auto-increment.</li>
        </ol>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={() => onExport(modelToExport)}
          disabled={!validation.isValid}
          className={`
            flex-1 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors
            ${validation.isValid
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
          `}
        >
          ↓ Export model JSON
        </button>
        <button
          type="button"
          onClick={() => onSaveOnly(modelToExport)}
          disabled={!validation.isValid}
          className={`
            flex-1 px-5 py-2.5 rounded-lg text-sm font-medium border transition-colors
            ${validation.isValid
              ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
              : 'border-gray-200 text-gray-400 cursor-not-allowed'}
          `}
        >
          Save to session only
        </button>
      </div>

      <StepNav onBack={onBack} />
    </div>
  )
}
