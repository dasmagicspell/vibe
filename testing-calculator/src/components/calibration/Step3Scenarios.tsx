import { useState } from 'react'
import type { CalibrationEntry, TimeEstimate } from '@/types'
import { TestType, ComplexityLevel, ALWAYS_ACTIVE_TEST_TYPES, CONDITIONAL_TEST_TYPES, TEST_TYPE_DESCRIPTIONS, COMPLEXITY_DEFINITIONS } from '@/types'
import { findBaseRateEntry, upsertBaseRateEntry } from '@/utils/modelHelpers'
import { TimeEstimateInput } from '@/components/shared/TimeEstimateInput'
import { Tooltip } from '@/components/shared/Tooltip'
import { StepNav } from './StepWizard'

interface Step3Props {
  entries: CalibrationEntry[]
  onChange: (entries: CalibrationEntry[]) => void
  onBack: () => void
  onNext: () => void
}

const COMPLEXITY_LEVELS = [ComplexityLevel.Low, ComplexityLevel.Medium, ComplexityLevel.High] as const

const COMPLEXITY_COLORS: Record<ComplexityLevel, string> = {
  [ComplexityLevel.Low]:    'text-green-700 bg-green-50',
  [ComplexityLevel.Medium]: 'text-yellow-700 bg-yellow-50',
  [ComplexityLevel.High]:   'text-red-700 bg-red-50',
}

/**
 * The calibration scenario matrix.
 *
 * Organised as an accordion — one section per test type. Each section shows a
 * three-row grid (Low / Medium / High complexity) with min/expected/max hour
 * inputs pre-populated from DEFAULT_SCENARIO_ESTIMATES.
 *
 * The engineer reviews and adjusts. Entries are base rates (no pageCategory),
 * which the calculation engine uses as the fallback for any page category.
 */
