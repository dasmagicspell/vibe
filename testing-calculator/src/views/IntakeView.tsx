import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ProjectSpec } from '@/types'
import { useApp, useModel, useProject } from '@/context/AppContext'
import {
  createDefaultProject,
  deriveActiveTestTypes,
  getIntakeStepErrors,
  validateProject,
} from '@/utils/projectHelpers'
import { normalizeProjectSpec } from '@/utils/certaintyHelpers'
import { runCalculationEngine } from '@/services/CalculationEngine'
import { getActiveSectionIndex } from '@/utils/scrollSpy'
import { StepWizard } from '@/components/calibration/StepWizard'
import { Section1Identity }    from '@/components/intake/Section1Identity'
import { Section2SiteProfile } from '@/components/intake/Section2SiteProfile'
import { Section3Pages }       from '@/components/intake/Section3Pages'
import { Section4Workflows }   from '@/components/intake/Section4Workflows'
import { Section5Integrations } from '@/components/intake/Section5Integrations'
import { Section6Ecommerce }   from '@/components/intake/Section6Ecommerce'
import { Section7RiskRigor }   from '@/components/intake/Section7RiskRigor'
import { Section8TestTypes }   from '@/components/intake/Section8TestTypes'
import { Section9Deliverables } from '@/components/intake/Section9Deliverables'
import { Section10Generate }   from '@/components/intake/Section10Generate'

const SECTION_LABELS = [
  'Identity',
  'Site profile',
  'Pages',
  'Workflows',
  'Integrations',
  'E-commerce',
  'Risk & rigour',
  'Test types',
  'Deliverables',
  'Generate',
]

export const INTAKE_STEP_ID = (index: number) => `intake-step-${index}`

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

export function IntakeView() {
  const { dispatch } = useApp()
  const model          = useModel()
  const existingProject = useProject()
  const navigate        = useNavigate()

  const [draft, setDraft] = useState<ProjectSpec>(() =>
    normalizeProjectSpec(existingProject ? { ...existingProject } : createDefaultProject())
  )
  const [activeStep, setActiveStep] = useState(0)
  const [viewedSteps, setViewedSteps] = useState<Set<number>>(new Set())
  const navLockRef = useRef<number | null>(null)
  const navLockReleaseTimerRef = useRef<number | undefined>(undefined)
  const scheduleNavLockReleaseRef = useRef<() => void>(() => {})
  const activeStepRef = useRef(0)

  const updateDraft = useCallback((updates: Partial<ProjectSpec>) => {
    setDraft(prev => {
      const next = { ...prev, ...updates }
      next.selectedTestTypes = deriveActiveTestTypes(next)
      dispatch({ type: 'SET_PROJECT', project: next })
      return next
    })
  }, [dispatch])

  function scrollToStep(step: number) {
    const el = document.getElementById(INTAKE_STEP_ID(step))
    if (!el) return
    navLockRef.current = step
    activeStepRef.current = step
    setActiveStep(step)
    const top = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET_PX
    window.scrollTo({ top, behavior: 'smooth' })
    scheduleNavLockReleaseRef.current()
  }

  function handleGenerate() {
    if (!model) return
    const validation = validateProject(draft)
    if (!validation.isValid) return
    const schedule = runCalculationEngine(model, draft)
    dispatch({ type: 'SET_PROJECT', project: draft })
    dispatch({ type: 'SET_SCHEDULE', schedule })
    navigate('/schedule')
  }

  // Track which section is in view for the sticky step indicator
  useEffect(() => {
    const sections = SECTION_LABELS.map((_, i) =>
      document.getElementById(INTAKE_STEP_ID(i))
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

  if (!model) {
    return (
      <main className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-semibold text-gray-900 mb-2">No testing model loaded</p>
        <p className="text-sm text-gray-500 mb-6">
          Import the shared <code className="font-mono bg-gray-100 px-1 rounded">testing-model.json</code>{' '}
          file before starting a project intake.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm hover:bg-brand-700 transition-colors"
        >
          Go to home screen
        </button>
      </main>
    )
  }

  const stepErrors = getIntakeStepErrors(draft)
  const steps = SECTION_LABELS.map((label, i) => ({
    label,
    isComplete: viewedSteps.has(i),
    hasError: stepErrors[i],
  }))
  const modelLabel = `${model.engineerName} v${model.version}`

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-2xl" aria-hidden="true">📋</span>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Project intake</h1>
          <p className="text-sm text-gray-500">
            Define the site using model <span className="font-medium text-gray-700">{modelLabel}</span>,
            then generate a data-driven estimation schedule.
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
          ariaLabel="Intake progress"
        />
      </div>

      <div>
        <section
          id={INTAKE_STEP_ID(0)}
          className="scroll-mt-44 bg-white rounded-xl border border-gray-200 p-6"
        >
          <Section1Identity
            data={draft}
            onChange={updateDraft}
          />
        </section>

        <StepSeparator />

        <section
          id={INTAKE_STEP_ID(1)}
          className="scroll-mt-44 bg-white rounded-xl border border-gray-200 p-6"
        >
          <Section2SiteProfile data={draft} onChange={updateDraft} />
        </section>

        <StepSeparator />

        <section
          id={INTAKE_STEP_ID(2)}
          className="scroll-mt-44 bg-white rounded-xl border border-gray-200 p-6"
        >
          <Section3Pages pages={draft.pages} onChange={updateDraft} />
        </section>

        <StepSeparator />

        <section
          id={INTAKE_STEP_ID(3)}
          className="scroll-mt-44 bg-white rounded-xl border border-gray-200 p-6"
        >
          <Section4Workflows workflows={draft.workflows} onChange={updateDraft} />
        </section>

        <StepSeparator />

        <section
          id={INTAKE_STEP_ID(4)}
          className="scroll-mt-44 bg-white rounded-xl border border-gray-200 p-6"
        >
          <Section5Integrations integrations={draft.integrations} onChange={updateDraft} />
        </section>

        <StepSeparator />

        <section
          id={INTAKE_STEP_ID(5)}
          className="scroll-mt-44 bg-white rounded-xl border border-gray-200 p-6"
        >
          <Section6Ecommerce data={draft} onChange={updateDraft} />
        </section>

        <StepSeparator />

        <section
          id={INTAKE_STEP_ID(6)}
          className="scroll-mt-44 bg-white rounded-xl border border-gray-200 p-6"
        >
          <Section7RiskRigor data={draft} onChange={updateDraft} />
        </section>

        <StepSeparator />

        <section
          id={INTAKE_STEP_ID(7)}
          className="scroll-mt-44 bg-white rounded-xl border border-gray-200 p-6"
        >
          <Section8TestTypes project={draft} onChange={updateDraft} />
        </section>

        <StepSeparator />

        <section
          id={INTAKE_STEP_ID(8)}
          className="scroll-mt-44 bg-white rounded-xl border border-gray-200 p-6"
        >
          <Section9Deliverables data={draft} onChange={updateDraft} />
        </section>

        <StepSeparator />

        <section
          id={INTAKE_STEP_ID(9)}
          className="scroll-mt-44 bg-white rounded-xl border border-gray-200 p-6"
        >
          <Section10Generate
            project={draft}
            onGenerate={handleGenerate}
            modelName={modelLabel}
          />
        </section>
      </div>
    </main>
  )
}
