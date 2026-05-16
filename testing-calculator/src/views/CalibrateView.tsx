import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TestingModel } from '@/types'
import { useApp, useModel } from '@/context/AppContext'
import { StorageService } from '@/services/StorageService'
import { createDefaultModel } from '@/utils/modelHelpers'
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
    existingModel ? { ...existingModel } : createDefaultModel()
  )
  const [activeStep, setActiveStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const scrollingRef = useRef(false)

  const isExistingModel = existingModel !== null

  const updateDraft = useCallback((updates: Partial<TestingModel>) => {
    setDraft(prev => ({ ...prev, ...updates }))
  }, [])

  function markStepsCompleteThrough(step: number) {
    setCompletedSteps(prev => {
      const next = new Set(prev)
      for (let i = 0; i < step; i++) next.add(i)
      return next
    })
  }

  function scrollToStep(step: number) {
    const el = document.getElementById(CALIBRATE_STEP_ID(step))
    if (!el) return
    scrollingRef.current = true
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET_PX
    window.scrollTo({ top, behavior: 'smooth' })
    setActiveStep(step)
    markStepsCompleteThrough(step)
    window.setTimeout(() => { scrollingRef.current = false }, 600)
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

    const observer = new IntersectionObserver(
      entries => {
        if (scrollingRef.current) return
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible.length === 0) return
        const index = sections.indexOf(visible[0].target as HTMLElement)
        if (index >= 0) {
          setActiveStep(index)
          markStepsCompleteThrough(index)
        }
      },
      {
        rootMargin: `-${SCROLL_OFFSET_PX}px 0px -45% 0px`,
        threshold: [0, 0.1, 0.25, 0.5],
      },
    )

    sections.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const steps = STEP_LABELS.map((label, i) => ({
    label,
    isComplete: completedSteps.has(i),
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
            isExistingModel={isExistingModel}
            onExport={handleExport}
            onSaveOnly={handleSaveOnly}
          />
        </section>
      </div>
    </main>
  )
}