export function Step3Scenarios({ entries, onChange, onBack, onNext }: Step3Props) {
  const [openSections, setOpenSections] = useState<Set<TestType>>(
    // Open the first always-active type by default
    new Set([ALWAYS_ACTIVE_TEST_TYPES[0]])
  )
  const [notes, setNotes] = useState<Record<string, string>>({})

  function toggleSection(testType: TestType) {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(testType)) next.delete(testType)
      else next.add(testType)
      return next
    })
  }

  function handleEstimateChange(
    testType: TestType,
    complexity: ComplexityLevel,
    estimate: TimeEstimate,
  ) {
    onChange(upsertBaseRateEntry(entries, testType, complexity, estimate, notes[testType]))
  }

  function handleNoteChange(testType: TestType, note: string) {
    setNotes(prev => ({ ...prev, [testType]: note }))
    // Update notes on all entries for this test type
    const updated = entries.map(e =>
      e.testType === testType && e.pageCategory === undefined
        ? { ...e, notes: note }
        : e
    )
    onChange(updated)
  }

  function getEstimate(testType: TestType, complexity: ComplexityLevel): TimeEstimate {
    const entry = findBaseRateEntry(entries, testType, complexity)
    return entry?.baseEstimate ?? { minHours: 0, expectedHours: 0, maxHours: 0 }
  }

  function isCalibrated(testType: TestType): boolean {
    return COMPLEXITY_LEVELS.some(c => {
      const e = findBaseRateEntry(entries, testType, c)
      return e && e.baseEstimate.expectedHours > 0
    })
  }

  const calibratedCount = [...ALWAYS_ACTIVE_TEST_TYPES, ...CONDITIONAL_TEST_TYPES]
    .filter(isCalibrated).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Calibration scenarios</h2>
        <p className="mt-1 text-sm text-gray-500">
          For each test type, enter how long it takes to test a page at Low, Medium, and High
          complexity at your standard level of rigour. Values are pre-filled with typical
          starting points — adjust them to match your experience.
        </p>
        <p className="mt-2 text-xs text-gray-400">
          {calibratedCount} of {ALWAYS_ACTIVE_TEST_TYPES.length + CONDITIONAL_TEST_TYPES.length} test
          types calibrated
        </p>
      </div>

      {/* Column headers */}
      <div className="hidden sm:grid grid-cols-[1fr_auto] gap-4 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">
        <span>Test type</span>
        <span className="pr-1">Min / Expected / Max</span>
      </div>

      {/* Always-active types */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
          Standard test types — always included
        </p>
        {ALWAYS_ACTIVE_TEST_TYPES.map(testType => (
          <ScenarioAccordion
            key={testType}
            testType={testType}
            isOpen={openSections.has(testType)}
            isCalibrated={isCalibrated(testType)}
            onToggle={() => toggleSection(testType)}
            getEstimate={getEstimate}
            onEstimateChange={handleEstimateChange}
            noteValue={notes[testType] ?? ''}
            onNoteChange={note => handleNoteChange(testType, note)}
          />
        ))}
      </div>

      {/* Conditional types */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
          Conditional test types — activate based on project intake
        </p>
        {CONDITIONAL_TEST_TYPES.map(testType => (
          <ScenarioAccordion
            key={testType}
            testType={testType}
            isOpen={openSections.has(testType)}
            isCalibrated={isCalibrated(testType)}
            onToggle={() => toggleSection(testType)}
            getEstimate={getEstimate}
            onEstimateChange={handleEstimateChange}
            noteValue={notes[testType] ?? ''}
            onNoteChange={note => handleNoteChange(testType, note)}
            isConditional
          />
        ))}
      </div>

      <StepNav onBack={onBack} onNext={onNext} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// ScenarioAccordion — one test type
// ---------------------------------------------------------------------------

interface AccordionProps {
  testType: TestType
  isOpen: boolean
  isCalibrated: boolean
  isConditional?: boolean
  onToggle: () => void
  getEstimate: (t: TestType, c: ComplexityLevel) => TimeEstimate
  onEstimateChange: (t: TestType, c: ComplexityLevel, e: TimeEstimate) => void
  noteValue: string
  onNoteChange: (note: string) => void
}

function ScenarioAccordion({
  testType,
  isOpen,
  isCalibrated,
  isConditional = false,
  onToggle,
  getEstimate,
  onEstimateChange,
  noteValue,
  onNoteChange,
}: AccordionProps) {
  return (
    <div className={`rounded-lg border transition-colors ${isOpen ? 'border-brand-200 bg-brand-50/30' : 'border-gray-200 bg-white'}`}>
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        aria-expanded={isOpen}
      >
        {/* Status dot */}
        <span
          className={`flex-none w-2 h-2 rounded-full ${isCalibrated ? 'bg-green-400' : 'bg-gray-300'}`}
          aria-label={isCalibrated ? 'Calibrated' : 'Not yet calibrated'}
        />

        {/* Label + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{testType}</span>
            {isConditional && (
              <span className="text-xs text-gray-400 font-normal bg-gray-100 px-1.5 py-0.5 rounded">
                conditional
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 truncate">{TEST_TYPE_DESCRIPTIONS[testType]}</p>
        </div>

        {/* Chevron */}
        <svg
          className={`flex-none w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          {/* Column headers (mobile visible) */}
          <div className="flex items-center gap-2 pt-3">
            <span className="w-24 text-xs text-gray-400 font-medium">Complexity</span>
            <div className="flex gap-2 text-xs text-gray-400 font-medium">
              <span className="w-20 text-center">Min hrs</span>
              <span className="w-20 text-center">Expected</span>
              <span className="w-20 text-center">Max hrs</span>
            </div>
          </div>

          {/* One row per complexity level */}
          {COMPLEXITY_LEVELS.map(complexity => (
            <div key={complexity} className="flex items-center gap-3">
              {/* Complexity badge */}
              <div className="flex items-center gap-1 w-24 flex-none">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${COMPLEXITY_COLORS[complexity]}`}
                >
                  {complexity}
                </span>
                <Tooltip content={COMPLEXITY_DEFINITIONS[complexity]} />
              </div>

              {/* Time estimate inputs */}
              <TimeEstimateInput
                id={`${testType}-${complexity}`}
                value={getEstimate(testType, complexity)}
                onChange={estimate => onEstimateChange(testType, complexity, estimate)}
              />
            </div>
          ))}

          {/* Notes */}
          <div className="pt-2">
            <label
              htmlFor={`notes-${testType}`}
              className="text-xs text-gray-500 font-medium"
            >
              Notes (optional)
            </label>
            <input
              id={`notes-${testType}`}
              type="text"
              value={noteValue}
              onChange={e => onNoteChange(e.target.value)}
              placeholder="Any assumptions or caveats for this test type…"
              className="mt-1 w-full px-3 py-1.5 text-xs rounded border border-gray-200
                         focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}
