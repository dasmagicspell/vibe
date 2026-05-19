import type { CalibrationEntry, TestingModel } from '@/types'
import { ComplexityLevel, TestType, ALWAYS_ACTIVE_TEST_TYPES, CONDITIONAL_TEST_TYPES } from '@/types'
import { validateModel, findBaseRateEntry, formatRange } from '@/utils/modelHelpers'
import { CertaintyBadge } from '@/components/shared/CertaintyBadge'
import { CalibrationAttentionSummary } from '@/components/calibration/CalibrationAttentionSummary'
import { StepNav } from './StepWizard'

interface Step7Props {
  model: TestingModel
  onBack?: () => void
  onExport: (model: TestingModel) => void   // save + export
  onSaveOnly: (model: TestingModel) => void // save to session without exporting
}

const COMPLEXITY_LEVELS = [ComplexityLevel.Low, ComplexityLevel.Medium, ComplexityLevel.High]

const ALL_CALIBRATION_TEST_TYPES = [
  ...ALWAYS_ACTIVE_TEST_TYPES,
  ...CONDITIONAL_TEST_TYPES,
] as const

function isTypeCalibrated(entries: CalibrationEntry[], testType: TestType): boolean {
  return COMPLEXITY_LEVELS.some(c => {
    const e = findBaseRateEntry(entries, testType, c)
    return e && e.baseEstimate.expectedHours > 0
  })
}

interface ScenarioGroupRowsProps {
  label: string
  testTypes: readonly TestType[]
  entries: CalibrationEntry[]
  isConditional?: boolean
}

function ScenarioGroupRows({ label, testTypes, entries, isConditional = false }: ScenarioGroupRowsProps) {
  return (
    <>
      <tr className="bg-gray-50/80">
        <td
          colSpan={COMPLEXITY_LEVELS.length + 2}
          className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500"
        >
          {label}
        </td>
      </tr>
      {testTypes.map(testType => (
        <tr key={testType} className="hover:bg-gray-50">
          <td className="px-4 py-2 text-gray-900 font-medium">
            <span>{testType}</span>
            {isConditional && (
              <span className="ml-1.5 text-[10px] font-normal text-gray-400">conditional</span>
            )}
          </td>
          {COMPLEXITY_LEVELS.map(c => {
            const entry = findBaseRateEntry(entries, testType, c)
            return (
              <td key={c} className="px-3 py-2 text-center text-gray-600 font-mono">
                {entry && entry.baseEstimate.expectedHours > 0
                  ? formatRange(entry.baseEstimate)
                  : <span className="text-gray-300">—</span>}
              </td>
            )
          })}
          <td className="px-3 py-2">
            <div className="flex justify-center gap-1">
              {COMPLEXITY_LEVELS.map(c => {
                const entry = findBaseRateEntry(entries, testType, c)
                const level = entry?.certainty ?? 'Low'
                return (
                  <span key={c} title={`${c}: ${level}`}>
                    <CertaintyBadge level={level} compact />
                  </span>
                )
              })}
            </div>
          </td>
        </tr>
      ))}
    </>
  )
}

export function Step7Review({ model, onBack, onExport, onSaveOnly }: Step7Props) {
  const validation = validateModel(model)

  const modelToExport: TestingModel = {
    ...model,
    calibratedAt: new Date().toISOString(),
  }

  const totalEntries = model.entries.length
  const calibratedCount = ALL_CALIBRATION_TEST_TYPES.filter(tt =>
    isTypeCalibrated(model.entries, tt),
  ).length
  const testCaseTypeCount = Object.values(model.representativeTestCases).filter(
    cases => cases.length > 0,
  ).length

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
            <p>{calibratedCount} of {ALL_CALIBRATION_TEST_TYPES.length} test types calibrated</p>
            <p>{testCaseTypeCount} of {ALL_CALIBRATION_TEST_TYPES.length} with representative cases</p>
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
                <th className="text-center px-3 py-2 text-gray-500 font-medium">Certainty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <ScenarioGroupRows
                label="Standard test types"
                testTypes={ALWAYS_ACTIVE_TEST_TYPES}
                entries={model.entries}
              />
              <ScenarioGroupRows
                label="Conditional test types"
                testTypes={CONDITIONAL_TEST_TYPES}
                entries={model.entries}
                isConditional
              />
            </tbody>
          </table>
        </div>

        <div className="px-4 py-4 border-t border-gray-200">
          <CalibrationAttentionSummary entries={model.entries} />
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
          <li>
            When updating a loaded model, the version auto-increments on your first calibration
            change unless you edit the version field yourself.
          </li>
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

      {onBack && <StepNav onBack={onBack} />}
    </div>
  )
}
