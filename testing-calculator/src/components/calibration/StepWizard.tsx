interface WizardStep {
  label: string
  isComplete: boolean
  hasError?: boolean
}

interface StepWizardProps {
  steps: WizardStep[]
  currentStep: number
  /** Allow jumping to a step by clicking it (only if target is complete or current) */
  onNavigate: (step: number) => void
}

function trackSegmentClass(complete: boolean): string {
  return complete ? 'bg-brand-300' : 'bg-gray-200'
}

/**
 * Horizontal step progress bar used at the top of the calibration wizard.
 * Stays visible while scrolling; each bubble scrolls to its section on click.
 */
export function StepWizard({ steps, currentStep, onNavigate }: StepWizardProps) {
  return (
    <nav aria-label="Calibration progress" className="w-full">
      <ol className="flex w-full">
        {steps.map((step, index) => {
          const isActive   = index === currentStep
          const isComplete = step.isComplete
          const isFirst = index === 0
          const isLast = index === steps.length - 1

          return (
            <li
              key={step.label}
              className={`flex flex-col items-center ${isLast ? 'flex-none' : 'flex-1'}`}
            >
              {/* Bubble row — line segments flank each circle for one continuous track */}
              <div className="flex items-center w-full">
                {!isFirst && (
                  <div
                    className={`flex-1 h-0.5 min-w-1 ${trackSegmentClass(steps[index - 1].isComplete)}`}
                    aria-hidden="true"
                  />
                )}

                <button
                  type="button"
                  onClick={() => onNavigate(index)}
                  className="relative z-10 shrink-0 group cursor-pointer"
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span
                    className={`
                      flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold
                      transition-colors ring-2 ring-offset-1
                      ${isActive
                        ? 'bg-brand-600 text-white ring-brand-600'
                        : isComplete
                          ? 'bg-brand-100 text-brand-700 ring-brand-200 group-hover:bg-brand-200'
                          : step.hasError
                            ? 'bg-red-100 text-red-700 ring-red-200'
                            : 'bg-gray-100 text-gray-400 ring-gray-200'}
                    `}
                  >
                    {index + 1}
                  </span>
                </button>

                {!isLast && (
                  <div
                    className={`flex-1 h-0.5 min-w-1 ${trackSegmentClass(isComplete)}`}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Label — hidden on very small screens */}
              <span
                className={`
                  hidden sm:block mt-1 text-xs font-medium text-center leading-tight max-w-16
                  ${isActive    ? 'text-brand-700' :
                    isComplete  ? 'text-brand-600' :
                    step.hasError ? 'text-red-600' :
                    'text-gray-400'}
                `}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Step navigation buttons (shared by all steps)
// ---------------------------------------------------------------------------

interface StepNavProps {
  onBack?:     () => void
  onNext?:     () => void
  nextLabel?:  string
  backLabel?:  string
  nextDisabled?: boolean
  isLastStep?: boolean
}

export function StepNav({
  onBack,
  onNext,
  nextLabel = 'Continue',
  backLabel = 'Back',
  nextDisabled = false,
  isLastStep = false,
}: StepNavProps) {
  if (!onBack && !onNext) return null

  return (
    <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
      <div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← {backLabel}
          </button>
        )}
      </div>
      <div>
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className={`
              px-5 py-2 rounded-lg text-sm font-medium transition-colors
              ${nextDisabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isLastStep
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-brand-600 text-white hover:bg-brand-700'}
            `}
          >
            {nextLabel} {!isLastStep && !nextDisabled && '→'}
          </button>
        )}
      </div>
    </div>
  )
}
