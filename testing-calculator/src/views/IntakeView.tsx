import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ProjectSpec } from '@/types'
import { useApp, useModel, useProject } from '@/context/AppContext'
import { createDefaultProject, deriveActiveTestTypes, isSectionComplete, isSectionRequired } from '@/utils/projectHelpers'
import { runCalculationEngine } from '@/services/CalculationEngine'
import { IntakeSidebar } from '@/components/intake/IntakeSidebar'
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

export function IntakeView() {
  const { dispatch } = useApp()
  const model          = useModel()
  const existingProject = useProject()
  const navigate        = useNavigate()

  const [section, setSection]   = useState(0)
  const [draft, setDraft]       = useState<ProjectSpec>(() =>
    existingProject ? { ...existingProject } : createDefaultProject()
  )

  // ---------------------------------------------------------------------------
  // Draft mutation — always recomputes selectedTestTypes from intake state
  // ---------------------------------------------------------------------------
  const updateDraft = useCallback((updates: Partial<ProjectSpec>) => {
    setDraft(prev => {
      const next = { ...prev, ...updates }
      next.selectedTestTypes = deriveActiveTestTypes(next)
      return next
    })
  }, [])

  // ---------------------------------------------------------------------------
  // Navigation — save to context on each section advance
  // ---------------------------------------------------------------------------
  function goNext() {
    dispatch({ type: 'SET_PROJECT', project: draft })
    setSection(s => Math.min(s + 1, SECTION_LABELS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBack() {
    setSection(s => Math.max(s - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function jumpTo(index: number) {
    dispatch({ type: 'SET_PROJECT', project: draft })
    setSection(index)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ---------------------------------------------------------------------------
  // Generate — saves project and navigates to schedule
  // Sprint 4 will call CalculationEngine here; for now it saves and navigates.
  // ---------------------------------------------------------------------------
  function handleGenerate() {
    if (!model) return
    const schedule = runCalculationEngine(model, draft)
    dispatch({ type: 'SET_PROJECT',  project: draft })
    dispatch({ type: 'SET_SCHEDULE', schedule })
    navigate('/schedule')
  }

  // ---------------------------------------------------------------------------
  // Guard: model must be loaded
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Sidebar data
  // ---------------------------------------------------------------------------
  const sections = SECTION_LABELS.map((label, i) => ({
    label,
    isComplete: isSectionComplete(i, draft),
    isRequired: isSectionRequired(i),
  }))

  const canGenerate =
    isSectionComplete(0, draft) &&   // identity required
    isSectionComplete(2, draft)       // pages required

  const modelLabel = `${model.engineerName} v${model.version}`

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <main className="max-w-screen-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Project intake</h1>
        <p className="text-sm text-gray-500">
          Define the site, then generate a data-driven estimation schedule.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <IntakeSidebar
          sections={sections}
          currentSection={section}
          onNavigate={jumpTo}
          canGenerate={canGenerate}
          onGenerate={handleGenerate}
        />

        {/* Section content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {section === 0 && (
              <Section1Identity
                data={draft}
                onChange={updateDraft}
                onNext={goNext}
              />
            )}
            {section === 1 && (
              <Section2SiteProfile
                data={draft}
                onChange={updateDraft}
                onBack={goBack}
                onNext={goNext}
              />
            )}
            {section === 2 && (
              <Section3Pages
                pages={draft.pages}
                onChange={updateDraft}
                onBack={goBack}
                onNext={goNext}
              />
            )}
            {section === 3 && (
              <Section4Workflows
                workflows={draft.workflows}
                onChange={updateDraft}
                onBack={goBack}
                onNext={goNext}
              />
            )}
            {section === 4 && (
              <Section5Integrations
                integrations={draft.integrations}
                onChange={updateDraft}
                onBack={goBack}
                onNext={goNext}
              />
            )}
            {section === 5 && (
              <Section6Ecommerce
                data={draft}
                onChange={updateDraft}
                onBack={goBack}
                onNext={goNext}
              />
            )}
            {section === 6 && (
              <Section7RiskRigor
                data={draft}
                onChange={updateDraft}
                onBack={goBack}
                onNext={goNext}
              />
            )}
            {section === 7 && (
              <Section8TestTypes
                project={draft}
                onChange={updateDraft}
                onBack={goBack}
                onNext={goNext}
              />
            )}
            {section === 8 && (
              <Section9Deliverables
                data={draft}
                onChange={updateDraft}
                onBack={goBack}
                onNext={goNext}
              />
            )}
            {section === 9 && (
              <Section10Generate
                project={draft}
                onBack={goBack}
                onGenerate={handleGenerate}
                modelName={modelLabel}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
