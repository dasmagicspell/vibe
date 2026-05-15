import { useState, useCallback } from 'react'
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

export function CalibrateView() {
  const { dispatch } = useApp()
  const existingModel = useModel()
  const navigate = useNavigate()

  const [draft, setDraft] = useState<TestingModel>(() =>
    existingModel ? { ...existingModel } : createDefaultModel()
  )
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const isExistingModel = existingModel !== null

  const updateDraft = useCallback((updates: Partial<TestingModel>) => {
    setDraft(prev => ({ ...prev, ...updates }))
  }, [])

  function markComplete(step: number) {
    setCompletedSteps(prev => new Set(prev).add(step))
  }

  function advance() {
    dispatch({ type: 'SET_MODEL', model: draft })
    markComplete(currentStep)
    setCurrentStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBack() {
    setCurrentStep(s => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function jumpTo(step: number) {
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

      <div className="mb-8">
        <StepWizard steps={steps} currentStep={currentStep} onNavigate={jumpTo} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {currentStep === 0 && (
          <Step1Profile
            data={{ engineerName: draft.engineerName, version: draft.version, notes: draft.notes ?? '' }}
            onChange={({ engineerName, version, notes }) => updateDraft({ engineerName, version, notes })}
            onNext={advance}
          />
        )}
        {currentStep === 1 && (
          <Step2Overhead
            data={draft.overheadFactors}
            onChange={overheadFactors => updateDraft({ overheadFactors })}
            onBack={goBack} onNext={advance}
          />
        )}
        {currentStep === 2 && (
          <Step3Scenarios
            entries={draft.entries}
            onChange={entries => updateDraft({ entries })}
            onBack={goBack} onNext={advance}
          />
        )}
        {currentStep === 3 && (
          <Step4Browser
            data={draft.browserCalibration}
            onChange={browserCalibration => updateDraft({ browserCalibration })}
            onBack={goBack} onNext={advance}
          />
        )}
        {currentStep === 4 && (
          <Step5Deliverables
            data={draft.deliverableEstimates}
            onChange={deliverableEstimates => updateDraft({ deliverableEstimates })}
            onBack={goBack} onNext={advance}
          />
        )}
        {currentStep === 5 && (
          <Step6Exploratory
            data={draft.exploratoryBlocks}
            onChange={exploratoryBlocks => updateDraft({ exploratoryBlocks })}
            onBack={goBack} onNext={advance}
          />
        )}
        {currentStep === 6 && (
          <Step7Review
            model={draft}
            isExistingModel={isExistingModel}
            onBack={goBack}
            onExport={handleExport}
            onSaveOnly={handleSaveOnly}
          />
        )}
      </div>

      <p className="text-center text-xs text-gray-400 mt-4">
        Step {currentStep + 1} of {STEP_LABELS.length}
      </p>
    </main>
  )
}
