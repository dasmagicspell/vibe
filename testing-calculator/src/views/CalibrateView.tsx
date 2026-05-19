import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TestingModel } from '@/types'
import { useApp, useModel } from '@/context/AppContext'
import { StorageService } from '@/services/StorageService'
import {
  bumpModelVersion,
  createDefaultModel,
  getCalibrationStepErrors,
  normalizeTestingModel,
  shouldAutoBumpModelVersion,
} from '@/utils/modelHelpers'
import { getActiveSectionIndex } from '@/utils/scrollSpy'
import { StepWizard } from '@/components/calibration/StepWizard'
import { Step1Profile }      from '@/components/calibration/Step1Profile'
import { Step2Overhead }     from '@/components/calibration/Step2Overhead'
import { Step3Scenarios }    from '@/components/calibration/Step3Scenarios'
import { Step4Browser }      from '@/components/calibration/Step4Browser'
import { Step5Deliverables } from '@/components/calibration/Step5Deliverables'
import { Step6Exploratory }  from '@/components/calibration/Step6Exploratory'
import { Step7Review }       from '@/components/calibration/Step7Review'

const STEP_LABELS = [
  'Profile', 'Overhead', 'Scenarios', 'Browser', 'Deliverables', 'Exploratory', 'Review',
]

export const CALIBRATE_STEP_ID = (index: number) => `calibrate-step-${index}`

/** Sticky nav bar (h-14) + step wizard — used for scroll offset and intersection root margin */
const SCROLL_OFFSET_PX = 176

/** Step bubbles stay gray until the user dwells on that section for this long. */
const STEP_VIEW_DWELL_MS = 1000

function StepSeparator() {
  return (
    <>
      <div className="my-10" aria-hidden="true" />
      <hr className="border-gray-200" />
      <div className="my-10" aria-hidden="true" />
    </>
  )
}

