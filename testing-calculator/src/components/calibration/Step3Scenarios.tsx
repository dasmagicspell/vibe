import { useState } from 'react'
import type { CalibrationEntry, CertaintyLevel, TimeEstimate } from '@/types'
import { TestType, ComplexityLevel, ALWAYS_ACTIVE_TEST_TYPES, CONDITIONAL_TEST_TYPES, TEST_TYPE_DESCRIPTIONS, COMPLEXITY_DEFINITIONS } from '@/types'
import { findBaseRateEntry, upsertBaseRateEntry } from '@/utils/modelHelpers'
import { isEstimateEmpty } from '@/utils/certaintyHelpers'
import { TimeEstimateInput } from '@/components/shared/TimeEstimateInput'
import { CertaintySelector } from '@/components/shared/CertaintySelector'
import { Tooltip } from '@/components/shared/Tooltip'
import { StepNav } from './StepWizard'

interface Step3Props {
  entries: CalibrationEntry[]
  onChange: (entries: CalibrationEntry[]) => void
  onBack?: () => void
  onNext?: () => void
}

const COMPLEXITY_LEVELS = [ComplexityLevel.Low, ComplexityLevel.Medium, ComplexityLevel.High] as const

const COMPLEXITY_COLORS: Record<ComplexityLevel, string> = {
  [ComplexityLevel.Low]:    'text-green-700 bg-green-50',
  [ComplexityLevel.Medium]: 'text-yellow-700 bg-yellow-50',
  [ComplexityLevel.High]:   'text-red-700 bg-red-50',
}

const CERTAINTY_DOT: Record<CertaintyLevel, string> = {
  High:   'bg-green-500',
  Medium: 'bg-yellow-500',
  Low:    'bg-red-500',
}

