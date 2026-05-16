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

/**
 * Horizontal step progress bar used at the top of the calibration wizard.
 * Stays visible while scrolling; each bubble scrolls to its section on click.
 */
export function StepWizard({ steps, currentStep, onNavigate }: StepWizardProps) {
  return (
    <nav aria-label="Calibration progress" className="w-full">
      <ol className="flex items-center w-full">
        {steps.map((step, index) => {
          const isActive   = index === currentStep
          const isComplete = step.isComplete
          const isLast = index === steps.length - 1

          return (
            <li
              key={step.label}
              className={`flex items-center ${isLast ? 'flex-none' : 'flex-1'}`}
            >
              {/* Step indicator + label */}
              <button
                type="button"
                onClick={() => onNavigate(index)}
                className="flex flex-col items-center gap-1 group cursor-pointer"
                aria-current={isActive ? 'step' : undefined}
              >
                {/* Circle */}
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
                  {isComplete ? (
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75
                           0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>

                {/* Label — hidden on very small screens */}
                <span
                  className={`
                    hidden sm:block text-xs font-medium text-center leading-tight max-w-16
                    ${isActive    ? 'text-brand-700' :
                      isComplete  ? 'text-brand-600' :
                      step.hasError ? 'text-red-600' :
                      'text-gray-400'}
                  `}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={`
                    flex-1 h-0.5 mx-2 mt-[-1rem]
                    ${isComplete ? 'bg-brand-300' : 'bg-gray-200'}
                  `}
                  aria-hidden="true"
                />
              )}
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