export function CalibrateView() {
  const { dispatch } = useApp()
  const existingModel = useModel()
  const navigate = useNavigate()

  const [draft, setDraft] = useState<TestingModel>(() =>
    existingModel ? normalizeTestingModel(existingModel) : createDefaultModel()
  )
  const loadedVersionRef = useRef(
    existingModel ? existingModel.version : createDefaultModel().version
  )
  const versionManuallyEditedRef = useRef(false)
  const versionAutoBumpedRef = useRef(false)
  const [activeStep, setActiveStep] = useState(0)
  const [viewedSteps, setViewedSteps] = useState<Set<number>>(new Set())
  /** Target step while smooth-scrolling from a bubble click; suppresses scroll-spy until scroll ends. */
  const navLockRef = useRef<number | null>(null)
  const navLockReleaseTimerRef = useRef<number | undefined>(undefined)
  const scheduleNavLockReleaseRef = useRef<() => void>(() => {})
  const activeStepRef = useRef(0)

  const isExistingModel = existingModel !== null

  const updateDraft = useCallback((updates: Partial<TestingModel>) => {
    setDraft(prev => {
      if ('version' in updates && updates.version !== prev.version) {
        versionManuallyEditedRef.current = true
      }

      const hasNonVersionFieldChange = Object.keys(updates).some(k => k !== 'version')
      let next: TestingModel = { ...prev, ...updates }

      if (
        shouldAutoBumpModelVersion({
          hadLoadedModel: isExistingModel,
          versionManuallyEdited: versionManuallyEditedRef.current,
          versionAutoBumped: versionAutoBumpedRef.current,
          hasNonVersionFieldChange,
          currentVersion: next.version,
          loadedVersion: loadedVersionRef.current,
        })
      ) {
        versionAutoBumpedRef.current = true
        next = { ...next, version: bumpModelVersion(loadedVersionRef.current) }
      }

      return next
    })
  }, [isExistingModel])

  function scrollToStep(step: number) {
    const el = document.getElementById(CALIBRATE_STEP_ID(step))
    if (!el) return
    navLockRef.current = step
    activeStepRef.current = step
    setActiveStep(step)
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET_PX
    window.scrollTo({ top, behavior: 'smooth' })
    scheduleNavLockReleaseRef.current()
  }

  function handleExport(modelToExport: TestingModel) {
    dispatch({ type: 'SET_MODEL', model: modelToExport })
    dispatch({ type: 'MARK_MODEL_CLEAN' })
    StorageService.exportModelToFile(modelToExport)
  }

  function handleSaveOnly(modelToSave: TestingModel) {
    dispatch({ type: 'SET_MODEL', model: modelToSave })
    dispatch({ type: 'MARK_MODEL_CLEAN' })
    navigate('/')
  }

  // Track which section is in view for the sticky step indicator
  useEffect(() => {
    const sections = STEP_LABELS.map((_, i) =>
      document.getElementById(CALIBRATE_STEP_ID(i))
    ).filter((el): el is HTMLElement => el !== null)

    if (sections.length === 0) return

    let rafId = 0

    function releaseNavLock() {
      if (navLockRef.current === null) return
      navLockRef.current = null
      syncActiveStepFromScroll()
    }

    function scheduleNavLockRelease() {
      if (navLockRef.current === null) return
      window.clearTimeout(navLockReleaseTimerRef.current)
      navLockReleaseTimerRef.current = window.setTimeout(releaseNavLock, 150)
    }
    scheduleNavLockReleaseRef.current = scheduleNavLockRelease

    function syncActiveStepFromScroll() {
      if (navLockRef.current !== null) return

      const tops = sections.map(s => s.getBoundingClientRect().top)
      const index = getActiveSectionIndex(tops, SCROLL_OFFSET_PX)
      if (activeStepRef.current === index) return

      activeStepRef.current = index
      setActiveStep(index)
    }

    function scheduleSync() {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(syncActiveStepFromScroll)
      scheduleNavLockRelease()
    }

    scheduleSync()
    window.addEventListener('scroll', scheduleSync, { passive: true })
    window.addEventListener('resize', scheduleSync, { passive: true })
    window.addEventListener('scrollend', releaseNavLock)
    return () => {
      cancelAnimationFrame(rafId)
      window.clearTimeout(navLockReleaseTimerRef.current)
      window.removeEventListener('scroll', scheduleSync)
      window.removeEventListener('resize', scheduleSync)
      window.removeEventListener('scrollend', releaseNavLock)
    }
  }, [])

  // Mark a step as viewed only after the user dwells on it (scroll or click).
  useEffect(() => {
    const step = activeStep
    const timer = window.setTimeout(() => {
      if (activeStepRef.current !== step) return
      setViewedSteps(prev => {
        if (prev.has(step)) return prev
        const next = new Set(prev)
        next.add(step)
        return next
      })
    }, STEP_VIEW_DWELL_MS)

    return () => clearTimeout(timer)
  }, [activeStep])

  const stepErrors = getCalibrationStepErrors(draft)

  const steps = STEP_LABELS.map((label, i) => ({
    label,
    isComplete: viewedSteps.has(i),
    hasError: stepErrors[i],
  }))

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-2xl" aria-hidden="true">🔧</span>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Model calibration</h1>
          <p className="text-sm text-gray-500">
            {isExistingModel
              ? `Updating model: ${existingModel.engineerName} v${existingModel.version}`
              : 'Create a new calibration model'}
          </p>
        </div>
      </div>

      <div
        className="
          sticky top-14 z-30 -mx-4 px-4 py-4 mb-2
          bg-gray-50/95 backdrop-blur-sm border-b border-gray-200
        "
      >
        <StepWizard
          steps={steps}
          currentStep={activeStep}
          onNavigate={scrollToStep}
          ariaLabel="Calibration progress"
        />
      </div>

      <div>
        <section
          id={CALIBRATE_STEP_ID(0)}
          className="scroll-mt-44 bg-white rounded-xl border border-gray-200 p-6"
        >
          <Step1Profile
            data={{ engineerName: draft.engineerName, version: draft.version, notes: draft.notes ?? '' }}
            onChange={({ engineerName, version, notes }) => updateDraft({ engineerName, version, notes })}
          />
        </section>

        <StepSeparator />

        <section
          id={CALIBRATE_STEP_ID(1)}
          className="scroll-mt-44 bg-white rounded-xl border border-gray-200 p-6"
        >
          <Step2Overhead
            data={draft.overheadFactors}
            onChange={overheadFactors => updateDraft({ overheadFactors })}
          />
        </section>

        <StepSeparator />

        <section
          id={CALIBRATE_STEP_ID(2)}
          className="scroll-mt-44 bg-white rounded-xl border border-gray-200 p-6"
        >
          <Step3Scenarios
            entries={draft.entries}
            onChange={entries => updateDraft({ entries })}
            representativeTestCases={draft.representativeTestCases}
            onTestCasesChange={(testType, cases) =>
              updateDraft({
                representativeTestCases: {
                  ...draft.representativeTestCases,
                  [testType]: cases,
                },
              })
            }
          />
        </section>

        <StepSeparator />

        <section
          id={CALIBRATE_STEP_ID(3)}
          className="scroll-mt-44 bg-white rounded-xl border border-gray-200 p-6"
        >
          <Step4Browser
            data={draft.browserCalibration}
            onChange={browserCalibration => updateDraft({ browserCalibration })}
          />
        </section>

        <StepSeparator />

        <section
          id={CALIBRATE_STEP_ID(4)}
          className="scroll-mt-44 bg-white rounded-xl border border-gray-200 p-6"
        >
          <Step5Deliverables
            data={draft.deliverableEstimates}
            onChange={deliverableEstimates => updateDraft({ deliverableEstimates })}
          />
        </section>

        <StepSeparator />

        <section
          id={CALIBRATE_STEP_ID(5)}
          className="scroll-mt-44 bg-white rounded-xl border border-gray-200 p-6"
        >
          <Step6Exploratory
            data={draft.exploratoryBlocks}
            onChange={exploratoryBlocks => updateDraft({ exploratoryBlocks })}
          />
        </section>

        <StepSeparator />

        <section
          id={CALIBRATE_STEP_ID(6)}
          className="scroll-mt-44 bg-white rounded-xl border border-gray-200 p-6"
        >
          <Step7Review
            model={draft}
            onExport={handleExport}
            onSaveOnly={handleSaveOnly}
          />
        </section>
      </div>
    </main>
  )
}