export function Step3Scenarios({ entries, onChange, onBack, onNext }: Step3Props) {
  const [openSections, setOpenSections] = useState<Set<TestType>>(
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

  function getEstimate(testType: TestType, complexity: ComplexityLevel): TimeEstimate {
    const entry = findBaseRateEntry(entries, testType, complexity)
    return entry?.baseEstimate ?? { minHours: 0, expectedHours: 0, maxHours: 0 }
  }

  function getCertainty(testType: TestType, complexity: ComplexityLevel): CertaintyLevel {
    const entry = findBaseRateEntry(entries, testType, complexity)
    if (!entry || isEstimateEmpty(entry.baseEstimate)) return 'Low'
    return entry.certainty
  }

  function handleEstimateChange(
    testType: TestType,
    complexity: ComplexityLevel,
    estimate: TimeEstimate,
  ) {
    const existing = findBaseRateEntry(entries, testType, complexity)
    const wasEmpty = !existing || isEstimateEmpty(existing.baseEstimate)
    const nowEmpty = isEstimateEmpty(estimate)

    let certainty: CertaintyLevel
    if (nowEmpty) {
      certainty = 'Low'
    } else if (wasEmpty) {
      certainty = 'High'
    } else {
      certainty = existing?.certainty ?? 'High'
    }

    onChange(upsertBaseRateEntry(entries, testType, complexity, estimate, notes[testType], certainty))
  }

  function handleCertaintyChange(
    testType: TestType,
    complexity: ComplexityLevel,
    certainty: CertaintyLevel,
  ) {
    const estimate = getEstimate(testType, complexity)
    onChange(upsertBaseRateEntry(entries, testType, complexity, estimate, notes[testType], certainty))
  }

  function handleNoteChange(testType: TestType, note: string) {
    setNotes(prev => ({ ...prev, [testType]: note }))
    const updated = entries.map(e =>
      e.testType === testType && e.pageCategory === undefined
        ? { ...e, notes: note }
        : e
    )
    onChange(updated)
  }

  function isCalibrated(testType: TestType): boolean {
    return COMPLEXITY_LEVELS.some(c => {
      const e = findBaseRateEntry(entries, testType, c)
      return e && e.baseEstimate.expectedHours > 0
    })
  }

  const calibratedCount = [...ALWAYS_ACTIVE_TEST_TYPES, ...CONDITIONAL_TEST_TYPES]
    .filter(isCalibrated).length

  const accordionProps = {
    getEstimate,
    getCertainty,
    onEstimateChange: handleEstimateChange,
    onCertaintyChange: handleCertaintyChange,
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Calibration scenarios</h2>
        <p className="mt-1 text-sm text-gray-500">
          For each test type, enter how long it takes to test a page at Low, Medium, and High
          complexity at your standard level of rigor. Set certainty (green / yellow / red) to
          reflect how confident you are in each estimate.
        </p>
        <p className="mt-2 text-xs text-gray-400">
          {calibratedCount} of {ALWAYS_ACTIVE_TEST_TYPES.length + CONDITIONAL_TEST_TYPES.length} test
          types with estimates
        </p>
      </div>

      <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-4 px-4 text-xs font-medium text-gray-400 uppercase tracking-wide">
        <span>Test type</span>
        <span>Min / Expected / Max</span>
        <span className="w-20 text-center">Certainty</span>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
          Standard test types — always included
        </p>
        {ALWAYS_ACTIVE_TEST_TYPES.map(testType => (
          <ScenarioAccordion
            key={testType}
            testType={testType}
            isOpen={openSections.has(testType)}
            onToggle={() => toggleSection(testType)}
            noteValue={notes[testType] ?? ''}
            onNoteChange={note => handleNoteChange(testType, note)}
            {...accordionProps}
          />
        ))}
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
          Conditional test types — activate based on project intake
        </p>
        {CONDITIONAL_TEST_TYPES.map(testType => (
          <ScenarioAccordion
            key={testType}
            testType={testType}
            isOpen={openSections.has(testType)}
            onToggle={() => toggleSection(testType)}
            noteValue={notes[testType] ?? ''}
            onNoteChange={note => handleNoteChange(testType, note)}
            isConditional
            {...accordionProps}
          />
        ))}
      </div>

      {(onBack || onNext) && <StepNav onBack={onBack} onNext={onNext} />}
    </div>
  )
}

interface AccordionProps {
  testType: TestType
  isOpen: boolean
  isConditional?: boolean
  onToggle: () => void
  getEstimate: (t: TestType, c: ComplexityLevel) => TimeEstimate
  getCertainty: (t: TestType, c: ComplexityLevel) => CertaintyLevel
  onEstimateChange: (t: TestType, c: ComplexityLevel, e: TimeEstimate) => void
  onCertaintyChange: (t: TestType, c: ComplexityLevel, level: CertaintyLevel) => void
  noteValue: string
  onNoteChange: (note: string) => void
}

function ScenarioAccordion({
  testType,
  isOpen,
  isConditional = false,
  onToggle,
  getEstimate,
  getCertainty,
  onEstimateChange,
  onCertaintyChange,
  noteValue,
  onNoteChange,
}: AccordionProps) {
  return (
    <div className={`rounded-lg border transition-colors ${isOpen ? 'border-brand-200 bg-brand-50/30' : 'border-gray-200 bg-white'}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        aria-expanded={isOpen}
      >
        <div className="flex gap-1 flex-none" aria-label="Certainty by complexity">
          {COMPLEXITY_LEVELS.map(c => (
            <span
              key={c}
              className={`w-2 h-2 rounded-full ${CERTAINTY_DOT[getCertainty(testType, c)]}`}
              title={`${c}: ${getCertainty(testType, c)} certainty`}
            />
          ))}
        </div>

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

        <svg
          className={`flex-none w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          <div className="flex items-center gap-2 pt-3 text-xs text-gray-400 font-medium">
            <span className="w-24">Complexity</span>
            <span className="flex-1">Hours</span>
            <span className="w-24 text-center">Certainty</span>
          </div>

          {COMPLEXITY_LEVELS.map(complexity => {
            const estimate = getEstimate(testType, complexity)
            const empty = isEstimateEmpty(estimate)
            return (
              <div key={complexity} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-24 flex-none">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${COMPLEXITY_COLORS[complexity]}`}
                  >
                    {complexity}
                  </span>
                  <Tooltip content={COMPLEXITY_DEFINITIONS[complexity]} />
                </div>

                <TimeEstimateInput
                  id={`${testType}-${complexity}`}
                  value={estimate}
                  onChange={e => onEstimateChange(testType, complexity, e)}
                />

                <div className="w-24 flex justify-center flex-none">
                  <CertaintySelector
                    id={`${testType}-${complexity}-certainty`}
                    compact
                    value={getCertainty(testType, complexity)}
                    onChange={level => onCertaintyChange(testType, complexity, level)}
                    disabled={empty}
                  />
                </div>
              </div>
            )
          })}

          <div className="pt-2">
            <label htmlFor={`notes-${testType}`} className="text-xs text-gray-500 font-medium">
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
